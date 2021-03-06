"use strict"

var methods = require("../methods")
var Util = require("../util")
var Constants = require("./constants")
var Reports = require("./reports")
var Filter = require("./filter")
var Types = Reports.Types
var assert = Util.assert

/**
 * The tests are laid out in a very data-driven design. With exception of the
 * reports, there is minimal object orientation and zero virtual dispatch.
 * Here's a quick overview:
 *
 * - The test handling dispatches based on various attributes the test has. For
 *   example, roots are known by a circular root reference, and skipped tests
 *   are known by not having a callback.
 *
 * - The test evaluation is very procedural. Although it's very highly
 *   asynchronous, the use of promises linearize the logic, so it reads very
 *   much like a recursive set of steps.
 *
 * - The data types are mostly either plain objects or classes with no methods,
 *   the latter mostly for debugging help. This also avoids most of the
 *   indirection required to accommodate breaking abstractions, which the API
 *   methods frequently need to do.
 */

// Prevent Sinon interference when they install their mocks
var setTimeout = global.setTimeout
var clearTimeout = global.clearTimeout
var now = global.Date.now

/**
 * Basic data types
 */
function Result(time, attempt) {
    assert(typeof time === "number")
    assert(attempt != null && typeof attempt === "object")
    assert(time >= 0)

    this.time = time
    this.caught = attempt.caught
    this.value = attempt.caught ? attempt.value : undefined
}

/**
 * Overview of the test properties:
 *
 * - `root` - The root test
 * - `reporters` - The list of reporters
 * - `current` - A reference to the currently active test
 * - `timeout` - The tests's timeout, or 0 if inherited
 * - `slow` - The tests's slow threshold
 * - `name` - The test's name
 * - `index` - The test's index
 * - `parent` - The test's parent
 * - `callback` - The test's callback
 * - `tests` - The test's child tests
 * - `beforeAll`, `beforeEach`, `afterEach`, `afterAll` - The test's various
 *   scheduled hooks
 * - `only` - A root-level limit on what tests may be run
 */

function Test(name, index, parent, callback) {
    assert(typeof name === "string")
    assert(typeof index === "number")
    assert(parent != null && typeof parent === "object")
    assert(typeof callback === "function")
    assert(index >= 0)

    this.locked = true
    this.root = parent.root
    this.name = name
    this.index = index
    this.parent = parent
    this.callback = callback
    this.isFailable = parent.isFailable
    this.attempts = parent.attempts

    this.timeout = parent.timeout
    this.slow = parent.slow
    this.tests = undefined
    this.beforeAll = undefined
    this.beforeEach = undefined
    this.afterEach = undefined
    this.afterAll = undefined
    this.reporter = undefined
    this.reflect = undefined
}

function Root() {
    this.locked = false
    this.reporters = []
    this.current = this
    this.root = this
    this.timeout = 0
    this.slow = 0
    this.attempts = 1
    this.isFailable = false
    this.files = undefined
    this.defaults = undefined

    this.only = undefined
    this.tests = undefined
    this.reporter = undefined
    this.reflect = undefined
    this.beforeAll = undefined
    this.beforeEach = undefined
    this.afterEach = undefined
    this.afterAll = undefined
}

function makeFilter(opts, name) {
    if (opts == null) return undefined
    if (opts[name] == null) return undefined
    return Filter.create(opts[name])
}

function Context(root, opts) {
    assert(root != null && typeof root === "object")
    assert(opts == null || typeof opts === "object")

    this.root = root
    this.tests = []
    this.isSuccess = true
    this.only = makeFilter(opts, "only") || makeFilter(root.options, "only")
    this.skip = makeFilter(opts, "skip") || makeFilter(root.options, "skip")
}

/**
 * Base tests (i.e. default export, result of `internal.root()`).
 */

exports.createRoot = function () {
    return new Root()
}

/**
 * A normal test through `t.test()`.
 */

exports.addTest = function (parent, name, callback) {
    assert(parent != null && typeof parent === "object")
    assert(typeof name === "string")
    assert(typeof callback === "function")

    var index = parent.tests != null ? parent.tests.length : 0
    var base = new Test(name, index, parent, callback)

    if (index) {
        parent.tests.push(base)
    } else {
        parent.tests = [base]
    }
}

/**
 * Clear the tests in place.
 */
exports.clearTests = function (parent) {
    assert(parent != null && typeof parent === "object")
    parent.tests = null
}

/**
 * Execute the tests
 */

function makeSlice(tests, length) {
    assert(Array.isArray(tests))
    assert(typeof length === "number")

    var ret = new Array(length)

    for (var i = 0; i < length; i++) {
        ret[i] = {name: tests[i].name, index: tests[i].index}
    }

    return ret
}

function reportWith(context, func) {
    assert(context != null && typeof context === "object")
    assert(typeof func === "function")

    return Util.ptry(function () {
        if (context.root.reporter == null) return undefined
        return func(context.root.reporter)
    })
    .then(function () {
        var reporters = context.root.reporters

        // Two easy cases.
        if (reporters.length === 0) return undefined
        if (reporters.length === 1) return func(reporters[0])
        return Promise.all(reporters.map(func))
    })
}

function reportStart(context) {
    assert(context != null && typeof context === "object")

    return reportWith(context, function (reporter) {
        return reporter(Reports.start())
    })
}

function reportEnter(context, duration) {
    assert(context != null && typeof context === "object")
    assert(typeof duration === "number")

    var test = context.root.current
    var slow = test.slow || Constants.defaultSlow

    return reportWith(context, function (reporter) {
        var path = makeSlice(context.tests, context.tests.length)

        return reporter(Reports.enter(path, duration, slow))
    })
}

function reportLeave(context) {
    assert(context != null && typeof context === "object")

    return reportWith(context, function (reporter) {
        return reporter(Reports.leave(
            makeSlice(context.tests, context.tests.length)))
    })
}

function reportPass(context, duration) {
    assert(context != null && typeof context === "object")
    assert(typeof duration === "number")

    var test = context.root.current
    var slow = test.slow || Constants.defaultSlow

    return reportWith(context, function (reporter) {
        var path = makeSlice(context.tests, context.tests.length)

        return reporter(Reports.pass(path, duration, slow))
    })
}

function reportFail(context, error, duration) {
    assert(context != null && typeof context === "object")
    assert(typeof duration === "number")

    var test = context.root.current
    var slow = test.slow || Constants.defaultSlow
    var isFailable = test.isFailable

    return reportWith(context, function (reporter) {
        var path = makeSlice(context.tests, context.tests.length)

        return reporter(Reports.fail(path, error, duration, slow, isFailable))
    })
}

function reportSkip(context) {
    assert(context != null && typeof context === "object")

    return reportWith(context, function (reporter) {
        return reporter(Reports.skip(
            makeSlice(context.tests, context.tests.length)))
    })
}

function reportEnd(context) {
    assert(context != null && typeof context === "object")

    return reportWith(context, function (reporter) {
        return reporter(Reports.end())
    })
}

function reportError(context, error) {
    assert(context != null && typeof context === "object")

    return reportWith(context, function (reporter) {
        return reporter(Reports.error(error))
    })
}

function reportHook(context, errorWrap) {
    assert(context != null && typeof context === "object")
    assert(errorWrap instanceof ErrorWrap)

    return reportWith(context, function (reporter) {
        return reporter(Reports.hook(
            errorWrap.stage,
            makeSlice(context.tests, context.tests.length),
            makeSlice(context.tests, context.tests.indexOf(errorWrap.test) + 1),
            errorWrap.func,
            errorWrap.error))
    })
}

// PhantomJS and IE don't add the stack until it's thrown. In failing async
// tests, it's already thrown in a sense, so this should be normalized with
// other test types.
var addStack = typeof new Error().stack !== "string"
    ? function addStack(e) {
        try {
            if (e instanceof Error && e.stack == null) throw e
        } finally {
            return e
        }
    }
    : function (e) { return e }

function getThen(res) {
    if (typeof res === "object" || typeof res === "function") {
        return res.then
    } else {
        return undefined
    }
}

function AsyncState(context, start, resolve, count) {
    assert(context != null && typeof context === "object")
    assert(typeof start === "number")
    assert(typeof resolve === "function")
    assert(typeof count === "number")

    this.context = context
    this.start = start
    this.resolve = resolve
    this.count = count
    this.timer = undefined
}

var p = Promise.resolve()

function asyncFinish(state, attempt) {
    assert(state != null && typeof state === "object")
    assert(attempt != null && typeof attempt === "object")

    // Capture immediately. Worst case scenario, it gets thrown away.
    var end = now()
    var test = state.context.root.current

    if (state.timer) {
        clearTimeout.call(global, state.timer)
        state.timer = undefined
    }

    if (attempt.caught && state.count < test.attempts) {
        // Don't recurse synchronously, since it may be resolved synchronously
        state.resolve(p.then(function () {
            return invokeInit(state.context, state.count + 1)
        }))
    } else {
        test.locked = true
        state.resolve(new Result(end - state.start, attempt))
    }
}

// Avoid creating a closure if possible, in case it doesn't return a thenable.
function invokeInit(context, count) {
    assert(context != null && typeof context === "object")
    assert(typeof count === "number")

    var test = context.root.current

    test.locked = false
    var start = now()
    var tryBody = try0(test.callback)
    var syncEnd = now()

    // Note: synchronous failures are test failures, not fatal errors.
    if (tryBody.caught) {
        if (count < test.attempts) return invokeInit(context, count + 1)
        test.locked = true
        return Promise.resolve(new Result(syncEnd - start, tryBody))
    }

    var tryThen = try1(getThen, undefined, tryBody.value)

    if (tryThen.caught) {
        if (count < test.attempts) return invokeInit(context, count + 1)
        test.locked = true
        return Promise.resolve(new Result(syncEnd - start, tryThen))
    }

    if (typeof tryThen.value !== "function") {
        test.locked = true
        return Promise.resolve(new Result(syncEnd - start, tryThen))
    }

    return new Promise(function (resolve) {
        var state = new AsyncState(context, start, resolve, count)
        var result = try2(tryThen.value, tryBody.value,
            function () {
                if (state == null) return
                asyncFinish(state, tryPass())
                state = undefined
            },
            function (e) {
                if (state == null) return
                asyncFinish(state, tryFail(addStack(e)))
                state = undefined
            })

        if (state == null) return
        if (result.caught) {
            asyncFinish(state, result)
            state = undefined
            return
        }

        // Set the timeout *after* initialization. The timeout will likely be
        // specified during initialization.
        var maxTimeout = test.timeout || Constants.defaultTimeout

        // Setting a timeout is pointless if it's infinite.
        if (maxTimeout !== Infinity) {
            state.timer = setTimeout.call(global, function () {
                if (state == null) return
                asyncFinish(state, tryFail(addStack(
                    new Error("Timeout of " + maxTimeout + " reached"))))
                state = undefined
            }, maxTimeout)
        }
    })
}

function ErrorWrap(test, stage, func, error) {
    assert(test != null && typeof test === "object")
    this.test = test
    this.stage = stage
    this.func = func
    this.error = error
}
methods(ErrorWrap, Error, {name: "ErrorWrap"})

function invokeHook(test, list, stage) {
    assert(test != null && typeof test === "object")
    if (list == null) return Promise.resolve()
    assert(Array.isArray(list))
    return Util.peach(list, function (hook) {
        try {
            return hook()
        } catch (e) {
            throw new ErrorWrap(test, stage, hook, e)
        }
    })
}

function invokeBeforeEach(test) {
    assert(test != null && typeof test === "object")

    return Util.ptry(function () {
        if (test.root === test) return undefined
        return invokeBeforeEach(test.parent)
    })
    .then(function () {
        return invokeHook(test, test.beforeEach, Types.BeforeEach)
    })
}

function invokeAfterEach(test) {
    assert(test != null && typeof test === "object")

    return invokeHook(test, test.afterEach, Types.AfterEach)
    .then(function () {
        if (test.root === test) return undefined
        return invokeAfterEach(test.parent)
    })
}

/**
 * This checks if the test was whitelisted with `t.only` or the `only` option,
 * and for convenience, returns `true` if no whitelist was specified.
 */
function isOnly(context) {
    assert(context != null && typeof context === "object")

    if (context.only != null) {
        if (Filter.test(context.tests, context.only) == null) return false
    }

    if (context.root.only != null) {
        if (Filter.test(context.tests, context.root.only) == null) return false
    }

    return true
}

/**
 * This checks if the test was blacklisted via the `skip` option.
 */
function isSkipped(context) {
    assert(context != null && typeof context === "object")

    return context.skip != null && Filter.test(context.tests, context.skip)
}

function runChildTests(test, context) {
    assert(test != null && typeof test === "object")
    assert(context != null && typeof context === "object")

    if (test.tests == null) return undefined

    function runChild(child) {
        test.root.current = child
        context.tests.push(child)

        return Util.pfinally(
            invokeBeforeEach(test)
            .then(function () { return runNormalChild(child, context) })
            .then(function () { return invokeAfterEach(test) })
            .catch(function (e) {
                if (!(e instanceof ErrorWrap)) throw e
                return reportHook(context, e)
            }),
            function () {
                test.root.current = test
                context.tests.pop()
            }
        )
    }

    var ran = false

    return Util.peach(test.tests, function (child) {
        context.tests.push(child)
        if (!isOnly(context)) {
            context.tests.pop()
            return undefined
        } else if (isSkipped(context)) {
            return Util.pfinally(
                reportSkip(context),
                function () { context.tests.pop() }
            )
        } else {
            return Util.ptry(function () {
                context.tests.pop()
                if (ran) return undefined
                ran = true
                return invokeHook(test, test.beforeAll, Types.BeforeAll)
            })
            .then(function () { return runChild(child) })
        }
    })
    .then(function () {
        if (!ran) return undefined
        return invokeHook(test, test.afterAll, Types.AfterAll)
    })
}

function clearChildren(test) {
    assert(test != null && typeof test === "object")

    if (test.tests == null) return
    for (var i = 0; i < test.tests.length; i++) {
        test.tests[i].tests = undefined
    }
}

function runNormalChild(test, context) {
    assert(test != null && typeof test === "object")
    assert(context != null && typeof context === "object")

    return Util.pfinally(
        invokeInit(context, 1)
        .then(function (result) {
            if (result.caught) {
                if (result.value === Constants.Skip) return reportSkip(context)
                if (!test.isFailable) context.isSuccess = false
                return reportFail(context, result.value, result.time)
            } else if (test.tests != null) {
                // Report this as if it was a parent test if it's passing and
                // has children.
                return reportEnter(context, result.time)
                .then(function () { return runChildTests(test, context) })
                .catch(function (e) {
                    if (!(e instanceof ErrorWrap)) throw e
                    return reportHook(context, e)
                })
                .then(function () { return reportLeave(context) })
            } else {
                return reportPass(context, result.time)
            }
        }),
        function () { clearChildren(test) }
    )
}

/**
 * This runs the root test and returns a promise resolved when it's done.
 */
exports.runTest = function (root, opts) {
    assert(root != null && typeof root === "object")
    assert(opts == null || typeof opts === "object")

    var context = new Context(root, opts)

    root.locked = true
    return Util.pfinally(
        reportStart(context)
        .then(function () { return runChildTests(root, context) })
        .catch(function (e) {
            if (!(e instanceof ErrorWrap)) throw e
            return reportHook(context, e)
        })
        .then(function () { return reportEnd(context) })
        // Tell the reporter something happened. Otherwise, it'll have to wrap
        // this method in a plugin, which shouldn't be necessary.
        .catch(function (e) {
            return reportError(context, e).then(function () { throw e })
        }),
        function () {
            clearChildren(root)
            root.locked = false
        }
    )
    .then(function () {
        return {isSuccess: context.isSuccess}
    })
}

// Help optimize for inefficient exception handling in V8

function tryPass(value) {
    return {caught: false, value: value}
}

function tryFail(e) {
    return {caught: true, value: e}
}

function try0(func) {
    assert(typeof func === "function")

    try {
        return tryPass(func())
    } catch (e) {
        return tryFail(e)
    }
}

function try1(func, inst, arg0) {
    assert(typeof func === "function")

    try {
        return tryPass(func.call(inst, arg0))
    } catch (e) {
        return tryFail(e)
    }
}

function try2(func, inst, arg0, arg1) {
    assert(typeof func === "function")

    try {
        return tryPass(func.call(inst, arg0, arg1))
    } catch (e) {
        return tryFail(e)
    }
}
