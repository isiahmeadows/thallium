"use strict"

const m = require("./messages.js")
const inspect = require("util").inspect
const Base = require("./test/base.js")
const Sync = require("./test/sync.js")
const Fake = require("./test/fake.js")
const Async = require("./test/async.js")
const activeReporters = require("./test/common.js").activeReporters

class AssertionError extends Error {
    constructor(message, expected, actual) {
        super(message)
        this.expected = expected
        this.actual = actual
    }

    get name() {
        return "AssertionError"
    }
}

/**
 * The whitelist is actually stored as a binary search tree for faster lookup
 * times when there are multiple selectors. Objects can't be used for the nodes,
 * where keys represent values and values represent children, because regular
 * expressions aren't possible to use. The other option, using a Map, would not
 * work well because I want to maintain ES5 compatibility.
 */

function isEquivalent(entry, item) {
    if (typeof entry === "string" && typeof item === "string") {
        return entry === item
    } else if (entry instanceof RegExp && item instanceof RegExp) {
        return entry.toString() === item.toString()
    } else {
        return false
    }
}

function matches(entry, item) {
    if (typeof entry === "string") {
        return entry === item
    } else {
        return entry.test(item)
    }
}

class Node {
    constructor(value) {
        this.value = value
        this.children = []
    }

    check(current) {
        for (let i = 0; i < this.children.length; i++) {
            if (matches(this.children[i].value, current)) return i
        }

        return -1
    }

    addSingle(entry) {
        for (let i = 0; i < this.children.length; i++) {
            if (isEquivalent(this.children[i].value, entry)) {
                return this.children[i]
            }
        }

        const child = new Node(entry)

        this.children.push(child)
        return child
    }
}

class Only {
    constructor() {
        this.node = new Node(null)
    }

    add(selector) {
        if (!Array.isArray(selector)) {
            throw new TypeError(m("type.only.selector"))
        }

        let node = this.node

        for (let i = 0; i < selector.length; i++) {
            const entry = selector[i]

            // If it's not a string, make it so. This is also Symbol-proof
            if (typeof entry !== "string" && !(entry instanceof RegExp)) {
                throw new TypeError(m("type.only.selector"))
            }

            node = node.addSingle(entry)
        }
    }

    // Do note that this requires the stack to be reversed. It is also mutated.
    check(path) {
        let node = this.node

        // The non-null check is to not recurse into subtests of the childmost
        // selector.
        while (path.length && node != null) {
            const index = node.check(path.pop())

            if (index === -1) return false
            node = node.children[index]
        }

        return true
    }
}

function checkInit(ctx) {
    if (!ctx.initializing) {
        throw new ReferenceError(m("fail.checkInit"))
    }
}

// This handles possibly nested arrays of arguments.
function walk(t, args, message, func) {
    checkInit(t._)

    for (const entry of args) {
        if (Array.isArray(entry)) {
            walk(t, entry, message, func)
        } else if (typeof entry === "function") {
            func(entry)
        } else {
            throw new TypeError(m(message))
        }
    }

    return t
}

// This handles name + func vs object with methods.
function isSetter(func, name) {
    if (typeof func === "function") return func
    throw new TypeError(m("type.define.callback", name))
}

function iterateSetter(t, name, func, iterator) {
    checkInit(t._)

    if (typeof name === "object" && name != null) {
        for (const key of Object.keys(name)) {
            iterator(key, isSetter(name[key], key))
        }
    } else {
        iterator(name, isSetter(func, name))
    }

    return t
}

const hasOwn = Object.prototype.hasOwnProperty

// This formats the assertion error messages.
function format(object) {
    object.message += ""

    if (!object.message) return "unspecified"

    return object.message.replace(/(.?)\{(.+?)\}/g, (m, pre, prop) => {
        if (pre === "\\") return m.slice(1)
        if (hasOwn.call(object, prop)) return pre + inspect(object[prop])
        return m
    })
}

// This checks if the test was whitelisted in a `t.only()` call, or for
// convenience, returns `true` if `t.only()` was never called.
function isOnly(test, name) {
    const path = [name]

    // This gets the path in reverse order. A FIFO stack is appropriate here.
    while (test.only == null && !test.isRoot) {
        path.push(test.name)
        test = test.parent
    }

    // If no `only` is active, then anything works.
    return test.only == null || test.only.check(path)
}

function runTest(t, namespace, name, callback) {
    if (typeof name !== "string") {
        throw new TypeError(m("type.test.name"))
    }

    if (typeof callback !== "function" && callback != null) {
        throw new TypeError(m("type.callback.optional"))
    }

    checkInit(t._)

    const ns = isOnly(t._, name) ? namespace : Fake.Dummy
    const index = t._.tests.length

    if (callback != null) {
        t._.tests.push(new ns.Block(t, name, index, callback))
        return t
    } else {
        const tt = new ns.Inline(t, name, index)

        t._.tests.push(tt)
        return tt.methods
    }
}

function runAsync(t, Test, name, callback) {
    if (typeof name !== "string") {
        throw new TypeError(m("type.test.name"))
    }

    if (typeof callback !== "function") {
        throw new TypeError(m("type.async.callback"))
    }

    checkInit(t._)

    const T = isOnly(t._, name) ? Test : Fake.Dummy.Block
    const index = t._.tests.length

    t._.tests.push(new T(t, name, index, callback))
    return t
}

module.exports = class Techtonic {
    constructor() {
        this._ = new Base(this)
    }

    /**
     * Exposed for internal use, but might be interesting for consumers.
     */
    base() {
        return new Techtonic()
    }

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     *
     * Returns the current instance for chaining.
     */
    only(/* ...selectors */) {
        checkInit(this._)
        this._.only = new Only()

        for (let i = 0; i < arguments.length; i++) {
            const selector = arguments[i]

            if (!Array.isArray(selector)) {
                throw new TypeError(m("type.only.index", i))
            }

            this._.only.add(selector)
        }

        return this
    }

    /**
     * Run `func` when tests are run. This is synchronous for block and async
     * tests, but not inline tests. It's probably most useful for plugin
     * authors. `t.block` is an ES3-compatible alias of `t.do`.
     *
     * Returns the current instance for chaining.
     */
    do(func) {
        if (typeof func !== "function") {
            throw new TypeError(m("type.any.callback"))
        }

        checkInit(this._)

        if (this._.inline) {
            this._.inline.push({run: func, args: []})
        } else {
            func()
        }

        return this
    }

    /**
     * Use a number of plugins. Possibly nested lists of them are also
     * supported.
     *
     * Returns the current instance for chaining.
     */
    use() {
        const args = []

        for (let i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
        }

        return walk(this, args, "type.plugin", plugin => {
            if (!this._.plugins.has(plugin)) {
                // Add plugin before calling it.
                this._.plugins.add(plugin)
                plugin.call(this, this)
            }
        })
    }

    /**
     * Add a number of reporters. Possibly nested lists of them are also
     * supported.
     *
     * Returns the current instance for chaining.
     */
    reporter() {
        const args = []

        for (let i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
        }

        return walk(this, args, "type.reporter", reporter => {
            if (this._.reporters == null) this._.reporters = new Set()

            this._.reporters.add(reporter)
        })
    }

    /**
     * Define one or more (if an object is passed) assertions.
     *
     * Returns the current instance for chaining.
     */
    define(name, func) {
        return iterateSetter(this, name, func, (name, func) => {
            function run() {
                const res = func.apply(undefined, arguments)

                if (typeof res !== "object" || res === null) {
                    throw new TypeError(m("type.define.return", name))
                }

                if (!res.test) {
                    throw new AssertionError(format(res), res.expected,
                        res.actual)
                }
            }

            this[name] = function () {
                checkInit(this._)

                if (this._.inline) {
                    const args = []

                    for (let i = 0; i < arguments.length; i++) {
                        args.push(arguments[i])
                    }

                    this._.inline.push({run, args})
                } else {
                    run.apply(undefined, arguments)
                }

                return this
            }
        })
    }

    /**
     * Wrap one or more (if an object is passed) existing methods.
     *
     * Returns the current instance for chaining.
     */
    wrap(name, func) {
        return iterateSetter(this, name, func, (name, func) => {
            const old = this[name]

            if (typeof old !== "function") {
                throw new TypeError(m("missing.wrap.callback", name))
            }

            this[name] = function () {
                checkInit(this._)

                const args = [old.bind(this)]

                for (let i = 0; i < arguments.length; i++) {
                    args.push(arguments[i])
                }

                const ret = func.apply(undefined, args)

                return ret !== undefined ? ret : this
            }
        })
    }

    /**
     * Define one or more (if an object is passed) new methods.
     *
     * Returns the current instance for chaining.
     */
    add(name, func) {
        return iterateSetter(this, name, func, (name, func) => {
            this[name] = function () {
                checkInit(this._)

                const args = [this]

                for (let i = 0; i < arguments.length; i++) {
                    args.push(arguments[i])
                }

                const ret = func.apply(this, args)

                return ret !== undefined ? ret : this
            }
        })
    }

    /**
     * If an argument was passed, this sets the timeout in milliseconds,
     * rounding negatives to 0, and returns the current instance for chaining.
     * Setting the timeout to 0 means to inherit the parent timeout, and setting
     * it to `Infinity` disables it.
     *
     * Otherwise, it returns the active (not necessarily own) timeout, or the
     * framework default of 2000 milliseconds.
     */
    timeout(timeout) {
        if (timeout != null) {
            checkInit(this._)
            this._.timeout = Math.max(+timeout, 0)
            return this
        } else {
            return Async.getTimeout(this._)
        }
    }

    /**
     * Get the parent test. Mostly useful for plugin authors.
     */
    parent() {
        if (this._.isRoot) return undefined
        else return this._.parent.methods
    }

    /**
     * Assert that this test is currently being initialized (and is thus safe to
     * modify). This should *always* be used by plugin authors if a test method
     * modifies state. If you use `define`, `wrap` or `add`, this is already
     * done for you.
     *
     * Returns the current instance for chaining.
     */
    checkInit() {
        checkInit(this._)
        return this
    }

    /**
     * Run the tests (or the test's tests if it's not a base instance). Pass a
     * `callback` to be called with a possible error, and this returns a promise
     * otherwise.
     */
    run(callback) {
        if (typeof callback !== "function" && callback != null) {
            throw new TypeError(m("type.callback.optional"))
        }

        checkInit(this._)

        if (this._.running) {
            throw new Error(m("run.concurrent"))
        }

        return this._.run(true).asCallback(callback)
    }

    /**
     * Add a Skipped block or inline test.
     */
    testSkip(name, callback) {
        return runTest(this, Fake.Skip, name, callback)
    }

    /**
     * Add a block or inline test.
     */
    test(name, callback) {
        return runTest(this, Sync, name, callback)
    }

    /**
     * Add a Skipped async test.
     */
    asyncSkip(name, callback) {
        return runAsync(this, Fake.Skip.Block, name, callback)
    }

    /**
     * Add an async test.
     */
    async(name, callback) {
        return runAsync(this, Async, name, callback)
    }

    /**
     * Get a list of all active reporters, either on this instance or on the
     * closest parent.
     */
    reporters() {
        return Array.from(activeReporters(this._))
    }

    /**
     * Check if this is an inline test. Mostly useful for plugin authors.
     */
    inline() {
        return this._.inline
    }

    // Export the AssertionError constructor
    get AssertionError() {
        return AssertionError
    }
}