(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict"

module.exports = require("clean-assert")

},{"clean-assert":34}],2:[function(require,module,exports){
"use strict"

module.exports = require("./lib/dom")

},{"./lib/dom":12}],3:[function(require,module,exports){
"use strict"

/**
 * Main entry point, for those wanting to use this framework with the core
 * assertions.
 */
var Thallium = require("./lib/api/thallium")

module.exports = new Thallium()

},{"./lib/api/thallium":7}],4:[function(require,module,exports){
"use strict"

var Thallium = require("./lib/api/thallium")
var Reports = require("./lib/core/reports")
var HookStage = Reports.HookStage

exports.root = function () {
    return new Thallium()
}

function d(duration) {
    if (duration == null) return 10
    if (typeof duration === "number") return duration|0
    throw new TypeError("Expected `duration` to be a number if it exists")
}

function s(slow) {
    if (slow == null) return 75
    if (typeof slow === "number") return slow|0
    throw new TypeError("Expected `slow` to be a number if it exists")
}

function p(path) {
    if (Array.isArray(path)) return path
    throw new TypeError("Expected `path` to be an array of locations")
}

function h(value) {
    if (value != null && typeof value._ === "number") return value
    throw new TypeError("Expected `value` to be a hook error")
}

/**
 * Create a new report, mainly for testing reporters.
 */
exports.reports = {
    start: function () {
        return new Reports.Start()
    },

    enter: function (path, duration, slow) {
        return new Reports.Enter(p(path), d(duration), s(slow))
    },

    leave: function (path) {
        return new Reports.Leave(p(path))
    },

    pass: function (path, duration, slow) {
        return new Reports.Pass(p(path), d(duration), s(slow))
    },

    fail: function (path, value, duration, slow, isFailable) { // eslint-disable-line max-params, max-len
        return new Reports.Fail(
            p(path), value, d(duration), s(slow),
            !!isFailable)
    },

    skip: function (path) {
        return new Reports.Skip(p(path))
    },

    end: function () {
        return new Reports.End()
    },

    error: function (value) {
        return new Reports.Error(value)
    },

    hook: function (path, rootPath, value) {
        return new Reports.Hook(p(path), p(rootPath), h(value))
    },
}

/**
 * Create a new hook error, mainly for testing reporters.
 */
exports.hookErrors = {
    beforeAll: function (func, value) {
        return new Reports.HookError(HookStage.BeforeAll, func, value)
    },

    beforeEach: function (func, value) {
        return new Reports.HookError(HookStage.BeforeEach, func, value)
    },

    afterEach: function (func, value) {
        return new Reports.HookError(HookStage.AfterEach, func, value)
    },

    afterAll: function (func, value) {
        return new Reports.HookError(HookStage.AfterAll, func, value)
    },
}

/**
 * Creates a new location, mainly for testing reporters.
 */
exports.location = function (name, index) {
    if (typeof name !== "string") {
        throw new TypeError("Expected `name` to be a string")
    }

    if (typeof index !== "number") {
        throw new TypeError("Expected `index` to be a number")
    }

    return {name: name, index: index|0}
}

},{"./lib/api/thallium":7,"./lib/core/reports":10}],5:[function(require,module,exports){
"use strict"

var assert = require("../util").assert

exports.addHook = function (list, callback) {
    assert(list == null || Array.isArray(list))
    assert(typeof callback === "function")

    if (list != null) {
        list.push(callback)
        return list
    } else {
        return [callback]
    }
}

exports.removeHook = function (list, callback) {
    assert(list == null || Array.isArray(list))
    assert(typeof callback === "function")

    if (list == null) return undefined
    if (list.length === 1) {
        if (list[0] === callback) return undefined
    } else {
        var index = list.indexOf(callback)

        if (index >= 0) list.splice(index, 1)
    }
    return list
}

exports.hasHook = function (list, callback) {
    assert(list == null || Array.isArray(list))
    assert(typeof callback === "function")

    if (list == null) return false
    if (list.length > 1) return list.indexOf(callback) >= 0
    return list[0] === callback
}

},{"../util":24}],6:[function(require,module,exports){
"use strict"

var assert = require("../util").assert
var methods = require("../methods")
var Tests = require("../core/tests")

var Common = require("./common")

/**
 * This contains the low level, more arcane things that are generally not
 * interesting to anyone other than plugin developers.
 */
module.exports = Reflect
function Reflect(test) {
    assert(test != null && typeof test === "object")

    var reflect = test.reflect

    if (reflect != null) return reflect
    test.reflect = this
    this._ = test
}

methods(Reflect, {
    /**
     * Whether a reporter was registered.
     */
    hasReporter: function (reporter) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a reporter")
        }

        return this._.root.reporters.indexOf(reporter) >= 0
    },

    /**
     * Add a reporter.
     */
    addReporter: function (reporter) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root")
        }

        if (root.reporters.indexOf(reporter) < 0) root.reporters.push(reporter)
    },

    /**
     * Remove a reporter.
     */
    removeReporter: function (reporter) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a reporter")
        }

        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root")
        }

        var index = root.reporters.indexOf(reporter)

        if (index >= 0) root.reporters.splice(index, 1)
    },

    /**
     * Get the currently executing test.
     */
    get current() {
        return new Reflect(this._.root.current)
    },

    /**
     * Get the root test.
     */
    get root() {
        return new Reflect(this._.root)
    },

    /**
     * Get the current total test count.
     */
    get count() {
        return this._.tests == null ? 0 : this._.tests.length
    },

    /**
     * Get a copy of the current test list, as a Reflect collection. This is
     * intentionally a slice, so you can't mutate the real children.
     */
    get children() {
        var children = []

        if (this._.tests != null) {
            for (var i = 0; i < this._.tests.length; i++) {
                children[i] = new Reflect(this._.tests[i])
            }
        }

        return children
    },

    /**
     * Is this test the root, i.e. top level?
     */
    get isRoot() {
        return this._.parent == null
    },

    /**
     * Is this locked (i.e. unsafe to modify)?
     */
    get isLocked() {
        return !!this._.locked
    },

    /**
     * Get the active timeout in milliseconds, not necessarily own, or the
     * framework default of 2000, if none was set.
     */
    get timeout() {
        return this._.timeout || Tests.defaultTimeout
    },

    /**
     * Get the active slow threshold in milliseconds, not necessarily own, or
     * the framework default of 75, if none was set.
     */
    get slow() {
        return this._.slow || Tests.defaultSlow
    },

    /**
     * Get the test's own max attempt count. Note that this is parasitically
     * inherited from its parent, not delegated.
     */
    get attempts() {
        return this._.attempts
    },

    /**
     * Get whether this test is failable. Note that this is parasitically
     * inherited from its parent, not delegated.
     */
    get isFailable() {
        return this._.isFailable
    },

    /**
     * Get the test name, or `undefined` if it's the root test.
     */
    get name() {
        if (this._.parent == null) return undefined
        return this._.name
    },

    /**
     * Get the test index, or `undefined` if it's the root test.
     */
    get index() {
        if (this._.parent == null) return undefined
        return this._.index
    },

    /**
     * Get the test's parent as a Reflect, or `undefined` if it's the root test.
     */
    get parent() {
        if (this._.parent == null) return undefined
        return new Reflect(this._.parent)
    },

    /**
     * Add a hook to be run before each subtest, including their subtests and so
     * on.
     */
    before: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.beforeEach = Common.addHook(this._.beforeEach, callback)
    },

    /**
     * Add a hook to be run once before all subtests are run.
     */
    beforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.beforeAll = Common.addHook(this._.beforeAll, callback)
    },

   /**
    * Add a hook to be run after each subtest, including their subtests and so
    * on.
    */
    after: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.afterEach = Common.addHook(this._.afterEach, callback)
    },

    /**
     * Add a hook to be run once after all subtests are run.
     */
    afterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.afterAll = Common.addHook(this._.afterAll, callback)
    },

    /**
     * Remove a hook previously added with `t.before` or `reflect.before`.
     */
    hasBefore: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        return Common.hasHook(this._.beforeEach, callback)
    },

    /**
     * Remove a hook previously added with `t.beforeAll` or `reflect.beforeAll`.
     */
    hasBeforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        return Common.hasHook(this._.beforeAll, callback)
    },

    /**
     * Remove a hook previously added with `t.after` or`reflect.after`.
     */
    hasAfter: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        return Common.hasHook(this._.afterEach, callback)
    },

    /**
     * Remove a hook previously added with `t.afterAll` or `reflect.afterAll`.
     */
    hasAfterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        return Common.hasHook(this._.afterAll, callback)
    },

    /**
     * Remove a hook previously added with `t.before` or `reflect.before`.
     */
    removeBefore: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.beforeEach = Common.removeHook(this._.beforeEach, callback)
    },

    /**
     * Remove a hook previously added with `t.beforeAll` or `reflect.beforeAll`.
     */
    removeBeforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.beforeAll = Common.removeHook(this._.beforeAll, callback)
    },

    /**
     * Remove a hook previously added with `t.after` or`reflect.after`.
     */
    removeAfter: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.afterEach = Common.removeHook(this._.afterEach, callback)
    },

    /**
     * Remove a hook previously added with `t.afterAll` or `reflect.afterAll`.
     */
    removeAfterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        this._.afterAll = Common.removeHook(this._.afterAll, callback)
    },

    /**
     * Add a block or inline test.
     */
    test: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        Tests.addTest(this._.root.current, name, callback)
    },

    /**
     * Skip the current test dynamically
     */
    skip: function () {
        if (this._.root.current === this._.root) {
            throw new TypeError("This should only be called within tests.")
        }

        throw Tests.Skip
    },
})

},{"../core/tests":11,"../methods":17,"../util":24,"./common":5}],7:[function(require,module,exports){
"use strict"

var methods = require("../methods")
var Util = require("../util")
var Tests = require("../core/tests")
var Filter = require("../core/filter")
var Reporters = require("../../r/index")

var Common = require("./common")
var Reflect = require("./reflect")

module.exports = Thallium
function Thallium() {
    this._ = Tests.createRoot()
}

methods(Thallium, {
    /**
     * Get a Reflect instance directly.
     */
    get reflect() {
        return new Reflect(this._.root.current)
    },

    /**
     * Call a plugin and return the result. The plugin is called with a Reflect
     * instance for access to plenty of potentially useful internal details.
     */
    call: function (plugin) {
        if (typeof plugin !== "function") {
            throw new TypeError("Expected `plugin` to be a function")
        }

        return plugin.call(this.reflect, this.reflect)
    },

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     */
    set only(selectors) {
        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root.")
        }

        Filter.validate(selectors)
        root.only = Filter.create(selectors)
    },

    /**
     * Add a reporter.
     */
    set reporter(reporter) {
        if (Array.isArray(reporter)
            ? typeof reporter[0] !== "string"
            : typeof reporter !== "function"
        ) {
            throw new TypeError(
                "Expected `reporter` to be a `[string, opts?]` pair or a " +
                "function.")
        }

        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root.")
        }

        if (typeof reporter === "function") {
            root.reporter = reporter
        } else {
            var mod = Reporters[reporter]

            if (mod == null) {
                throw new TypeError("Built-in reporter " +
                    JSON.stringify(reporter) + " not found")
            }

            root.reporter = mod(reporter[1])
        }
    },

    /**
     * Check if this has a reporter.
     */
    get hasReporter() {
        return this._.root.reporter != null
    },

    /**
     * Get the current file set.
     */
    get files() {
        return this._.files
    },

    /**
     * Set the current file set.
     */
    set files(files) {
        var root = this._.root

        if (root.current !== root) {
            throw new Error("Files may only be set in the root.")
        }

        if (files == null) {
            root.files = undefined
        } else {
            if (!Array.isArray(files)) {
                throw new TypeError(
                    "Expected files to be an array if it exists, but found " +
                    "a(n) " + Util.getType(files))
            }

            for (var i = 0; i < files.length; i++) {
                var glob = files[i]

                if (typeof glob !== "string") {
                    throw new TypeError(
                        "Expected t.files[" + i + "] to be a string, but " +
                        "found a(n) " + Util.getType(glob))
                }
            }

            root.files = files
        }
    },

    /**
     * Set the current file set.
     */
    set options(opts) {
        if (opts != null) {
            if (typeof opts !== "object") {
                throw new Error("Options must be an object if given.")
            }

            if (opts.only != null) Filter.validate(opts.only)
            if (opts.skip != null) Filter.validate(opts.skip)
        }

        this._.options = opts
    },

    /**
     * Get the current timeout. 0 means inherit the parent's, and `Infinity`
     * means it's disabled.
     */
    get timeout() {
        return this._.root.current.timeout || Tests.defaultTimeout
    },

    /**
     * Set the timeout in milliseconds, rounding negatives to 0. Setting the
     * timeout to 0 means to inherit the parent timeout, and setting it to
     * `Infinity` disables it.
     */
    set timeout(timeout) {
        this._.root.current.timeout = Math.floor(Math.max(+timeout, 0))
    },

    /**
     * Get the current slow threshold. 0 means inherit the parent's, and
     * `Infinity` means it's disabled.
     */
    get slow() {
        return this._.root.current.slow || Tests.defaultSlow
    },

    /**
     * Set the slow threshold in milliseconds, rounding negatives to 0. Setting
     * the timeout to 0 means to inherit the parent threshold, and setting it to
     * `Infinity` disables it.
     */
    set slow(slow) {
        this._.root.current.slow = Math.floor(Math.max(+slow, 0))
    },

    /**
     * Get the current attempt count. `0` means inherit the parent's.
     */
    get attempts() {
        return this._.root.current.attempts
    },

    /**
     * Set the number of attempts allowed, rounding negatives to 0. Setting the
     * count to `0` means to inherit the parent retry count.
     */
    set attempts(attempts) {
        // This is done differently to avoid a massive performance penalty.
        var calculated = Math.floor(Math.max(attempts, 0))
        var test = this._.root.current

        test.attempts = calculated || test.parent.attempts
    },

    /**
     * Get whether this test is failable.
     */
    get isFailable() {
        return this._.root.current.isFailable
    },

    /**
     * Get whether this test is failable.
     */
    set isFailable(isFailable) {
        this._.root.current.isFailable = !!isFailable
    },

    /**
     * Run the tests (or the test's tests if it's not a base instance).
     */
    run: function (opts) {
        var root = this._.root

        if (root.current !== root) {
            throw new Error(
                "Only the root test can be run - If you only want to run a " +
                "subtest, use `t.only = [[\"test\", ...]]` instead.")
        }

        if (root.locked) {
            throw new Error("Can't run while tests are already running.")
        }

        if (opts != null) {
            if (typeof opts !== "object") {
                throw new Error("Options must be an object if given.")
            }

            if (opts.only != null) Filter.validate(opts.only)
            if (opts.skip != null) Filter.validate(opts.skip)
        }

        var restore = root.reporter == null

        if (restore) root.reporter = Reporters.spec()
        return Tests.runTest(root, opts).then(
            function (v) { if (restore) root.reporter = undefined; return v },
            function (e) { if (restore) root.reporter = undefined; throw e }
        )
    },

    /**
     * Add a test.
     */
    test: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        Tests.addTest(this._.root.current, name, callback)
    },

    /**
     * Skip the current test dynamically
     */
    skip: function () {
        if (this._.root.current === this._.root) {
            throw new TypeError("This should only be called within tests.")
        }

        throw Tests.Skip
    },

    /**
     * Clear all existing tests.
     */
    clearTests: function () {
        if (this._.root !== this._) {
            throw new Error("Tests may only be cleared at the root.")
        }

        if (this._.locked) {
            throw new Error("Can't clear tests while they are running.")
        }

        Tests.clearTests(this._)
    },

    before: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.beforeEach = Common.addHook(test.beforeEach, callback)
    },

    beforeAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.beforeAll = Common.addHook(test.beforeAll, callback)
    },

    after: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.afterEach = Common.addHook(test.afterEach, callback)
    },

    afterAll: function (callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        var test = this._.root.current

        test.afterAll = Common.addHook(test.afterAll, callback)
    },
})

},{"../../r/index":69,"../core/filter":9,"../core/tests":11,"../methods":17,"../util":24,"./common":5,"./reflect":6}],8:[function(require,module,exports){
(function (global){
"use strict"

/**
 * This is the entry point for the Browserify bundle. Note that it *also* will
 * run as part of the tests in Node (unbundled), and it theoretically could be
 * run in Node or a runtime limited to only ES5 support (e.g. Rhino, Nashorn, or
 * embedded V8), so do *not* assume browser globals are present.
 */

var t = require("../index")
var dom = require("../dom")

global.t = t
global.assert = require("../assert")
t.r = require("../r")
t.dom = dom
t.internal = require("../internal")

function autoload(script) {
    if (!script.hasAttribute("data-files")) return

    function set(opts, attr, transform) {
        var value = script.getAttribute("data-" + attr)

        if (value) opts[attr] = transform(value)
    }

    var files = script.getAttribute("data-files").trim()
    var opts = {files: files ? files.split(/\s+/g) : []}

    set(opts, "onready", Function)
    set(opts, "timeout", Number)
    set(opts, "preload", Function)
    set(opts, "prerun", Function)
    set(opts, "postrun", Function)
    set(opts, "onerror", function (attr) {
        return new Function("err", attr) // eslint-disable-line
    })

    if (global.document.readyState !== "loading") {
        dom(opts).run()
    } else {
        global.document.addEventListener("DOMContentLoaded", function () {
            dom(opts).run()
        })
    }
}

if (global.document != null && global.document.currentScript != null) {
    autoload(global.document.currentScript)
}

// In case the user needs to adjust these (e.g. Nashorn + console output).
t.console = require("./replaced/console")

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../assert":1,"../dom":2,"../index":3,"../internal":4,"../r":69,"./replaced/console":18}],9:[function(require,module,exports){
"use strict"

var assert = require("../util").assert

/**
 * The filter is actually stored as a tree for faster lookup times when there
 * are multiple selectors. Objects can't be used for the nodes, where keys
 * represent values and values represent children, because regular expressions
 * aren't possible to use.
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

function matches(value, entry) {
    if (typeof value === "string") {
        return value === entry.name
    } else {
        return value.test(entry.name)
    }
}

function Filter(value) {
    assert(
        value == null || typeof value === "string" || value instanceof RegExp
    )

    this.value = value
    this.length = 0
}

function findEquivalent(node, entry) {
    assert(node != null && typeof node === "object")
    assert(typeof entry === "string" || entry instanceof RegExp)

    for (var i = 0; i < node.length; i++) {
        if (isEquivalent(node[i].value, entry)) return node[i]
    }

    return undefined
}

/**
 * Validate a selector at the API level.
 */
exports.validate = function (list) {
    for (var i = 0; i < list.length; i++) {
        var selector = list[i]

        if (!Array.isArray(selector)) {
            throw new TypeError("Expected selector " + i + " to be an array")
        }

        for (var j = 0; j < selector.length; j++) {
            // Strings and regular expressions are the only things allowed.
            if (typeof selector[j] !== "string" &&
                    !(selector[j] instanceof RegExp)) {
                throw new TypeError(
                    "Selector " + i + " may only consist of strings and " +
                    "regular expressions")
            }
        }
    }
}

/**
 * Create a filter from a list of selectors
 */
exports.create = function (list) {
    assert(Array.isArray(list))
    var filter = new Filter()

    for (var i = 0; i < list.length; i++) {
        var selector = list[i]
        var node = filter

        for (var j = 0; j < selector.length; j++) {
            var entry = selector[j]
            var child = findEquivalent(node, entry)

            if (child == null) {
                child = new Filter(entry)
                node[node.length++] = child
            }

            node = child
        }
    }

    return filter
}

/**
 * Test if a path matches a filter. Returns `undefined` if no match, `false` if
 * incomplete, and `true` if exact.
 */
exports.test = function (path, filter) {
    assert(Array.isArray(path))
    assert(filter != null && typeof filter === "object")

    loop: // eslint-disable-line no-labels
    for (var i = 0; i < path.length; i++) {
        var entry = path[i]

        for (var j = 0; j < filter.length; j++) {
            if (matches(filter[j].value, entry)) {
                filter = filter[j]
                continue loop // eslint-disable-line no-labels
            }
        }

        return undefined
    }

    return filter.length === 0
}

},{"../util":24}],10:[function(require,module,exports){
"use strict"

var methods = require("../methods")
var assert = require("../util").assert

/**
 * All the report types. The only reason there are more than two types (normal
 * and hook) is for the user's benefit (dev tools, `util.inspect`, etc.)
 */

var Types = exports.Types = Object.freeze({
    Start: 0,
    Enter: 1,
    Leave: 2,
    Pass: 3,
    Fail: 4,
    Skip: 5,
    End: 6,
    Error: 7,

    // Note that `Hook` is actually a bit flag, to save some space (and to
    // simplify the type representation).
    Hook: 8,
})

var HookStage = exports.HookStage = Object.freeze({
    BeforeAll: Types.Hook | 0,
    BeforeEach: Types.Hook | 1,
    AfterEach: Types.Hook | 2,
    AfterAll: Types.Hook | 3,
})

exports.Report = Report
function Report(type) {
    assert(typeof type === "number")

    this._ = type
}

// Avoid a recursive call when `inspect`ing a result while still keeping it
// styled like it would be normally. Each type uses a named singleton factory to
// ensure engines show the correct `name`/`displayName` for the type.
function initInspect(inspect, report) {
    var type = report._

    if (type & Types.Hook) {
        inspect.stage = report.stage
    }

    if (type !== Types.Start &&
            type !== Types.End &&
            type !== Types.Error) {
        inspect.path = report.path
    }

    if (type & Types.Hook) {
        inspect.rootPath = report.rootPath
    }

    // Only add the relevant properties
    if (type === Types.Fail ||
            type === Types.Error ||
            type & Types.Hook) {
        inspect.value = report.value
    }

    if (type === Types.Enter ||
            type === Types.Pass ||
            type === Types.Fail) {
        inspect.duration = report.duration
        inspect.slow = report.slow
    }

    if (type === Types.Fail) {
        inspect.isFailable = report.isFailable
    }
}

methods(Report, {
    // The report types
    get isStart() { return this._ === Types.Start },
    get isEnter() { return this._ === Types.Enter },
    get isLeave() { return this._ === Types.Leave },
    get isPass() { return this._ === Types.Pass },
    get isFail() { return this._ === Types.Fail },
    get isSkip() { return this._ === Types.Skip },
    get isEnd() { return this._ === Types.End },
    get isError() { return this._ === Types.Error },
    get isHook() { return (this._ & Types.Hook) !== 0 },

    /**
     * Get a stringified description of the type.
     */
    get type() {
        switch (this._) {
        case Types.Start: return "start"
        case Types.Enter: return "enter"
        case Types.Leave: return "leave"
        case Types.Pass: return "pass"
        case Types.Fail: return "fail"
        case Types.Skip: return "skip"
        case Types.End: return "end"
        case Types.Error: return "error"
        default:
            if (this._ & Types.Hook) return "hook"
            throw new Error("unreachable")
        }
    },
})

exports.Start = StartReport
function StartReport() {
    Report.call(this, Types.Start)
}
methods(StartReport, Report, {
    inspect: function () {
        return new function Report(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Enter = EnterReport
function EnterReport(path, duration, slow) {
    Report.call(this, Types.Enter)
    this.path = path
    this.duration = duration
    this.slow = slow
}
methods(EnterReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function EnterReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Leave = LeaveReport
function LeaveReport(path) {
    Report.call(this, Types.Leave)
    this.path = path
}
methods(LeaveReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function LeaveReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Pass = PassReport
function PassReport(path, duration, slow) {
    Report.call(this, Types.Pass)
    this.path = path
    this.duration = duration
    this.slow = slow
}
methods(PassReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function PassReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Fail = FailReport
function FailReport(path, error, duration, slow, isFailable) { // eslint-disable-line max-params, max-len
    Report.call(this, Types.Fail)
    this.path = path
    this.error = error
    this.duration = duration
    this.slow = slow
    this.isFailable = isFailable
}
methods(FailReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function FailReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Skip = SkipReport
function SkipReport(path) {
    Report.call(this, Types.Skip)
    this.path = path
}
methods(SkipReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function SkipReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.End = EndReport
function EndReport() {
    Report.call(this, Types.End)
}
methods(EndReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function EndReport(report) {
            initInspect(this, report)
        }(this)
    },
})

exports.Error = ErrorReport
function ErrorReport(error) {
    Report.call(this, Types.Error)
    this.error = error
}
methods(ErrorReport, Report, {
    /**
     * So util.inspect provides more sensible output for testing/etc.
     */
    inspect: function () {
        return new function ErrorReport(report) {
            initInspect(this, report)
        }(this)
    },
})

var HookMethods = {
    get stage() {
        switch (this._) {
        case HookStage.BeforeAll: return "before all"
        case HookStage.BeforeEach: return "before each"
        case HookStage.AfterEach: return "after each"
        case HookStage.AfterAll: return "after all"
        default: throw new Error("unreachable")
        }
    },

    get isBeforeAll() { return this._ === HookStage.BeforeAll },
    get isBeforeEach() { return this._ === HookStage.BeforeEach },
    get isAfterEach() { return this._ === HookStage.AfterEach },
    get isAfterAll() { return this._ === HookStage.AfterAll },
}

exports.HookError = HookError
function HookError(stage, func, error) {
    this._ = stage
    this.name = func.name || func.displayName || ""
    this.error = error
}
methods(HookError, HookMethods)

exports.Hook = HookReport
function HookReport(path, rootPath, hookError) {
    Report.call(this, hookError._)
    this.path = path
    this.rootPath = rootPath
    this.name = hookError.name
    this.error = hookError.error
}
methods(HookReport, Report, HookMethods, {
    get hookError() { return new HookError(this._, this, this.error) },
})

},{"../methods":17,"../util":24}],11:[function(require,module,exports){
(function (global){
"use strict"

var methods = require("../methods")
var Util = require("../util")
var Reports = require("./reports")
var Filter = require("./filter")
var HookStage = Reports.HookStage
var assert = Util.assert
var peach = Util.peach

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

// Named for debuggability
exports.Skip = new function Skip() {}()

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

exports.defaultTimeout = 2000 // ms
exports.defaultSlow = 75 // ms

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

    return Promise.resolve()
    .then(function () {
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
        return reporter(new Reports.Start())
    })
}

function reportEnter(context, duration) {
    assert(context != null && typeof context === "object")
    assert(typeof duration === "number")

    var test = context.root.current
    var slow = test.slow || exports.defaultSlow

    return reportWith(context, function (reporter) {
        var path = makeSlice(context.tests, context.tests.length)

        return reporter(new Reports.Enter(path, duration, slow))
    })
}

function reportLeave(context) {
    assert(context != null && typeof context === "object")

    return reportWith(context, function (reporter) {
        return reporter(new Reports.Leave(
            makeSlice(context.tests, context.tests.length)))
    })
}

function reportPass(context, duration) {
    assert(context != null && typeof context === "object")
    assert(typeof duration === "number")

    var test = context.root.current
    var slow = test.slow || exports.defaultSlow

    return reportWith(context, function (reporter) {
        var path = makeSlice(context.tests, context.tests.length)

        return reporter(new Reports.Pass(path, duration, slow))
    })
}

function reportFail(context, error, duration) {
    assert(context != null && typeof context === "object")
    assert(typeof duration === "number")

    var test = context.root.current
    var slow = test.slow || exports.defaultSlow
    var isFailable = test.isFailable

    return reportWith(context, function (reporter) {
        var path = makeSlice(context.tests, context.tests.length)

        return reporter(new Reports.Fail(
            path, error, duration, slow, isFailable))
    })
}

function reportSkip(context) {
    assert(context != null && typeof context === "object")

    return reportWith(context, function (reporter) {
        return reporter(new Reports.Skip(
            makeSlice(context.tests, context.tests.length)))
    })
}

function reportEnd(context) {
    assert(context != null && typeof context === "object")

    return reportWith(context, function (reporter) {
        return reporter(new Reports.End())
    })
}

function reportError(context, error) {
    assert(context != null && typeof context === "object")

    return reportWith(context, function (reporter) {
        return reporter(new Reports.Error(error))
    })
}

function reportHook(context, test, error) {
    assert(context != null && typeof context === "object")
    assert(test != null && typeof test === "object")

    return reportWith(context, function (reporter) {
        return reporter(new Reports.Hook(
            makeSlice(context.tests, context.tests.length),
            makeSlice(context.tests, context.tests.indexOf(test) + 1),
            error))
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

    if (state.timer) {
        clearTimeout.call(global, state.timer)
        state.timer = undefined
    }

    if (attempt.caught && state.count < state.context.root.current.attempts) {
        // Don't recurse synchronously, since it may be resolved synchronously
        state.resolve(p.then(function () {
            return invokeInit(state.context, state.count + 1)
        }))
    } else {
        state.resolve(new Result(end - state.start, attempt))
    }
}

// Avoid creating a closure if possible, in case it doesn't return a thenable.
function invokeInit(context, count) {
    assert(context != null && typeof context === "object")
    assert(typeof count === "number")

    var test = context.root.current
    var start = now()
    var tryBody = try0(test.callback)
    var syncEnd = now()

    // Note: synchronous failures are test failures, not fatal errors.
    if (tryBody.caught) {
        if (count < test.attempts) return invokeInit(context, count + 1)
        return Promise.resolve(new Result(syncEnd - start, tryBody))
    }

    var tryThen = try1(getThen, undefined, tryBody.value)

    if (tryThen.caught) {
        if (count < test.attempts) return invokeInit(context, count + 1)
        return Promise.resolve(new Result(syncEnd - start, tryThen))
    }

    if (typeof tryThen.value !== "function") {
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
        var maxTimeout = test.timeout || exports.defaultTimeout

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

function ErrorWrap(test, error) {
    assert(test != null && typeof test === "object")

    this.test = test
    this.error = error
}
methods(ErrorWrap, Error, {name: "ErrorWrap"})

function invokeHook(test, list, stage) {
    assert(test != null && typeof test === "object")
    if (list == null) return Promise.resolve()
    assert(Array.isArray(list))
    return peach(list, function (hook) {
        try {
            return hook()
        } catch (e) {
            throw new ErrorWrap(test, new Reports.HookError(stage, hook, e))
        }
    })
}

function invokeBeforeEach(test) {
    assert(test != null && typeof test === "object")

    if (test.root === test) {
        return invokeHook(test, test.beforeEach, HookStage.BeforeEach)
    } else {
        return invokeBeforeEach(test.parent).then(function () {
            return invokeHook(test, test.beforeEach, HookStage.BeforeEach)
        })
    }
}

function invokeAfterEach(test) {
    assert(test != null && typeof test === "object")

    if (test.root === test) {
        return invokeHook(test, test.afterEach, HookStage.AfterEach)
    } else {
        return invokeHook(test, test.afterEach, HookStage.AfterEach)
        .then(function () { return invokeAfterEach(test.parent) })
    }
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

    function leave() {
        test.root.current = test
        context.tests.pop()
    }

    function runChild(child) {
        test.root.current = child
        context.tests.push(child)

        return invokeBeforeEach(test)
        .then(function () { return runNormalChild(child, context) })
        .then(function () { return invokeAfterEach(test) })
        .catch(function (e) {
            if (!(e instanceof ErrorWrap)) throw e
            return reportHook(context, e.test, e.error)
        })
        .then(leave, function (e) { leave(); throw e })
    }

    var ran = false

    return peach(test.tests, function (child) {
        context.tests.push(child)
        if (!isOnly(context)) {
            context.tests.pop()
            return Promise.resolve()
        } else if (isSkipped(context)) {
            // Check for pre-skipped tests.
            return reportSkip(context).then(
                function () { context.tests.pop() },
                function (e) { context.tests.pop(); throw e })
        } else if (ran) {
            context.tests.pop()
            return runChild(child)
        } else {
            context.tests.pop()
            ran = true
            return invokeHook(test, test.beforeAll, HookStage.BeforeAll)
            .then(function () { return runChild(child) })
        }
    })
    .then(function () {
        if (!ran) return undefined
        return invokeHook(test, test.afterAll, HookStage.AfterAll)
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

    test.locked = false

    return invokeInit(context, 1)
    .then(
        function (result) { test.locked = true; return result },
        function (error) { test.locked = true; throw error })
    .then(function (result) {
        if (result.caught) {
            if (result.value === exports.Skip) return reportSkip(context)
            if (!test.isFailable) context.isSuccess = false
            return reportFail(context, result.value, result.time)
        } else if (test.tests != null) {
            // Report this as if it was a parent test if it's passing and has
            // children.
            return reportEnter(context, result.time)
            .then(function () { return runChildTests(test, context) })
            .then(function () { return reportLeave(context) })
            .catch(function (e) {
                if (!(e instanceof ErrorWrap)) throw e
                return reportLeave(context).then(function () {
                    return reportHook(context, e.test, e.error)
                })
            })
        } else {
            return reportPass(context, result.time)
        }
    })
    .then(
        function () { clearChildren(test) },
        function (e) { clearChildren(test); throw e })
}

/**
 * This runs the root test and returns a promise resolved when it's done.
 */
exports.runTest = function (root, opts) {
    assert(root != null && typeof root === "object")
    assert(opts == null || typeof opts === "object")

    var context = new Context(root, opts)

    root.locked = true
    return reportStart(context)
    .then(function () { return runChildTests(root, context) })
    .catch(function (e) {
        if (!(e instanceof ErrorWrap)) throw e
        return reportHook(context, e.test, e.error)
    })
    .then(function () { return reportEnd(context) })
    // Tell the reporter something happened. Otherwise, it'll have to wrap this
    // method in a plugin, which shouldn't be necessary.
    .catch(function (e) {
        return reportError(context, e).then(function () { throw e })
    })
    .then(
        function () {
            clearChildren(root)
            root.locked = false
            return {
                isSuccess: context.isSuccess,
            }
        },
        function (e) {
            clearChildren(root)
            root.locked = false
            throw e
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../methods":17,"../util":24,"./filter":9,"./reports":10}],12:[function(require,module,exports){
"use strict"

/**
 * The reporter and test initialization sequence, and script loading. This
 * doesn't understand anything view-wise.
 */

var defaultT = require("../../index")

var assert = require("../util").assert
var methods = require("../methods")
var R = require("../reporter")

var D = require("./inject")
var runTests = require("./run-tests")
var injectStyles = require("./inject-styles")
var View = require("./view")

function Tree(name) {
    assert(name == null || typeof name === "string")
    this.name = name
    this.status = R.Status.Unknown
    this.node = null
    this.children = Object.create(null)
}

var reporter = R.on("dom", {
    accepts: [],
    create: function (opts, methods) {
        assert(opts != null && typeof opts === "object")
        assert(methods != null && typeof methods === "object")

        var reporter = new R.Reporter(Tree, undefined, methods, false)

        reporter.opts = opts
        return reporter
    },

    // Give the browser a chance to repaint before continuing (microtasks
    // normally block rendering).
    after: function () {
        return new Promise(View.nextFrame)
    },

    report: function (_, report) {
        return View.report(_, report)
    },
})

function noop() {}

function setDefaultsChecked(opts) {
    assert(opts != null && typeof opts === "object")

    if (opts.title == null) opts.title = "Thallium tests"
    if (opts.timeout == null) opts.timeout = 5000
    if (opts.files == null) opts.files = []
    if (opts.preload == null) opts.preload = noop
    if (opts.prerun == null) opts.prerun = noop
    if (opts.postrun == null) opts.postrun = noop
    if (opts.error == null) opts.error = noop
    if (opts.thallium == null) opts.thallium = defaultT

    if (typeof opts.title !== "string") {
        throw new TypeError("`opts.title` must be a string if passed")
    }

    if (typeof opts.timeout !== "number") {
        throw new TypeError("`opts.timeout` must be a number if passed")
    }

    if (!Array.isArray(opts.files)) {
        throw new TypeError("`opts.files` must be an array if passed")
    }

    if (typeof opts.preload !== "function") {
        throw new TypeError("`opts.preload` must be a function if passed")
    }

    if (typeof opts.prerun !== "function") {
        throw new TypeError("`opts.prerun` must be a function if passed")
    }

    if (typeof opts.postrun !== "function") {
        throw new TypeError("`opts.postrun` must be a function if passed")
    }

    if (typeof opts.error !== "function") {
        throw new TypeError("`opts.error` must be a function if passed")
    }

    if (typeof opts.thallium !== "object") {
        throw new TypeError(
            "`opts.thallium` must be a Thallium instance if passed")
    }
}

function onReady(init) {
    assert(typeof init === "function")

    if (D.document.body != null) return Promise.resolve(init())
    return new Promise(function (resolve) {
        D.document.addEventListener("DOMContentLoaded", function () {
            resolve(init())
        }, false)
    })
}

function DOM(opts) {
    assert(opts != null && typeof opts === "object")

    this._opts = opts
    this._destroyPromise = undefined
    this._data = onReady(function () {
        setDefaultsChecked(opts)
        if (!D.document.title) D.document.title = opts.title
        injectStyles()
        var data = View.init(opts)

        opts.thallium.reporter = reporter(data.state)
        return data
    })
}

methods(DOM, {
    run: function () {
        if (this._destroyPromise != null) {
            return Promise.reject(new Error(
                "The test suite must not be run after the view has been " +
                "detached."
            ))
        }

        var opts = this._opts

        return this._data.then(function (data) {
            return runTests(opts, data.state)
        })
    },

    detach: function () {
        if (this._destroyPromise != null) return this._destroyPromise
        var self = this

        return this._destroyPromise = self._data.then(function (data) {
            data.state.locked = true
            if (data.state.currentPromise == null) return data
            return data.state.currentPromise.then(function () { return data })
        })
        .then(function (data) {
            self._opts = undefined
            self._data = self._destroyPromise

            while (data.root.firstChild) {
                data.root.removeChild(data.root.firstChild)
            }
        })
    },
})

module.exports = function (opts) {
    if (opts == null) return new DOM({})
    if (Array.isArray(opts)) return new DOM({files: opts})
    if (typeof opts === "object") return new DOM(opts)
    throw new TypeError("`opts` must be an object or array of files if passed")
}

},{"../../index":3,"../methods":17,"../reporter":20,"../util":24,"./inject":14,"./inject-styles":13,"./run-tests":15,"./view":16}],13:[function(require,module,exports){
"use strict"

var Util = require("../util")
var D = require("./inject")
var assert = Util.assert

/**
 * The reporter stylesheet. Here's the format:
 *
 * // Single item
 * ".selector": {
 *     // props...
 * }
 *
 * // Duplicate entries
 * ".selector": {
 *     "prop": [
 *         // values...
 *     ],
 * }
 *
 * // Duplicate selectors
 * ".selector": [
 *     // values...
 * ]
 *
 * // Media query
 * "@media screen": {
 *     // selectors...
 * }
 *
 * Note that CSS strings *must* be quoted inside the value.
 */

var styles = Util.lazy(function () {
    var hasOwn = Object.prototype.hasOwnProperty

    /**
     * Partially taken and adapted from normalize.css (licensed under the MIT
     * License).
     * https://github.com/necolas/normalize.css
     */
    var styleObject = {
        "#tl": {
            "font-family": "sans-serif",
            "line-height": "1.15",
            "-ms-text-size-adjust": "100%",
            "-webkit-text-size-adjust": "100%",
        },

        "#tl button": {
            "font-family": "sans-serif",
            "line-height": "1.15",
            "overflow": "visible",
            "font-size": "100%",
            "margin": "0",
            "text-transform": "none",
            "-webkit-appearance": "button",
        },

        "#tl h1": {
            "font-size": "2em",
            "margin": "0.67em 0",
        },

        "#tl a": {
            "background-color": "transparent",
            "-webkit-text-decoration-skip": "objects",
        },

        "#tl a:active, #tl a:hover": {
            "outline-width": "0",
        },

        "#tl button::-moz-focus-inner": {
            "border-style": "none",
            "padding": "0",
        },

        "#tl button:-moz-focusring": {
            outline: "1px dotted ButtonText",
        },

        /**
         * Base styles. Note that this CSS is designed to intentionally override
         * most things that could propagate.
         */
        "#tl *": [
            {"text-align": "left"},
            {"text-align": "start"},
        ],

        "#tl .tl-report, #tl .tl-report ul": {
            "list-style-type": "none",
        },

        "#tl li ~ .tl-suite": {
            "padding-top": "1em",
        },

        "#tl .tl-suite > h2": {
            "color": "black",
            "font-size": "1.5em",
            "font-weight": "bold",
            "margin-bottom": "0.5em",
        },

        "#tl .tl-suite .tl-suite > h2": {
            "font-size": "1.2em",
            "margin-bottom": "0.3em",
        },

        "#tl .tl-suite .tl-suite .tl-suite > h2": {
            "font-size": "1.2em",
            "margin-bottom": "0.2em",
            "font-weight": "normal",
        },

        "#tl .tl-test > h2": {
            "color": "black",
            "font-size": "1em",
            "font-weight": "normal",
            "margin": "0",
        },

        "#tl .tl-test > :first-child::before": {
            "display": "inline-block",
            "font-weight": "bold",
            "width": "1.2em",
            "text-align": "center",
            "font-family": "sans-serif",
            "text-shadow": "0 3px 2px #969696",
        },

        "#tl .tl-test.tl-fail > h2, #tl .tl-test.tl-error > h2": {
            color: "#c00",
        },

        "#tl .tl-test.tl-skip > h2": {
            color: "#08c",
        },

        "#tl .tl-test.tl-pass > :first-child::before": {
            content: "'✓'",
            color: "#0c0",
        },

        "#tl .tl-test.tl-fail > :first-child::before": {
            content: "'✖'",
        },

        "#tl .tl-test.tl-error > :first-child::before": {
            content: "'!'",
        },

        "#tl .tl-test.tl-skip > :first-child::before": {
            content: "'−'",
        },

        "#tl .tl-pre, #tl .tl-diff-header": {
            // normalize.css: Correct the inheritance and scaling of font size
            // in all browsers
            "font-family": "monospace, monospace",
            "background": "#f0f0f0",
            "white-space": "pre",
            "font-size": "0.85em",
        },

        "#tl .tl-pre": {
            "min-width": "100%",
            "float": "left",
            "clear": "left",
        },

        "#tl .tl-line": {
            display: "block",
            margin: "0 0.25em",
            width: "99%", // Because Firefox sucks
        },

        "#tl .tl-diff-header > *": {
            padding: "0.25em",
        },

        "#tl .tl-diff-header": {
            "padding": "0.25em",
            "margin-bottom": "0.5em",
            "display": "inline-block",
        },

        "#tl .tl-line:first-child, #tl .tl-diff-header ~ .tl-line": {
            "padding-top": "0.25em",
        },

        "#tl .tl-line:last-child": {
            "padding-bottom": "0.25em",
        },

        "#tl .tl-fail .tl-display": {
            margin: "0.5em",
        },

        "#tl .tl-display > *": {
            overflow: "auto",
        },

        "#tl .tl-display > :not(:last-child)": {
            "margin-bottom": "0.5em",
        },

        "#tl .tl-diff-added": {
            "color": "#0c0",
            "font-weight": "bold",
        },

        "#tl .tl-diff-removed": {
            "color": "#c00",
            "font-weight": "bold",
        },

        "#tl .tl-stack .tl-line": {
            color: "#800",
        },

        "#tl .tl-diff::before, #tl .tl-stack::before": {
            "font-weight": "normal",
            "margin": "0.25em 0.25em 0.25em 0",
            "display": "block",
            "font-style": "italic",
        },

        "#tl .tl-diff::before": {
            content: "'Diff:'",
        },

        "#tl .tl-stack::before": {
            content: "'Stack:'",
        },

        "#tl .tl-header": {
            "text-align": "right",
        },

        "#tl .tl-header > *": {
            "display": "inline-block",
            "text-align": "center",
            "padding": "0.5em 0.75em",
            "border": "2px solid #00c",
            "border-radius": "1em",
            "background-color": "transparent",
            "margin": "0.25em 0.5em",
        },

        "#tl .tl-header > :focus": {
            outline: "none",
        },

        "#tl .tl-run": {
            "border-color": "#080",
            "background-color": "#0c0",
            "color": "white",
            "width": "6em",
        },

        "#tl .tl-run:hover": {
            "background-color": "#8c8",
            "color": "white",
        },

        "#tl .tl-toggle.tl-pass": {
            "border-color": "#0c0",
        },

        "#tl .tl-toggle.tl-fail": {
            "border-color": "#c00",
        },

        "#tl .tl-toggle.tl-skip": {
            "border-color": "#08c",
        },

        "#tl .tl-toggle.tl-pass.tl-active, #tl .tl-toggle.tl-pass:active": {
            "border-color": "#080",
            "background-color": "#0c0",
        },

        "#tl .tl-toggle.tl-fail.tl-active, #tl .tl-toggle.tl-fail:active": {
            "border-color": "#800",
            "background-color": "#c00",
        },

        "#tl .tl-toggle.tl-skip.tl-active, #tl .tl-toggle.tl-skip:active": {
            "border-color": "#058",
            "background-color": "#08c",
        },

        "#tl .tl-toggle.tl-pass:hover": {
            "border-color": "#0c0",
            "background-color": "#afa",
        },

        "#tl .tl-toggle.tl-fail:hover": {
            "border-color": "#c00",
            "background-color": "#faa",
        },

        "#tl .tl-toggle.tl-skip:hover": {
            "border-color": "#08c",
            "background-color": "#bdf",
        },

        "#tl .tl-report.tl-pass .tl-test:not(.tl-pass)": {
            display: "none",
        },

        "#tl .tl-report.tl-fail .tl-test:not(.tl-fail)": {
            display: "none",
        },

        "#tl .tl-report.tl-skip .tl-test:not(.tl-skip)": {
            display: "none",
        },
    }

    var css = ""

    function appendBase(selector, props) {
        assert(typeof selector === "string")
        css += selector + "{"

        if (Array.isArray(props)) {
            for (var i = 0; i < props.length; i++) {
                appendProps(props[i])
            }
        } else {
            appendProps(props)
        }

        css += "}"
    }

    function appendProps(props) {
        assert(props != null && typeof props === "object")
        for (var key in props) {
            if (hasOwn.call(props, key)) {
                if (typeof props[key] === "object") {
                    appendBase(key, props[key])
                } else {
                    css += key + ":" + props[key] + ";"
                }
            }
        }
    }

    for (var selector in styleObject) {
        if (hasOwn.call(styleObject, selector)) {
            appendBase(selector, styleObject[selector])
        }
    }

    return css.concat() // Hint to flatten.
})

module.exports = function () {
    if (D.document.head.querySelector("style[data-tl-style]") == null) {
        var style = D.document.createElement("style")

        style.type = "text/css"
        style.setAttribute("data-tl-style", "")
        if (style.styleSheet) {
            style.styleSheet.cssText = styles()
        } else {
            style.appendChild(D.document.createTextNode(styles()))
        }

        D.document.head.appendChild(style)
    }
}

},{"../util":24,"./inject":14}],14:[function(require,module,exports){
(function (global){
"use strict"

/**
 * The global injections for the DOM. Mainly for debugging.
 */

exports.document = global.document
exports.window = global.window

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],15:[function(require,module,exports){
(function (global){
"use strict"

var Util = require("../util")
var D = require("./inject")
var now = Date.now // Avoid Sinon's mock
var hasOwn = Object.prototype.hasOwnProperty
var assert = Util.assert

/**
 * Test runner and script loader
 */

function uncached(file) {
    assert(typeof file === "string")

    if (file.indexOf("?") < 0) {
        return file + "?loaded=" + now()
    } else {
        return file + "&loaded=" + now()
    }
}

function loadScript(file, timeout) {
    assert(typeof file === "string")
    assert(typeof timeout === "number")

    return new Promise(function (resolve, reject) {
        var script = D.document.createElement("script")
        var timer = global.setTimeout(function () {
            clear()
            reject(new Error("Timeout exceeded loading '" + file + "'"))
        }, timeout)

        function clear(ev) {
            if (ev != null) ev.preventDefault()
            if (ev != null) ev.stopPropagation()
            global.clearTimeout(timer)
            script.onload = undefined
            script.onerror = undefined
            D.document.head.removeChild(script)
        }

        script.src = uncached(file)
        script.async = true
        script.defer = true
        script.onload = function (ev) {
            clear(ev)
            resolve()
        }

        script.onerror = function (ev) {
            clear(ev)
            reject(ev)
        }

        D.document.head.appendChild(script)
    })
}

function tryDelete(key) {
    assert(typeof key === "string")

    try {
        delete global[key]
    } catch (_) {
        // ignore
    }
}

function descriptorChanged(a, b) {
    // Note: if the descriptor was removed, it would've been deleted, anyways.
    if (a == null) return false
    if (a.configurable !== b.configurable) return true
    if (a.enumerable !== b.enumerable) return true
    if (a.writable !== b.writable) return true
    if (a.get !== b.get) return true
    if (a.set !== b.set) return true
    if (a.value !== b.value) return true
    return false
}

// These fire deprecation warnings, and thus should be avoided.
var blacklist = Object.freeze({
    webkitStorageInfo: true,
    webkitIndexedDB: true,
})

function findGlobals() {
    var found = Object.keys(global)
    var globals = Object.create(null)

    for (var i = 0; i < found.length; i++) {
        var key = found[i]

        if (!hasOwn.call(blacklist, key)) {
            globals[key] = Object.getOwnPropertyDescriptor(global, key)
        }
    }

    return globals
}

module.exports = function (opts, state) {
    assert(opts != null && typeof opts === "object")
    assert(state != null && typeof state === "object")

    if (state.locked) {
        return Promise.reject(new Error(
            "The test suite must not be run after the view has been detached."
        ))
    }

    if (state.currentPromise != null) return state.currentPromise

    opts.thallium.clearTests()

    // Detect and remove globals created by loaded scripts.
    var globals = findGlobals()

    function cleanup() {
        var found = Object.keys(global)

        for (var i = 0; i < found.length; i++) {
            var key = found[i]

            if (!hasOwn.call(globals, key)) {
                tryDelete(key)
            } else if (descriptorChanged(
                Object.getOwnPropertyDescriptor(global, key),
                globals[key]
            )) {
                tryDelete(key)
            }
        }

        state.currentPromise = undefined
    }

    return state.currentPromise = Promise.resolve()
    .then(function () {
        state.pass.textContent = "0"
        state.fail.textContent = "0"
        state.skip.textContent = "0"
        return opts.preload()
    })
    .then(function () {
        return Util.peach(opts.files, function (file) {
            return loadScript(file, opts.timeout)
        })
    })
    .then(function () { return opts.prerun() })
    .then(function () { return opts.thallium.run() })
    .then(function () { return opts.postrun() })
    .catch(function (e) {
        return Promise.resolve(opts.error(e)).then(function () { throw e })
    })
    .then(
        function () { cleanup() },
        function (e) { cleanup(); throw e })
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../util":24,"./inject":14}],16:[function(require,module,exports){
(function (global){
"use strict"

var diff = require("diff")
var inspect = require("clean-assert-util").inspect

var R = require("../reporter")
var assert = require("../util").assert

var D = require("./inject")
var runTests = require("./run-tests")

/**
 * View logic
 */

function t(text) {
    assert(typeof text === "string")
    return D.document.createTextNode(text)
}

function h(type, attrs, children) {
    assert(typeof type === "string")
    var parts = type.split(/\s+/g)

    if (Array.isArray(attrs)) {
        children = attrs
        attrs = undefined
    }

    if (attrs == null) attrs = {}
    if (children == null) children = []

    type = parts[0]
    attrs.className = parts.slice(1).join(" ")

    var elem = D.document.createElement(type)

    Object.keys(attrs).forEach(function (attr) {
        elem[attr] = attrs[attr]
    })

    children.forEach(function (child) {
        if (child != null) elem.appendChild(child)
    })

    return elem
}

function unifiedDiff(err) {
    assert(err != null && typeof err === "object")
    assert(err.name === "AssertionError")

    var actual = inspect(err.actual)
    var expected = inspect(err.expected)
    var msg = diff.createPatch("string", actual, expected)
        .split(/\r?\n|\r/g).slice(4)
        .filter(function (line) { return !/^\@\@|^\\ No newline/.test(line) })
    var end = msg.length

    while (end !== 0 && /^\s*$/g.test(msg[end - 1])) end--
    return h("div tl-diff", [
        h("div tl-diff-header", [
            h("span tl-diff-added", [t("+ expected")]),
            h("span tl-diff-removed", [t("- actual")]),
        ]),
        h("div tl-pre", !end
            ? [h("span tl-line tl-diff-added", [t(" (none)")])]
            : msg.slice(0, end)
            .map(function (line) { return line.trimRight() })
            .map(function (line) {
                if (line[0] === "+") {
                    return h("span tl-line tl-diff-added", [t(line)])
                } else if (line[0] === "-") {
                    return h("span tl-line tl-diff-removed", [t(line)])
                } else {
                    return h("span tl-line tl-diff-none", [t(line)])
                }
            })
        ),
    ])
}

function toLines(str) {
    assert(typeof str === "string")

    return h("div tl-pre", str.split(/\r?\n|\r/g).map(function (line) {
        return h("span tl-line", [t(line.trimRight())])
    }))
}

function formatError(e, showDiff) {
    var stack = R.readStack(e)

    return h("div tl-display", [
        h("div tl-message", [toLines(e.name + ": " + e.message)]),
        showDiff ? unifiedDiff(e) : undefined,
        stack ? h("div tl-stack", [toLines(stack)]) : undefined,
    ])
}

function showTest(_, report, className, child) {
    assert(_ != null && typeof _ === "object")
    assert(report != null && typeof report === "object")
    assert(typeof className === "string")
    assert(child == null || typeof child === "object")

    var end = report.path.length - 1
    var name = report.path[end].name
    var parent = _.get(report.path, end)
    var speed = R.speed(report)

    if (speed === "fast") {
        parent.node.appendChild(h("li " + className + " tl-fast", [
            h("h2", [t(name)]),
            child,
        ]))
    } else {
        parent.node.appendChild(h("li " + className + " tl-" + speed, [
            h("h2", [
                t(name + " ("),
                h("span tl-duration", [t(R.formatTime(report.duration))]),
                t(")"),
            ]),
            child,
        ]))
    }

    _.opts.duration.textContent = R.formatTime(_.duration)
}

function showSkip(_, report) {
    assert(_ != null && typeof _ === "object")
    assert(report != null && typeof report === "object")

    var end = report.path.length - 1
    var name = report.path[end].name
    var parent = _.get(report.path, end)

    parent.node.appendChild(h("li tl-test tl-skip", [
        h("h2", [t(name)]),
    ]))
}

exports.nextFrame = nextFrame
function nextFrame(func) {
    assert(typeof func === "function")

    if (D.window.requestAnimationFrame) {
        D.window.requestAnimationFrame(func)
    } else {
        global.setTimeout(func, 0)
    }
}

exports.report = function (_, report) {
    assert(_ != null && typeof _ === "object")
    assert(report != null && typeof report === "object")

    if (report.isStart) {
        return new Promise(function (resolve) {
            // Clear the element first, just in case.
            while (_.opts.report.firstChild) {
                _.opts.report.removeChild(_.opts.report.firstChild)
            }

            // Defer the next frame, so the current changes can be sent, in case
            // it's clearing old test results from a large suite. (Chrome does
            // better batching this way, at least.)
            nextFrame(function () {
                _.get([], 0).node = _.opts.report
                _.opts.duration.textContent = R.formatTime(0)
                _.opts.pass.textContent = "0"
                _.opts.fail.textContent = "0"
                _.opts.skip.textContent = "0"
                resolve()
            })
        })
    } else if (report.isEnter) {
        var child = h("ul")

        _.get(report.path).node = child
        showTest(_, report, "tl-suite tl-pass", child)
        _.opts.pass.textContent = _.pass
    } else if (report.isPass) {
        showTest(_, report, "tl-test tl-pass")
        _.opts.pass.textContent = _.pass
    } else if (report.isFail) {
        showTest(_, report, "tl-test tl-fail", formatError(report.error,
            report.error.name === "AssertionError" &&
                report.error.showDiff !== false))
        _.opts.fail.textContent = _.fail
    } else if (report.isSkip) {
        showSkip(_, report, "tl-test tl-skip")
        _.opts.skip.textContent = _.skip
    } else if (report.isError) {
        _.opts.report.appendChild(h("li tl-error", [
            h("h2", [t("Internal error")]),
            formatError(report.error, false),
        ]))
    }

    return undefined
}

function makeCounter(state, child, label, name) {
    assert(state != null && typeof state === "object")
    assert(child != null && typeof child === "object")
    assert(typeof label === "string")
    assert(typeof name === "string")

    return h("button tl-toggle " + name, {
        onclick: function (ev) {
            ev.preventDefault()
            ev.stopPropagation()

            if (/\btl-active\b/.test(this.className)) {
                this.className = this.className
                    .replace(/\btl-active\b/g, "")
                    .replace(/\s+/g, " ")
                    .trim()
                state.report.className = state.report.className
                    .replace(new RegExp("\\b" + name + "\\b", "g"), "")
                    .replace(/\s+/g, " ")
                    .trim()
                state.active = undefined
            } else {
                if (state.active != null) {
                    state.active.className = state.active.className
                        .replace(/\btl-active\b/g, "")
                        .replace(/\s+/g, " ")
                        .trim()
                }

                state.active = this
                this.className += " tl-active"
                state.report.className = state.report.className
                    .replace(/\btl-(pass|fail|skip)\b/g, "")
                    .replace(/\s+/g, " ")
                    .trim() + " " + name
            }
        },
    }, [t(label), child])
}

exports.init = function (opts) {
    assert(opts != null && typeof opts === "object")
    var state = {
        currentPromise: undefined,
        locked: false,
        duration: h("em", [t(R.formatTime(0))]),
        pass: h("em", [t("0")]),
        fail: h("em", [t("0")]),
        skip: h("em", [t("0")]),
        report: h("ul tl-report"),
        active: undefined,
    }

    var header = h("div tl-header", [
        h("div tl-duration", [t("Duration: "), state.duration]),
        makeCounter(state, state.pass, "Passes: ", "tl-pass"),
        makeCounter(state, state.fail, "Failures: ", "tl-fail"),
        makeCounter(state, state.skip, "Skipped: ", "tl-skip"),
        h("button tl-run", {
            onclick: function (ev) {
                ev.preventDefault()
                ev.stopPropagation()
                runTests(opts, state)
            },
        }, [t("Run")]),
    ])

    var root = D.document.getElementById("tl")

    if (root == null) {
        D.document.body.appendChild(root = h("div", {id: "tl"}, [
            header,
            state.report,
        ]))
    } else {
        // Clear the element first, just in case.
        while (root.firstChild) root.removeChild(root.firstChild)
        root.appendChild(header)
        root.appendChild(state.report)
    }

    return {
        root: root,
        state: state,
    }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../reporter":20,"../util":24,"./inject":14,"./run-tests":15,"clean-assert-util":32,"diff":54}],17:[function(require,module,exports){
"use strict"

module.exports = function (Base, Super) {
    if (typeof Base !== "function") {
        throw new TypeError("Expected base to be a function")
    }

    var start = 2

    if (typeof Super === "function") {
        Base.prototype = Object.create(Super.prototype)
        Object.defineProperty(Base.prototype, "constructor", {
            configurable: true,
            writable: true,
            enumerable: false,
            value: Base,
        })
    } else {
        start = 1
    }

    for (var i = start; i < arguments.length; i++) {
        var methods = arguments[i]

        if (methods != null) {
            if (typeof methods !== "object") {
                throw new TypeError("Expected methods to be an object")
            }

            var keys = Object.keys(methods)

            for (var k = 0; k < keys.length; k++) {
                var key = keys[k]
                var desc = Object.getOwnPropertyDescriptor(methods, key)

                desc.enumerable = false
                Object.defineProperty(Base.prototype, key, desc)
            }
        }
    }
}

},{}],18:[function(require,module,exports){
(function (global){
"use strict"

var methods = require("../methods")
var assert = require("../util").assert

/**
 * This contains the browser console stuff.
 */

exports.symbols = Object.freeze({
    Pass: "✓",
    Fail: "✖",
    Dot: "․",
    DotFail: "!",
})

exports.windowWidth = 75
exports.newline = "\n"

// Color support is unforced and unsupported, since you can only specify
// line-by-line colors via CSS, and even that isn't very portable.
exports.colorSupport = {
    isSupported: false,
    isForced: false,
}

/**
 * Since browsers don't have unbuffered output, this kind of simulates it.
 */

exports.Defaults = Defaults
function Defaults(opts) {
    this.opts = opts
    this.acc = ""
}

methods(Defaults, {
    write: function (str) {
        assert(typeof str === "string")
        var newline = this.opts.newline

        this.acc += str
        var index = str.indexOf(newline)

        if (index >= 0) {
            var lines = str.split(newline)

            this.acc = lines.pop()

            for (var i = 0; i < lines.length; i++) {
                global.console.log(lines[i])
            }
        }
    },

    reset: function () {
        if (this.acc !== "") {
            global.console.log(this.acc)
            this.acc = ""
        }
    },
})

var acc = ""

exports.defaults = {
    write: function (str) {
        assert(typeof str === "string")
        acc += str
        var index = str.indexOf(exports.newline)

        if (index >= 0) {
            var lines = str.split(exports.newline)

            acc = lines.pop()

            for (var i = 0; i < lines.length; i++) {
                global.console.log(lines[i])
            }
        }
    },

    reset: function () {
        if (acc !== "") {
            global.console.log(acc)
            acc = ""
        }
    },
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../methods":17,"../util":24}],19:[function(require,module,exports){
"use strict"

var diff = require("diff")

var methods = require("../methods")
var inspect = require("clean-assert-util").inspect
var Util = require("../util")
var Console = require("../replaced/console")
var assert = Util.assert

var Reporter = require("./reporter")
var RUtil = require("./util")

function printTime(_, p, str) {
    assert(_ != null && typeof _ === "object")
    assert(p != null && typeof p === "object")
    assert(typeof p.then === "function")
    assert(typeof str === "string")

    if (!_.timePrinted) {
        _.timePrinted = true
        str += RUtil.color("light", " (" + RUtil.formatTime(_.duration) + ")")
    }

    return p.then(function () { return _.print(str) })
}

function unifiedDiff(err) {
    assert(err != null && typeof err === "object")
    assert(err.name === "AssertionError")

    var actual = inspect(err.actual)
    var expected = inspect(err.expected)
    var msg = diff.createPatch("string", actual, expected)
    var header = Console.newline +
        RUtil.color("diff added", "+ expected") + " " +
        RUtil.color("diff removed", "- actual") +
        Console.newline + Console.newline

    return header + msg.split(/\r?\n|\r/g).slice(4)
    .filter(function (line) { return !/^\@\@|^\\ No newline/.test(line) })
    .map(function (line) {
        switch (line[0]) {
        case "+": return RUtil.color("diff added", line.trimRight())
        case "-": return RUtil.color("diff removed", line.trimRight())
        default: return line.trimRight()
        }
    })
    .join(Console.newline)
}

function formatFail(str) {
    return str.trimRight()
    .split(/\r?\n|\r/g)
    .map(function (line) { return RUtil.color("fail", line.trimRight()) })
    .join(Console.newline)
}

function getDiffStack(e) {
    assert(e instanceof Error)

    var description = formatFail(e.name + ": " + e.message)

    if (e.name === "AssertionError" && e.showDiff !== false) {
        description += Console.newline + unifiedDiff(e)
    }

    var stripped = formatFail(RUtil.readStack(e))

    if (stripped === "") return description
    return description + Console.newline + stripped
}

function inspectTrimmed(object) {
    return inspect(object).trimRight()
    .split(/\r?\n|\r/g)
    .map(function (line) { return line.trimRight() })
    .join(Console.newline)
}

function printFailList(_, err) {
    assert(_ != null && typeof _ === "object")

    var str = err instanceof Error ? getDiffStack(err) : inspectTrimmed(err)
    var parts = str.split(/\r?\n/g)

    return _.print("    " + parts[0]).then(function () {
        return Util.peach(parts.slice(1), function (part) {
            return _.print(part ? "      " + part : "")
        })
    })
}

module.exports = function (opts, methods) {
    return new ConsoleReporter(opts, methods)
}

/**
 * Base class for most console reporters.
 *
 * Note: printing is asynchronous, because otherwise, if enough errors exist,
 * Node will eventually start dropping lines sent to its buffer, especially when
 * stack traces get involved. If Thallium's output is redirected, that can be a
 * big problem for consumers, as they only have part of the output, and won't be
 * able to see all the errors later. Also, if console warnings come up en-masse,
 * that would also contribute. So, we have to wait for each line to flush before
 * we can continue, so the full output makes its way to the console.
 *
 * Some test frameworks like Tape miss this, though.
 *
 * @param {Object} opts The options for the reporter.
 * @param {Function} opts.write The unbufferred writer for the reporter.
 * @param {Function} opts.reset A reset function for the printer + writer.
 * @param {String[]} accepts The options accepted.
 * @param {Function} init The init function for the subclass reporter's
 *                        isolated state (created by factory).
 */
function ConsoleReporter(opts, methods) {
    assert(opts == null || typeof opts === "object")
    assert(methods != null && typeof methods === "object")

    Reporter.call(this, RUtil.Tree, opts, methods, true)

    if (!Console.colorSupport.isForced &&
            methods.accepts.indexOf("color") >= 0) {
        this.opts.color = opts.color
    }

    RUtil.defaultify(this, opts, "write")
    this.reset()
}

methods(ConsoleReporter, Reporter, {
    print: function (str) {
        if (str == null) str = ""
        assert(typeof str === "string")
        return Promise.resolve(this.opts.write(str + "\n"))
    },

    write: function (str) {
        if (str != null) {
            assert(typeof str === "string")
            return Promise.resolve(this.opts.write(str))
        } else {
            return Promise.resolve()
        }
    },

    printResults: function () {
        var self = this

        if (!this.tests && !this.skip) {
            return this.print(
                RUtil.color("plain", "  0 tests") +
                RUtil.color("light", " (0ms)"))
            .then(function () { return self.print() })
        }

        return this.print().then(function () {
            var p = Promise.resolve()

            if (self.pass) {
                p = printTime(self, p,
                    RUtil.color("bright pass", "  ") +
                    RUtil.color("green", self.pass + " passing"))
            }

            if (self.skip) {
                p = printTime(self, p,
                    RUtil.color("skip", "  " + self.skip + " skipped"))
            }

            if (self.fail) {
                p = printTime(self, p,
                    RUtil.color("bright fail", "  ") +
                    RUtil.color("fail", self.fail + " failing"))
            }

            return p
        })
        .then(function () { return self.print() })
        .then(function () {
            return Util.peach(self.errors, function (report, i) {
                var name = i + 1 + ") " + RUtil.joinPath(report) +
                    RUtil.formatRest(report)

                return self.print("  " + RUtil.color("plain", name + ":"))
                .then(function () {
                    return printFailList(self, report.error)
                })
                .then(function () { return self.print() })
            })
        })
    },

    printError: function (report) {
        assert(report != null && typeof report === "object")

        var self = this
        var lines = report.error instanceof Error
            ? RUtil.getStack(report.error)
            : inspectTrimmed(report.error)

        return this.print().then(function () {
            return Util.peach(lines.split(/\r?\n/g), function (line) {
                return self.print(line)
            })
        })
    },
})

},{"../methods":17,"../replaced/console":18,"../util":24,"./reporter":22,"./util":23,"clean-assert-util":32,"diff":54}],20:[function(require,module,exports){
"use strict"

var Util = require("./util")

exports.on = require("./on")
exports.consoleReporter = require("./console-reporter")
exports.Reporter = require("./reporter")
exports.color = Util.color
exports.formatRest = Util.formatRest
exports.formatTime = Util.formatTime
exports.getStack = Util.getStack
exports.joinPath = Util.joinPath
exports.readStack = Util.readStack
exports.setColor = Util.setColor
exports.speed = Util.speed
exports.Status = Util.Status
exports.unsetColor = Util.unsetColor
exports.Console = require("../replaced/console")

},{"../replaced/console":18,"./console-reporter":19,"./on":21,"./reporter":22,"./util":23}],21:[function(require,module,exports){
"use strict"

var Status = require("./util").Status

// Because ES5 sucks. (And, it's breaking my PhantomJS builds)
function setName(reporter, name) {
    try {
        Object.defineProperty(reporter, "name", {value: name})
    } catch (e) {
        // ignore
    }
}

/**
 * A macro of sorts, to simplify creating reporters. It accepts an object with
 * the following parameters:
 *
 * `accepts: string[]` - The properties accepted. Everything else is ignored,
 * and it's partially there for documentation. This parameter is required.
 *
 * `create(opts, methods)` - Create a new reporter instance.  This parameter is
 * required. Note that `methods` refers to the parameter object itself.
 *
 * `init(state, opts)` - Initialize extra reporter state, if applicable.
 *
 * `before(reporter)` - Do things before each event, returning a possible
 * thenable when done. This defaults to a no-op.
 *
 * `after(reporter)` - Do things after each event, returning a possible
 * thenable when done. This defaults to a no-op.
 *
 * `report(reporter, report)` - Handle a test report. This may return a possible
 * thenable when done, and it is required.
 */
module.exports = function (name, methods) {
    setName(reporter, name)
    reporter[name] = reporter
    return reporter
    function reporter(opts) {
        /**
         * Instead of silently failing to work, let's error out early.
         */
        if (opts != null && typeof opts !== "object") {
            throw new TypeError("Options must be an object if passed.")
        }

        var _ = methods.create(opts, methods)

        return function (report) {
            // Only some events have common steps.
            if (report.isStart) {
                _.running = true
            } else if (report.isEnter || report.isPass) {
                _.get(report.path).status = Status.Passing
                _.duration += report.duration
                _.tests++
                _.pass++
            } else if (report.isFail) {
                _.get(report.path).status = Status.Failing
                _.duration += report.duration
                _.tests++
                _.fail++
            } else if (report.isHook) {
                _.get(report.path).status = Status.Failing
                _.get(report.rootPath).status = Status.Failing
                _.fail++
            } else if (report.isSkip) {
                _.get(report.path).status = Status.Skipped
                // Skipped tests aren't counted in the total test count
                _.skip++
            }

            return Promise.resolve(
                typeof methods.before === "function"
                    ? methods.before(_)
                    : undefined)
            .then(function () { return methods.report(_, report) })
            .then(function () {
                return typeof methods.after === "function"
                    ? methods.after(_)
                    : undefined
            })
            .then(function () {
                if (report.isEnd || report.isError) {
                    _.reset()
                    if (typeof _.opts.reset === "function") {
                        return _.opts.reset()
                    }
                }
                return undefined
            })
        }
    }
}

},{"./util":23}],22:[function(require,module,exports){
"use strict"

var methods = require("../methods")
var assert = require("../util").assert
var Console = require("../replaced/console")
var Util = require("./util")
var hasOwn = Object.prototype.hasOwnProperty

function State(reporter) {
    assert(reporter != null && typeof reporter === "object")

    if (typeof reporter.methods.init === "function") {
        (0, reporter.methods.init)(this, reporter.opts)
    }
}

/**
 * This helps speed up getting previous trees, so a potentially expensive
 * tree search doesn't have to be performed.
 *
 * (This does actually make a slight perf difference in the tests.)
 */
function isRepeat(cache, path) {
    assert(cache != null && typeof cache === "object")
    assert(Array.isArray(path))

    // Can't be a repeat the first time.
    if (cache.path == null) return false
    if (path.length !== cache.path.length) return false
    if (path === cache.path) return true

    // It's unlikely the nesting will be consistently more than a few levels
    // deep (>= 5), so this shouldn't bog anything down.
    for (var i = 0; i < path.length; i++) {
        if (path[i] !== cache.path[i]) {
            return false
        }
    }

    cache.path = path
    return true
}

/**
 * Superclass for all reporters. This covers the state for pretty much every
 * reporter.
 *
 * Note that if you delay the initial reset, you still must call it before the
 * constructor finishes.
 */
module.exports = Reporter
function Reporter(Tree, opts, methods, delay) {
    assert(typeof Tree === "function")
    assert(opts == null || typeof opts === "object")
    assert(methods != null && typeof methods === "object")
    assert(typeof delay === "boolean")

    this.Tree = Tree
    this.isSupported = Console.colorSupport.isSupported
    this.opts = {}
    this.methods = methods
    Util.defaultify(this, opts, "reset")
    if (!delay) this.reset()
}

methods(Reporter, {
    reset: function () {
        this.running = false
        this.timePrinted = false
        this.tests = 0
        this.pass = 0
        this.fail = 0
        this.skip = 0
        this.duration = 0
        this.errors = []
        this.state = new State(this)
        this.base = new this.Tree(undefined)
        this.cache = {path: undefined, result: undefined, end: 0}
    },

    pushError: function (report) {
        assert(report != null && typeof report === "object")

        this.errors.push(report)
    },

    get: function (path, end) {
        assert(Array.isArray(path))
        assert(end == null || typeof end === "number")

        if (end == null) end = path.length
        if (end === 0) return this.base
        if (isRepeat(this.cache, path, end)) {
            return this.cache.result
        }

        var child = this.base

        for (var i = 0; i < end; i++) {
            var entry = path[i]

            if (hasOwn.call(child.children, entry.index)) {
                child = child.children[entry.index]
            } else {
                child = child.children[entry.index] = new this.Tree(entry.name)
            }
        }

        this.cache.end = end
        return this.cache.result = child
    },
})

},{"../methods":17,"../replaced/console":18,"../util":24,"./util":23}],23:[function(require,module,exports){
"use strict"

var Util = require("../util")
var Console = require("../replaced/console")
var assert = Util.assert

/*
 * Stack normalization
 */

// Exported for debugging
exports.readStack = readStack
function readStack(e) {
    var stack = Util.getStack(e)

    // If it doesn't start with the message, just return the stack.
    //  Firefox, Safari                Chrome, IE
    if (/^(@)?\S+\:\d+/.test(stack) || /^\s*at/.test(stack)) {
        return formatLineBreaks(stack)
    }

    var index = stack.indexOf(e.message)

    if (index < 0) return formatLineBreaks(Util.getStack(e))
    var re = /\r?\n/g

    re.lastIndex = index + e.message.length
    if (!re.test(stack)) return ""
    return formatLineBreaks(stack.slice(re.lastIndex))
}

function formatLineBreaks(str) {
    assert(typeof str === "string")

    return str.replace(/^\s+|[^\r\n\S]+$/g, "")
        .replace(/\s*(\r?\n|\r)\s*/g, Console.newline)
}

exports.getStack = function (e) {
    if (!(e instanceof Error)) return formatLineBreaks(Util.getStack(e))
    var description = (e.name + ": " + e.message)
        .replace(/\s+$/gm, "")
        .replace(/\r?\n|\r/g, Console.newline)
    var stripped = readStack(e)

    if (stripped === "") return description
    return description + Console.newline + stripped
}

// Color palette pulled from Mocha
function colorToNumber(name) {
    assert(typeof name === "string")

    switch (name) {
    case "pass": return 90
    case "fail": return 31

    case "bright pass": return 92
    case "bright fail": return 91
    case "bright yellow": return 93

    case "skip": return 36
    case "suite": return 0
    case "plain": return 0

    case "error title": return 0
    case "error message": return 31
    case "error stack": return 90

    case "checkmark": return 32
    case "fast": return 90
    case "medium": return 33
    case "slow": return 31
    case "green": return 32
    case "light": return 90

    case "diff gutter": return 90
    case "diff added": return 32
    case "diff removed": return 31
    default: throw new TypeError("Invalid name: \"" + name + "\"")
    }
}

// TODO: use the state to calculate this instead of relying on a global...
exports.color = color
function color(name, str) {
    assert(typeof name === "string")
    assert(typeof str === "string")

    if (Console.colorSupport.isSupported) {
        return "\u001b[" + colorToNumber(name) + "m" + str + "\u001b[0m"
    } else {
        return str
    }
}

exports.setColor = function (_) {
    assert(_ != null && typeof _ === "object")
    if (_.opts.color != null) {
        Console.colorSupport.isSupported = !!_.opts.color
    }
}

exports.unsetColor = function (_) {
    assert(_ != null && typeof _ === "object")
    if (_.opts.color != null && !Console.colorSupport.isForced) {
        Console.colorSupport.isSupported = this.oldSupported
    }
}

var Status = exports.Status = Object.freeze({
    Unknown: 0,
    Skipped: 1,
    Passing: 2,
    Failing: 3,
})

exports.Tree = function (value) {
    assert(value == null || typeof value === "string")

    this.value = value
    this.status = Status.Unknown
    this.children = Object.create(null)
}

exports.defaultify = function (_, opts, prop) {
    assert(_ != null && typeof _ === "object")
    assert(opts == null || typeof opts === "object")
    assert(typeof prop === "string")

    if (_.methods.accepts.indexOf(prop) >= 0) {
        var used = opts != null && typeof opts[prop] === "function"
            ? opts
            : Console.defaults

        _.opts[prop] = function () {
            return Promise.resolve(used[prop].apply(used, arguments))
        }
    }
}

function joinPath(reportPath) {
    assert(Array.isArray(reportPath))

    var path = ""

    for (var i = 0; i < reportPath.length; i++) {
        path += " " + reportPath[i].name
    }

    return path.slice(1)
}

exports.joinPath = function (report) {
    assert(report != null && typeof report === "object")

    return joinPath(report.path)
}

exports.speed = function (report) {
    assert(report != null && typeof report === "object")

    if (report.duration >= report.slow) return "slow"
    if (report.duration >= report.slow / 2) return "medium"
    if (report.duration >= 0) return "fast"
    throw new RangeError("Duration must not be negative")
}

exports.formatTime = (function () {
    var s = 1000 /* ms */
    var m = 60 * s
    var h = 60 * m
    var d = 24 * h

    return function (ms) {
        assert(typeof ms === "number")

        if (ms >= d) return Math.round(ms / d) + "d"
        if (ms >= h) return Math.round(ms / h) + "h"
        if (ms >= m) return Math.round(ms / m) + "m"
        if (ms >= s) return Math.round(ms / s) + "s"
        return ms + "ms"
    }
})()

exports.formatRest = function (report) {
    assert(report != null && typeof report === "object")

    if (!report.isHook) return ""
    var path = " ("

    if (report.rootPath.length) {
        path += report.stage
        if (report.name) path += " ‒ " + report.name
        if (report.path.length > report.rootPath.length + 1) {
            path += ", in " + joinPath(report.rootPath)
        }
    } else {
        path += "global " + report.stage
        if (report.name) path += " ‒ " + report.name
    }

    return path + ")"
}

},{"../replaced/console":18,"../util":24}],24:[function(require,module,exports){
"use strict"

var methods = require("./methods")

// Quick assert
exports.assert = assert
function assert(cond) {
    if (!cond) throw new AssertFail()
}

// Quick hack to ensure there's a stack
var captureStackTrace = typeof Error.captureStackTrace === "function"
    ? Error.captureStackTrace : function (inst) {
        var e = new Error()

        e.name = inst.name
        inst.stack = exports.getStack(e)
    }

function AssertFail() {
    captureStackTrace(this, assert)
}

methods(AssertFail, Error, {
    name: "Assertion failed",
})

exports.getType = function (value) {
    if (value == null) return "null"
    if (Array.isArray(value)) return "array"
    return typeof value
}

// PhantomJS, IE, and possibly Edge don't set the stack trace until the error is
// thrown. Note that this prefers an existing stack first, since non-native
// errors likely already contain this. Note that this isn't necessary in the
// CLI - that only targets Node.
exports.getStack = function (e) {
    var stack = e.stack

    if (!(e instanceof Error) || stack != null) return stack

    try {
        throw e
    } catch (e) {
        return e.stack
    }
}

exports.pcall = function (func) {
    assert(typeof func === "function")
    return new Promise(function (resolve, reject) {
        return func(function (e, value) {
            return e != null ? reject(e) : resolve(value)
        })
    })
}

exports.peach = function (list, func) {
    assert(Array.isArray(list))
    assert(typeof func === "function")

    var len = list.length
    var p = Promise.resolve()

    for (var i = 0; i < len; i++) {
        p = p.then(func.bind(undefined, list[i], i))
    }

    return p
}

/**
 * A lazy accessor, complete with thrown error memoization and a decent amount
 * of optimization, since it's used in a lot of code.
 *
 * Note that this uses reference indirection and direct mutation to keep only
 * just the computation non-constant, so engines can avoid closure allocation.
 * Also, `create` is intentionally kept *out* of any closure, so it can be more
 * easily collected.
 */
function Lazy(create) {
    this.value = create
    this.get = this.init
}

methods(Lazy, {
    recursive: function () {
        throw new TypeError("Lazy functions must not be called recursively!")
    },

    return: function () {
        return this.value
    },

    throw: function () {
        throw this.value
    },

    init: function () {
        this.get = this.recursive

        try {
            this.value = (0, this.value)()
            this.get = this.return
            return this.value
        } catch (e) {
            this.value = e
            this.get = this.throw
            throw this.value
        }
    },
})

exports.lazy = function (create) {
    assert(typeof create === "function")

    var ref = new Lazy(create)

    return function () {
        return ref.get()
    }
}

},{"./methods":17}],25:[function(require,module,exports){
"use strict"

/* global t */

require("../lib/browser-bundle")
require("./index")
t.support = require("./support")

},{"../lib/browser-bundle":8,"./index":27,"./support":28}],26:[function(require,module,exports){
(function (global){
"use strict"

/**
 * @fileoverview
 * This module exports the following utility functions:
 *
 * - `Common.showDeprecation()` - Allow deprecation messages to be shown.
 * - `Common.hideDeprecation()` - Prevent deprecation messages from being shown.
 * - `Common.warn(...args)` - Print a deprecation warning
 * - `Common.deprecate(message, func)` - Wrap a function to print a deprecation
 *   message before its first use.
 */

// To suppress deprecation messages
var suppressDeprecation = true

exports.showDeprecation = function () {
    suppressDeprecation = false
}

exports.hideDeprecation = function () {
    suppressDeprecation = true
}

var console = global.console
var shouldPrint = console != null && typeof console.warn === "function" &&
    !(global.process != null && global.process.env != null &&
        global.process.env.NO_MIGRATE_WARN)

exports.warn = function () {
    if (shouldPrint && !suppressDeprecation) {
        console.warn.apply(console, arguments)
    }
}

exports.deprecate = function (message, func) {
    var printed = !shouldPrint

    /** @this */
    return function () {
        if (!suppressDeprecation) {
            if (!printed) {
                printed = true
                console.trace()
                console.warn(message)
            }

            message = undefined
        }

        return func.apply(this, arguments)
    }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],27:[function(require,module,exports){
"use strict"

/**
 * Backport wrapper to warn about most of the major breaking changes from the
 * last major version.
 *
 * It consists of solely internal monkey patching to revive support of previous
 * versions, although I tried to limit how much knowledge of the internals this
 * requires.
 */

var Common = require("./common")
var methods = require("../lib/methods")
var Thallium = require("../lib/api/thallium")
var Reflect = require("../lib/api/reflect")

// Note: here's a sample template of how each notice should be structured:
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `reflect.isFoo()` is deprecated in favor of the `reflect.isFoo` getter. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `t.testSkip()` is deprecated in favor of calling `t.skip()` within the  *
 *   test body.                                                              *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
var tlTest = Thallium.prototype.test
var tlSkip = Thallium.prototype.skip

methods(Thallium, {
    testSkip: Common.deprecate(
        "`t.testSkip` is deprecated. Please call `t.skip()` inside the test " +
        "body instead.",
        /** @this */ function (name, callback) { // eslint-disable-line no-unused-vars, max-len
            return tlTest.call(this, name, tlSkip.bind(this))
        }),
})

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * - `reflect.testSkip()` is deprecated in favor of calling `reflect.skip()` *
 *   within the test body.                                                   *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
var reflectTest = Thallium.prototype.test
var reflectSkip = Thallium.prototype.skip

methods(Reflect, {
    testSkip: Common.deprecate(
        "`reflect.testSkip` is deprecated. Please call `reflect.skip()` " +
        "inside the test body instead.",
        /** @this */ function (name, callback) { // eslint-disable-line no-unused-vars, max-len
            return reflectTest.call(this, name, reflectSkip.bind(this))
        }),
})

},{"../lib/api/reflect":6,"../lib/api/thallium":7,"../lib/methods":17,"./common":26}],28:[function(require,module,exports){
"use strict"

/**
 * Replaces the old `t.call` non-invasively.
 */
exports.call = function (t, plugin) {
    var reflect = t.reflect
    var args = [reflect]

    for (var i = 2; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    return plugin.apply(reflect, args)
}

},{}],29:[function(require,module,exports){
module.exports = function (xs, f) {
    if (xs.map) return xs.map(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = xs[i];
        if (hasOwn.call(xs, i)) res.push(f(x, i, xs));
    }
    return res;
};

var hasOwn = Object.prototype.hasOwnProperty;

},{}],30:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;

module.exports = function (xs, f, acc) {
    var hasAcc = arguments.length >= 3;
    if (hasAcc && xs.reduce) return xs.reduce(f, acc);
    if (xs.reduce) return xs.reduce(f);
    
    for (var i = 0; i < xs.length; i++) {
        if (!hasOwn.call(xs, i)) continue;
        if (!hasAcc) {
            acc = xs[i];
            hasAcc = true;
            continue;
        }
        acc = f(acc, xs[i], i);
    }
    return acc;
};

},{}],31:[function(require,module,exports){
"use strict"

// See https://github.com/substack/node-browserify/issues/1674

module.exports = require("util-inspect")

},{"util-inspect":66}],32:[function(require,module,exports){
"use strict"

var inspect = exports.inspect = require("./inspect")
var hasOwn = Object.prototype.hasOwnProperty
var AssertionError

// PhantomJS, IE, and possibly Edge don't set the stack trace until the error is
// thrown. Note that this prefers an existing stack first, since non-native
// errors likely already contain this.
function getStack(e) {
    var stack = e.stack

    if (!(e instanceof Error) || stack != null) return stack

    try {
        throw e
    } catch (e) {
        return e.stack
    }
}

try {
    AssertionError = new Function([ // eslint-disable-line no-new-func
        "'use strict';",
        "class AssertionError extends Error {",
        "    constructor(message, expected, actual) {",
        "        super(message)",
        "        this.expected = expected",
        "        this.actual = actual",
        "    }",
        "",
        "    get name() {",
        "        return 'AssertionError'",
        "    }",
        "}",
        // check native subclassing support
        "new AssertionError('message', 1, 2)",
        "return AssertionError",
    ].join("\n"))()
} catch (e) {
    AssertionError = typeof Error.captureStackTrace === "function"
        ? function AssertionError(message, expected, actual) {
            this.message = message || ""
            this.expected = expected
            this.actual = actual
            Error.captureStackTrace(this, this.constructor)
        }
        : function AssertionError(message, expected, actual) {
            this.message = message || ""
            this.expected = expected
            this.actual = actual
            var e = new Error(message)

            e.name = "AssertionError"
            this.stack = getStack(e)
        }

    AssertionError.prototype = Object.create(Error.prototype)

    Object.defineProperty(AssertionError.prototype, "constructor", {
        configurable: true,
        writable: true,
        enumerable: false,
        value: AssertionError,
    })

    Object.defineProperty(AssertionError.prototype, "name", {
        configurable: true,
        writable: true,
        enumerable: false,
        value: "AssertionError",
    })
}

exports.AssertionError = AssertionError

/* eslint-disable no-self-compare */
// For better NaN handling
exports.strictIs = function (a, b) {
    return a === b || a !== a && b !== b
}

exports.looseIs = function (a, b) {
    return a == b || a !== a && b !== b // eslint-disable-line eqeqeq
}

/* eslint-enable no-self-compare */

var templateRegexp = /(.?)\{(.+?)\}/g

exports.escape = function (string) {
    if (typeof string !== "string") {
        throw new TypeError("`string` must be a string")
    }

    return string.replace(templateRegexp, function (m, pre) {
        return pre + "\\" + m.slice(1)
    })
}

// This formats the assertion error messages.
exports.format = function (message, args, prettify) {
    if (prettify == null) prettify = inspect

    if (typeof message !== "string") {
        throw new TypeError("`message` must be a string")
    }

    if (typeof args !== "object" || args === null) {
        throw new TypeError("`args` must be an object")
    }

    if (typeof prettify !== "function") {
        throw new TypeError("`prettify` must be a function if passed")
    }

    return message.replace(templateRegexp, function (m, pre, prop) {
        if (pre === "\\") {
            return m.slice(1)
        } else if (hasOwn.call(args, prop)) {
            return pre + prettify(args[prop], {depth: 5})
        } else {
            return pre + m
        }
    })
}

exports.fail = function (message, args, prettify) {
    if (args == null) throw new AssertionError(message)
    throw new AssertionError(
        exports.format(message, args, prettify),
        args.expected,
        args.actual)
}

// The basic assert, like `assert.ok`, but gives you an optional message.
exports.assert = function (test, message) {
    if (!test) throw new AssertionError(message)
}

},{"./inspect":31}],33:[function(require,module,exports){
"use strict"

/* global Promise */

var type = require("./lib/type")
var equal = require("./lib/equal")
var throwsAsync = require("./lib/throws-async")
var has = require("./lib/has")
var includes = require("./lib/includes")
var hasKeys = require("./lib/has-keys")

function unary(method) {
    return function (value) {
        return Promise.resolve(value).then(method)
    }
}

function binary(method) {
    return function (value, expected) {
        return Promise.resolve(value).then(function (value) {
            method(value, expected)
        })
    }
}

function ternary(method) {
    return function (value, a, b) {
        return Promise.resolve(value).then(function (value) {
            method(value, a, b)
        })
    }
}

function optTernary(method) {
    return function (object, a, b) {
        if (arguments.length >= 3) {
            return Promise.resolve(object).then(function (object) {
                method(object, a, b)
            })
        } else {
            return Promise.resolve(object).then(function (object) {
                method(object, a)
            })
        }
    }
}

exports.ok = unary(type.ok)
exports.notOk = unary(type.notOk)
exports.isBoolean = unary(type.isBoolean)
exports.notBoolean = unary(type.notBoolean)
exports.isFunction = unary(type.isFunction)
exports.notFunction = unary(type.notFunction)
exports.isNumber = unary(type.isNumber)
exports.notNumber = unary(type.notNumber)
exports.isObject = unary(type.isObject)
exports.notObject = unary(type.notObject)
exports.isString = unary(type.isString)
exports.notString = unary(type.notString)
exports.isSymbol = unary(type.isSymbol)
exports.notSymbol = unary(type.notSymbol)
exports.exists = unary(type.exists)
exports.notExists = unary(type.notExists)
exports.isArray = unary(type.isArray)
exports.notArray = unary(type.notArray)

exports.is = function (Type, object) {
    return Promise.resolve(object).then(function (object) {
        type.is(Type, object)
    })
}

exports.not = function (Type, object) {
    return Promise.resolve(object).then(function (object) {
        type.not(Type, object)
    })
}

exports.equal = binary(equal.equal)
exports.notEqual = binary(equal.notEqual)
exports.equalLoose = binary(equal.equalLoose)
exports.notEqualLoose = binary(equal.notEqualLoose)
exports.deepEqual = binary(equal.deepEqual)
exports.notDeepEqual = binary(equal.notDeepEqual)
exports.match = binary(equal.match)
exports.notMatch = binary(equal.notMatch)
exports.atLeast = binary(equal.atLeast)
exports.atMost = binary(equal.atMost)
exports.above = binary(equal.above)
exports.below = binary(equal.below)
exports.between = ternary(equal.between)
exports.closeTo = ternary(equal.closeTo)
exports.notCloseTo = ternary(equal.notCloseTo)

exports.throws = throwsAsync.throws
exports.throwsMatch = throwsAsync.throwsMatch

exports.hasOwn = optTernary(has.hasOwn)
exports.notHasOwn = optTernary(has.notHasOwn)
exports.hasOwnLoose = optTernary(has.hasOwnLoose)
exports.notHasOwnLoose = optTernary(has.notHasOwnLoose)
exports.hasKey = optTernary(has.hasKey)
exports.notHasKey = optTernary(has.notHasKey)
exports.hasKeyLoose = optTernary(has.hasKeyLoose)
exports.notHasKeyLoose = optTernary(has.notHasKeyLoose)
exports.has = optTernary(has.has)
exports.notHas = optTernary(has.notHas)
exports.hasLoose = optTernary(has.hasLoose)
exports.notHasLoose = optTernary(has.notHasLoose)

exports.includes = binary(includes.includes)
exports.includesDeep = binary(includes.includesDeep)
exports.includesMatch = binary(includes.includesMatch)
exports.includesAny = binary(includes.includesAny)
exports.includesAnyDeep = binary(includes.includesAnyDeep)
exports.includesAnyMatch = binary(includes.includesAnyMatch)
exports.notIncludesAll = binary(includes.notIncludesAll)
exports.notIncludesAllDeep = binary(includes.notIncludesAllDeep)
exports.notIncludesAllMatch = binary(includes.notIncludesAllMatch)
exports.notIncludes = binary(includes.notIncludes)
exports.notIncludesDeep = binary(includes.notIncludesDeep)
exports.notIncludesMatch = binary(includes.notIncludesMatch)

exports.hasKeys = binary(hasKeys.hasKeys)
exports.hasKeysDeep = binary(hasKeys.hasKeysDeep)
exports.hasKeysMatch = binary(hasKeys.hasKeysMatch)
exports.hasKeysAny = binary(hasKeys.hasKeysAny)
exports.hasKeysAnyDeep = binary(hasKeys.hasKeysAnyDeep)
exports.hasKeysAnyMatch = binary(hasKeys.hasKeysAnyMatch)
exports.notHasKeysAll = binary(hasKeys.notHasKeysAll)
exports.notHasKeysAllDeep = binary(hasKeys.notHasKeysAllDeep)
exports.notHasKeysAllMatch = binary(hasKeys.notHasKeysAllMatch)
exports.notHasKeys = binary(hasKeys.notHasKeys)
exports.notHasKeysDeep = binary(hasKeys.notHasKeysDeep)
exports.notHasKeysMatch = binary(hasKeys.notHasKeysMatch)

},{"./lib/equal":35,"./lib/has":37,"./lib/has-keys":36,"./lib/includes":38,"./lib/throws-async":39,"./lib/type":42}],34:[function(require,module,exports){
"use strict"

/**
 * Core TDD-style assertions. These are done by a composition of DSLs, since
 * there is *so* much repetition. Also, this is split into several namespaces to
 * keep the file size manageable.
 */

var util = require("clean-assert-util")
var type = require("./lib/type")
var equal = require("./lib/equal")
var throws = require("./lib/throws")
var has = require("./lib/has")
var includes = require("./lib/includes")
var hasKeys = require("./lib/has-keys")

exports.AssertionError = util.AssertionError
exports.assert = util.assert
exports.fail = util.fail

exports.ok = type.ok
exports.notOk = type.notOk
exports.isBoolean = type.isBoolean
exports.notBoolean = type.notBoolean
exports.isFunction = type.isFunction
exports.notFunction = type.notFunction
exports.isNumber = type.isNumber
exports.notNumber = type.notNumber
exports.isObject = type.isObject
exports.notObject = type.notObject
exports.isString = type.isString
exports.notString = type.notString
exports.isSymbol = type.isSymbol
exports.notSymbol = type.notSymbol
exports.exists = type.exists
exports.notExists = type.notExists
exports.isArray = type.isArray
exports.notArray = type.notArray
exports.is = type.is
exports.not = type.not

exports.equal = equal.equal
exports.notEqual = equal.notEqual
exports.equalLoose = equal.equalLoose
exports.notEqualLoose = equal.notEqualLoose
exports.deepEqual = equal.deepEqual
exports.notDeepEqual = equal.notDeepEqual
exports.match = equal.match
exports.notMatch = equal.notMatch
exports.atLeast = equal.atLeast
exports.atMost = equal.atMost
exports.above = equal.above
exports.below = equal.below
exports.between = equal.between
exports.closeTo = equal.closeTo
exports.notCloseTo = equal.notCloseTo

exports.throws = throws.throws
exports.throwsMatch = throws.throwsMatch

exports.hasOwn = has.hasOwn
exports.notHasOwn = has.notHasOwn
exports.hasOwnLoose = has.hasOwnLoose
exports.notHasOwnLoose = has.notHasOwnLoose
exports.hasKey = has.hasKey
exports.notHasKey = has.notHasKey
exports.hasKeyLoose = has.hasKeyLoose
exports.notHasKeyLoose = has.notHasKeyLoose
exports.has = has.has
exports.notHas = has.notHas
exports.hasLoose = has.hasLoose
exports.notHasLoose = has.notHasLoose

/**
 * There's 2 sets of 12 permutations here for `includes` and `hasKeys`, instead
 * of N sets of 2 (which would fit the `foo`/`notFoo` idiom better), so it's
 * easier to just make a couple separate DSLs and use that to define everything.
 *
 * Here's the top level:
 *
 * - shallow
 * - strict deep
 * - structural deep
 *
 * And the second level:
 *
 * - includes all/not missing some
 * - includes some/not missing all
 * - not including all/missing some
 * - not including some/missing all
 *
 * Here's an example using the naming scheme for `hasKeys*`
 *
 *               |     shallow     |    strict deep      |   structural deep
 * --------------|-----------------|---------------------|----------------------
 * includes all  | `hasKeys`       | `hasKeysDeep`       | `hasKeysMatch`
 * includes some | `hasKeysAny`    | `hasKeysAnyDeep`    | `hasKeysAnyMatch`
 * missing some  | `notHasKeysAll` | `notHasKeysAllDeep` | `notHasKeysAllMatch`
 * missing all   | `notHasKeys`    | `notHasKeysDeep`    | `notHasKeysMatch`
 *
 * Note that the `hasKeys` shallow comparison variants are also overloaded to
 * consume either an array (in which it simply checks against a list of keys) or
 * an object (where it does a full deep comparison).
 */

exports.includes = includes.includes
exports.includesDeep = includes.includesDeep
exports.includesMatch = includes.includesMatch
exports.includesAny = includes.includesAny
exports.includesAnyDeep = includes.includesAnyDeep
exports.includesAnyMatch = includes.includesAnyMatch
exports.notIncludesAll = includes.notIncludesAll
exports.notIncludesAllDeep = includes.notIncludesAllDeep
exports.notIncludesAllMatch = includes.notIncludesAllMatch
exports.notIncludes = includes.notIncludes
exports.notIncludesDeep = includes.notIncludesDeep
exports.notIncludesMatch = includes.notIncludesMatch

exports.hasKeys = hasKeys.hasKeys
exports.hasKeysDeep = hasKeys.hasKeysDeep
exports.hasKeysMatch = hasKeys.hasKeysMatch
exports.hasKeysAny = hasKeys.hasKeysAny
exports.hasKeysAnyDeep = hasKeys.hasKeysAnyDeep
exports.hasKeysAnyMatch = hasKeys.hasKeysAnyMatch
exports.notHasKeysAll = hasKeys.notHasKeysAll
exports.notHasKeysAllDeep = hasKeys.notHasKeysAllDeep
exports.notHasKeysAllMatch = hasKeys.notHasKeysAllMatch
exports.notHasKeys = hasKeys.notHasKeys
exports.notHasKeysDeep = hasKeys.notHasKeysDeep
exports.notHasKeysMatch = hasKeys.notHasKeysMatch

exports.async = require("./async")

},{"./async":33,"./lib/equal":35,"./lib/has":37,"./lib/has-keys":36,"./lib/includes":38,"./lib/throws":41,"./lib/type":42,"clean-assert-util":32}],35:[function(require,module,exports){
"use strict"

var match = require("clean-match")
var util = require("clean-assert-util")

function binary(numeric, comparator, message) {
    return function (actual, expected) {
        if (numeric) {
            if (typeof actual !== "number") {
                throw new TypeError("`actual` must be a number")
            }

            if (typeof expected !== "number") {
                throw new TypeError("`expected` must be a number")
            }
        }

        if (!comparator(actual, expected)) {
            util.fail(message, {actual: actual, expected: expected})
        }
    }
}

exports.equal = binary(false,
    function (a, b) { return util.strictIs(a, b) },
    "Expected {actual} to equal {expected}")

exports.notEqual = binary(false,
    function (a, b) { return !util.strictIs(a, b) },
    "Expected {actual} to not equal {expected}")

exports.equalLoose = binary(false,
    function (a, b) { return util.looseIs(a, b) },
    "Expected {actual} to loosely equal {expected}")

exports.notEqualLoose = binary(false,
    function (a, b) { return !util.looseIs(a, b) },
    "Expected {actual} to not loosely equal {expected}")

exports.atLeast = binary(true,
    function (a, b) { return a >= b },
    "Expected {actual} to be at least {expected}")

exports.atMost = binary(true,
    function (a, b) { return a <= b },
    "Expected {actual} to be at most {expected}")

exports.above = binary(true,
    function (a, b) { return a > b },
    "Expected {actual} to be above {expected}")

exports.below = binary(true,
    function (a, b) { return a < b },
    "Expected {actual} to be below {expected}")

exports.between = function (actual, lower, upper) {
    if (typeof actual !== "number") {
        throw new TypeError("`actual` must be a number")
    }

    if (typeof lower !== "number") {
        throw new TypeError("`lower` must be a number")
    }

    if (typeof upper !== "number") {
        throw new TypeError("`upper` must be a number")
    }

    // The negation is to address NaNs as well, without writing a ton of special
    // case boilerplate
    if (!(actual >= lower && actual <= upper)) {
        util.fail("Expected {actual} to be between {lower} and {upper}", {
            actual: actual,
            lower: lower,
            upper: upper,
        })
    }
}

exports.deepEqual = binary(false,
    function (a, b) { return match.strict(a, b) },
    "Expected {actual} to deeply equal {expected}")

exports.notDeepEqual = binary(false,
    function (a, b) { return !match.strict(a, b) },
    "Expected {actual} to not deeply equal {expected}")

exports.match = binary(false,
    function (a, b) { return match.loose(a, b) },
    "Expected {actual} to match {expected}")

exports.notMatch = binary(false,
    function (a, b) { return !match.loose(a, b) },
    "Expected {actual} to not match {expected}")

// Uses division to allow for a more robust comparison of floats. Also, this
// handles near-zero comparisons correctly, as well as a zero tolerance (i.e.
// exact comparison).
function closeTo(expected, actual, tolerance) {
    if (tolerance === Infinity || actual === expected) return true
    if (tolerance === 0) return false
    if (actual === 0) return Math.abs(expected) < tolerance
    if (expected === 0) return Math.abs(actual) < tolerance
    return Math.abs(expected / actual - 1) < tolerance
}

// Note: these two always fail when dealing with NaNs.
exports.closeTo = function (expected, actual, tolerance) {
    if (typeof actual !== "number") {
        throw new TypeError("`actual` must be a number")
    }

    if (typeof expected !== "number") {
        throw new TypeError("`expected` must be a number")
    }

    if (tolerance == null) tolerance = 1e-10

    if (typeof tolerance !== "number" || tolerance < 0) {
        throw new TypeError(
            "`tolerance` must be a non-negative number if given")
    }

    if (actual !== actual || expected !== expected || // eslint-disable-line no-self-compare, max-len
            !closeTo(expected, actual, tolerance)) {
        util.fail("Expected {actual} to be close to {expected}", {
            actual: actual,
            expected: expected,
        })
    }
}

exports.notCloseTo = function (expected, actual, tolerance) {
    if (typeof actual !== "number") {
        throw new TypeError("`actual` must be a number")
    }

    if (typeof expected !== "number") {
        throw new TypeError("`expected` must be a number")
    }

    if (tolerance == null) tolerance = 1e-10

    if (typeof tolerance !== "number" || tolerance < 0) {
        throw new TypeError(
            "`tolerance` must be a non-negative number if given")
    }

    if (expected !== expected || actual !== actual || // eslint-disable-line no-self-compare, max-len
            closeTo(expected, actual, tolerance)) {
        util.fail("Expected {actual} to not be close to {expected}", {
            actual: actual,
            expected: expected,
        })
    }
}

},{"clean-assert-util":32,"clean-match":43}],36:[function(require,module,exports){
"use strict"

var match = require("clean-match")
var util = require("clean-assert-util")
var hasOwn = Object.prototype.hasOwnProperty

function hasKeys(all, object, keys) {
    for (var i = 0; i < keys.length; i++) {
        var test = hasOwn.call(object, keys[i])

        if (test !== all) return !all
    }

    return all
}

function hasValues(func, all, object, keys) {
    if (object === keys) return true
    var list = Object.keys(keys)

    for (var i = 0; i < list.length; i++) {
        var key = list[i]
        var test = hasOwn.call(object, key) && func(keys[key], object[key])

        if (test !== all) return test
    }

    return all
}

function makeHasOverload(all, invert, message) {
    return function (object, keys) {
        if (typeof object !== "object" || object == null) {
            throw new TypeError("`object` must be an object")
        }

        if (typeof keys !== "object" || keys == null) {
            throw new TypeError("`keys` must be an object or array")
        }

        if (Array.isArray(keys)) {
            if (keys.length && hasKeys(all, object, keys) === invert) {
                util.fail(message, {actual: object, keys: keys})
            }
        } else if (Object.keys(keys).length) {
            if (hasValues(util.strictIs, all, object, keys) === invert) {
                util.fail(message, {actual: object, keys: keys})
            }
        }
    }
}

function makeHasKeys(func, all, invert, message) {
    return function (object, keys) {
        if (typeof object !== "object" || object == null) {
            throw new TypeError("`object` must be an object")
        }

        if (typeof keys !== "object" || keys == null) {
            throw new TypeError("`keys` must be an object")
        }

        // exclusive or to invert the result if `invert` is true
        if (Object.keys(keys).length) {
            if (hasValues(func, all, object, keys) === invert) {
                util.fail(message, {actual: object, keys: keys})
            }
        }
    }
}

/* eslint-disable max-len */

exports.hasKeys = makeHasOverload(true, false, "Expected {actual} to have all keys in {keys}")
exports.hasKeysDeep = makeHasKeys(match.strict, true, false, "Expected {actual} to have all keys in {keys}")
exports.hasKeysMatch = makeHasKeys(match.loose, true, false, "Expected {actual} to match all keys in {keys}")
exports.hasKeysAny = makeHasOverload(false, false, "Expected {actual} to have any key in {keys}")
exports.hasKeysAnyDeep = makeHasKeys(match.strict, false, false, "Expected {actual} to have any key in {keys}")
exports.hasKeysAnyMatch = makeHasKeys(match.loose, false, false, "Expected {actual} to match any key in {keys}")
exports.notHasKeysAll = makeHasOverload(true, true, "Expected {actual} to not have all keys in {keys}")
exports.notHasKeysAllDeep = makeHasKeys(match.strict, true, true, "Expected {actual} to not have all keys in {keys}")
exports.notHasKeysAllMatch = makeHasKeys(match.loose, true, true, "Expected {actual} to not match all keys in {keys}")
exports.notHasKeys = makeHasOverload(false, true, "Expected {actual} to not have any key in {keys}")
exports.notHasKeysDeep = makeHasKeys(match.strict, false, true, "Expected {actual} to not have any key in {keys}")
exports.notHasKeysMatch = makeHasKeys(match.loose, false, true, "Expected {actual} to not match any key in {keys}")

},{"clean-assert-util":32,"clean-match":43}],37:[function(require,module,exports){
"use strict"

var util = require("clean-assert-util")
var hasOwn = Object.prototype.hasOwnProperty

function has(_) { // eslint-disable-line max-len, max-params
    return function (object, key, value) {
        if (arguments.length >= 3) {
            if (!_.has(object, key) ||
                    !util.strictIs(_.get(object, key), value)) {
                util.fail(_.messages[0], {
                    expected: value,
                    actual: object[key],
                    key: key,
                    object: object,
                })
            }
        } else if (!_.has(object, key)) {
            util.fail(_.messages[1], {
                expected: value,
                actual: object[key],
                key: key,
                object: object,
            })
        }
    }
}

function hasLoose(_) {
    return function (object, key, value) {
        if (!_.has(object, key) || !util.looseIs(_.get(object, key), value)) {
            util.fail(_.messages[0], {
                expected: value,
                actual: object[key],
                key: key,
                object: object,
            })
        }
    }
}

function notHas(_) { // eslint-disable-line max-len, max-params
    return function (object, key, value) {
        if (arguments.length >= 3) {
            if (_.has(object, key) &&
                    util.strictIs(_.get(object, key), value)) {
                util.fail(_.messages[2], {
                    expected: value,
                    actual: object[key],
                    key: key,
                    object: object,
                })
            }
        } else if (_.has(object, key)) {
            util.fail(_.messages[3], {
                expected: value,
                actual: object[key],
                key: key,
                object: object,
            })
        }
    }
}

function notHasLoose(_) { // eslint-disable-line max-len, max-params
    return function (object, key, value) {
        if (_.has(object, key) && util.looseIs(_.get(object, key), value)) {
            util.fail(_.messages[2], {
                expected: value,
                actual: object[key],
                key: key,
                object: object,
            })
        }
    }
}

function hasOwnKey(object, key) { return hasOwn.call(object, key) }
function hasInKey(object, key) { return key in object }
function hasInColl(object, key) { return object.has(key) }
function hasObjectGet(object, key) { return object[key] }
function hasCollGet(object, key) { return object.get(key) }

function createHas(has, get, messages) {
    return {has: has, get: get, messages: messages}
}

var hasOwnMethods = createHas(hasOwnKey, hasObjectGet, [
    "Expected {object} to have own key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have own key {expected}",
    "Expected {object} to not have own key {key} equal to {actual}",
    "Expected {actual} to not have own key {expected}",
])

var hasKeyMethods = createHas(hasInKey, hasObjectGet, [
    "Expected {object} to have key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have key {expected}",
    "Expected {object} to not have key {key} equal to {actual}",
    "Expected {actual} to not have key {expected}",
])

var hasMethods = createHas(hasInColl, hasCollGet, [
    "Expected {object} to have key {key} equal to {expected}, but found {actual}", // eslint-disable-line max-len
    "Expected {actual} to have key {expected}",
    "Expected {object} to not have key {key} equal to {actual}",
    "Expected {actual} to not have key {expected}",
])

exports.hasOwn = has(hasOwnMethods)
exports.notHasOwn = notHas(hasOwnMethods)
exports.hasOwnLoose = hasLoose(hasOwnMethods)
exports.notHasOwnLoose = notHasLoose(hasOwnMethods)

exports.hasKey = has(hasKeyMethods)
exports.notHasKey = notHas(hasKeyMethods)
exports.hasKeyLoose = hasLoose(hasKeyMethods)
exports.notHasKeyLoose = notHasLoose(hasKeyMethods)

exports.has = has(hasMethods)
exports.notHas = notHas(hasMethods)
exports.hasLoose = hasLoose(hasMethods)
exports.notHasLoose = notHasLoose(hasMethods)

},{"clean-assert-util":32}],38:[function(require,module,exports){
"use strict"

var match = require("clean-match")
var util = require("clean-assert-util")

function includes(func, all, array, values) {
    // Cheap cases first
    if (!Array.isArray(array)) return false
    if (array === values) return true
    if (all && array.length < values.length) return false

    for (var i = 0; i < values.length; i++) {
        var value = values[i]
        var test = false

        for (var j = 0; j < array.length; j++) {
            if (func(value, array[j])) {
                test = true
                break
            }
        }

        if (test !== all) return test
    }

    return all
}

function defineIncludes(func, all, invert, message) {
    return function (array, values) {
        if (!Array.isArray(array)) {
            throw new TypeError("`array` must be an array")
        }

        if (!Array.isArray(values)) values = [values]

        if (values.length && includes(func, all, array, values) === invert) {
            util.fail(message, {actual: array, values: values})
        }
    }
}

/* eslint-disable max-len */

exports.includes = defineIncludes(util.strictIs, true, false, "Expected {actual} to have all values in {values}")
exports.includesDeep = defineIncludes(match.strict, true, false, "Expected {actual} to match all values in {values}")
exports.includesMatch = defineIncludes(match.loose, true, false, "Expected {actual} to match all values in {values}")
exports.includesAny = defineIncludes(util.strictIs, false, false, "Expected {actual} to have any value in {values}")
exports.includesAnyDeep = defineIncludes(match.strict, false, false, "Expected {actual} to match any value in {values}")
exports.includesAnyMatch = defineIncludes(match.loose, false, false, "Expected {actual} to match any value in {values}")
exports.notIncludesAll = defineIncludes(util.strictIs, true, true, "Expected {actual} to not have all values in {values}")
exports.notIncludesAllDeep = defineIncludes(match.strict, true, true, "Expected {actual} to not match all values in {values}")
exports.notIncludesAllMatch = defineIncludes(match.loose, true, true, "Expected {actual} to not match all values in {values}")
exports.notIncludes = defineIncludes(util.strictIs, false, true, "Expected {actual} to not have any value in {values}")
exports.notIncludesDeep = defineIncludes(match.strict, false, true, "Expected {actual} to not match any value in {values}")
exports.notIncludesMatch = defineIncludes(match.loose, false, true, "Expected {actual} to not match any value in {values}")

},{"clean-assert-util":32,"clean-match":43}],39:[function(require,module,exports){
"use strict"

/* global Promise */

var util = require("clean-assert-util")
var common = require("./throws-common")

exports.throws = function (Type, callback) {
    if (callback == null) {
        callback = Type
        Type = null
    }

    if (Type != null && typeof Type !== "function") {
        throw new TypeError("`Type` must be a function if passed")
    }

    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    return Promise.resolve()
    .then(callback)
    .then(function () {
        throw new util.AssertionError("Expected callback to throw")
    }, function (e) {
        if (Type != null && !(e instanceof Type)) {
            util.fail(
                "Expected callback to throw an instance of " +
                common.getName(Type) + ", but found {actual}",
                {actual: e})
        }
    })
}

exports.throwsMatch = function (matcher, callback) {
    if (typeof matcher !== "string" &&
            typeof matcher !== "function" &&
            !(matcher instanceof RegExp) &&
            !common.isPlainObject(matcher)) {
        throw new TypeError(
            "`matcher` must be a string, function, RegExp, or object")
    }

    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    return Promise.resolve()
    .then(callback)
    .then(function () {
        throw new util.AssertionError("Expected callback to throw")
    }, function (e) {
        if (!common.throwsMatchTest(matcher, e)) {
            util.fail(
                "Expected callback to  throw an error that matches " +
                "{expected}, but found {actual}",
                {expected: matcher, actual: e})
        }
    })
}

},{"./throws-common":40,"clean-assert-util":32}],40:[function(require,module,exports){
"use strict"

var util = require("clean-assert-util")

exports.getName = function (func) {
    var name = func.name

    if (name == null) name = func.displayName
    if (name) return util.escape(name)
    return "<anonymous>"
}

exports.throwsMatchTest = function (matcher, e) {
    if (typeof matcher === "string") return e.message === matcher
    if (typeof matcher === "function") return !!matcher(e)
    if (matcher instanceof RegExp) return !!matcher.test(e.message)

    var keys = Object.keys(matcher)

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]

        if (!(key in e) || !util.strictIs(matcher[key], e[key])) return false
    }

    return true
}

exports.isPlainObject = function (object) {
    return object == null || Object.getPrototypeOf(object) === Object.prototype
}

},{"clean-assert-util":32}],41:[function(require,module,exports){
"use strict"

var util = require("clean-assert-util")
var common = require("./throws-common")

exports.throws = function (Type, callback) {
    if (callback == null) {
        callback = Type
        Type = null
    }

    if (Type != null && typeof Type !== "function") {
        throw new TypeError("`Type` must be a function if passed")
    }

    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    try {
        callback() // eslint-disable-line callback-return
    } catch (e) {
        if (Type != null && !(e instanceof Type)) {
            util.fail(
                "Expected callback to throw an instance of " +
                common.getName(Type) + ", but found {actual}",
                {actual: e})
        }
        return
    }

    throw new util.AssertionError("Expected callback to throw")
}

exports.throwsMatch = function (matcher, callback) {
    if (typeof matcher !== "string" &&
            typeof matcher !== "function" &&
            !(matcher instanceof RegExp) &&
            !common.isPlainObject(matcher)) {
        throw new TypeError(
            "`matcher` must be a string, function, RegExp, or object")
    }

    if (typeof callback !== "function") {
        throw new TypeError("`callback` must be a function")
    }

    try {
        callback() // eslint-disable-line callback-return
    } catch (e) {
        if (!common.throwsMatchTest(matcher, e)) {
            util.fail(
                "Expected callback to  throw an error that matches " +
                "{expected}, but found {actual}",
                {expected: matcher, actual: e})
        }
        return
    }

    throw new util.AssertionError("Expected callback to throw.")
}

},{"./throws-common":40,"clean-assert-util":32}],42:[function(require,module,exports){
"use strict"

var util = require("clean-assert-util")

exports.ok = function (x) {
    if (!x) util.fail("Expected {actual} to be truthy", {actual: x})
}

exports.notOk = function (x) {
    if (x) util.fail("Expected {actual} to be falsy", {actual: x})
}

exports.isBoolean = function (x) {
    if (typeof x !== "boolean") {
        util.fail("Expected {actual} to be a boolean", {actual: x})
    }
}

exports.notBoolean = function (x) {
    if (typeof x === "boolean") {
        util.fail("Expected {actual} to not be a boolean", {actual: x})
    }
}

exports.isFunction = function (x) {
    if (typeof x !== "function") {
        util.fail("Expected {actual} to be a function", {actual: x})
    }
}

exports.notFunction = function (x) {
    if (typeof x === "function") {
        util.fail("Expected {actual} to not be a function", {actual: x})
    }
}

exports.isNumber = function (x) {
    if (typeof x !== "number") {
        util.fail("Expected {actual} to be a number", {actual: x})
    }
}

exports.notNumber = function (x) {
    if (typeof x === "number") {
        util.fail("Expected {actual} to not be a number", {actual: x})
    }
}

exports.isObject = function (x) {
    if (typeof x !== "object" || x == null) {
        util.fail("Expected {actual} to be an object", {actual: x})
    }
}

exports.notObject = function (x) {
    if (typeof x === "object" && x != null) {
        util.fail("Expected {actual} to not be an object", {actual: x})
    }
}

exports.isString = function (x) {
    if (typeof x !== "string") {
        util.fail("Expected {actual} to be a string", {actual: x})
    }
}

exports.notString = function (x) {
    if (typeof x === "string") {
        util.fail("Expected {actual} to not be a string", {actual: x})
    }
}

exports.isSymbol = function (x) {
    if (typeof x !== "symbol") {
        util.fail("Expected {actual} to be a symbol", {actual: x})
    }
}

exports.notSymbol = function (x) {
    if (typeof x === "symbol") {
        util.fail("Expected {actual} to not be a symbol", {actual: x})
    }
}

exports.exists = function (x) {
    if (x == null) {
        util.fail("Expected {actual} to exist", {actual: x})
    }
}

exports.notExists = function (x) {
    if (x != null) {
        util.fail("Expected {actual} to not exist", {actual: x})
    }
}

exports.isArray = function (x) {
    if (!Array.isArray(x)) {
        util.fail("Expected {actual} to be an array", {actual: x})
    }
}

exports.notArray = function (x) {
    if (Array.isArray(x)) {
        util.fail("Expected {actual} to not be an array", {actual: x})
    }
}

exports.is = function (Type, object) {
    if (typeof Type !== "function") {
        throw new TypeError("`Type` must be a function")
    }

    if (!(object instanceof Type)) {
        util.fail("Expected {object} to be an instance of {expected}", {
            expected: Type,
            actual: object.constructor,
            object: object,
        })
    }
}

exports.not = function (Type, object) {
    if (typeof Type !== "function") {
        throw new TypeError("`Type` must be a function")
    }

    if (object instanceof Type) {
        util.fail("Expected {object} to not be an instance of {expected}", {
            expected: Type,
            object: object,
        })
    }
}

},{"clean-assert-util":32}],43:[function(require,module,exports){
(function (global){
/**
 * @license
 * clean-match
 *
 * A simple, fast ES2015+ aware deep matching utility.
 *
 * Copyright (c) 2016 and later, Isiah Meadows <me@isiahmeadows.com>.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

/* eslint-disable */
;(function (global, factory) {
    if (typeof exports === "object" && exports != null) {
        factory(global, exports)
    } else if (typeof define === "function") {
        define("clean-match", ["exports"], function (exports) {
            factory(global, exports)
        })
    } else {
        factory(global, global.match = {})
    }
})(typeof global === "object" && global !== null ? global
    : typeof self === "object" && self !== null ? self
    : typeof window === "object" && window !== null ? window
    : this,
function (global, exports) {
    /* eslint-enable */
    "use strict"

    /* global Symbol, Uint8Array, DataView, ArrayBuffer, ArrayBufferView, Map,
    Set */

    /**
     * Deep matching algorithm, with zero dependencies. Note the following:
     *
     * - This is relatively performance-tuned, although it prefers high
     *   correctness. Patch with care, since performance is a concern.
     * - This does pack a *lot* of features, which should explain the length.
     * - Some of the duplication is intentional. It's generally commented, but
     *   it's mainly for performance, since the engine needs its type info.
     * - Polyfilled core-js Symbols from cross-origin contexts will never
     *   register as being actual Symbols.
     *
     * And in case you're wondering about the longer functions and occasional
     * repetition, it's because V8's inliner isn't always intelligent enough to
     * deal with the super highly polymorphic data this often deals with, and JS
     * doesn't have compile-time macros.
     */

    var objectToString = Object.prototype.toString
    var hasOwn = Object.prototype.hasOwnProperty

    var supportsUnicode = hasOwn.call(RegExp.prototype, "unicode")
    var supportsSticky = hasOwn.call(RegExp.prototype, "sticky")

    // Legacy engines have several issues when it comes to `typeof`.
    var isFunction = (function () {
        function SlowIsFunction(value) {
            if (value == null) return false

            var tag = objectToString.call(value)

            return tag === "[object Function]" ||
                tag === "[object GeneratorFunction]" ||
                tag === "[object AsyncFunction]" ||
                tag === "[object Proxy]"
        }

        function isPoisoned(object) {
            return object != null && typeof object !== "function"
        }

        // In Safari 10, `typeof Proxy === "object"`
        if (isPoisoned(global.Proxy)) return SlowIsFunction

        // In Safari 8, several typed array constructors are
        // `typeof C === "object"`
        if (isPoisoned(global.Int8Array)) return SlowIsFunction

        // In old V8, RegExps are callable
        if (typeof /x/ === "function") return SlowIsFunction // eslint-disable-line

        // Leave this for normal things. It's easily inlined.
        return function isFunction(value) {
            return typeof value === "function"
        }
    })()

    // Set up our own buffer check. We should always accept the polyfill, even
    // in Node. Note that it uses `global.Buffer` to avoid including `buffer` in
    // the bundle.

    var BufferNative = 0
    var BufferPolyfill = 1
    var BufferSafari = 2

    var bufferSupport = (function () {
        function FakeBuffer() {}
        FakeBuffer.isBuffer = function () { return true }

        // Only Safari 5-7 has ever had this issue.
        if (new FakeBuffer().constructor !== FakeBuffer) return BufferSafari
        if (!isFunction(global.Buffer)) return BufferPolyfill
        if (!isFunction(global.Buffer.isBuffer)) return BufferPolyfill
        // Avoid global polyfills
        if (global.Buffer.isBuffer(new FakeBuffer())) return BufferPolyfill
        return BufferNative
    })()

    var globalIsBuffer = bufferSupport === BufferNative
        ? global.Buffer.isBuffer
        : undefined

    function isBuffer(object) {
        if (bufferSupport === BufferNative && globalIsBuffer(object)) {
            return true
        } else if (bufferSupport === BufferSafari && object._isBuffer) {
            return true
        }

        var B = object.constructor

        if (!isFunction(B)) return false
        if (!isFunction(B.isBuffer)) return false
        return B.isBuffer(object)
    }

    // core-js' symbols are objects, and some old versions of V8 erroneously had
    // `typeof Symbol() === "object"`.
    var symbolsAreObjects = isFunction(global.Symbol) &&
        typeof Symbol() === "object"

    // `context` is a bit field, with the following bits. This is not as much
    // for performance than to just reduce the number of parameters I need to be
    // throwing around.
    var Strict = 1
    var Initial = 2
    var SameProto = 4

    exports.loose = function (a, b) {
        return match(a, b, Initial, undefined, undefined)
    }

    exports.strict = function (a, b) {
        return match(a, b, Strict | Initial, undefined, undefined)
    }

    // Feature-test delayed stack additions and extra keys. PhantomJS and IE
    // both wait until the error was actually thrown first, and assign them as
    // own properties, which is unhelpful for assertions. This returns a
    // function to speed up cases where `Object.keys` is sufficient (e.g. in
    // Chrome/FF/Node).
    //
    // This wouldn't be necessary if those engines would make the stack a
    // getter, and record it when the error was created, not when it was thrown.
    // It specifically filters out errors and only checks existing descriptors,
    // just to keep the mess from affecting everything (it's not fully correct,
    // but it's necessary).
    var requiresProxy = (function () {
        var test = new Error()
        var old = Object.create(null)

        Object.keys(test).forEach(function (key) { old[key] = true })

        try {
            throw test
        } catch (_) {
            // ignore
        }

        return Object.keys(test).some(function (key) { return !old[key] })
    })()

    function isIgnored(object, key) {
        switch (key) {
        case "line": if (typeof object.line !== "number") return false; break
        case "sourceURL":
            if (typeof object.sourceURL !== "string") return false; break
        case "stack": if (typeof object.stack !== "string") return false; break
        default: return false
        }

        var desc = Object.getOwnPropertyDescriptor(object, key)

        return !desc.configurable && desc.enumerable && !desc.writable
    }

    // This is only invoked with errors, so it's not going to present a
    // significant slow down.
    function getKeysStripped(object) {
        var keys = Object.keys(object)
        var count = 0

        for (var i = 0; i < keys.length; i++) {
            if (!isIgnored(object, keys[i])) keys[count++] = keys[i]
        }

        keys.length = count
        return keys
    }

    // Way faster, since typed array indices are always dense and contain
    // numbers.

    // Setup for `isBufferOrView` and `isView`
    var ArrayBufferNone = 0
    var ArrayBufferLegacy = 1
    var ArrayBufferCurrent = 2

    var arrayBufferSupport = (function () {
        if (!isFunction(global.Uint8Array)) return ArrayBufferNone
        if (!isFunction(global.DataView)) return ArrayBufferNone
        if (!isFunction(global.ArrayBuffer)) return ArrayBufferNone
        if (isFunction(global.ArrayBuffer.isView)) return ArrayBufferCurrent
        if (isFunction(global.ArrayBufferView)) return ArrayBufferLegacy
        return ArrayBufferNone
    })()

    // If typed arrays aren't supported (they weren't technically part of
    // ES5, but many engines implemented Khronos' spec before ES6), then
    // just fall back to generic buffer detection.

    function floatIs(a, b) {
        // So NaNs are considered equal.
        return a === b || a !== a && b !== b // eslint-disable-line no-self-compare, max-len
    }

    function matchView(a, b) {
        var count = a.length

        if (count !== b.length) return false

        while (count) {
            count--
            if (!floatIs(a[count], b[count])) return false
        }

        return true
    }

    var isView = (function () {
        if (arrayBufferSupport === ArrayBufferNone) return undefined
        // ES6 typed arrays
        if (arrayBufferSupport === ArrayBufferCurrent) return ArrayBuffer.isView
        // legacy typed arrays
        return function isView(object) {
            return object instanceof ArrayBufferView
        }
    })()

    // Support checking maps and sets deeply. They are object-like enough to
    // count, and are useful in their own right. The code is rather messy, but
    // mainly to keep the order-independent checking from becoming insanely
    // slow.
    var supportsMap = isFunction(global.Map)
    var supportsSet = isFunction(global.Set)

    // One of the sets and both maps' keys are converted to arrays for faster
    // handling.
    function keyList(map) {
        var list = new Array(map.size)
        var i = 0
        var iter = map.keys()

        for (var next = iter.next(); !next.done; next = iter.next()) {
            list[i++] = next.value
        }

        return list
    }

    // The pair of arrays are aligned in a single O(n^2) operation (mod deep
    // matching and rotation), adapting to O(n) when they're already aligned.
    function matchKey(current, akeys, start, end, context, left, right) { // eslint-disable-line max-params, max-len
        for (var i = start + 1; i < end; i++) {
            var key = akeys[i]

            if (match(current, key, context, left, right)) {
                // TODO: once engines actually optimize `copyWithin`, use that
                // instead. It'll be much faster than this loop.
                while (i > start) akeys[i] = akeys[--i]
                akeys[i] = key
                return true
            }
        }

        return false
    }

    function matchValues(a, b, akeys, bkeys, end, context, left, right) { // eslint-disable-line max-params, max-len
        for (var i = 0; i < end; i++) {
            if (!match(a.get(akeys[i]), b.get(bkeys[i]),
                    context, left, right)) {
                return false
            }
        }

        return true
    }

    // Possibly expensive order-independent key-value match. First, try to avoid
    // it by conservatively assuming everything is in order - a cheap O(n) is
    // always nicer than an expensive O(n^2).
    function matchMap(a, b, context, left, right) { // eslint-disable-line max-params, max-len
        var end = a.size
        var akeys = keyList(a)
        var bkeys = keyList(b)
        var i = 0

        while (i !== end && match(akeys[i], bkeys[i], context, left, right)) {
            i++
        }

        if (i === end) {
            return matchValues(a, b, akeys, bkeys, end, context, left, right)
        }

        // Don't compare the same key twice
        if (!matchKey(bkeys[i], akeys, i, end, context, left, right)) {
            return false
        }

        // If the above fails, while we're at it, let's sort them as we go, so
        // the key order matches.
        while (++i < end) {
            var key = bkeys[i]

            // Adapt if the keys are already in order, which is frequently the
            // case.
            if (!match(key, akeys[i], context, left, right) &&
                    !matchKey(key, akeys, i, end, context, left, right)) {
                return false
            }
        }

        return matchValues(a, b, akeys, bkeys, end, context, left, right)
    }

    function hasAllIdentical(alist, b) {
        for (var i = 0; i < alist.length; i++) {
            if (!b.has(alist[i])) return false
        }

        return true
    }

    // Compare the values structurally, and independent of order.
    function searchFor(avalue, objects, context, left, right) { // eslint-disable-line max-params, max-len
        for (var j in objects) {
            if (hasOwn.call(objects, j)) {
                if (match(avalue, objects[j], context, left, right)) {
                    delete objects[j]
                    return true
                }
            }
        }

        return false
    }

    function hasStructure(value, context) {
        return typeof value === "object" && value !== null ||
                !(context & Strict) && typeof value === "symbol"
    }

    // The set algorithm is structured a little differently. It takes one of the
    // sets into an array, does a cheap identity check, then does the deep
    // check.
    function matchSet(a, b, context, left, right) { // eslint-disable-line max-params, max-len
        // This is to try to avoid an expensive structural match on the keys.
        // Test for identity first.
        var alist = keyList(a)

        if (hasAllIdentical(alist, b)) return true

        var iter = b.values()
        var count = 0
        var objects

        // Gather all the objects
        for (var next = iter.next(); !next.done; next = iter.next()) {
            var bvalue = next.value

            if (hasStructure(bvalue, context)) {
                // Create the objects map lazily. Note that this also grabs
                // Symbols when not strictly matching, since their description
                // is compared.
                if (count === 0) objects = Object.create(null)
                objects[count++] = bvalue
            }
        }

        // If everything is a primitive, then abort.
        if (count === 0) return false

        // Iterate the object, removing each one remaining when matched (and
        // aborting if none can be).
        for (var i = 0; i < count; i++) {
            var avalue = alist[i]

            if (hasStructure(avalue, context) &&
                    !searchFor(avalue, objects, context, left, right)) {
                return false
            }
        }

        return true
    }

    function matchRegExp(a, b) {
        return a.source === b.source &&
            a.global === b.global &&
            a.ignoreCase === b.ignoreCase &&
            a.multiline === b.multiline &&
            (!supportsUnicode || a.unicode === b.unicode) &&
            (!supportsSticky || a.sticky === b.sticky)
    }

    function matchPrepareDescend(a, b, context, left, right) { // eslint-disable-line max-params, max-len
        // Check for circular references after the first level, where it's
        // redundant. Note that they have to point to the same level to actually
        // be considered deeply equal.
        if (!(context & Initial)) {
            var leftIndex = left.indexOf(a)
            var rightIndex = right.indexOf(b)

            if (leftIndex !== rightIndex) return false
            if (leftIndex >= 0) return true

            left.push(a)
            right.push(b)

            var result = matchInner(a, b, context, left, right)

            left.pop()
            right.pop()

            return result
        } else {
            return matchInner(a, b, context & ~Initial, [a], [b])
        }
    }

    function matchSameProto(a, b, context, left, right) { // eslint-disable-line max-params, max-len
        if (symbolsAreObjects && a instanceof Symbol) {
            return !(context & Strict) && a.toString() === b.toString()
        }

        if (a instanceof RegExp) return matchRegExp(a, b)
        if (a instanceof Date) return a.valueOf() === b.valueOf()
        if (arrayBufferSupport !== ArrayBufferNone) {
            if (a instanceof DataView) {
                return matchView(
                    new Uint8Array(a.buffer, a.byteOffset, a.byteLength),
                    new Uint8Array(b.buffer, b.byteOffset, b.byteLength))
            }
            if (a instanceof ArrayBuffer) {
                return matchView(new Uint8Array(a), new Uint8Array(b))
            }
            if (isView(a)) return matchView(a, b)
        }

        if (isBuffer(a)) return matchView(a, b)

        if (Array.isArray(a)) {
            if (a.length !== b.length) return false
            if (a.length === 0) return true
        } else if (supportsMap && a instanceof Map) {
            if (a.size !== b.size) return false
            if (a.size === 0) return true
        } else if (supportsSet && a instanceof Set) {
            if (a.size !== b.size) return false
            if (a.size === 0) return true
        } else if (objectToString.call(a) === "[object Arguments]") {
            if (objectToString.call(b) !== "[object Arguments]") return false
            if (a.length !== b.length) return false
            if (a.length === 0) return true
        } else if (objectToString.call(b) === "[object Arguments]") {
            return false
        }

        return matchPrepareDescend(a, b, context, left, right)
    }

    // Most special cases require both types to match, and if only one of them
    // are, the objects themselves don't match.
    function matchDifferentProto(a, b, context, left, right) { // eslint-disable-line max-params, max-len
        if (symbolsAreObjects) {
            if (a instanceof Symbol || b instanceof Symbol) return false
        }
        if (context & Strict) return false
        if (arrayBufferSupport !== ArrayBufferNone) {
            if (a instanceof ArrayBuffer || b instanceof ArrayBuffer) {
                return false
            }
            if (isView(a) || isView(b)) return false
        }
        if (Array.isArray(a) || Array.isArray(b)) return false
        if (supportsMap && (a instanceof Map || b instanceof Map)) return false
        if (supportsSet && (a instanceof Set || b instanceof Set)) return false
        if (objectToString.call(a) === "[object Arguments]") {
            if (objectToString.call(b) !== "[object Arguments]") return false
            if (a.length !== b.length) return false
            if (a.length === 0) return true
        }
        if (objectToString.call(b) === "[object Arguments]") return false
        return matchPrepareDescend(a, b, context, left, right)
    }

    function match(a, b, context, left, right) { // eslint-disable-line max-params, max-len
        if (a === b) return true
        // NaNs are equal
        if (a !== a) return b !== b // eslint-disable-line no-self-compare
        if (a === null || b === null) return false
        if (typeof a === "symbol" && typeof b === "symbol") {
            return !(context & Strict) && a.toString() === b.toString()
        }
        if (typeof a !== "object" || typeof b !== "object") return false

        // Usually, both objects have identical prototypes, and that allows for
        // half the type checking.
        if (Object.getPrototypeOf(a) === Object.getPrototypeOf(b)) {
            return matchSameProto(a, b, context | SameProto, left, right)
        } else {
            return matchDifferentProto(a, b, context, left, right)
        }
    }

    function matchArrayLike(a, b, context, left, right) { // eslint-disable-line max-params, max-len
        for (var i = 0; i < a.length; i++) {
            if (!match(a[i], b[i], context, left, right)) return false
        }

        return true
    }

    // PhantomJS and SlimerJS both have mysterious issues where `Error` is
    // sometimes erroneously of a different `window`, and it shows up in the
    // tests. This means I have to use a much slower algorithm to detect Errors.
    //
    // PhantomJS: https://github.com/petkaantonov/bluebird/issues/1146
    // SlimerJS: https://github.com/laurentj/slimerjs/issues/400
    //
    // (Yes, the PhantomJS bug is detailed in the Bluebird issue tracker.)
    var checkCrossOrigin = (function () {
        if (global.window == null || global.window.navigator == null) {
            return false
        }
        return /slimerjs|phantomjs/i.test(global.window.navigator.userAgent)
    })()

    var errorStringTypes = {
        "[object Error]": true,
        "[object EvalError]": true,
        "[object RangeError]": true,
        "[object ReferenceError]": true,
        "[object SyntaxError]": true,
        "[object TypeError]": true,
        "[object URIError]": true,
    }

    function isProxiedError(object) {
        while (object != null) {
            if (errorStringTypes[objectToString.call(object)]) return true
            object = Object.getPrototypeOf(object)
        }

        return false
    }

    function matchInner(a, b, context, left, right) { // eslint-disable-line max-statements, max-params, max-len
        var akeys, bkeys
        var isUnproxiedError = false

        if (context & SameProto) {
            if (Array.isArray(a)) {
                return matchArrayLike(a, b, context, left, right)
            }

            if (supportsMap && a instanceof Map) {
                return matchMap(a, b, context, left, right)
            }

            if (supportsSet && a instanceof Set) {
                return matchSet(a, b, context, left, right)
            }

            if (objectToString.call(a) === "[object Arguments]") {
                return matchArrayLike(a, b, context, left, right)
            }

            if (requiresProxy &&
                    (checkCrossOrigin ? isProxiedError(a)
                        : a instanceof Error)) {
                akeys = getKeysStripped(a)
                bkeys = getKeysStripped(b)
            } else {
                akeys = Object.keys(a)
                bkeys = Object.keys(b)
                isUnproxiedError = a instanceof Error
            }
        } else {
            if (objectToString.call(a) === "[object Arguments]") {
                return matchArrayLike(a, b, context, left, right)
            }

            // If we require a proxy, be permissive and check the `toString`
            // type. This is so it works cross-origin in PhantomJS in
            // particular.
            if (checkCrossOrigin ? isProxiedError(a) : a instanceof Error) {
                return false
            }
            akeys = Object.keys(a)
            bkeys = Object.keys(b)
        }

        var count = akeys.length

        if (count !== bkeys.length) return false

        // Shortcut if there's nothing to match
        if (count === 0) return true

        var i

        if (isUnproxiedError) {
            // Shortcut if the properties are different.
            for (i = 0; i < count; i++) {
                if (akeys[i] !== "stack") {
                    if (!hasOwn.call(b, akeys[i])) return false
                }
            }

            // Verify that all the akeys' values matched.
            for (i = 0; i < count; i++) {
                if (akeys[i] !== "stack" &&
                        !match(a[akeys[i]], b[akeys[i]],
                            context, left, right)) {
                    return false
                }
            }
        } else {
            // Shortcut if the properties are different.
            for (i = 0; i < count; i++) {
                if (!hasOwn.call(b, akeys[i])) return false
            }

            // Verify that all the akeys' values matched.
            for (i = 0; i < count; i++) {
                if (!match(a[akeys[i]], b[akeys[i]], context, left, right)) {
                    return false
                }
            }
        }

        return true
    }
}); // eslint-disable-line semi

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],44:[function(require,module,exports){
/*istanbul ignore start*/"use strict";

exports.__esModule = true;
exports. /*istanbul ignore end*/convertChangesToDMP = convertChangesToDMP;
// See: http://code.google.com/p/google-diff-match-patch/wiki/API
function convertChangesToDMP(changes) {
  var ret = [],
      change = /*istanbul ignore start*/void 0 /*istanbul ignore end*/,
      operation = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
  for (var i = 0; i < changes.length; i++) {
    change = changes[i];
    if (change.added) {
      operation = 1;
    } else if (change.removed) {
      operation = -1;
    } else {
      operation = 0;
    }

    ret.push([operation, change.value]);
  }
  return ret;
}


},{}],45:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/convertChangesToXML = convertChangesToXML;
function convertChangesToXML(changes) {
  var ret = [];
  for (var i = 0; i < changes.length; i++) {
    var change = changes[i];
    if (change.added) {
      ret.push('<ins>');
    } else if (change.removed) {
      ret.push('<del>');
    }

    ret.push(escapeHTML(change.value));

    if (change.added) {
      ret.push('</ins>');
    } else if (change.removed) {
      ret.push('</del>');
    }
  }
  return ret.join('');
}

function escapeHTML(s) {
  var n = s;
  n = n.replace(/&/g, '&amp;');
  n = n.replace(/</g, '&lt;');
  n = n.replace(/>/g, '&gt;');
  n = n.replace(/"/g, '&quot;');

  return n;
}


},{}],46:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.arrayDiff = undefined;
exports. /*istanbul ignore end*/diffArrays = diffArrays;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var arrayDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/arrayDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
arrayDiff.tokenize = arrayDiff.join = function (value) {
  return value.slice();
};

function diffArrays(oldArr, newArr, callback) {
  return arrayDiff.diff(oldArr, newArr, callback);
}


},{"./base":47}],47:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports['default'] = /*istanbul ignore end*/Diff;
function Diff() {}

Diff.prototype = { /*istanbul ignore start*/
  /*istanbul ignore end*/diff: function diff(oldString, newString) {
    /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    var callback = options.callback;
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    this.options = options;

    var self = this;

    function done(value) {
      if (callback) {
        setTimeout(function () {
          callback(undefined, value);
        }, 0);
        return true;
      } else {
        return value;
      }
    }

    // Allow subclasses to massage the input prior to running
    oldString = this.castInput(oldString);
    newString = this.castInput(newString);

    oldString = this.removeEmpty(this.tokenize(oldString));
    newString = this.removeEmpty(this.tokenize(newString));

    var newLen = newString.length,
        oldLen = oldString.length;
    var editLength = 1;
    var maxEditLength = newLen + oldLen;
    var bestPath = [{ newPos: -1, components: [] }];

    // Seed editLength = 0, i.e. the content starts with the same values
    var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
    if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
      // Identity per the equality and tokenizer
      return done([{ value: this.join(newString), count: newString.length }]);
    }

    // Main worker method. checks all permutations of a given edit length for acceptance.
    function execEditLength() {
      for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
        var basePath = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
        var addPath = bestPath[diagonalPath - 1],
            removePath = bestPath[diagonalPath + 1],
            _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
        if (addPath) {
          // No one else is going to attempt to use this value, clear it
          bestPath[diagonalPath - 1] = undefined;
        }

        var canAdd = addPath && addPath.newPos + 1 < newLen,
            canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;
        if (!canAdd && !canRemove) {
          // If this path is a terminal then prune
          bestPath[diagonalPath] = undefined;
          continue;
        }

        // Select the diagonal that we want to branch from. We select the prior
        // path whose position in the new string is the farthest from the origin
        // and does not pass the bounds of the diff graph
        if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
          basePath = clonePath(removePath);
          self.pushComponent(basePath.components, undefined, true);
        } else {
          basePath = addPath; // No need to clone, we've pulled it from the list
          basePath.newPos++;
          self.pushComponent(basePath.components, true, undefined);
        }

        _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath);

        // If we have hit the end of both strings, then we are done
        if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
          return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
        } else {
          // Otherwise track this path as a potential candidate and continue.
          bestPath[diagonalPath] = basePath;
        }
      }

      editLength++;
    }

    // Performs the length of edit iteration. Is a bit fugly as this has to support the
    // sync and async mode which is never fun. Loops over execEditLength until a value
    // is produced.
    if (callback) {
      (function exec() {
        setTimeout(function () {
          // This should not happen, but we want to be safe.
          /* istanbul ignore next */
          if (editLength > maxEditLength) {
            return callback();
          }

          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength) {
        var ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/pushComponent: function pushComponent(components, added, removed) {
    var last = components[components.length - 1];
    if (last && last.added === added && last.removed === removed) {
      // We need to clone here as the component clone operation is just
      // as shallow array clone
      components[components.length - 1] = { count: last.count + 1, added: added, removed: removed };
    } else {
      components.push({ count: 1, added: added, removed: removed });
    }
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
    var newLen = newString.length,
        oldLen = oldString.length,
        newPos = basePath.newPos,
        oldPos = newPos - diagonalPath,
        commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
      newPos++;
      oldPos++;
      commonCount++;
    }

    if (commonCount) {
      basePath.components.push({ count: commonCount });
    }

    basePath.newPos = newPos;
    return oldPos;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/equals: function equals(left, right) {
    return left === right;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/removeEmpty: function removeEmpty(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/castInput: function castInput(value) {
    return value;
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/tokenize: function tokenize(value) {
    return value.split('');
  },
  /*istanbul ignore start*/ /*istanbul ignore end*/join: function join(chars) {
    return chars.join('');
  }
};

function buildValues(diff, components, newString, oldString, useLongestToken) {
  var componentPos = 0,
      componentLen = components.length,
      newPos = 0,
      oldPos = 0;

  for (; componentPos < componentLen; componentPos++) {
    var component = components[componentPos];
    if (!component.removed) {
      if (!component.added && useLongestToken) {
        var value = newString.slice(newPos, newPos + component.count);
        value = value.map(function (value, i) {
          var oldValue = oldString[oldPos + i];
          return oldValue.length > value.length ? oldValue : value;
        });

        component.value = diff.join(value);
      } else {
        component.value = diff.join(newString.slice(newPos, newPos + component.count));
      }
      newPos += component.count;

      // Common case
      if (!component.added) {
        oldPos += component.count;
      }
    } else {
      component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
      oldPos += component.count;

      // Reverse add and remove so removes are output first to match common convention
      // The diffing algorithm is tied to add then remove output and this is the simplest
      // route to get the desired output with minimal overhead.
      if (componentPos && components[componentPos - 1].added) {
        var tmp = components[componentPos - 1];
        components[componentPos - 1] = components[componentPos];
        components[componentPos] = tmp;
      }
    }
  }

  // Special case handle for when one terminal is ignored. For this case we merge the
  // terminal into the prior string and drop the change.
  var lastComponent = components[componentLen - 1];
  if (componentLen > 1 && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
    components[componentLen - 2].value += lastComponent.value;
    components.pop();
  }

  return components;
}

function clonePath(path) {
  return { newPos: path.newPos, components: path.components.slice(0) };
}


},{}],48:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.characterDiff = undefined;
exports. /*istanbul ignore end*/diffChars = diffChars;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var characterDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/characterDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
function diffChars(oldStr, newStr, callback) {
  return characterDiff.diff(oldStr, newStr, callback);
}


},{"./base":47}],49:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.cssDiff = undefined;
exports. /*istanbul ignore end*/diffCss = diffCss;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var cssDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/cssDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
cssDiff.tokenize = function (value) {
  return value.split(/([{}:;,]|\s+)/);
};

function diffCss(oldStr, newStr, callback) {
  return cssDiff.diff(oldStr, newStr, callback);
}


},{"./base":47}],50:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.jsonDiff = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports. /*istanbul ignore end*/diffJson = diffJson;
/*istanbul ignore start*/exports. /*istanbul ignore end*/canonicalize = canonicalize;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_line = require('./line') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/

var objectPrototypeToString = Object.prototype.toString;

var jsonDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/jsonDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
// Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
// dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:
jsonDiff.useLongestToken = true;

jsonDiff.tokenize = /*istanbul ignore start*/_line.lineDiff. /*istanbul ignore end*/tokenize;
jsonDiff.castInput = function (value) {
  /*istanbul ignore start*/var /*istanbul ignore end*/undefinedReplacement = this.options.undefinedReplacement;


  return typeof value === 'string' ? value : JSON.stringify(canonicalize(value), function (k, v) {
    if (typeof v === 'undefined') {
      return undefinedReplacement;
    }

    return v;
  }, '  ');
};
jsonDiff.equals = function (left, right) {
  return (/*istanbul ignore start*/_base2['default']. /*istanbul ignore end*/prototype.equals(left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'))
  );
};

function diffJson(oldObj, newObj, options) {
  return jsonDiff.diff(oldObj, newObj, options);
}

// This function handles the presence of circular references by bailing out when encountering an
// object that is already on the "stack" of items being processed.
function canonicalize(obj, stack, replacementStack) {
  stack = stack || [];
  replacementStack = replacementStack || [];

  var i = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

  for (i = 0; i < stack.length; i += 1) {
    if (stack[i] === obj) {
      return replacementStack[i];
    }
  }

  var canonicalizedObj = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

  if ('[object Array]' === objectPrototypeToString.call(obj)) {
    stack.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);
    for (i = 0; i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack);
    }
    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }

  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }

  if ( /*istanbul ignore start*/(typeof /*istanbul ignore end*/obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null) {
    stack.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);
    var sortedKeys = [],
        key = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;
    for (key in obj) {
      /* istanbul ignore else */
      if (obj.hasOwnProperty(key)) {
        sortedKeys.push(key);
      }
    }
    sortedKeys.sort();
    for (i = 0; i < sortedKeys.length; i += 1) {
      key = sortedKeys[i];
      canonicalizedObj[key] = canonicalize(obj[key], stack, replacementStack);
    }
    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }
  return canonicalizedObj;
}


},{"./base":47,"./line":51}],51:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.lineDiff = undefined;
exports. /*istanbul ignore end*/diffLines = diffLines;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffTrimmedLines = diffTrimmedLines;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_params = require('../util/params') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var lineDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/lineDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
lineDiff.tokenize = function (value) {
  var retLines = [],
      linesAndNewlines = value.split(/(\n|\r\n)/);

  // Ignore the final empty token that occurs if the string ends with a new line
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }

  // Merge the content and line separators into single tokens
  for (var i = 0; i < linesAndNewlines.length; i++) {
    var line = linesAndNewlines[i];

    if (i % 2 && !this.options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      if (this.options.ignoreWhitespace) {
        line = line.trim();
      }
      retLines.push(line);
    }
  }

  return retLines;
};

function diffLines(oldStr, newStr, callback) {
  return lineDiff.diff(oldStr, newStr, callback);
}
function diffTrimmedLines(oldStr, newStr, callback) {
  var options = /*istanbul ignore start*/(0, _params.generateOptions) /*istanbul ignore end*/(callback, { ignoreWhitespace: true });
  return lineDiff.diff(oldStr, newStr, options);
}


},{"../util/params":59,"./base":47}],52:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.sentenceDiff = undefined;
exports. /*istanbul ignore end*/diffSentences = diffSentences;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/var sentenceDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/sentenceDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
sentenceDiff.tokenize = function (value) {
  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
};

function diffSentences(oldStr, newStr, callback) {
  return sentenceDiff.diff(oldStr, newStr, callback);
}


},{"./base":47}],53:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.wordDiff = undefined;
exports. /*istanbul ignore end*/diffWords = diffWords;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWordsWithSpace = diffWordsWithSpace;

var /*istanbul ignore start*/_base = require('./base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_params = require('../util/params') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/

// Based on https://en.wikipedia.org/wiki/Latin_script_in_Unicode
//
// Ranges and exceptions:
// Latin-1 Supplement, 0080–00FF
//  - U+00D7  × Multiplication sign
//  - U+00F7  ÷ Division sign
// Latin Extended-A, 0100–017F
// Latin Extended-B, 0180–024F
// IPA Extensions, 0250–02AF
// Spacing Modifier Letters, 02B0–02FF
//  - U+02C7  ˇ &#711;  Caron
//  - U+02D8  ˘ &#728;  Breve
//  - U+02D9  ˙ &#729;  Dot Above
//  - U+02DA  ˚ &#730;  Ring Above
//  - U+02DB  ˛ &#731;  Ogonek
//  - U+02DC  ˜ &#732;  Small Tilde
//  - U+02DD  ˝ &#733;  Double Acute Accent
// Latin Extended Additional, 1E00–1EFF
var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;

var reWhitespace = /\S/;

var wordDiff = /*istanbul ignore start*/exports. /*istanbul ignore end*/wordDiff = new /*istanbul ignore start*/_base2['default']() /*istanbul ignore end*/;
wordDiff.equals = function (left, right) {
  return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
};
wordDiff.tokenize = function (value) {
  var tokens = value.split(/(\s+|\b)/);

  // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.
  for (var i = 0; i < tokens.length - 1; i++) {
    // If we have an empty string in the next field and we have only word chars before and after, merge
    if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }

  return tokens;
};

function diffWords(oldStr, newStr, callback) {
  var options = /*istanbul ignore start*/(0, _params.generateOptions) /*istanbul ignore end*/(callback, { ignoreWhitespace: true });
  return wordDiff.diff(oldStr, newStr, options);
}
function diffWordsWithSpace(oldStr, newStr, callback) {
  return wordDiff.diff(oldStr, newStr, callback);
}


},{"../util/params":59,"./base":47}],54:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports.canonicalize = exports.convertChangesToXML = exports.convertChangesToDMP = exports.parsePatch = exports.applyPatches = exports.applyPatch = exports.createPatch = exports.createTwoFilesPatch = exports.structuredPatch = exports.diffArrays = exports.diffJson = exports.diffCss = exports.diffSentences = exports.diffTrimmedLines = exports.diffLines = exports.diffWordsWithSpace = exports.diffWords = exports.diffChars = exports.Diff = undefined;
/*istanbul ignore end*/
var /*istanbul ignore start*/_base = require('./diff/base') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _base2 = _interopRequireDefault(_base);

/*istanbul ignore end*/
var /*istanbul ignore start*/_character = require('./diff/character') /*istanbul ignore end*/;

var /*istanbul ignore start*/_word = require('./diff/word') /*istanbul ignore end*/;

var /*istanbul ignore start*/_line = require('./diff/line') /*istanbul ignore end*/;

var /*istanbul ignore start*/_sentence = require('./diff/sentence') /*istanbul ignore end*/;

var /*istanbul ignore start*/_css = require('./diff/css') /*istanbul ignore end*/;

var /*istanbul ignore start*/_json = require('./diff/json') /*istanbul ignore end*/;

var /*istanbul ignore start*/_array = require('./diff/array') /*istanbul ignore end*/;

var /*istanbul ignore start*/_apply = require('./patch/apply') /*istanbul ignore end*/;

var /*istanbul ignore start*/_parse = require('./patch/parse') /*istanbul ignore end*/;

var /*istanbul ignore start*/_create = require('./patch/create') /*istanbul ignore end*/;

var /*istanbul ignore start*/_dmp = require('./convert/dmp') /*istanbul ignore end*/;

var /*istanbul ignore start*/_xml = require('./convert/xml') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

exports. /*istanbul ignore end*/Diff = _base2['default'];
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffChars = _character.diffChars;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWords = _word.diffWords;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffWordsWithSpace = _word.diffWordsWithSpace;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffLines = _line.diffLines;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffTrimmedLines = _line.diffTrimmedLines;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffSentences = _sentence.diffSentences;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffCss = _css.diffCss;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffJson = _json.diffJson;
/*istanbul ignore start*/exports. /*istanbul ignore end*/diffArrays = _array.diffArrays;
/*istanbul ignore start*/exports. /*istanbul ignore end*/structuredPatch = _create.structuredPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createTwoFilesPatch = _create.createTwoFilesPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createPatch = _create.createPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatch = _apply.applyPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatches = _apply.applyPatches;
/*istanbul ignore start*/exports. /*istanbul ignore end*/parsePatch = _parse.parsePatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/convertChangesToDMP = _dmp.convertChangesToDMP;
/*istanbul ignore start*/exports. /*istanbul ignore end*/convertChangesToXML = _xml.convertChangesToXML;
/*istanbul ignore start*/exports. /*istanbul ignore end*/canonicalize = _json.canonicalize; /* See LICENSE file for terms of use */

/*
 * Text diff implementation.
 *
 * This library supports the following APIS:
 * JsDiff.diffChars: Character by character diff
 * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
 * JsDiff.diffLines: Line based diff
 *
 * JsDiff.diffCss: Diff targeted at CSS content
 *
 * These methods are based on the implementation proposed in
 * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */


},{"./convert/dmp":44,"./convert/xml":45,"./diff/array":46,"./diff/base":47,"./diff/character":48,"./diff/css":49,"./diff/json":50,"./diff/line":51,"./diff/sentence":52,"./diff/word":53,"./patch/apply":55,"./patch/create":56,"./patch/parse":57}],55:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/applyPatch = applyPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/applyPatches = applyPatches;

var /*istanbul ignore start*/_parse = require('./parse') /*istanbul ignore end*/;

var /*istanbul ignore start*/_distanceIterator = require('../util/distance-iterator') /*istanbul ignore end*/;

/*istanbul ignore start*/
var _distanceIterator2 = _interopRequireDefault(_distanceIterator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/*istanbul ignore end*/function applyPatch(source, uniDiff) {
  /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  if (typeof uniDiff === 'string') {
    uniDiff = /*istanbul ignore start*/(0, _parse.parsePatch) /*istanbul ignore end*/(uniDiff);
  }

  if (Array.isArray(uniDiff)) {
    if (uniDiff.length > 1) {
      throw new Error('applyPatch only works with a single input.');
    }

    uniDiff = uniDiff[0];
  }

  // Apply the diff to the input
  var lines = source.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = source.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      hunks = uniDiff.hunks,
      compareLine = options.compareLine || function (lineNumber, line, operation, patchContent) /*istanbul ignore start*/{
    return (/*istanbul ignore end*/line === patchContent
    );
  },
      errorCount = 0,
      fuzzFactor = options.fuzzFactor || 0,
      minLine = 0,
      offset = 0,
      removeEOFNL = /*istanbul ignore start*/void 0 /*istanbul ignore end*/,
      addEOFNL = /*istanbul ignore start*/void 0 /*istanbul ignore end*/;

  /**
   * Checks if the hunk exactly fits on the provided location
   */
  function hunkFits(hunk, toPos) {
    for (var j = 0; j < hunk.lines.length; j++) {
      var line = hunk.lines[j],
          operation = line[0],
          content = line.substr(1);

      if (operation === ' ' || operation === '-') {
        // Context sanity check
        if (!compareLine(toPos + 1, lines[toPos], operation, content)) {
          errorCount++;

          if (errorCount > fuzzFactor) {
            return false;
          }
        }
        toPos++;
      }
    }

    return true;
  }

  // Search best fit offsets for each hunk based on the previous ones
  for (var i = 0; i < hunks.length; i++) {
    var hunk = hunks[i],
        maxLine = lines.length - hunk.oldLines,
        localOffset = 0,
        toPos = offset + hunk.oldStart - 1;

    var iterator = /*istanbul ignore start*/(0, _distanceIterator2['default']) /*istanbul ignore end*/(toPos, minLine, maxLine);

    for (; localOffset !== undefined; localOffset = iterator()) {
      if (hunkFits(hunk, toPos + localOffset)) {
        hunk.offset = offset += localOffset;
        break;
      }
    }

    if (localOffset === undefined) {
      return false;
    }

    // Set lower text limit to end of the current hunk, so next ones don't try
    // to fit over already patched text
    minLine = hunk.offset + hunk.oldStart + hunk.oldLines;
  }

  // Apply patch hunks
  for (var _i = 0; _i < hunks.length; _i++) {
    var _hunk = hunks[_i],
        _toPos = _hunk.offset + _hunk.newStart - 1;
    if (_hunk.newLines == 0) {
      _toPos++;
    }

    for (var j = 0; j < _hunk.lines.length; j++) {
      var line = _hunk.lines[j],
          operation = line[0],
          content = line.substr(1),
          delimiter = _hunk.linedelimiters[j];

      if (operation === ' ') {
        _toPos++;
      } else if (operation === '-') {
        lines.splice(_toPos, 1);
        delimiters.splice(_toPos, 1);
        /* istanbul ignore else */
      } else if (operation === '+') {
          lines.splice(_toPos, 0, content);
          delimiters.splice(_toPos, 0, delimiter);
          _toPos++;
        } else if (operation === '\\') {
          var previousOperation = _hunk.lines[j - 1] ? _hunk.lines[j - 1][0] : null;
          if (previousOperation === '+') {
            removeEOFNL = true;
          } else if (previousOperation === '-') {
            addEOFNL = true;
          }
        }
    }
  }

  // Handle EOFNL insertion/removal
  if (removeEOFNL) {
    while (!lines[lines.length - 1]) {
      lines.pop();
      delimiters.pop();
    }
  } else if (addEOFNL) {
    lines.push('');
    delimiters.push('\n');
  }
  for (var _k = 0; _k < lines.length - 1; _k++) {
    lines[_k] = lines[_k] + delimiters[_k];
  }
  return lines.join('');
}

// Wrapper that supports multiple file patches via callbacks.
function applyPatches(uniDiff, options) {
  if (typeof uniDiff === 'string') {
    uniDiff = /*istanbul ignore start*/(0, _parse.parsePatch) /*istanbul ignore end*/(uniDiff);
  }

  var currentIndex = 0;
  function processIndex() {
    var index = uniDiff[currentIndex++];
    if (!index) {
      return options.complete();
    }

    options.loadFile(index, function (err, data) {
      if (err) {
        return options.complete(err);
      }

      var updatedContent = applyPatch(data, index, options);
      options.patched(index, updatedContent, function (err) {
        if (err) {
          return options.complete(err);
        }

        processIndex();
      });
    });
  }
  processIndex();
}


},{"../util/distance-iterator":58,"./parse":57}],56:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/structuredPatch = structuredPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createTwoFilesPatch = createTwoFilesPatch;
/*istanbul ignore start*/exports. /*istanbul ignore end*/createPatch = createPatch;

var /*istanbul ignore start*/_line = require('../diff/line') /*istanbul ignore end*/;

/*istanbul ignore start*/
function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*istanbul ignore end*/function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (!options) {
    options = {};
  }
  if (typeof options.context === 'undefined') {
    options.context = 4;
  }

  var diff = /*istanbul ignore start*/(0, _line.diffLines) /*istanbul ignore end*/(oldStr, newStr, options);
  diff.push({ value: '', lines: [] }); // Append an empty value to make cleanup easier

  function contextLines(lines) {
    return lines.map(function (entry) {
      return ' ' + entry;
    });
  }

  var hunks = [];
  var oldRangeStart = 0,
      newRangeStart = 0,
      curRange = [],
      oldLine = 1,
      newLine = 1;
  /*istanbul ignore start*/
  var _loop = function _loop( /*istanbul ignore end*/i) {
    var current = diff[i],
        lines = current.lines || current.value.replace(/\n$/, '').split('\n');
    current.lines = lines;

    if (current.added || current.removed) {
      /*istanbul ignore start*/
      var _curRange;

      /*istanbul ignore end*/
      // If we have previous context, start with that
      if (!oldRangeStart) {
        var prev = diff[i - 1];
        oldRangeStart = oldLine;
        newRangeStart = newLine;

        if (prev) {
          curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
          oldRangeStart -= curRange.length;
          newRangeStart -= curRange.length;
        }
      }

      // Output our changes
      /*istanbul ignore start*/(_curRange = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/lines.map(function (entry) {
        return (current.added ? '+' : '-') + entry;
      })));

      // Track the updated file position
      if (current.added) {
        newLine += lines.length;
      } else {
        oldLine += lines.length;
      }
    } else {
      // Identical context lines. Track line changes
      if (oldRangeStart) {
        // Close out any changes that have been output (or join overlapping)
        if (lines.length <= options.context * 2 && i < diff.length - 2) {
          /*istanbul ignore start*/
          var _curRange2;

          /*istanbul ignore end*/
          // Overlapping
          /*istanbul ignore start*/(_curRange2 = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange2 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/contextLines(lines)));
        } else {
          /*istanbul ignore start*/
          var _curRange3;

          /*istanbul ignore end*/
          // end the range and output
          var contextSize = Math.min(lines.length, options.context);
          /*istanbul ignore start*/(_curRange3 = /*istanbul ignore end*/curRange).push. /*istanbul ignore start*/apply /*istanbul ignore end*/( /*istanbul ignore start*/_curRange3 /*istanbul ignore end*/, /*istanbul ignore start*/_toConsumableArray( /*istanbul ignore end*/contextLines(lines.slice(0, contextSize))));

          var hunk = {
            oldStart: oldRangeStart,
            oldLines: oldLine - oldRangeStart + contextSize,
            newStart: newRangeStart,
            newLines: newLine - newRangeStart + contextSize,
            lines: curRange
          };
          if (i >= diff.length - 2 && lines.length <= options.context) {
            // EOF is inside this hunk
            var oldEOFNewline = /\n$/.test(oldStr);
            var newEOFNewline = /\n$/.test(newStr);
            if (lines.length == 0 && !oldEOFNewline) {
              // special case: old has no eol and no trailing context; no-nl can end up before adds
              curRange.splice(hunk.oldLines, 0, '\\ No newline at end of file');
            } else if (!oldEOFNewline || !newEOFNewline) {
              curRange.push('\\ No newline at end of file');
            }
          }
          hunks.push(hunk);

          oldRangeStart = 0;
          newRangeStart = 0;
          curRange = [];
        }
      }
      oldLine += lines.length;
      newLine += lines.length;
    }
  };

  for (var i = 0; i < diff.length; i++) {
    /*istanbul ignore start*/
    _loop( /*istanbul ignore end*/i);
  }

  return {
    oldFileName: oldFileName, newFileName: newFileName,
    oldHeader: oldHeader, newHeader: newHeader,
    hunks: hunks
  };
}

function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  var diff = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);

  var ret = [];
  if (oldFileName == newFileName) {
    ret.push('Index: ' + oldFileName);
  }
  ret.push('===================================================================');
  ret.push('--- ' + diff.oldFileName + (typeof diff.oldHeader === 'undefined' ? '' : '\t' + diff.oldHeader));
  ret.push('+++ ' + diff.newFileName + (typeof diff.newHeader === 'undefined' ? '' : '\t' + diff.newHeader));

  for (var i = 0; i < diff.hunks.length; i++) {
    var hunk = diff.hunks[i];
    ret.push('@@ -' + hunk.oldStart + ',' + hunk.oldLines + ' +' + hunk.newStart + ',' + hunk.newLines + ' @@');
    ret.push.apply(ret, hunk.lines);
  }

  return ret.join('\n') + '\n';
}

function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
  return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
}


},{"../diff/line":51}],57:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/parsePatch = parsePatch;
function parsePatch(uniDiff) {
  /*istanbul ignore start*/var /*istanbul ignore end*/options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/),
      delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [],
      list = [],
      i = 0;

  function parseIndex() {
    var index = {};
    list.push(index);

    // Parse diff metadata
    while (i < diffstr.length) {
      var line = diffstr[i];

      // File header found, end parsing diff metadata
      if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
        break;
      }

      // Diff index
      var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);
      if (header) {
        index.index = header[1];
      }

      i++;
    }

    // Parse file headers if they are defined. Unified diff requires them, but
    // there's no technical issues to have an isolated hunk without file header
    parseFileHeader(index);
    parseFileHeader(index);

    // Parse hunks
    index.hunks = [];

    while (i < diffstr.length) {
      var _line = diffstr[i];

      if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(_line)) {
        break;
      } else if (/^@@/.test(_line)) {
        index.hunks.push(parseHunk());
      } else if (_line && options.strict) {
        // Ignore unexpected content unless in strict mode
        throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(_line));
      } else {
        i++;
      }
    }
  }

  // Parses the --- and +++ headers, if none are found, no lines
  // are consumed.
  function parseFileHeader(index) {
    var headerPattern = /^(---|\+\+\+)\s+([\S ]*)(?:\t(.*?)\s*)?$/;
    var fileHeader = headerPattern.exec(diffstr[i]);
    if (fileHeader) {
      var keyPrefix = fileHeader[1] === '---' ? 'old' : 'new';
      index[keyPrefix + 'FileName'] = fileHeader[2];
      index[keyPrefix + 'Header'] = fileHeader[3];

      i++;
    }
  }

  // Parses a hunk
  // This assumes that we are at the start of a hunk.
  function parseHunk() {
    var chunkHeaderIndex = i,
        chunkHeaderLine = diffstr[i++],
        chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);

    var hunk = {
      oldStart: +chunkHeader[1],
      oldLines: +chunkHeader[2] || 1,
      newStart: +chunkHeader[3],
      newLines: +chunkHeader[4] || 1,
      lines: [],
      linedelimiters: []
    };

    var addCount = 0,
        removeCount = 0;
    for (; i < diffstr.length; i++) {
      // Lines starting with '---' could be mistaken for the "remove line" operation
      // But they could be the header for the next file. Therefore prune such cases out.
      if (diffstr[i].indexOf('--- ') === 0 && i + 2 < diffstr.length && diffstr[i + 1].indexOf('+++ ') === 0 && diffstr[i + 2].indexOf('@@') === 0) {
        break;
      }
      var operation = diffstr[i][0];

      if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
        hunk.lines.push(diffstr[i]);
        hunk.linedelimiters.push(delimiters[i] || '\n');

        if (operation === '+') {
          addCount++;
        } else if (operation === '-') {
          removeCount++;
        } else if (operation === ' ') {
          addCount++;
          removeCount++;
        }
      } else {
        break;
      }
    }

    // Handle the empty block count case
    if (!addCount && hunk.newLines === 1) {
      hunk.newLines = 0;
    }
    if (!removeCount && hunk.oldLines === 1) {
      hunk.oldLines = 0;
    }

    // Perform optional sanity checking
    if (options.strict) {
      if (addCount !== hunk.newLines) {
        throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }
      if (removeCount !== hunk.oldLines) {
        throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
      }
    }

    return hunk;
  }

  while (i < diffstr.length) {
    parseIndex();
  }

  return list;
}


},{}],58:[function(require,module,exports){
/*istanbul ignore start*/"use strict";

exports.__esModule = true;

exports["default"] = /*istanbul ignore end*/function (start, minLine, maxLine) {
  var wantForward = true,
      backwardExhausted = false,
      forwardExhausted = false,
      localOffset = 1;

  return function iterator() {
    if (wantForward && !forwardExhausted) {
      if (backwardExhausted) {
        localOffset++;
      } else {
        wantForward = false;
      }

      // Check if trying to fit beyond text length, and if not, check it fits
      // after offset location (or desired location on first iteration)
      if (start + localOffset <= maxLine) {
        return localOffset;
      }

      forwardExhausted = true;
    }

    if (!backwardExhausted) {
      if (!forwardExhausted) {
        wantForward = true;
      }

      // Check if trying to fit before text beginning, and if not, check it fits
      // before offset location
      if (minLine <= start - localOffset) {
        return -localOffset++;
      }

      backwardExhausted = true;
      return iterator();
    }

    // We tried to fit hunk before text beginning and beyond text lenght, then
    // hunk can't fit on the text. Return undefined
  };
};


},{}],59:[function(require,module,exports){
/*istanbul ignore start*/'use strict';

exports.__esModule = true;
exports. /*istanbul ignore end*/generateOptions = generateOptions;
function generateOptions(options, defaults) {
  if (typeof options === 'function') {
    defaults.callback = options;
  } else if (options) {
    for (var name in options) {
      /* istanbul ignore else */
      if (options.hasOwnProperty(name)) {
        defaults[name] = options[name];
      }
    }
  }
  return defaults;
}


},{}],60:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],61:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],62:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],63:[function(require,module,exports){
"use strict";

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

var isFunction = function (fn) {
	return (typeof fn === 'function' && !(fn instanceof RegExp)) || toString.call(fn) === '[object Function]';
};

module.exports = function forEach(obj, fn) {
	if (!isFunction(fn)) {
		throw new TypeError('iterator must be a function');
	}
	var i, k,
		isString = typeof obj === 'string',
		l = obj.length,
		context = arguments.length > 2 ? arguments[2] : null;
	if (l === +l) {
		for (i = 0; i < l; i++) {
			if (context === null) {
				fn(isString ? obj.charAt(i) : obj[i], i, obj);
			} else {
				fn.call(context, isString ? obj.charAt(i) : obj[i], i, obj);
			}
		}
	} else {
		for (k in obj) {
			if (hasOwn.call(obj, k)) {
				if (context === null) {
					fn(obj[k], k, obj);
				} else {
					fn.call(context, obj[k], k, obj);
				}
			}
		}
	}
};


},{}],64:[function(require,module,exports){
"use strict";

// modified from https://github.com/es-shims/es5-shim
var has = Object.prototype.hasOwnProperty,
	toString = Object.prototype.toString,
	forEach = require('./foreach'),
	isArgs = require('./isArguments'),
	hasDontEnumBug = !({'toString': null}).propertyIsEnumerable('toString'),
	hasProtoEnumBug = (function () {}).propertyIsEnumerable('prototype'),
	dontEnums = [
		"toString",
		"toLocaleString",
		"valueOf",
		"hasOwnProperty",
		"isPrototypeOf",
		"propertyIsEnumerable",
		"constructor"
	];

var keysShim = function keys(object) {
	var isObject = object !== null && typeof object === 'object',
		isFunction = toString.call(object) === '[object Function]',
		isArguments = isArgs(object),
		theKeys = [];

	if (!isObject && !isFunction && !isArguments) {
		throw new TypeError("Object.keys called on a non-object");
	}

	if (isArguments) {
		forEach(object, function (value, index) {
			theKeys.push(index);
		});
	} else {
		var name,
			skipProto = hasProtoEnumBug && isFunction;

		for (name in object) {
			if (!(skipProto && name === 'prototype') && has.call(object, name)) {
				theKeys.push(name);
			}
		}
	}

	if (hasDontEnumBug) {
		var ctor = object.constructor,
			skipConstructor = ctor && ctor.prototype === object;

		forEach(dontEnums, function (dontEnum) {
			if (!(skipConstructor && dontEnum === 'constructor') && has.call(object, dontEnum)) {
				theKeys.push(dontEnum);
			}
		});
	}
	return theKeys;
};

keysShim.shim = function shimObjectKeys() {
	if (!Object.keys) {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

module.exports = keysShim;


},{"./foreach":63,"./isArguments":65}],65:[function(require,module,exports){
"use strict";

var toString = Object.prototype.toString;

module.exports = function isArguments(value) {
	var str = toString.call(value);
	var isArguments = str === '[object Arguments]';
	if (!isArguments) {
		isArguments = str !== '[object Array]'
			&& value !== null
			&& typeof value === 'object'
			&& typeof value.length === 'number'
			&& value.length >= 0
			&& toString.call(value.callee) === '[object Function]';
	}
	return isArguments;
};


},{}],66:[function(require,module,exports){

/**
 * Module dependencies.
 */

var map = require('array-map');
var indexOf = require('indexof');
var isArray = require('isarray');
var forEach = require('foreach');
var reduce = require('array-reduce');
var getObjectKeys = require('object-keys');
var JSON = require('json3');

/**
 * Make sure `Object.keys` work for `undefined`
 * values that are still there, like `document.all`.
 * http://lists.w3.org/Archives/Public/public-html/2009Jun/0546.html
 *
 * @api private
 */

function objectKeys(val){
  if (Object.keys) return Object.keys(val);
  return getObjectKeys(val);
}

/**
 * Module exports.
 */

module.exports = inspect;

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 * @license MIT (© Joyent)
 */
/* legacy: obj, showHidden, depth, colors*/

function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    _extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};

function stylizeNoColor(str, styleType) {
  return str;
}

function isBoolean(arg) {
  return typeof arg === 'boolean';
}

function isUndefined(arg) {
  return arg === void 0;
}

function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}

function isFunction(arg) {
  return typeof arg === 'function';
}

function isString(arg) {
  return typeof arg === 'string';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isNull(arg) {
  return arg === null;
}

function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

function arrayToHash(array) {
  var hash = {};

  forEach(array, function(val, idx) {
    hash[val] = true;
  });

  return hash;
}

function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwn(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  forEach(keys, function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}

function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = objectKeys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden && Object.getOwnPropertyNames) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (indexOf(keys, 'message') >= 0 || indexOf(keys, 'description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = map(keys, function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}

function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = { value: value[key] };
  if (Object.getOwnPropertyDescriptor) {
    desc = Object.getOwnPropertyDescriptor(value, key) || desc;
  }
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwn(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (indexOf(ctx.seen, desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = map(str.split('\n'), function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + map(str.split('\n'), function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}

function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}

function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = reduce(output, function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

function _extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = objectKeys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}

},{"array-map":29,"array-reduce":30,"foreach":60,"indexof":61,"isarray":62,"json3":67,"object-keys":64}],67:[function(require,module,exports){
(function (global){
/*! JSON v3.3.0 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
;(function (root) {
  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd;

  // Use the `global` object exposed by Node (including Browserify via
  // `insert-module-globals`), Narwhal, and Ringo as the default context.
  // Rhino exports a `global` function instead.
  var freeGlobal = typeof global == "object" && global;
  if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal)) {
    root = freeGlobal;
  }

  // Public: Initializes JSON 3 using the given `context` object, attaching the
  // `stringify` and `parse` functions to the specified `exports` object.
  function runInContext(context, exports) {
    context || (context = root["Object"]());
    exports || (exports = root["Object"]());

    // Native constructor aliases.
    var Number = context["Number"] || root["Number"],
        String = context["String"] || root["String"],
        Object = context["Object"] || root["Object"],
        Date = context["Date"] || root["Date"],
        SyntaxError = context["SyntaxError"] || root["SyntaxError"],
        TypeError = context["TypeError"] || root["TypeError"],
        Math = context["Math"] || root["Math"],
        nativeJSON = context["JSON"] || root["JSON"];

    // Delegate to the native `stringify` and `parse` implementations.
    if (typeof nativeJSON == "object" && nativeJSON) {
      exports.stringify = nativeJSON.stringify;
      exports.parse = nativeJSON.parse;
    }

    // Convenience aliases.
    var objectProto = Object.prototype,
        getClass = objectProto.toString,
        isProperty, forEach, undef;

    // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
    var isExtended = new Date(-3509827334573292);
    try {
      // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
      // results for certain dates in Opera >= 10.53.
      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
        // Safari < 2.0.2 stores the internal millisecond time value correctly,
        // but clips the values returned by the date methods to the range of
        // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
    } catch (exception) {}

    // Internal: Determines whether the native `JSON.stringify` and `parse`
    // implementations are spec-compliant. Based on work by Ken Snyder.
    function has(name) {
      if (has[name] !== undef) {
        // Return cached feature test result.
        return has[name];
      }
      var isSupported;
      if (name == "bug-string-char-index") {
        // IE <= 7 doesn't support accessing string characters using square
        // bracket notation. IE 8 only supports this for primitives.
        isSupported = "a"[0] != "a";
      } else if (name == "json") {
        // Indicates whether both `JSON.stringify` and `JSON.parse` are
        // supported.
        isSupported = has("json-stringify") && has("json-parse");
      } else {
        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
        // Test `JSON.stringify`.
        if (name == "json-stringify") {
          var stringify = exports.stringify, stringifySupported = typeof stringify == "function" && isExtended;
          if (stringifySupported) {
            // A test function object with a custom `toJSON` method.
            (value = function () {
              return 1;
            }).toJSON = value;
            try {
              stringifySupported =
                // Firefox 3.1b1 and b2 serialize string, number, and boolean
                // primitives as object literals.
                stringify(0) === "0" &&
                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
                // literals.
                stringify(new Number()) === "0" &&
                stringify(new String()) == '""' &&
                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
                // does not define a canonical JSON representation (this applies to
                // objects with `toJSON` properties as well, *unless* they are nested
                // within an object or array).
                stringify(getClass) === undef &&
                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
                // FF 3.1b3 pass this test.
                stringify(undef) === undef &&
                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
                // respectively, if the value is omitted entirely.
                stringify() === undef &&
                // FF 3.1b1, 2 throw an error if the given value is not a number,
                // string, array, object, Boolean, or `null` literal. This applies to
                // objects with custom `toJSON` methods as well, unless they are nested
                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
                // methods entirely.
                stringify(value) === "1" &&
                stringify([value]) == "[1]" &&
                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
                // `"[null]"`.
                stringify([undef]) == "[null]" &&
                // YUI 3.0.0b1 fails to serialize `null` literals.
                stringify(null) == "null" &&
                // FF 3.1b1, 2 halts serialization if an array contains a function:
                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
                // elides non-JSON values from objects and arrays, unless they
                // define custom `toJSON` methods.
                stringify([undef, getClass, null]) == "[null,null,null]" &&
                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
                // where character escape codes are expected (e.g., `\b` => `\u0008`).
                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
                stringify(null, value) === "1" &&
                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
                // serialize extended years.
                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
                // The milliseconds are optional in ES 5, but required in 5.1.
                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
                // four-digit years instead of six-digit years. Credits: @Yaffle.
                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
                // values less than 1000. Credits: @Yaffle.
                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
            } catch (exception) {
              stringifySupported = false;
            }
          }
          isSupported = stringifySupported;
        }
        // Test `JSON.parse`.
        if (name == "json-parse") {
          var parse = exports.parse;
          if (typeof parse == "function") {
            try {
              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
              // Conforming implementations should also coerce the initial argument to
              // a string prior to parsing.
              if (parse("0") === 0 && !parse(false)) {
                // Simple parsing test.
                value = parse(serialized);
                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
                if (parseSupported) {
                  try {
                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                    parseSupported = !parse('"\t"');
                  } catch (exception) {}
                  if (parseSupported) {
                    try {
                      // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                      // certain octal literals.
                      parseSupported = parse("01") !== 1;
                    } catch (exception) {}
                  }
                  if (parseSupported) {
                    try {
                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                      // points. These environments, along with FF 3.1b1 and 2,
                      // also allow trailing commas in JSON objects and arrays.
                      parseSupported = parse("1.") !== 1;
                    } catch (exception) {}
                  }
                }
              }
            } catch (exception) {
              parseSupported = false;
            }
          }
          isSupported = parseSupported;
        }
      }
      return has[name] = !!isSupported;
    }

    if (!has("json")) {
      // Common `[[Class]]` name aliases.
      var functionClass = "[object Function]",
          dateClass = "[object Date]",
          numberClass = "[object Number]",
          stringClass = "[object String]",
          arrayClass = "[object Array]",
          booleanClass = "[object Boolean]";

      // Detect incomplete support for accessing string characters by index.
      var charIndexBuggy = has("bug-string-char-index");

      // Define additional utility methods if the `Date` methods are buggy.
      if (!isExtended) {
        var floor = Math.floor;
        // A mapping between the months of the year and the number of days between
        // January 1st and the first of the respective month.
        var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        // Internal: Calculates the number of days between the Unix epoch and the
        // first day of the given month.
        var getDay = function (year, month) {
          return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
        };
      }

      // Internal: Determines if a property is a direct property of the given
      // object. Delegates to the native `Object#hasOwnProperty` method.
      if (!(isProperty = objectProto.hasOwnProperty)) {
        isProperty = function (property) {
          var members = {}, constructor;
          if ((members.__proto__ = null, members.__proto__ = {
            // The *proto* property cannot be set multiple times in recent
            // versions of Firefox and SeaMonkey.
            "toString": 1
          }, members).toString != getClass) {
            // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
            // supports the mutable *proto* property.
            isProperty = function (property) {
              // Capture and break the objectgs prototype chain (see section 8.6.2
              // of the ES 5.1 spec). The parenthesized expression prevents an
              // unsafe transformation by the Closure Compiler.
              var original = this.__proto__, result = property in (this.__proto__ = null, this);
              // Restore the original prototype chain.
              this.__proto__ = original;
              return result;
            };
          } else {
            // Capture a reference to the top-level `Object` constructor.
            constructor = members.constructor;
            // Use the `constructor` property to simulate `Object#hasOwnProperty` in
            // other environments.
            isProperty = function (property) {
              var parent = (this.constructor || constructor).prototype;
              return property in this && !(property in parent && this[property] === parent[property]);
            };
          }
          members = null;
          return isProperty.call(this, property);
        };
      }

      // Internal: A set of primitive types used by `isHostType`.
      var PrimitiveTypes = {
        "boolean": 1,
        "number": 1,
        "string": 1,
        "undefined": 1
      };

      // Internal: Determines if the given object `property` value is a
      // non-primitive.
      var isHostType = function (object, property) {
        var type = typeof object[property];
        return type == "object" ? !!object[property] : !PrimitiveTypes[type];
      };

      // Internal: Normalizes the `for...in` iteration algorithm across
      // environments. Each enumerated key is yielded to a `callback` function.
      forEach = function (object, callback) {
        var size = 0, Properties, members, property;

        // Tests for bugs in the current environment's `for...in` algorithm. The
        // `valueOf` property inherits the non-enumerable flag from
        // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
        (Properties = function () {
          this.valueOf = 0;
        }).prototype.valueOf = 0;

        // Iterate over a new instance of the `Properties` class.
        members = new Properties();
        for (property in members) {
          // Ignore all properties inherited from `Object.prototype`.
          if (isProperty.call(members, property)) {
            size++;
          }
        }
        Properties = members = null;

        // Normalize the iteration algorithm.
        if (!size) {
          // A list of non-enumerable properties inherited from `Object.prototype`.
          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
          // properties.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, length;
            var hasProperty = !isFunction && typeof object.constructor != "function" && isHostType(object, "hasOwnProperty") ? object.hasOwnProperty : isProperty;
            for (property in object) {
              // Gecko <= 1.0 enumerates the `prototype` property of functions under
              // certain conditions; IE does not.
              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
                callback(property);
              }
            }
            // Manually invoke the callback for each non-enumerable property.
            for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
          };
        } else if (size == 2) {
          // Safari <= 2.0.4 enumerates shadowed properties twice.
          forEach = function (object, callback) {
            // Create a set of iterated properties.
            var members = {}, isFunction = getClass.call(object) == functionClass, property;
            for (property in object) {
              // Store each property name to prevent double enumeration. The
              // `prototype` property of functions is not enumerated due to cross-
              // environment inconsistencies.
              if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
                callback(property);
              }
            }
          };
        } else {
          // No bugs detected; use the standard `for...in` algorithm.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
            for (property in object) {
              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
                callback(property);
              }
            }
            // Manually invoke the callback for the `constructor` property due to
            // cross-environment inconsistencies.
            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
              callback(property);
            }
          };
        }
        return forEach(object, callback);
      };

      // Public: Serializes a JavaScript `value` as a JSON string. The optional
      // `filter` argument may specify either a function that alters how object and
      // array members are serialized, or an array of strings and numbers that
      // indicates which properties should be serialized. The optional `width`
      // argument may be either a string or number that specifies the indentation
      // level of the output.
      if (!has("json-stringify")) {
        // Internal: A map of control characters and their escaped equivalents.
        var Escapes = {
          92: "\\\\",
          34: '\\"',
          8: "\\b",
          12: "\\f",
          10: "\\n",
          13: "\\r",
          9: "\\t"
        };

        // Internal: Converts `value` into a zero-padded string such that its
        // length is at least equal to `width`. The `width` must be <= 6.
        var leadingZeroes = "000000";
        var toPaddedString = function (width, value) {
          // The `|| 0` expression is necessary to work around a bug in
          // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
          return (leadingZeroes + (value || 0)).slice(-width);
        };

        // Internal: Double-quotes a string `value`, replacing all ASCII control
        // characters (characters with code unit values between 0 and 31) with
        // their escaped equivalents. This is an implementation of the
        // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
        var unicodePrefix = "\\u00";
        var quote = function (value) {
          var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
          var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
          for (; index < length; index++) {
            var charCode = value.charCodeAt(index);
            // If the character is a control character, append its Unicode or
            // shorthand escape sequence; otherwise, append the character as-is.
            switch (charCode) {
              case 8: case 9: case 10: case 12: case 13: case 34: case 92:
                result += Escapes[charCode];
                break;
              default:
                if (charCode < 32) {
                  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                  break;
                }
                result += useCharIndex ? symbols[index] : value.charAt(index);
            }
          }
          return result + '"';
        };

        // Internal: Recursively serializes an object. Implements the
        // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
        var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
          var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
          try {
            // Necessary for host object support.
            value = object[property];
          } catch (exception) {}
          if (typeof value == "object" && value) {
            className = getClass.call(value);
            if (className == dateClass && !isProperty.call(value, "toJSON")) {
              if (value > -1 / 0 && value < 1 / 0) {
                // Dates are serialized according to the `Date#toJSON` method
                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
                // for the ISO 8601 date time string format.
                if (getDay) {
                  // Manually compute the year, month, date, hours, minutes,
                  // seconds, and milliseconds if the `getUTC*` methods are
                  // buggy. Adapted from @Yaffle's `date-shim` project.
                  date = floor(value / 864e5);
                  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                  date = 1 + date - getDay(year, month);
                  // The `time` value specifies the time within the day (see ES
                  // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                  // to compute `A modulo B`, as the `%` operator does not
                  // correspond to the `modulo` operation for negative numbers.
                  time = (value % 864e5 + 864e5) % 864e5;
                  // The hours, minutes, seconds, and milliseconds are obtained by
                  // decomposing the time within the day. See section 15.9.1.10.
                  hours = floor(time / 36e5) % 24;
                  minutes = floor(time / 6e4) % 60;
                  seconds = floor(time / 1e3) % 60;
                  milliseconds = time % 1e3;
                } else {
                  year = value.getUTCFullYear();
                  month = value.getUTCMonth();
                  date = value.getUTCDate();
                  hours = value.getUTCHours();
                  minutes = value.getUTCMinutes();
                  seconds = value.getUTCSeconds();
                  milliseconds = value.getUTCMilliseconds();
                }
                // Serialize extended years correctly.
                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                  // Months, dates, hours, minutes, and seconds should have two
                  // digits; milliseconds should have three.
                  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                  // Milliseconds are optional in ES 5.0, but required in 5.1.
                  "." + toPaddedString(3, milliseconds) + "Z";
              } else {
                value = null;
              }
            } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
              // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
              // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
              // ignores all `toJSON` methods on these objects unless they are
              // defined directly on an instance.
              value = value.toJSON(property);
            }
          }
          if (callback) {
            // If a replacement function was provided, call it to obtain the value
            // for serialization.
            value = callback.call(object, property, value);
          }
          if (value === null) {
            return "null";
          }
          className = getClass.call(value);
          if (className == booleanClass) {
            // Booleans are represented literally.
            return "" + value;
          } else if (className == numberClass) {
            // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
            // `"null"`.
            return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
          } else if (className == stringClass) {
            // Strings are double-quoted and escaped.
            return quote("" + value);
          }
          // Recursively serialize objects and arrays.
          if (typeof value == "object") {
            // Check for cyclic structures. This is a linear search; performance
            // is inversely proportional to the number of unique nested objects.
            for (length = stack.length; length--;) {
              if (stack[length] === value) {
                // Cyclic structures cannot be serialized by `JSON.stringify`.
                throw TypeError();
              }
            }
            // Add the object to the stack of traversed objects.
            stack.push(value);
            results = [];
            // Save the current indentation level and indent one additional level.
            prefix = indentation;
            indentation += whitespace;
            if (className == arrayClass) {
              // Recursively serialize array elements.
              for (index = 0, length = value.length; index < length; index++) {
                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
                results.push(element === undef ? "null" : element);
              }
              result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
            } else {
              // Recursively serialize object members. Members are selected from
              // either a user-specified list of property names, or the object
              // itself.
              forEach(properties || value, function (property) {
                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
                if (element !== undef) {
                  // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                  // is not the empty string, let `member` {quote(property) + ":"}
                  // be the concatenation of `member` and the `space` character."
                  // The "`space` character" refers to the literal space
                  // character, not the `space` {width} argument provided to
                  // `JSON.stringify`.
                  results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
                }
              });
              result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
            }
            // Remove the object from the traversed object stack.
            stack.pop();
            return result;
          }
        };

        // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
        exports.stringify = function (source, filter, width) {
          var whitespace, callback, properties, className;
          if (typeof filter == "function" || typeof filter == "object" && filter) {
            if ((className = getClass.call(filter)) == functionClass) {
              callback = filter;
            } else if (className == arrayClass) {
              // Convert the property names array into a makeshift set.
              properties = {};
              for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
            }
          }
          if (width) {
            if ((className = getClass.call(width)) == numberClass) {
              // Convert the `width` to an integer and create a string containing
              // `width` number of space characters.
              if ((width -= width % 1) > 0) {
                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
              }
            } else if (className == stringClass) {
              whitespace = width.length <= 10 ? width : width.slice(0, 10);
            }
          }
          // Opera <= 7.54u2 discards the values associated with empty string keys
          // (`""`) only if they are used directly within an object member list
          // (e.g., `!("" in { "": 1})`).
          return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
        };
      }

      // Public: Parses a JSON source string.
      if (!has("json-parse")) {
        var fromCharCode = String.fromCharCode;

        // Internal: A map of escaped control characters and their unescaped
        // equivalents.
        var Unescapes = {
          92: "\\",
          34: '"',
          47: "/",
          98: "\b",
          116: "\t",
          110: "\n",
          102: "\f",
          114: "\r"
        };

        // Internal: Stores the parser state.
        var Index, Source;

        // Internal: Resets the parser state and throws a `SyntaxError`.
        var abort = function () {
          Index = Source = null;
          throw SyntaxError();
        };

        // Internal: Returns the next token, or `"$"` if the parser has reached
        // the end of the source string. A token may be a string, number, `null`
        // literal, or Boolean literal.
        var lex = function () {
          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
          while (Index < length) {
            charCode = source.charCodeAt(Index);
            switch (charCode) {
              case 9: case 10: case 13: case 32:
                // Skip whitespace tokens, including tabs, carriage returns, line
                // feeds, and space characters.
                Index++;
                break;
              case 123: case 125: case 91: case 93: case 58: case 44:
                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
                // the current position.
                value = charIndexBuggy ? source.charAt(Index) : source[Index];
                Index++;
                return value;
              case 34:
                // `"` delimits a JSON string; advance to the next character and
                // begin parsing the string. String tokens are prefixed with the
                // sentinel `@` character to distinguish them from punctuators and
                // end-of-string tokens.
                for (value = "@", Index++; Index < length;) {
                  charCode = source.charCodeAt(Index);
                  if (charCode < 32) {
                    // Unescaped ASCII control characters (those with a code unit
                    // less than the space character) are not permitted.
                    abort();
                  } else if (charCode == 92) {
                    // A reverse solidus (`\`) marks the beginning of an escaped
                    // control character (including `"`, `\`, and `/`) or Unicode
                    // escape sequence.
                    charCode = source.charCodeAt(++Index);
                    switch (charCode) {
                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                        // Revive escaped control characters.
                        value += Unescapes[charCode];
                        Index++;
                        break;
                      case 117:
                        // `\u` marks the beginning of a Unicode escape sequence.
                        // Advance to the first character and validate the
                        // four-digit code point.
                        begin = ++Index;
                        for (position = Index + 4; Index < position; Index++) {
                          charCode = source.charCodeAt(Index);
                          // A valid sequence comprises four hexdigits (case-
                          // insensitive) that form a single hexadecimal value.
                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                            // Invalid Unicode escape sequence.
                            abort();
                          }
                        }
                        // Revive the escaped character.
                        value += fromCharCode("0x" + source.slice(begin, Index));
                        break;
                      default:
                        // Invalid escape sequence.
                        abort();
                    }
                  } else {
                    if (charCode == 34) {
                      // An unescaped double-quote character marks the end of the
                      // string.
                      break;
                    }
                    charCode = source.charCodeAt(Index);
                    begin = Index;
                    // Optimize for the common case where a string is valid.
                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
                      charCode = source.charCodeAt(++Index);
                    }
                    // Append the string as-is.
                    value += source.slice(begin, Index);
                  }
                }
                if (source.charCodeAt(Index) == 34) {
                  // Advance to the next character and return the revived string.
                  Index++;
                  return value;
                }
                // Unterminated string.
                abort();
              default:
                // Parse numbers and literals.
                begin = Index;
                // Advance past the negative sign, if one is specified.
                if (charCode == 45) {
                  isSigned = true;
                  charCode = source.charCodeAt(++Index);
                }
                // Parse an integer or floating-point value.
                if (charCode >= 48 && charCode <= 57) {
                  // Leading zeroes are interpreted as octal literals.
                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                    // Illegal octal literal.
                    abort();
                  }
                  isSigned = false;
                  // Parse the integer component.
                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                  // Floats cannot contain a leading decimal point; however, this
                  // case is already accounted for by the parser.
                  if (source.charCodeAt(Index) == 46) {
                    position = ++Index;
                    // Parse the decimal component.
                    for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal trailing decimal.
                      abort();
                    }
                    Index = position;
                  }
                  // Parse exponents. The `e` denoting the exponent is
                  // case-insensitive.
                  charCode = source.charCodeAt(Index);
                  if (charCode == 101 || charCode == 69) {
                    charCode = source.charCodeAt(++Index);
                    // Skip past the sign following the exponent, if one is
                    // specified.
                    if (charCode == 43 || charCode == 45) {
                      Index++;
                    }
                    // Parse the exponential component.
                    for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal empty exponent.
                      abort();
                    }
                    Index = position;
                  }
                  // Coerce the parsed value to a JavaScript number.
                  return +source.slice(begin, Index);
                }
                // A negative sign may only precede numbers.
                if (isSigned) {
                  abort();
                }
                // `true`, `false`, and `null` literals.
                if (source.slice(Index, Index + 4) == "true") {
                  Index += 4;
                  return true;
                } else if (source.slice(Index, Index + 5) == "false") {
                  Index += 5;
                  return false;
                } else if (source.slice(Index, Index + 4) == "null") {
                  Index += 4;
                  return null;
                }
                // Unrecognized token.
                abort();
            }
          }
          // Return the sentinel `$` character if the parser has reached the end
          // of the source string.
          return "$";
        };

        // Internal: Parses a JSON `value` token.
        var get = function (value) {
          var results, hasMembers;
          if (value == "$") {
            // Unexpected end of input.
            abort();
          }
          if (typeof value == "string") {
            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
              // Remove the sentinel `@` character.
              return value.slice(1);
            }
            // Parse object and array literals.
            if (value == "[") {
              // Parses a JSON array, returning a new JavaScript array.
              results = [];
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing square bracket marks the end of the array literal.
                if (value == "]") {
                  break;
                }
                // If the array literal contains elements, the current token
                // should be a comma separating the previous element from the
                // next.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "]") {
                      // Unexpected trailing `,` in array literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each array element.
                    abort();
                  }
                }
                // Elisions and leading commas are not permitted.
                if (value == ",") {
                  abort();
                }
                results.push(get(value));
              }
              return results;
            } else if (value == "{") {
              // Parses a JSON object, returning a new JavaScript object.
              results = {};
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing curly brace marks the end of the object literal.
                if (value == "}") {
                  break;
                }
                // If the object literal contains members, the current token
                // should be a comma separator.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "}") {
                      // Unexpected trailing `,` in object literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each object member.
                    abort();
                  }
                }
                // Leading commas are not permitted, object property names must be
                // double-quoted strings, and a `:` must separate each property
                // name and value.
                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                  abort();
                }
                results[value.slice(1)] = get(lex());
              }
              return results;
            }
            // Unexpected token encountered.
            abort();
          }
          return value;
        };

        // Internal: Updates a traversed object member.
        var update = function (source, property, callback) {
          var element = walk(source, property, callback);
          if (element === undef) {
            delete source[property];
          } else {
            source[property] = element;
          }
        };

        // Internal: Recursively traverses a parsed JSON object, invoking the
        // `callback` function for each value. This is an implementation of the
        // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
        var walk = function (source, property, callback) {
          var value = source[property], length;
          if (typeof value == "object" && value) {
            // `forEach` can't be used to traverse an array in Opera <= 8.54
            // because its `Object#hasOwnProperty` implementation returns `false`
            // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
            if (getClass.call(value) == arrayClass) {
              for (length = value.length; length--;) {
                update(value, length, callback);
              }
            } else {
              forEach(value, function (property) {
                update(value, property, callback);
              });
            }
          }
          return callback.call(source, property, value);
        };

        // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
        exports.parse = function (source, callback) {
          var result, value;
          Index = 0;
          Source = "" + source;
          result = get(lex());
          // If a JSON string contains multiple tokens, it is invalid.
          if (lex() != "$") {
            abort();
          }
          // Reset the parser state.
          Index = Source = null;
          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
        };
      }
    }

    exports["runInContext"] = runInContext;
    return exports;
  }

  if (typeof exports == "object" && exports && !exports.nodeType && !isLoader) {
    // Export for CommonJS environments.
    runInContext(root, exports);
  } else {
    // Export for web browsers and JavaScript engines.
    var nativeJSON = root.JSON;
    var JSON3 = runInContext(root, (root["JSON3"] = {
      // Public: Restores the original value of the global `JSON` object and
      // returns a reference to the `JSON3` object.
      "noConflict": function () {
        root.JSON = nativeJSON;
        return JSON3;
      }
    }));

    root.JSON = {
      "parse": JSON3.parse,
      "stringify": JSON3.stringify
    };
  }

  // Export for asynchronous module loaders.
  if (isLoader) {
    define(function () {
      return JSON3;
    });
  }
}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],68:[function(require,module,exports){
"use strict"

// This is a reporter that mimics Mocha's `dot` reporter

var R = require("../lib/reporter")

function width() {
    return R.Console.windowWidth * 4 / 3 | 0
}

function printDot(_, color) {
    function emit() {
        return _.write(R.color(color, color === "fail"
                ? R.Console.symbols.DotFail
                : R.Console.symbols.Dot))
    }

    if (_.state.counter++ % width() === 0) {
        return _.write(R.Console.newline + "  ").then(emit)
    } else {
        return emit()
    }
}

module.exports = R.on("dot", {
    accepts: ["write", "reset", "colors"],
    create: R.consoleReporter,
    before: R.setColor,
    after: R.unsetColor,
    init: function (state) { state.counter = 0 },

    report: function (_, report) {
        if (report.isEnter || report.isPass) {
            return printDot(_, R.speed(report))
        } else if (report.isHook || report.isFail) {
            _.pushError(report)
            // Print a dot regardless of hook success
            return printDot(_, "fail")
        } else if (report.isSkip) {
            return printDot(_, "skip")
        } else if (report.isEnd) {
            return _.print().then(_.printResults.bind(_))
        } else if (report.isError) {
            if (_.state.counter) {
                return _.print().then(_.printError.bind(_, report))
            } else {
                return _.printError(report)
            }
        } else {
            return undefined
        }
    },
})

},{"../lib/reporter":20}],69:[function(require,module,exports){
"use strict"

exports.dot = require("./dot")
exports.spec = require("./spec")
exports.tap = require("./tap")

},{"./dot":68,"./spec":70,"./tap":71}],70:[function(require,module,exports){
"use strict"

// This is a reporter that mimics Mocha's `spec` reporter.

var R = require("../lib/reporter")

function indent(level) {
    var ret = ""

    while (level--) ret += "  "
    return ret
}

function getName(level, report) {
    return report.path[level - 1].name
}

function printReport(_, report, init) {
    if (_.state.leaving) {
        _.state.leaving = false
        return _.print().then(function () {
            return _.print(indent(_.state.level) + init())
        })
    } else {
        return _.print(indent(_.state.level) + init())
    }
}

module.exports = R.on("spec", {
    accepts: ["write", "reset", "colors"],
    create: R.consoleReporter,
    before: R.setColor,
    after: R.unsetColor,

    init: function (state) {
        state.level = 1
        state.leaving = false
    },

    report: function (_, report) {
        if (report.isStart) {
            return _.print()
        } else if (report.isEnter) {
            var level = _.state.level++
            var last = report.path[level - 1]

            _.state.leaving = false
            if (last.index) {
                return _.print().then(function () {
                    return _.print(indent(level) + last.name)
                })
            } else {
                return _.print(indent(level) + last.name)
            }
        } else if (report.isLeave) {
            _.state.level--
            _.state.leaving = true
            return undefined
        } else if (report.isPass) {
            return printReport(_, report, function () {
                var str =
                    R.color("checkmark", R.Console.symbols.Pass + " ") +
                    R.color("pass", getName(_.state.level, report))

                var speed = R.speed(report)

                if (speed !== "fast") {
                    str += R.color(speed, " (" + report.duration + "ms)")
                }

                return str
            })
        } else if (report.isHook || report.isFail) {
            _.pushError(report)

            // Don't print the description line on cumulative hooks
            if (report.isHook && (report.isBeforeAll || report.isAfterAll)) {
                return undefined
            }

            return printReport(_, report, function () {
                return R.color("fail",
                    _.errors.length + ") " + getName(_.state.level, report) +
                    R.formatRest(report))
            })
        } else if (report.isSkip) {
            return printReport(_, report, function () {
                return R.color("skip", "- " + getName(_.state.level, report))
            })
        }

        if (report.isEnd) return _.printResults()
        if (report.isError) return _.printError(report)
        return undefined
    },
})

},{"../lib/reporter":20}],71:[function(require,module,exports){
"use strict"

// This is a basic TAP-generating reporter.

var peach = require("../lib/util").peach
var R = require("../lib/reporter")
var inspect = require("clean-assert-util").inspect

function shouldBreak(minLength, str) {
    return str.length > R.Console.windowWidth - minLength ||
        /\r?\n|[:?-]/.test(str)
}

function template(_, report, tmpl, skip) {
    if (!skip) _.state.counter++
    var path = R.joinPath(report).replace(/\$/g, "$$$$")

    return _.print(
        tmpl.replace(/%c/g, _.state.counter)
            .replace(/%p/g, path + R.formatRest(report)))
}

function printLines(_, value, skipFirst) {
    var lines = value.split(/\r?\n/g)

    if (skipFirst) lines.shift()
    return peach(lines, function (line) { return _.print("    " + line) })
}

function printRaw(_, key, str) {
    if (shouldBreak(key.length, str)) {
        return _.print("  " + key + ": |-")
        .then(function () { return printLines(_, str, false) })
    } else {
        return _.print("  " + key + ": " + str)
    }
}

function printValue(_, key, value) {
    return printRaw(_, key, inspect(value))
}

function printLine(p, _, line) {
    return p.then(function () { return _.print(line) })
}

function printError(_, report) {
    var err = report.error

    if (!(err instanceof Error)) {
        return printValue(_, "value", err)
    }

    // Let's *not* depend on the constructor being Thallium's...
    if (err.name !== "AssertionError") {
        return _.print("  stack: |-").then(function () {
            return printLines(_, R.getStack(err), false)
        })
    }

    return printValue(_, "expected", err.expected)
    .then(function () { return printValue(_, "actual", err.actual) })
    .then(function () { return printRaw(_, "message", err.message) })
    .then(function () { return _.print("  stack: |-") })
    .then(function () {
        var message = err.message

        err.message = ""
        return printLines(_, R.getStack(err), true)
        .then(function () { err.message = message })
    })
}

module.exports = R.on("tap", {
    accepts: ["write", "reset"],
    create: R.consoleReporter,
    init: function (state) { state.counter = 0 },

    report: function (_, report) {
        if (report.isStart) {
            return _.print("TAP version 13")
        } else if (report.isEnter) {
            // Print a leading comment, to make some TAP formatters prettier.
            return template(_, report, "# %p", true)
            .then(function () { return template(_, report, "ok %c") })
        } else if (report.isPass) {
            return template(_, report, "ok %c %p")
        } else if (report.isFail || report.isHook) {
            return template(_, report, "not ok %c %p")
            .then(function () { return _.print("  ---") })
            .then(function () { return printError(_, report) })
            .then(function () { return _.print("  ...") })
        } else if (report.isSkip) {
            return template(_, report, "ok %c # skip %p")
        } else if (report.isEnd) {
            var p = _.print("1.." + _.state.counter)
            .then(function () { return _.print("# tests " + _.tests) })

            if (_.pass) p = printLine(p, _, "# pass " + _.pass)
            if (_.fail) p = printLine(p, _, "# fail " + _.fail)
            if (_.skip) p = printLine(p, _, "# skip " + _.skip)
            return printLine(p, _, "# duration " + R.formatTime(_.duration))
        } else if (report.isError) {
            return _.print("Bail out!")
            .then(function () { return _.print("  ---") })
            .then(function () { return printError(_, report) })
            .then(function () { return _.print("  ...") })
        } else {
            return undefined
        }
    },
})

},{"../lib/reporter":20,"../lib/util":24,"clean-assert-util":32}]},{},[25])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3NlcnQuanMiLCJkb20uanMiLCJpbmRleC5qcyIsImludGVybmFsLmpzIiwibGliL2FwaS9jb21tb24uanMiLCJsaWIvYXBpL3JlZmxlY3QuanMiLCJsaWIvYXBpL3RoYWxsaXVtLmpzIiwibGliL2Jyb3dzZXItYnVuZGxlLmpzIiwibGliL2NvcmUvZmlsdGVyLmpzIiwibGliL2NvcmUvcmVwb3J0cy5qcyIsImxpYi9jb3JlL3Rlc3RzLmpzIiwibGliL2RvbS9pbmRleC5qcyIsImxpYi9kb20vaW5qZWN0LXN0eWxlcy5qcyIsImxpYi9kb20vaW5qZWN0LmpzIiwibGliL2RvbS9ydW4tdGVzdHMuanMiLCJsaWIvZG9tL3ZpZXcuanMiLCJsaWIvbWV0aG9kcy5qcyIsImxpYi9yZXBsYWNlZC9jb25zb2xlLWJyb3dzZXIuanMiLCJsaWIvcmVwb3J0ZXIvY29uc29sZS1yZXBvcnRlci5qcyIsImxpYi9yZXBvcnRlci9pbmRleC5qcyIsImxpYi9yZXBvcnRlci9vbi5qcyIsImxpYi9yZXBvcnRlci9yZXBvcnRlci5qcyIsImxpYi9yZXBvcnRlci91dGlsLmpzIiwibGliL3V0aWwuanMiLCJtaWdyYXRlL2J1bmRsZS5qcyIsIm1pZ3JhdGUvY29tbW9uLmpzIiwibWlncmF0ZS9pbmRleC5qcyIsIm1pZ3JhdGUvc3VwcG9ydC5qcyIsIm5vZGVfbW9kdWxlcy9hcnJheS1tYXAvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYXJyYXktcmVkdWNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC11dGlsL2Jyb3dzZXItaW5zcGVjdC5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQtdXRpbC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvYXN5bmMuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC9saWIvZXF1YWwuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0L2xpYi9oYXMta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL2hhcy5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL2luY2x1ZGVzLmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC9saWIvdGhyb3dzLWFzeW5jLmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC9saWIvdGhyb3dzLWNvbW1vbi5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL3Rocm93cy5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL3R5cGUuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tbWF0Y2gvY2xlYW4tbWF0Y2guanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvY29udmVydC9kbXAuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvY29udmVydC94bWwuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9kaWZmL2Jhc2UuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9jaGFyYWN0ZXIuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9jc3MuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9qc29uLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2RpZmYvbGluZS5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9kaWZmL3NlbnRlbmNlLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2RpZmYvd29yZC5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9wYXRjaC9hcHBseS5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9wYXRjaC9jcmVhdGUuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvcGF0Y2gvcGFyc2UuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvdXRpbC9kaXN0YW5jZS1pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy91dGlsL3BhcmFtcy5qcyIsIm5vZGVfbW9kdWxlcy9mb3JlYWNoL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2luZGV4b2YvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaXNhcnJheS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9mb3JlYWNoLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1rZXlzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1rZXlzL2lzQXJndW1lbnRzLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwtaW5zcGVjdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy91dGlsLWluc3BlY3Qvbm9kZV9tb2R1bGVzL2pzb24zL2xpYi9qc29uMy5qcyIsInIvZG90LmpzIiwici9pbmRleC5qcyIsInIvc3BlYy5qcyIsInIvdGFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDclJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqcUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2o0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCJcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0XCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2xpYi9kb21cIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogTWFpbiBlbnRyeSBwb2ludCwgZm9yIHRob3NlIHdhbnRpbmcgdG8gdXNlIHRoaXMgZnJhbWV3b3JrIHdpdGggdGhlIGNvcmVcbiAqIGFzc2VydGlvbnMuXG4gKi9cbnZhciBUaGFsbGl1bSA9IHJlcXVpcmUoXCIuL2xpYi9hcGkvdGhhbGxpdW1cIilcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVGhhbGxpdW0oKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFRoYWxsaXVtID0gcmVxdWlyZShcIi4vbGliL2FwaS90aGFsbGl1bVwiKVxudmFyIFJlcG9ydHMgPSByZXF1aXJlKFwiLi9saWIvY29yZS9yZXBvcnRzXCIpXG52YXIgSG9va1N0YWdlID0gUmVwb3J0cy5Ib29rU3RhZ2VcblxuZXhwb3J0cy5yb290ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgVGhhbGxpdW0oKVxufVxuXG5mdW5jdGlvbiBkKGR1cmF0aW9uKSB7XG4gICAgaWYgKGR1cmF0aW9uID09IG51bGwpIHJldHVybiAxMFxuICAgIGlmICh0eXBlb2YgZHVyYXRpb24gPT09IFwibnVtYmVyXCIpIHJldHVybiBkdXJhdGlvbnwwXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBkdXJhdGlvbmAgdG8gYmUgYSBudW1iZXIgaWYgaXQgZXhpc3RzXCIpXG59XG5cbmZ1bmN0aW9uIHMoc2xvdykge1xuICAgIGlmIChzbG93ID09IG51bGwpIHJldHVybiA3NVxuICAgIGlmICh0eXBlb2Ygc2xvdyA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHNsb3d8MFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgc2xvd2AgdG8gYmUgYSBudW1iZXIgaWYgaXQgZXhpc3RzXCIpXG59XG5cbmZ1bmN0aW9uIHAocGF0aCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHBhdGgpKSByZXR1cm4gcGF0aFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcGF0aGAgdG8gYmUgYW4gYXJyYXkgb2YgbG9jYXRpb25zXCIpXG59XG5cbmZ1bmN0aW9uIGgodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUuXyA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHZhbHVlXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGB2YWx1ZWAgdG8gYmUgYSBob29rIGVycm9yXCIpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IHJlcG9ydCwgbWFpbmx5IGZvciB0ZXN0aW5nIHJlcG9ydGVycy5cbiAqL1xuZXhwb3J0cy5yZXBvcnRzID0ge1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5TdGFydCgpXG4gICAgfSxcblxuICAgIGVudGVyOiBmdW5jdGlvbiAocGF0aCwgZHVyYXRpb24sIHNsb3cpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkVudGVyKHAocGF0aCksIGQoZHVyYXRpb24pLCBzKHNsb3cpKVxuICAgIH0sXG5cbiAgICBsZWF2ZTogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkxlYXZlKHAocGF0aCkpXG4gICAgfSxcblxuICAgIHBhc3M6IGZ1bmN0aW9uIChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuUGFzcyhwKHBhdGgpLCBkKGR1cmF0aW9uKSwgcyhzbG93KSlcbiAgICB9LFxuXG4gICAgZmFpbDogZnVuY3Rpb24gKHBhdGgsIHZhbHVlLCBkdXJhdGlvbiwgc2xvdywgaXNGYWlsYWJsZSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkZhaWwoXG4gICAgICAgICAgICBwKHBhdGgpLCB2YWx1ZSwgZChkdXJhdGlvbiksIHMoc2xvdyksXG4gICAgICAgICAgICAhIWlzRmFpbGFibGUpXG4gICAgfSxcblxuICAgIHNraXA6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ta2lwKHAocGF0aCkpXG4gICAgfSxcblxuICAgIGVuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRW5kKClcbiAgICB9LFxuXG4gICAgZXJyb3I6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRXJyb3IodmFsdWUpXG4gICAgfSxcblxuICAgIGhvb2s6IGZ1bmN0aW9uIChwYXRoLCByb290UGF0aCwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkhvb2socChwYXRoKSwgcChyb290UGF0aCksIGgodmFsdWUpKVxuICAgIH0sXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGhvb2sgZXJyb3IsIG1haW5seSBmb3IgdGVzdGluZyByZXBvcnRlcnMuXG4gKi9cbmV4cG9ydHMuaG9va0Vycm9ycyA9IHtcbiAgICBiZWZvcmVBbGw6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKEhvb2tTdGFnZS5CZWZvcmVBbGwsIGZ1bmMsIHZhbHVlKVxuICAgIH0sXG5cbiAgICBiZWZvcmVFYWNoOiBmdW5jdGlvbiAoZnVuYywgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkhvb2tFcnJvcihIb29rU3RhZ2UuQmVmb3JlRWFjaCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGFmdGVyRWFjaDogZnVuY3Rpb24gKGZ1bmMsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ib29rRXJyb3IoSG9va1N0YWdlLkFmdGVyRWFjaCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGFmdGVyQWxsOiBmdW5jdGlvbiAoZnVuYywgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkhvb2tFcnJvcihIb29rU3RhZ2UuQWZ0ZXJBbGwsIGZ1bmMsIHZhbHVlKVxuICAgIH0sXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBsb2NhdGlvbiwgbWFpbmx5IGZvciB0ZXN0aW5nIHJlcG9ydGVycy5cbiAqL1xuZXhwb3J0cy5sb2NhdGlvbiA9IGZ1bmN0aW9uIChuYW1lLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYG5hbWVgIHRvIGJlIGEgc3RyaW5nXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBpbmRleCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYGluZGV4YCB0byBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIHJldHVybiB7bmFtZTogbmFtZSwgaW5kZXg6IGluZGV4fDB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcIi4uL3V0aWxcIikuYXNzZXJ0XG5cbmV4cG9ydHMuYWRkSG9vayA9IGZ1bmN0aW9uIChsaXN0LCBjYWxsYmFjaykge1xuICAgIGFzc2VydChsaXN0ID09IG51bGwgfHwgQXJyYXkuaXNBcnJheShsaXN0KSlcbiAgICBhc3NlcnQodHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpXG5cbiAgICBpZiAobGlzdCAhPSBudWxsKSB7XG4gICAgICAgIGxpc3QucHVzaChjYWxsYmFjaylcbiAgICAgICAgcmV0dXJuIGxpc3RcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gW2NhbGxiYWNrXVxuICAgIH1cbn1cblxuZXhwb3J0cy5yZW1vdmVIb29rID0gZnVuY3Rpb24gKGxpc3QsIGNhbGxiYWNrKSB7XG4gICAgYXNzZXJ0KGxpc3QgPT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KGxpc3QpKVxuICAgIGFzc2VydCh0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIilcblxuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaWYgKGxpc3RbMF0gPT09IGNhbGxiYWNrKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGluZGV4ID0gbGlzdC5pbmRleE9mKGNhbGxiYWNrKVxuXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSBsaXN0LnNwbGljZShpbmRleCwgMSlcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Rcbn1cblxuZXhwb3J0cy5oYXNIb29rID0gZnVuY3Rpb24gKGxpc3QsIGNhbGxiYWNrKSB7XG4gICAgYXNzZXJ0KGxpc3QgPT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KGxpc3QpKVxuICAgIGFzc2VydCh0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIilcblxuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiBmYWxzZVxuICAgIGlmIChsaXN0Lmxlbmd0aCA+IDEpIHJldHVybiBsaXN0LmluZGV4T2YoY2FsbGJhY2spID49IDBcbiAgICByZXR1cm4gbGlzdFswXSA9PT0gY2FsbGJhY2tcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiLi4vdXRpbFwiKS5hc3NlcnRcbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBUZXN0cyA9IHJlcXVpcmUoXCIuLi9jb3JlL3Rlc3RzXCIpXG5cbnZhciBDb21tb24gPSByZXF1aXJlKFwiLi9jb21tb25cIilcblxuLyoqXG4gKiBUaGlzIGNvbnRhaW5zIHRoZSBsb3cgbGV2ZWwsIG1vcmUgYXJjYW5lIHRoaW5ncyB0aGF0IGFyZSBnZW5lcmFsbHkgbm90XG4gKiBpbnRlcmVzdGluZyB0byBhbnlvbmUgb3RoZXIgdGhhbiBwbHVnaW4gZGV2ZWxvcGVycy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBSZWZsZWN0XG5mdW5jdGlvbiBSZWZsZWN0KHRlc3QpIHtcbiAgICBhc3NlcnQodGVzdCAhPSBudWxsICYmIHR5cGVvZiB0ZXN0ID09PSBcIm9iamVjdFwiKVxuXG4gICAgdmFyIHJlZmxlY3QgPSB0ZXN0LnJlZmxlY3RcblxuICAgIGlmIChyZWZsZWN0ICE9IG51bGwpIHJldHVybiByZWZsZWN0XG4gICAgdGVzdC5yZWZsZWN0ID0gdGhpc1xuICAgIHRoaXMuXyA9IHRlc3Rcbn1cblxubWV0aG9kcyhSZWZsZWN0LCB7XG4gICAgLyoqXG4gICAgICogV2hldGhlciBhIHJlcG9ydGVyIHdhcyByZWdpc3RlcmVkLlxuICAgICAqL1xuICAgIGhhc1JlcG9ydGVyOiBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXBvcnRlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byBiZSBhIHJlcG9ydGVyXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fLnJvb3QucmVwb3J0ZXJzLmluZGV4T2YocmVwb3J0ZXIpID49IDBcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgcmVwb3J0ZXIuXG4gICAgICovXG4gICAgYWRkUmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb290LnJlcG9ydGVycy5pbmRleE9mKHJlcG9ydGVyKSA8IDApIHJvb3QucmVwb3J0ZXJzLnB1c2gocmVwb3J0ZXIpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIHJlbW92ZVJlcG9ydGVyOiBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZXBvcnRlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byBiZSBhIHJlcG9ydGVyXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcm9vdCA9IHRoaXMuXy5yb290XG5cbiAgICAgICAgaWYgKHJvb3QuY3VycmVudCAhPT0gcm9vdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVwb3J0ZXJzIG1heSBvbmx5IGJlIGFkZGVkIHRvIHRoZSByb290XCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaW5kZXggPSByb290LnJlcG9ydGVycy5pbmRleE9mKHJlcG9ydGVyKVxuXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSByb290LnJlcG9ydGVycy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudGx5IGV4ZWN1dGluZyB0ZXN0LlxuICAgICAqL1xuICAgIGdldCBjdXJyZW50KCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZmxlY3QodGhpcy5fLnJvb3QuY3VycmVudClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSByb290IHRlc3QuXG4gICAgICovXG4gICAgZ2V0IHJvb3QoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVmbGVjdCh0aGlzLl8ucm9vdClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IHRvdGFsIHRlc3QgY291bnQuXG4gICAgICovXG4gICAgZ2V0IGNvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLnRlc3RzID09IG51bGwgPyAwIDogdGhpcy5fLnRlc3RzLmxlbmd0aFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBjb3B5IG9mIHRoZSBjdXJyZW50IHRlc3QgbGlzdCwgYXMgYSBSZWZsZWN0IGNvbGxlY3Rpb24uIFRoaXMgaXNcbiAgICAgKiBpbnRlbnRpb25hbGx5IGEgc2xpY2UsIHNvIHlvdSBjYW4ndCBtdXRhdGUgdGhlIHJlYWwgY2hpbGRyZW4uXG4gICAgICovXG4gICAgZ2V0IGNoaWxkcmVuKCkge1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXVxuXG4gICAgICAgIGlmICh0aGlzLl8udGVzdHMgIT0gbnVsbCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl8udGVzdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbltpXSA9IG5ldyBSZWZsZWN0KHRoaXMuXy50ZXN0c1tpXSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaGlsZHJlblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJcyB0aGlzIHRlc3QgdGhlIHJvb3QsIGkuZS4gdG9wIGxldmVsP1xuICAgICAqL1xuICAgIGdldCBpc1Jvb3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8ucGFyZW50ID09IG51bGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogSXMgdGhpcyBsb2NrZWQgKGkuZS4gdW5zYWZlIHRvIG1vZGlmeSk/XG4gICAgICovXG4gICAgZ2V0IGlzTG9ja2VkKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLl8ubG9ja2VkXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYWN0aXZlIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLCBub3QgbmVjZXNzYXJpbHkgb3duLCBvciB0aGVcbiAgICAgKiBmcmFtZXdvcmsgZGVmYXVsdCBvZiAyMDAwLCBpZiBub25lIHdhcyBzZXQuXG4gICAgICovXG4gICAgZ2V0IHRpbWVvdXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8udGltZW91dCB8fCBUZXN0cy5kZWZhdWx0VGltZW91dFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGFjdGl2ZSBzbG93IHRocmVzaG9sZCBpbiBtaWxsaXNlY29uZHMsIG5vdCBuZWNlc3NhcmlseSBvd24sIG9yXG4gICAgICogdGhlIGZyYW1ld29yayBkZWZhdWx0IG9mIDc1LCBpZiBub25lIHdhcyBzZXQuXG4gICAgICovXG4gICAgZ2V0IHNsb3coKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8uc2xvdyB8fCBUZXN0cy5kZWZhdWx0U2xvd1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHRlc3QncyBvd24gbWF4IGF0dGVtcHQgY291bnQuIE5vdGUgdGhhdCB0aGlzIGlzIHBhcmFzaXRpY2FsbHlcbiAgICAgKiBpbmhlcml0ZWQgZnJvbSBpdHMgcGFyZW50LCBub3QgZGVsZWdhdGVkLlxuICAgICAqL1xuICAgIGdldCBhdHRlbXB0cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5hdHRlbXB0c1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgd2hldGhlciB0aGlzIHRlc3QgaXMgZmFpbGFibGUuIE5vdGUgdGhhdCB0aGlzIGlzIHBhcmFzaXRpY2FsbHlcbiAgICAgKiBpbmhlcml0ZWQgZnJvbSBpdHMgcGFyZW50LCBub3QgZGVsZWdhdGVkLlxuICAgICAqL1xuICAgIGdldCBpc0ZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLmlzRmFpbGFibGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0ZXN0IG5hbWUsIG9yIGB1bmRlZmluZWRgIGlmIGl0J3MgdGhlIHJvb3QgdGVzdC5cbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuXy5wYXJlbnQgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gdGhpcy5fLm5hbWVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0ZXN0IGluZGV4LCBvciBgdW5kZWZpbmVkYCBpZiBpdCdzIHRoZSByb290IHRlc3QuXG4gICAgICovXG4gICAgZ2V0IGluZGV4KCkge1xuICAgICAgICBpZiAodGhpcy5fLnBhcmVudCA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIHJldHVybiB0aGlzLl8uaW5kZXhcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB0ZXN0J3MgcGFyZW50IGFzIGEgUmVmbGVjdCwgb3IgYHVuZGVmaW5lZGAgaWYgaXQncyB0aGUgcm9vdCB0ZXN0LlxuICAgICAqL1xuICAgIGdldCBwYXJlbnQoKSB7XG4gICAgICAgIGlmICh0aGlzLl8ucGFyZW50ID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgcmV0dXJuIG5ldyBSZWZsZWN0KHRoaXMuXy5wYXJlbnQpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIGJlZm9yZSBlYWNoIHN1YnRlc3QsIGluY2x1ZGluZyB0aGVpciBzdWJ0ZXN0cyBhbmQgc29cbiAgICAgKiBvbi5cbiAgICAgKi9cbiAgICBiZWZvcmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fLmJlZm9yZUVhY2ggPSBDb21tb24uYWRkSG9vayh0aGlzLl8uYmVmb3JlRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIG9uY2UgYmVmb3JlIGFsbCBzdWJ0ZXN0cyBhcmUgcnVuLlxuICAgICAqL1xuICAgIGJlZm9yZUFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYmVmb3JlQWxsID0gQ29tbW9uLmFkZEhvb2sodGhpcy5fLmJlZm9yZUFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgLyoqXG4gICAgKiBBZGQgYSBob29rIHRvIGJlIHJ1biBhZnRlciBlYWNoIHN1YnRlc3QsIGluY2x1ZGluZyB0aGVpciBzdWJ0ZXN0cyBhbmQgc29cbiAgICAqIG9uLlxuICAgICovXG4gICAgYWZ0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fLmFmdGVyRWFjaCA9IENvbW1vbi5hZGRIb29rKHRoaXMuXy5hZnRlckVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBob29rIHRvIGJlIHJ1biBvbmNlIGFmdGVyIGFsbCBzdWJ0ZXN0cyBhcmUgcnVuLlxuICAgICAqL1xuICAgIGFmdGVyQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuXy5hZnRlckFsbCA9IENvbW1vbi5hZGRIb29rKHRoaXMuXy5hZnRlckFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmJlZm9yZWAgb3IgYHJlZmxlY3QuYmVmb3JlYC5cbiAgICAgKi9cbiAgICBoYXNCZWZvcmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIENvbW1vbi5oYXNIb29rKHRoaXMuXy5iZWZvcmVFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYmVmb3JlQWxsYCBvciBgcmVmbGVjdC5iZWZvcmVBbGxgLlxuICAgICAqL1xuICAgIGhhc0JlZm9yZUFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQ29tbW9uLmhhc0hvb2sodGhpcy5fLmJlZm9yZUFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyYCBvcmByZWZsZWN0LmFmdGVyYC5cbiAgICAgKi9cbiAgICBoYXNBZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQ29tbW9uLmhhc0hvb2sodGhpcy5fLmFmdGVyRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyQWxsYCBvciBgcmVmbGVjdC5hZnRlckFsbGAuXG4gICAgICovXG4gICAgaGFzQWZ0ZXJBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIENvbW1vbi5oYXNIb29rKHRoaXMuXy5hZnRlckFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmJlZm9yZWAgb3IgYHJlZmxlY3QuYmVmb3JlYC5cbiAgICAgKi9cbiAgICByZW1vdmVCZWZvcmU6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fLmJlZm9yZUVhY2ggPSBDb21tb24ucmVtb3ZlSG9vayh0aGlzLl8uYmVmb3JlRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmJlZm9yZUFsbGAgb3IgYHJlZmxlY3QuYmVmb3JlQWxsYC5cbiAgICAgKi9cbiAgICByZW1vdmVCZWZvcmVBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fLmJlZm9yZUFsbCA9IENvbW1vbi5yZW1vdmVIb29rKHRoaXMuXy5iZWZvcmVBbGwsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5hZnRlcmAgb3JgcmVmbGVjdC5hZnRlcmAuXG4gICAgICovXG4gICAgcmVtb3ZlQWZ0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fLmFmdGVyRWFjaCA9IENvbW1vbi5yZW1vdmVIb29rKHRoaXMuXy5hZnRlckVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5hZnRlckFsbGAgb3IgYHJlZmxlY3QuYWZ0ZXJBbGxgLlxuICAgICAqL1xuICAgIHJlbW92ZUFmdGVyQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuXy5hZnRlckFsbCA9IENvbW1vbi5yZW1vdmVIb29rKHRoaXMuXy5hZnRlckFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGJsb2NrIG9yIGlubGluZSB0ZXN0LlxuICAgICAqL1xuICAgIHRlc3Q6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGRUZXN0KHRoaXMuXy5yb290LmN1cnJlbnQsIG5hbWUsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTa2lwIHRoZSBjdXJyZW50IHRlc3QgZHluYW1pY2FsbHlcbiAgICAgKi9cbiAgICBza2lwOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl8ucm9vdC5jdXJyZW50ID09PSB0aGlzLl8ucm9vdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoaXMgc2hvdWxkIG9ubHkgYmUgY2FsbGVkIHdpdGhpbiB0ZXN0cy5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IFRlc3RzLlNraXBcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBVdGlsID0gcmVxdWlyZShcIi4uL3V0aWxcIilcbnZhciBUZXN0cyA9IHJlcXVpcmUoXCIuLi9jb3JlL3Rlc3RzXCIpXG52YXIgRmlsdGVyID0gcmVxdWlyZShcIi4uL2NvcmUvZmlsdGVyXCIpXG52YXIgUmVwb3J0ZXJzID0gcmVxdWlyZShcIi4uLy4uL3IvaW5kZXhcIilcblxudmFyIENvbW1vbiA9IHJlcXVpcmUoXCIuL2NvbW1vblwiKVxudmFyIFJlZmxlY3QgPSByZXF1aXJlKFwiLi9yZWZsZWN0XCIpXG5cbm1vZHVsZS5leHBvcnRzID0gVGhhbGxpdW1cbmZ1bmN0aW9uIFRoYWxsaXVtKCkge1xuICAgIHRoaXMuXyA9IFRlc3RzLmNyZWF0ZVJvb3QoKVxufVxuXG5tZXRob2RzKFRoYWxsaXVtLCB7XG4gICAgLyoqXG4gICAgICogR2V0IGEgUmVmbGVjdCBpbnN0YW5jZSBkaXJlY3RseS5cbiAgICAgKi9cbiAgICBnZXQgcmVmbGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWZsZWN0KHRoaXMuXy5yb290LmN1cnJlbnQpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGwgYSBwbHVnaW4gYW5kIHJldHVybiB0aGUgcmVzdWx0LiBUaGUgcGx1Z2luIGlzIGNhbGxlZCB3aXRoIGEgUmVmbGVjdFxuICAgICAqIGluc3RhbmNlIGZvciBhY2Nlc3MgdG8gcGxlbnR5IG9mIHBvdGVudGlhbGx5IHVzZWZ1bCBpbnRlcm5hbCBkZXRhaWxzLlxuICAgICAqL1xuICAgIGNhbGw6IGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwbHVnaW4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBwbHVnaW5gIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwbHVnaW4uY2FsbCh0aGlzLnJlZmxlY3QsIHRoaXMucmVmbGVjdClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogV2hpdGVsaXN0IHNwZWNpZmljIHRlc3RzLCB1c2luZyBhcnJheS1iYXNlZCBzZWxlY3RvcnMgd2hlcmUgZWFjaCBlbnRyeVxuICAgICAqIGlzIGVpdGhlciBhIHN0cmluZyBvciByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICovXG4gICAgc2V0IG9ubHkoc2VsZWN0b3JzKSB7XG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3QuXCIpXG4gICAgICAgIH1cblxuICAgICAgICBGaWx0ZXIudmFsaWRhdGUoc2VsZWN0b3JzKVxuICAgICAgICByb290Lm9ubHkgPSBGaWx0ZXIuY3JlYXRlKHNlbGVjdG9ycylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgcmVwb3J0ZXIuXG4gICAgICovXG4gICAgc2V0IHJlcG9ydGVyKHJlcG9ydGVyKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlcG9ydGVyKVxuICAgICAgICAgICAgPyB0eXBlb2YgcmVwb3J0ZXJbMF0gIT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgIDogdHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byBiZSBhIGBbc3RyaW5nLCBvcHRzP11gIHBhaXIgb3IgYSBcIiArXG4gICAgICAgICAgICAgICAgXCJmdW5jdGlvbi5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3QuXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJvb3QucmVwb3J0ZXIgPSByZXBvcnRlclxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIG1vZCA9IFJlcG9ydGVyc1tyZXBvcnRlcl1cblxuICAgICAgICAgICAgaWYgKG1vZCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkJ1aWx0LWluIHJlcG9ydGVyIFwiICtcbiAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkocmVwb3J0ZXIpICsgXCIgbm90IGZvdW5kXCIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJvb3QucmVwb3J0ZXIgPSBtb2QocmVwb3J0ZXJbMV0pXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhpcyBoYXMgYSByZXBvcnRlci5cbiAgICAgKi9cbiAgICBnZXQgaGFzUmVwb3J0ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8ucm9vdC5yZXBvcnRlciAhPSBudWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudCBmaWxlIHNldC5cbiAgICAgKi9cbiAgICBnZXQgZmlsZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8uZmlsZXNcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBjdXJyZW50IGZpbGUgc2V0LlxuICAgICAqL1xuICAgIHNldCBmaWxlcyhmaWxlcykge1xuICAgICAgICB2YXIgcm9vdCA9IHRoaXMuXy5yb290XG5cbiAgICAgICAgaWYgKHJvb3QuY3VycmVudCAhPT0gcm9vdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmlsZXMgbWF5IG9ubHkgYmUgc2V0IGluIHRoZSByb290LlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZpbGVzID09IG51bGwpIHtcbiAgICAgICAgICAgIHJvb3QuZmlsZXMgPSB1bmRlZmluZWRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShmaWxlcykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIGZpbGVzIHRvIGJlIGFuIGFycmF5IGlmIGl0IGV4aXN0cywgYnV0IGZvdW5kIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJhKG4pIFwiICsgVXRpbC5nZXRUeXBlKGZpbGVzKSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBnbG9iID0gZmlsZXNbaV1cblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZ2xvYiAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJFeHBlY3RlZCB0LmZpbGVzW1wiICsgaSArIFwiXSB0byBiZSBhIHN0cmluZywgYnV0IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZm91bmQgYShuKSBcIiArIFV0aWwuZ2V0VHlwZShnbG9iKSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJvb3QuZmlsZXMgPSBmaWxlc1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgY3VycmVudCBmaWxlIHNldC5cbiAgICAgKi9cbiAgICBzZXQgb3B0aW9ucyhvcHRzKSB7XG4gICAgICAgIGlmIChvcHRzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0cyAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wdGlvbnMgbXVzdCBiZSBhbiBvYmplY3QgaWYgZ2l2ZW4uXCIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvcHRzLm9ubHkgIT0gbnVsbCkgRmlsdGVyLnZhbGlkYXRlKG9wdHMub25seSlcbiAgICAgICAgICAgIGlmIChvcHRzLnNraXAgIT0gbnVsbCkgRmlsdGVyLnZhbGlkYXRlKG9wdHMuc2tpcClcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuXy5vcHRpb25zID0gb3B0c1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgdGltZW91dC4gMCBtZWFucyBpbmhlcml0IHRoZSBwYXJlbnQncywgYW5kIGBJbmZpbml0eWBcbiAgICAgKiBtZWFucyBpdCdzIGRpc2FibGVkLlxuICAgICAqL1xuICAgIGdldCB0aW1lb3V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLnJvb3QuY3VycmVudC50aW1lb3V0IHx8IFRlc3RzLmRlZmF1bHRUaW1lb3V0XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdGltZW91dCBpbiBtaWxsaXNlY29uZHMsIHJvdW5kaW5nIG5lZ2F0aXZlcyB0byAwLiBTZXR0aW5nIHRoZVxuICAgICAqIHRpbWVvdXQgdG8gMCBtZWFucyB0byBpbmhlcml0IHRoZSBwYXJlbnQgdGltZW91dCwgYW5kIHNldHRpbmcgaXQgdG9cbiAgICAgKiBgSW5maW5pdHlgIGRpc2FibGVzIGl0LlxuICAgICAqL1xuICAgIHNldCB0aW1lb3V0KHRpbWVvdXQpIHtcbiAgICAgICAgdGhpcy5fLnJvb3QuY3VycmVudC50aW1lb3V0ID0gTWF0aC5mbG9vcihNYXRoLm1heCgrdGltZW91dCwgMCkpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudCBzbG93IHRocmVzaG9sZC4gMCBtZWFucyBpbmhlcml0IHRoZSBwYXJlbnQncywgYW5kXG4gICAgICogYEluZmluaXR5YCBtZWFucyBpdCdzIGRpc2FibGVkLlxuICAgICAqL1xuICAgIGdldCBzbG93KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLnJvb3QuY3VycmVudC5zbG93IHx8IFRlc3RzLmRlZmF1bHRTbG93XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc2xvdyB0aHJlc2hvbGQgaW4gbWlsbGlzZWNvbmRzLCByb3VuZGluZyBuZWdhdGl2ZXMgdG8gMC4gU2V0dGluZ1xuICAgICAqIHRoZSB0aW1lb3V0IHRvIDAgbWVhbnMgdG8gaW5oZXJpdCB0aGUgcGFyZW50IHRocmVzaG9sZCwgYW5kIHNldHRpbmcgaXQgdG9cbiAgICAgKiBgSW5maW5pdHlgIGRpc2FibGVzIGl0LlxuICAgICAqL1xuICAgIHNldCBzbG93KHNsb3cpIHtcbiAgICAgICAgdGhpcy5fLnJvb3QuY3VycmVudC5zbG93ID0gTWF0aC5mbG9vcihNYXRoLm1heCgrc2xvdywgMCkpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgY3VycmVudCBhdHRlbXB0IGNvdW50LiBgMGAgbWVhbnMgaW5oZXJpdCB0aGUgcGFyZW50J3MuXG4gICAgICovXG4gICAgZ2V0IGF0dGVtcHRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLnJvb3QuY3VycmVudC5hdHRlbXB0c1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIG51bWJlciBvZiBhdHRlbXB0cyBhbGxvd2VkLCByb3VuZGluZyBuZWdhdGl2ZXMgdG8gMC4gU2V0dGluZyB0aGVcbiAgICAgKiBjb3VudCB0byBgMGAgbWVhbnMgdG8gaW5oZXJpdCB0aGUgcGFyZW50IHJldHJ5IGNvdW50LlxuICAgICAqL1xuICAgIHNldCBhdHRlbXB0cyhhdHRlbXB0cykge1xuICAgICAgICAvLyBUaGlzIGlzIGRvbmUgZGlmZmVyZW50bHkgdG8gYXZvaWQgYSBtYXNzaXZlIHBlcmZvcm1hbmNlIHBlbmFsdHkuXG4gICAgICAgIHZhciBjYWxjdWxhdGVkID0gTWF0aC5mbG9vcihNYXRoLm1heChhdHRlbXB0cywgMCkpXG4gICAgICAgIHZhciB0ZXN0ID0gdGhpcy5fLnJvb3QuY3VycmVudFxuXG4gICAgICAgIHRlc3QuYXR0ZW1wdHMgPSBjYWxjdWxhdGVkIHx8IHRlc3QucGFyZW50LmF0dGVtcHRzXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB3aGV0aGVyIHRoaXMgdGVzdCBpcyBmYWlsYWJsZS5cbiAgICAgKi9cbiAgICBnZXQgaXNGYWlsYWJsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290LmN1cnJlbnQuaXNGYWlsYWJsZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgd2hldGhlciB0aGlzIHRlc3QgaXMgZmFpbGFibGUuXG4gICAgICovXG4gICAgc2V0IGlzRmFpbGFibGUoaXNGYWlsYWJsZSkge1xuICAgICAgICB0aGlzLl8ucm9vdC5jdXJyZW50LmlzRmFpbGFibGUgPSAhIWlzRmFpbGFibGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUnVuIHRoZSB0ZXN0cyAob3IgdGhlIHRlc3QncyB0ZXN0cyBpZiBpdCdzIG5vdCBhIGJhc2UgaW5zdGFuY2UpLlxuICAgICAqL1xuICAgIHJ1bjogZnVuY3Rpb24gKG9wdHMpIHtcbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLl8ucm9vdFxuXG4gICAgICAgIGlmIChyb290LmN1cnJlbnQgIT09IHJvb3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIk9ubHkgdGhlIHJvb3QgdGVzdCBjYW4gYmUgcnVuIC0gSWYgeW91IG9ubHkgd2FudCB0byBydW4gYSBcIiArXG4gICAgICAgICAgICAgICAgXCJzdWJ0ZXN0LCB1c2UgYHQub25seSA9IFtbXFxcInRlc3RcXFwiLCAuLi5dXWAgaW5zdGVhZC5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyb290LmxvY2tlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgcnVuIHdoaWxlIHRlc3RzIGFyZSBhbHJlYWR5IHJ1bm5pbmcuXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0cyAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdHMgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcHRpb25zIG11c3QgYmUgYW4gb2JqZWN0IGlmIGdpdmVuLlwiKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3B0cy5vbmx5ICE9IG51bGwpIEZpbHRlci52YWxpZGF0ZShvcHRzLm9ubHkpXG4gICAgICAgICAgICBpZiAob3B0cy5za2lwICE9IG51bGwpIEZpbHRlci52YWxpZGF0ZShvcHRzLnNraXApXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdG9yZSA9IHJvb3QucmVwb3J0ZXIgPT0gbnVsbFxuXG4gICAgICAgIGlmIChyZXN0b3JlKSByb290LnJlcG9ydGVyID0gUmVwb3J0ZXJzLnNwZWMoKVxuICAgICAgICByZXR1cm4gVGVzdHMucnVuVGVzdChyb290LCBvcHRzKS50aGVuKFxuICAgICAgICAgICAgZnVuY3Rpb24gKHYpIHsgaWYgKHJlc3RvcmUpIHJvb3QucmVwb3J0ZXIgPSB1bmRlZmluZWQ7IHJldHVybiB2IH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkgeyBpZiAocmVzdG9yZSkgcm9vdC5yZXBvcnRlciA9IHVuZGVmaW5lZDsgdGhyb3cgZSB9XG4gICAgICAgIClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgdGVzdC5cbiAgICAgKi9cbiAgICB0ZXN0OiBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYG5hbWVgIHRvIGJlIGEgc3RyaW5nXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgVGVzdHMuYWRkVGVzdCh0aGlzLl8ucm9vdC5jdXJyZW50LCBuYW1lLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2tpcCB0aGUgY3VycmVudCB0ZXN0IGR5bmFtaWNhbGx5XG4gICAgICovXG4gICAgc2tpcDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fLnJvb3QuY3VycmVudCA9PT0gdGhpcy5fLnJvb3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJUaGlzIHNob3VsZCBvbmx5IGJlIGNhbGxlZCB3aXRoaW4gdGVzdHMuXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBUZXN0cy5Ta2lwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIGFsbCBleGlzdGluZyB0ZXN0cy5cbiAgICAgKi9cbiAgICBjbGVhclRlc3RzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl8ucm9vdCAhPT0gdGhpcy5fKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUZXN0cyBtYXkgb25seSBiZSBjbGVhcmVkIGF0IHRoZSByb290LlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuXy5sb2NrZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGNsZWFyIHRlc3RzIHdoaWxlIHRoZXkgYXJlIHJ1bm5pbmcuXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5jbGVhclRlc3RzKHRoaXMuXylcbiAgICB9LFxuXG4gICAgYmVmb3JlOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0ZXN0ID0gdGhpcy5fLnJvb3QuY3VycmVudFxuXG4gICAgICAgIHRlc3QuYmVmb3JlRWFjaCA9IENvbW1vbi5hZGRIb29rKHRlc3QuYmVmb3JlRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIGJlZm9yZUFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGVzdCA9IHRoaXMuXy5yb290LmN1cnJlbnRcblxuICAgICAgICB0ZXN0LmJlZm9yZUFsbCA9IENvbW1vbi5hZGRIb29rKHRlc3QuYmVmb3JlQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgYWZ0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5hZnRlckVhY2ggPSBDb21tb24uYWRkSG9vayh0ZXN0LmFmdGVyRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIGFmdGVyQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0ZXN0ID0gdGhpcy5fLnJvb3QuY3VycmVudFxuXG4gICAgICAgIHRlc3QuYWZ0ZXJBbGwgPSBDb21tb24uYWRkSG9vayh0ZXN0LmFmdGVyQWxsLCBjYWxsYmFjaylcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogVGhpcyBpcyB0aGUgZW50cnkgcG9pbnQgZm9yIHRoZSBCcm93c2VyaWZ5IGJ1bmRsZS4gTm90ZSB0aGF0IGl0ICphbHNvKiB3aWxsXG4gKiBydW4gYXMgcGFydCBvZiB0aGUgdGVzdHMgaW4gTm9kZSAodW5idW5kbGVkKSwgYW5kIGl0IHRoZW9yZXRpY2FsbHkgY291bGQgYmVcbiAqIHJ1biBpbiBOb2RlIG9yIGEgcnVudGltZSBsaW1pdGVkIHRvIG9ubHkgRVM1IHN1cHBvcnQgKGUuZy4gUmhpbm8sIE5hc2hvcm4sIG9yXG4gKiBlbWJlZGRlZCBWOCksIHNvIGRvICpub3QqIGFzc3VtZSBicm93c2VyIGdsb2JhbHMgYXJlIHByZXNlbnQuXG4gKi9cblxudmFyIHQgPSByZXF1aXJlKFwiLi4vaW5kZXhcIilcbnZhciBkb20gPSByZXF1aXJlKFwiLi4vZG9tXCIpXG5cbmdsb2JhbC50ID0gdFxuZ2xvYmFsLmFzc2VydCA9IHJlcXVpcmUoXCIuLi9hc3NlcnRcIilcbnQuciA9IHJlcXVpcmUoXCIuLi9yXCIpXG50LmRvbSA9IGRvbVxudC5pbnRlcm5hbCA9IHJlcXVpcmUoXCIuLi9pbnRlcm5hbFwiKVxuXG5mdW5jdGlvbiBhdXRvbG9hZChzY3JpcHQpIHtcbiAgICBpZiAoIXNjcmlwdC5oYXNBdHRyaWJ1dGUoXCJkYXRhLWZpbGVzXCIpKSByZXR1cm5cblxuICAgIGZ1bmN0aW9uIHNldChvcHRzLCBhdHRyLCB0cmFuc2Zvcm0pIHtcbiAgICAgICAgdmFyIHZhbHVlID0gc2NyaXB0LmdldEF0dHJpYnV0ZShcImRhdGEtXCIgKyBhdHRyKVxuXG4gICAgICAgIGlmICh2YWx1ZSkgb3B0c1thdHRyXSA9IHRyYW5zZm9ybSh2YWx1ZSlcbiAgICB9XG5cbiAgICB2YXIgZmlsZXMgPSBzY3JpcHQuZ2V0QXR0cmlidXRlKFwiZGF0YS1maWxlc1wiKS50cmltKClcbiAgICB2YXIgb3B0cyA9IHtmaWxlczogZmlsZXMgPyBmaWxlcy5zcGxpdCgvXFxzKy9nKSA6IFtdfVxuXG4gICAgc2V0KG9wdHMsIFwib25yZWFkeVwiLCBGdW5jdGlvbilcbiAgICBzZXQob3B0cywgXCJ0aW1lb3V0XCIsIE51bWJlcilcbiAgICBzZXQob3B0cywgXCJwcmVsb2FkXCIsIEZ1bmN0aW9uKVxuICAgIHNldChvcHRzLCBcInByZXJ1blwiLCBGdW5jdGlvbilcbiAgICBzZXQob3B0cywgXCJwb3N0cnVuXCIsIEZ1bmN0aW9uKVxuICAgIHNldChvcHRzLCBcIm9uZXJyb3JcIiwgZnVuY3Rpb24gKGF0dHIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcImVyclwiLCBhdHRyKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgfSlcblxuICAgIGlmIChnbG9iYWwuZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gXCJsb2FkaW5nXCIpIHtcbiAgICAgICAgZG9tKG9wdHMpLnJ1bigpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2xvYmFsLmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRvbShvcHRzKS5ydW4oKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuaWYgKGdsb2JhbC5kb2N1bWVudCAhPSBudWxsICYmIGdsb2JhbC5kb2N1bWVudC5jdXJyZW50U2NyaXB0ICE9IG51bGwpIHtcbiAgICBhdXRvbG9hZChnbG9iYWwuZG9jdW1lbnQuY3VycmVudFNjcmlwdClcbn1cblxuLy8gSW4gY2FzZSB0aGUgdXNlciBuZWVkcyB0byBhZGp1c3QgdGhlc2UgKGUuZy4gTmFzaG9ybiArIGNvbnNvbGUgb3V0cHV0KS5cbnQuY29uc29sZSA9IHJlcXVpcmUoXCIuL3JlcGxhY2VkL2NvbnNvbGVcIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiLi4vdXRpbFwiKS5hc3NlcnRcblxuLyoqXG4gKiBUaGUgZmlsdGVyIGlzIGFjdHVhbGx5IHN0b3JlZCBhcyBhIHRyZWUgZm9yIGZhc3RlciBsb29rdXAgdGltZXMgd2hlbiB0aGVyZVxuICogYXJlIG11bHRpcGxlIHNlbGVjdG9ycy4gT2JqZWN0cyBjYW4ndCBiZSB1c2VkIGZvciB0aGUgbm9kZXMsIHdoZXJlIGtleXNcbiAqIHJlcHJlc2VudCB2YWx1ZXMgYW5kIHZhbHVlcyByZXByZXNlbnQgY2hpbGRyZW4sIGJlY2F1c2UgcmVndWxhciBleHByZXNzaW9uc1xuICogYXJlbid0IHBvc3NpYmxlIHRvIHVzZS5cbiAqL1xuXG5mdW5jdGlvbiBpc0VxdWl2YWxlbnQoZW50cnksIGl0ZW0pIHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiBpdGVtID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiBlbnRyeSA9PT0gaXRlbVxuICAgIH0gZWxzZSBpZiAoZW50cnkgaW5zdGFuY2VvZiBSZWdFeHAgJiYgaXRlbSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICByZXR1cm4gZW50cnkudG9TdHJpbmcoKSA9PT0gaXRlbS50b1N0cmluZygpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaGVzKHZhbHVlLCBlbnRyeSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSBlbnRyeS5uYW1lXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLnRlc3QoZW50cnkubmFtZSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIEZpbHRlcih2YWx1ZSkge1xuICAgIGFzc2VydChcbiAgICAgICAgdmFsdWUgPT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgfHwgdmFsdWUgaW5zdGFuY2VvZiBSZWdFeHBcbiAgICApXG5cbiAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB0aGlzLmxlbmd0aCA9IDBcbn1cblxuZnVuY3Rpb24gZmluZEVxdWl2YWxlbnQobm9kZSwgZW50cnkpIHtcbiAgICBhc3NlcnQobm9kZSAhPSBudWxsICYmIHR5cGVvZiBub2RlID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0eXBlb2YgZW50cnkgPT09IFwic3RyaW5nXCIgfHwgZW50cnkgaW5zdGFuY2VvZiBSZWdFeHApXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGlzRXF1aXZhbGVudChub2RlW2ldLnZhbHVlLCBlbnRyeSkpIHJldHVybiBub2RlW2ldXG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIFZhbGlkYXRlIGEgc2VsZWN0b3IgYXQgdGhlIEFQSSBsZXZlbC5cbiAqL1xuZXhwb3J0cy52YWxpZGF0ZSA9IGZ1bmN0aW9uIChsaXN0KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IGxpc3RbaV1cblxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgc2VsZWN0b3IgXCIgKyBpICsgXCIgdG8gYmUgYW4gYXJyYXlcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc2VsZWN0b3IubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIC8vIFN0cmluZ3MgYW5kIHJlZ3VsYXIgZXhwcmVzc2lvbnMgYXJlIHRoZSBvbmx5IHRoaW5ncyBhbGxvd2VkLlxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzZWxlY3RvcltqXSAhPT0gXCJzdHJpbmdcIiAmJlxuICAgICAgICAgICAgICAgICAgICAhKHNlbGVjdG9yW2pdIGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIFwiU2VsZWN0b3IgXCIgKyBpICsgXCIgbWF5IG9ubHkgY29uc2lzdCBvZiBzdHJpbmdzIGFuZCBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwicmVndWxhciBleHByZXNzaW9uc1wiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIENyZWF0ZSBhIGZpbHRlciBmcm9tIGEgbGlzdCBvZiBzZWxlY3RvcnNcbiAqL1xuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiAobGlzdCkge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGxpc3QpKVxuICAgIHZhciBmaWx0ZXIgPSBuZXcgRmlsdGVyKClcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2VsZWN0b3IgPSBsaXN0W2ldXG4gICAgICAgIHZhciBub2RlID0gZmlsdGVyXG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzZWxlY3Rvci5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIGVudHJ5ID0gc2VsZWN0b3Jbal1cbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGZpbmRFcXVpdmFsZW50KG5vZGUsIGVudHJ5KVxuXG4gICAgICAgICAgICBpZiAoY2hpbGQgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNoaWxkID0gbmV3IEZpbHRlcihlbnRyeSlcbiAgICAgICAgICAgICAgICBub2RlW25vZGUubGVuZ3RoKytdID0gY2hpbGRcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZSA9IGNoaWxkXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlsdGVyXG59XG5cbi8qKlxuICogVGVzdCBpZiBhIHBhdGggbWF0Y2hlcyBhIGZpbHRlci4gUmV0dXJucyBgdW5kZWZpbmVkYCBpZiBubyBtYXRjaCwgYGZhbHNlYCBpZlxuICogaW5jb21wbGV0ZSwgYW5kIGB0cnVlYCBpZiBleGFjdC5cbiAqL1xuZXhwb3J0cy50ZXN0ID0gZnVuY3Rpb24gKHBhdGgsIGZpbHRlcikge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHBhdGgpKVxuICAgIGFzc2VydChmaWx0ZXIgIT0gbnVsbCAmJiB0eXBlb2YgZmlsdGVyID09PSBcIm9iamVjdFwiKVxuXG4gICAgbG9vcDogLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sYWJlbHNcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gcGF0aFtpXVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZmlsdGVyLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2hlcyhmaWx0ZXJbal0udmFsdWUsIGVudHJ5KSkge1xuICAgICAgICAgICAgICAgIGZpbHRlciA9IGZpbHRlcltqXVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlIGxvb3AgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sYWJlbHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICByZXR1cm4gZmlsdGVyLmxlbmd0aCA9PT0gMFxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIGFzc2VydCA9IHJlcXVpcmUoXCIuLi91dGlsXCIpLmFzc2VydFxuXG4vKipcbiAqIEFsbCB0aGUgcmVwb3J0IHR5cGVzLiBUaGUgb25seSByZWFzb24gdGhlcmUgYXJlIG1vcmUgdGhhbiB0d28gdHlwZXMgKG5vcm1hbFxuICogYW5kIGhvb2spIGlzIGZvciB0aGUgdXNlcidzIGJlbmVmaXQgKGRldiB0b29scywgYHV0aWwuaW5zcGVjdGAsIGV0Yy4pXG4gKi9cblxudmFyIFR5cGVzID0gZXhwb3J0cy5UeXBlcyA9IE9iamVjdC5mcmVlemUoe1xuICAgIFN0YXJ0OiAwLFxuICAgIEVudGVyOiAxLFxuICAgIExlYXZlOiAyLFxuICAgIFBhc3M6IDMsXG4gICAgRmFpbDogNCxcbiAgICBTa2lwOiA1LFxuICAgIEVuZDogNixcbiAgICBFcnJvcjogNyxcblxuICAgIC8vIE5vdGUgdGhhdCBgSG9va2AgaXMgYWN0dWFsbHkgYSBiaXQgZmxhZywgdG8gc2F2ZSBzb21lIHNwYWNlIChhbmQgdG9cbiAgICAvLyBzaW1wbGlmeSB0aGUgdHlwZSByZXByZXNlbnRhdGlvbikuXG4gICAgSG9vazogOCxcbn0pXG5cbnZhciBIb29rU3RhZ2UgPSBleHBvcnRzLkhvb2tTdGFnZSA9IE9iamVjdC5mcmVlemUoe1xuICAgIEJlZm9yZUFsbDogVHlwZXMuSG9vayB8IDAsXG4gICAgQmVmb3JlRWFjaDogVHlwZXMuSG9vayB8IDEsXG4gICAgQWZ0ZXJFYWNoOiBUeXBlcy5Ib29rIHwgMixcbiAgICBBZnRlckFsbDogVHlwZXMuSG9vayB8IDMsXG59KVxuXG5leHBvcnRzLlJlcG9ydCA9IFJlcG9ydFxuZnVuY3Rpb24gUmVwb3J0KHR5cGUpIHtcbiAgICBhc3NlcnQodHlwZW9mIHR5cGUgPT09IFwibnVtYmVyXCIpXG5cbiAgICB0aGlzLl8gPSB0eXBlXG59XG5cbi8vIEF2b2lkIGEgcmVjdXJzaXZlIGNhbGwgd2hlbiBgaW5zcGVjdGBpbmcgYSByZXN1bHQgd2hpbGUgc3RpbGwga2VlcGluZyBpdFxuLy8gc3R5bGVkIGxpa2UgaXQgd291bGQgYmUgbm9ybWFsbHkuIEVhY2ggdHlwZSB1c2VzIGEgbmFtZWQgc2luZ2xldG9uIGZhY3RvcnkgdG9cbi8vIGVuc3VyZSBlbmdpbmVzIHNob3cgdGhlIGNvcnJlY3QgYG5hbWVgL2BkaXNwbGF5TmFtZWAgZm9yIHRoZSB0eXBlLlxuZnVuY3Rpb24gaW5pdEluc3BlY3QoaW5zcGVjdCwgcmVwb3J0KSB7XG4gICAgdmFyIHR5cGUgPSByZXBvcnQuX1xuXG4gICAgaWYgKHR5cGUgJiBUeXBlcy5Ib29rKSB7XG4gICAgICAgIGluc3BlY3Quc3RhZ2UgPSByZXBvcnQuc3RhZ2VcbiAgICB9XG5cbiAgICBpZiAodHlwZSAhPT0gVHlwZXMuU3RhcnQgJiZcbiAgICAgICAgICAgIHR5cGUgIT09IFR5cGVzLkVuZCAmJlxuICAgICAgICAgICAgdHlwZSAhPT0gVHlwZXMuRXJyb3IpIHtcbiAgICAgICAgaW5zcGVjdC5wYXRoID0gcmVwb3J0LnBhdGhcbiAgICB9XG5cbiAgICBpZiAodHlwZSAmIFR5cGVzLkhvb2spIHtcbiAgICAgICAgaW5zcGVjdC5yb290UGF0aCA9IHJlcG9ydC5yb290UGF0aFxuICAgIH1cblxuICAgIC8vIE9ubHkgYWRkIHRoZSByZWxldmFudCBwcm9wZXJ0aWVzXG4gICAgaWYgKHR5cGUgPT09IFR5cGVzLkZhaWwgfHxcbiAgICAgICAgICAgIHR5cGUgPT09IFR5cGVzLkVycm9yIHx8XG4gICAgICAgICAgICB0eXBlICYgVHlwZXMuSG9vaykge1xuICAgICAgICBpbnNwZWN0LnZhbHVlID0gcmVwb3J0LnZhbHVlXG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09IFR5cGVzLkVudGVyIHx8XG4gICAgICAgICAgICB0eXBlID09PSBUeXBlcy5QYXNzIHx8XG4gICAgICAgICAgICB0eXBlID09PSBUeXBlcy5GYWlsKSB7XG4gICAgICAgIGluc3BlY3QuZHVyYXRpb24gPSByZXBvcnQuZHVyYXRpb25cbiAgICAgICAgaW5zcGVjdC5zbG93ID0gcmVwb3J0LnNsb3dcbiAgICB9XG5cbiAgICBpZiAodHlwZSA9PT0gVHlwZXMuRmFpbCkge1xuICAgICAgICBpbnNwZWN0LmlzRmFpbGFibGUgPSByZXBvcnQuaXNGYWlsYWJsZVxuICAgIH1cbn1cblxubWV0aG9kcyhSZXBvcnQsIHtcbiAgICAvLyBUaGUgcmVwb3J0IHR5cGVzXG4gICAgZ2V0IGlzU3RhcnQoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLlN0YXJ0IH0sXG4gICAgZ2V0IGlzRW50ZXIoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkVudGVyIH0sXG4gICAgZ2V0IGlzTGVhdmUoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkxlYXZlIH0sXG4gICAgZ2V0IGlzUGFzcygpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuUGFzcyB9LFxuICAgIGdldCBpc0ZhaWwoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkZhaWwgfSxcbiAgICBnZXQgaXNTa2lwKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5Ta2lwIH0sXG4gICAgZ2V0IGlzRW5kKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5FbmQgfSxcbiAgICBnZXQgaXNFcnJvcigpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuRXJyb3IgfSxcbiAgICBnZXQgaXNIb29rKCkgeyByZXR1cm4gKHRoaXMuXyAmIFR5cGVzLkhvb2spICE9PSAwIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBzdHJpbmdpZmllZCBkZXNjcmlwdGlvbiBvZiB0aGUgdHlwZS5cbiAgICAgKi9cbiAgICBnZXQgdHlwZSgpIHtcbiAgICAgICAgc3dpdGNoICh0aGlzLl8pIHtcbiAgICAgICAgY2FzZSBUeXBlcy5TdGFydDogcmV0dXJuIFwic3RhcnRcIlxuICAgICAgICBjYXNlIFR5cGVzLkVudGVyOiByZXR1cm4gXCJlbnRlclwiXG4gICAgICAgIGNhc2UgVHlwZXMuTGVhdmU6IHJldHVybiBcImxlYXZlXCJcbiAgICAgICAgY2FzZSBUeXBlcy5QYXNzOiByZXR1cm4gXCJwYXNzXCJcbiAgICAgICAgY2FzZSBUeXBlcy5GYWlsOiByZXR1cm4gXCJmYWlsXCJcbiAgICAgICAgY2FzZSBUeXBlcy5Ta2lwOiByZXR1cm4gXCJza2lwXCJcbiAgICAgICAgY2FzZSBUeXBlcy5FbmQ6IHJldHVybiBcImVuZFwiXG4gICAgICAgIGNhc2UgVHlwZXMuRXJyb3I6IHJldHVybiBcImVycm9yXCJcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmICh0aGlzLl8gJiBUeXBlcy5Ib29rKSByZXR1cm4gXCJob29rXCJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVucmVhY2hhYmxlXCIpXG4gICAgICAgIH1cbiAgICB9LFxufSlcblxuZXhwb3J0cy5TdGFydCA9IFN0YXJ0UmVwb3J0XG5mdW5jdGlvbiBTdGFydFJlcG9ydCgpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5TdGFydClcbn1cbm1ldGhvZHMoU3RhcnRSZXBvcnQsIFJlcG9ydCwge1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5FbnRlciA9IEVudGVyUmVwb3J0XG5mdW5jdGlvbiBFbnRlclJlcG9ydChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkVudGVyKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cbiAgICB0aGlzLnNsb3cgPSBzbG93XG59XG5tZXRob2RzKEVudGVyUmVwb3J0LCBSZXBvcnQsIHtcbiAgICAvKipcbiAgICAgKiBTbyB1dGlsLmluc3BlY3QgcHJvdmlkZXMgbW9yZSBzZW5zaWJsZSBvdXRwdXQgZm9yIHRlc3RpbmcvZXRjLlxuICAgICAqL1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBFbnRlclJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLkxlYXZlID0gTGVhdmVSZXBvcnRcbmZ1bmN0aW9uIExlYXZlUmVwb3J0KHBhdGgpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5MZWF2ZSlcbiAgICB0aGlzLnBhdGggPSBwYXRoXG59XG5tZXRob2RzKExlYXZlUmVwb3J0LCBSZXBvcnQsIHtcbiAgICAvKipcbiAgICAgKiBTbyB1dGlsLmluc3BlY3QgcHJvdmlkZXMgbW9yZSBzZW5zaWJsZSBvdXRwdXQgZm9yIHRlc3RpbmcvZXRjLlxuICAgICAqL1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBMZWF2ZVJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLlBhc3MgPSBQYXNzUmVwb3J0XG5mdW5jdGlvbiBQYXNzUmVwb3J0KHBhdGgsIGR1cmF0aW9uLCBzbG93KSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuUGFzcylcbiAgICB0aGlzLnBhdGggPSBwYXRoXG4gICAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uXG4gICAgdGhpcy5zbG93ID0gc2xvd1xufVxubWV0aG9kcyhQYXNzUmVwb3J0LCBSZXBvcnQsIHtcbiAgICAvKipcbiAgICAgKiBTbyB1dGlsLmluc3BlY3QgcHJvdmlkZXMgbW9yZSBzZW5zaWJsZSBvdXRwdXQgZm9yIHRlc3RpbmcvZXRjLlxuICAgICAqL1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBQYXNzUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuRmFpbCA9IEZhaWxSZXBvcnRcbmZ1bmN0aW9uIEZhaWxSZXBvcnQocGF0aCwgZXJyb3IsIGR1cmF0aW9uLCBzbG93LCBpc0ZhaWxhYmxlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLkZhaWwpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxuICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxuICAgIHRoaXMuc2xvdyA9IHNsb3dcbiAgICB0aGlzLmlzRmFpbGFibGUgPSBpc0ZhaWxhYmxlXG59XG5tZXRob2RzKEZhaWxSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIEZhaWxSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5Ta2lwID0gU2tpcFJlcG9ydFxuZnVuY3Rpb24gU2tpcFJlcG9ydChwYXRoKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuU2tpcClcbiAgICB0aGlzLnBhdGggPSBwYXRoXG59XG5tZXRob2RzKFNraXBSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIFNraXBSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5FbmQgPSBFbmRSZXBvcnRcbmZ1bmN0aW9uIEVuZFJlcG9ydCgpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5FbmQpXG59XG5tZXRob2RzKEVuZFJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gRW5kUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuRXJyb3IgPSBFcnJvclJlcG9ydFxuZnVuY3Rpb24gRXJyb3JSZXBvcnQoZXJyb3IpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5FcnJvcilcbiAgICB0aGlzLmVycm9yID0gZXJyb3Jcbn1cbm1ldGhvZHMoRXJyb3JSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIEVycm9yUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbnZhciBIb29rTWV0aG9kcyA9IHtcbiAgICBnZXQgc3RhZ2UoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5fKSB7XG4gICAgICAgIGNhc2UgSG9va1N0YWdlLkJlZm9yZUFsbDogcmV0dXJuIFwiYmVmb3JlIGFsbFwiXG4gICAgICAgIGNhc2UgSG9va1N0YWdlLkJlZm9yZUVhY2g6IHJldHVybiBcImJlZm9yZSBlYWNoXCJcbiAgICAgICAgY2FzZSBIb29rU3RhZ2UuQWZ0ZXJFYWNoOiByZXR1cm4gXCJhZnRlciBlYWNoXCJcbiAgICAgICAgY2FzZSBIb29rU3RhZ2UuQWZ0ZXJBbGw6IHJldHVybiBcImFmdGVyIGFsbFwiXG4gICAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihcInVucmVhY2hhYmxlXCIpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0IGlzQmVmb3JlQWxsKCkgeyByZXR1cm4gdGhpcy5fID09PSBIb29rU3RhZ2UuQmVmb3JlQWxsIH0sXG4gICAgZ2V0IGlzQmVmb3JlRWFjaCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gSG9va1N0YWdlLkJlZm9yZUVhY2ggfSxcbiAgICBnZXQgaXNBZnRlckVhY2goKSB7IHJldHVybiB0aGlzLl8gPT09IEhvb2tTdGFnZS5BZnRlckVhY2ggfSxcbiAgICBnZXQgaXNBZnRlckFsbCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gSG9va1N0YWdlLkFmdGVyQWxsIH0sXG59XG5cbmV4cG9ydHMuSG9va0Vycm9yID0gSG9va0Vycm9yXG5mdW5jdGlvbiBIb29rRXJyb3Ioc3RhZ2UsIGZ1bmMsIGVycm9yKSB7XG4gICAgdGhpcy5fID0gc3RhZ2VcbiAgICB0aGlzLm5hbWUgPSBmdW5jLm5hbWUgfHwgZnVuYy5kaXNwbGF5TmFtZSB8fCBcIlwiXG4gICAgdGhpcy5lcnJvciA9IGVycm9yXG59XG5tZXRob2RzKEhvb2tFcnJvciwgSG9va01ldGhvZHMpXG5cbmV4cG9ydHMuSG9vayA9IEhvb2tSZXBvcnRcbmZ1bmN0aW9uIEhvb2tSZXBvcnQocGF0aCwgcm9vdFBhdGgsIGhvb2tFcnJvcikge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIGhvb2tFcnJvci5fKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLnJvb3RQYXRoID0gcm9vdFBhdGhcbiAgICB0aGlzLm5hbWUgPSBob29rRXJyb3IubmFtZVxuICAgIHRoaXMuZXJyb3IgPSBob29rRXJyb3IuZXJyb3Jcbn1cbm1ldGhvZHMoSG9va1JlcG9ydCwgUmVwb3J0LCBIb29rTWV0aG9kcywge1xuICAgIGdldCBob29rRXJyb3IoKSB7IHJldHVybiBuZXcgSG9va0Vycm9yKHRoaXMuXywgdGhpcywgdGhpcy5lcnJvcikgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuLi9tZXRob2RzXCIpXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsXCIpXG52YXIgUmVwb3J0cyA9IHJlcXVpcmUoXCIuL3JlcG9ydHNcIilcbnZhciBGaWx0ZXIgPSByZXF1aXJlKFwiLi9maWx0ZXJcIilcbnZhciBIb29rU3RhZ2UgPSBSZXBvcnRzLkhvb2tTdGFnZVxudmFyIGFzc2VydCA9IFV0aWwuYXNzZXJ0XG52YXIgcGVhY2ggPSBVdGlsLnBlYWNoXG5cbi8qKlxuICogVGhlIHRlc3RzIGFyZSBsYWlkIG91dCBpbiBhIHZlcnkgZGF0YS1kcml2ZW4gZGVzaWduLiBXaXRoIGV4Y2VwdGlvbiBvZiB0aGVcbiAqIHJlcG9ydHMsIHRoZXJlIGlzIG1pbmltYWwgb2JqZWN0IG9yaWVudGF0aW9uIGFuZCB6ZXJvIHZpcnR1YWwgZGlzcGF0Y2guXG4gKiBIZXJlJ3MgYSBxdWljayBvdmVydmlldzpcbiAqXG4gKiAtIFRoZSB0ZXN0IGhhbmRsaW5nIGRpc3BhdGNoZXMgYmFzZWQgb24gdmFyaW91cyBhdHRyaWJ1dGVzIHRoZSB0ZXN0IGhhcy4gRm9yXG4gKiAgIGV4YW1wbGUsIHJvb3RzIGFyZSBrbm93biBieSBhIGNpcmN1bGFyIHJvb3QgcmVmZXJlbmNlLCBhbmQgc2tpcHBlZCB0ZXN0c1xuICogICBhcmUga25vd24gYnkgbm90IGhhdmluZyBhIGNhbGxiYWNrLlxuICpcbiAqIC0gVGhlIHRlc3QgZXZhbHVhdGlvbiBpcyB2ZXJ5IHByb2NlZHVyYWwuIEFsdGhvdWdoIGl0J3MgdmVyeSBoaWdobHlcbiAqICAgYXN5bmNocm9ub3VzLCB0aGUgdXNlIG9mIHByb21pc2VzIGxpbmVhcml6ZSB0aGUgbG9naWMsIHNvIGl0IHJlYWRzIHZlcnlcbiAqICAgbXVjaCBsaWtlIGEgcmVjdXJzaXZlIHNldCBvZiBzdGVwcy5cbiAqXG4gKiAtIFRoZSBkYXRhIHR5cGVzIGFyZSBtb3N0bHkgZWl0aGVyIHBsYWluIG9iamVjdHMgb3IgY2xhc3NlcyB3aXRoIG5vIG1ldGhvZHMsXG4gKiAgIHRoZSBsYXR0ZXIgbW9zdGx5IGZvciBkZWJ1Z2dpbmcgaGVscC4gVGhpcyBhbHNvIGF2b2lkcyBtb3N0IG9mIHRoZVxuICogICBpbmRpcmVjdGlvbiByZXF1aXJlZCB0byBhY2NvbW1vZGF0ZSBicmVha2luZyBhYnN0cmFjdGlvbnMsIHdoaWNoIHRoZSBBUElcbiAqICAgbWV0aG9kcyBmcmVxdWVudGx5IG5lZWQgdG8gZG8uXG4gKi9cblxuLy8gUHJldmVudCBTaW5vbiBpbnRlcmZlcmVuY2Ugd2hlbiB0aGV5IGluc3RhbGwgdGhlaXIgbW9ja3NcbnZhciBzZXRUaW1lb3V0ID0gZ2xvYmFsLnNldFRpbWVvdXRcbnZhciBjbGVhclRpbWVvdXQgPSBnbG9iYWwuY2xlYXJUaW1lb3V0XG52YXIgbm93ID0gZ2xvYmFsLkRhdGUubm93XG5cbi8qKlxuICogQmFzaWMgZGF0YSB0eXBlc1xuICovXG5mdW5jdGlvbiBSZXN1bHQodGltZSwgYXR0ZW1wdCkge1xuICAgIGFzc2VydCh0eXBlb2YgdGltZSA9PT0gXCJudW1iZXJcIilcbiAgICBhc3NlcnQoYXR0ZW1wdCAhPSBudWxsICYmIHR5cGVvZiBhdHRlbXB0ID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0aW1lID49IDApXG5cbiAgICB0aGlzLnRpbWUgPSB0aW1lXG4gICAgdGhpcy5jYXVnaHQgPSBhdHRlbXB0LmNhdWdodFxuICAgIHRoaXMudmFsdWUgPSBhdHRlbXB0LmNhdWdodCA/IGF0dGVtcHQudmFsdWUgOiB1bmRlZmluZWRcbn1cblxuLyoqXG4gKiBPdmVydmlldyBvZiB0aGUgdGVzdCBwcm9wZXJ0aWVzOlxuICpcbiAqIC0gYHJvb3RgIC0gVGhlIHJvb3QgdGVzdFxuICogLSBgcmVwb3J0ZXJzYCAtIFRoZSBsaXN0IG9mIHJlcG9ydGVyc1xuICogLSBgY3VycmVudGAgLSBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudGx5IGFjdGl2ZSB0ZXN0XG4gKiAtIGB0aW1lb3V0YCAtIFRoZSB0ZXN0cydzIHRpbWVvdXQsIG9yIDAgaWYgaW5oZXJpdGVkXG4gKiAtIGBzbG93YCAtIFRoZSB0ZXN0cydzIHNsb3cgdGhyZXNob2xkXG4gKiAtIGBuYW1lYCAtIFRoZSB0ZXN0J3MgbmFtZVxuICogLSBgaW5kZXhgIC0gVGhlIHRlc3QncyBpbmRleFxuICogLSBgcGFyZW50YCAtIFRoZSB0ZXN0J3MgcGFyZW50XG4gKiAtIGBjYWxsYmFja2AgLSBUaGUgdGVzdCdzIGNhbGxiYWNrXG4gKiAtIGB0ZXN0c2AgLSBUaGUgdGVzdCdzIGNoaWxkIHRlc3RzXG4gKiAtIGBiZWZvcmVBbGxgLCBgYmVmb3JlRWFjaGAsIGBhZnRlckVhY2hgLCBgYWZ0ZXJBbGxgIC0gVGhlIHRlc3QncyB2YXJpb3VzXG4gKiAgIHNjaGVkdWxlZCBob29rc1xuICogLSBgb25seWAgLSBBIHJvb3QtbGV2ZWwgbGltaXQgb24gd2hhdCB0ZXN0cyBtYXkgYmUgcnVuXG4gKi9cblxuZnVuY3Rpb24gVGVzdChuYW1lLCBpbmRleCwgcGFyZW50LCBjYWxsYmFjaykge1xuICAgIGFzc2VydCh0eXBlb2YgbmFtZSA9PT0gXCJzdHJpbmdcIilcbiAgICBhc3NlcnQodHlwZW9mIGluZGV4ID09PSBcIm51bWJlclwiKVxuICAgIGFzc2VydChwYXJlbnQgIT0gbnVsbCAmJiB0eXBlb2YgcGFyZW50ID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIilcbiAgICBhc3NlcnQoaW5kZXggPj0gMClcblxuICAgIHRoaXMubG9ja2VkID0gdHJ1ZVxuICAgIHRoaXMucm9vdCA9IHBhcmVudC5yb290XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMuaW5kZXggPSBpbmRleFxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50XG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrXG4gICAgdGhpcy5pc0ZhaWxhYmxlID0gcGFyZW50LmlzRmFpbGFibGVcbiAgICB0aGlzLmF0dGVtcHRzID0gcGFyZW50LmF0dGVtcHRzXG5cbiAgICB0aGlzLnRpbWVvdXQgPSBwYXJlbnQudGltZW91dFxuICAgIHRoaXMuc2xvdyA9IHBhcmVudC5zbG93XG4gICAgdGhpcy50ZXN0cyA9IHVuZGVmaW5lZFxuICAgIHRoaXMuYmVmb3JlQWxsID0gdW5kZWZpbmVkXG4gICAgdGhpcy5iZWZvcmVFYWNoID0gdW5kZWZpbmVkXG4gICAgdGhpcy5hZnRlckVhY2ggPSB1bmRlZmluZWRcbiAgICB0aGlzLmFmdGVyQWxsID0gdW5kZWZpbmVkXG4gICAgdGhpcy5yZXBvcnRlciA9IHVuZGVmaW5lZFxuICAgIHRoaXMucmVmbGVjdCA9IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBSb290KCkge1xuICAgIHRoaXMubG9ja2VkID0gZmFsc2VcbiAgICB0aGlzLnJlcG9ydGVycyA9IFtdXG4gICAgdGhpcy5jdXJyZW50ID0gdGhpc1xuICAgIHRoaXMucm9vdCA9IHRoaXNcbiAgICB0aGlzLnRpbWVvdXQgPSAwXG4gICAgdGhpcy5zbG93ID0gMFxuICAgIHRoaXMuYXR0ZW1wdHMgPSAxXG4gICAgdGhpcy5pc0ZhaWxhYmxlID0gZmFsc2VcbiAgICB0aGlzLmZpbGVzID0gdW5kZWZpbmVkXG4gICAgdGhpcy5kZWZhdWx0cyA9IHVuZGVmaW5lZFxuXG4gICAgdGhpcy5vbmx5ID0gdW5kZWZpbmVkXG4gICAgdGhpcy50ZXN0cyA9IHVuZGVmaW5lZFxuICAgIHRoaXMucmVwb3J0ZXIgPSB1bmRlZmluZWRcbiAgICB0aGlzLnJlZmxlY3QgPSB1bmRlZmluZWRcbiAgICB0aGlzLmJlZm9yZUFsbCA9IHVuZGVmaW5lZFxuICAgIHRoaXMuYmVmb3JlRWFjaCA9IHVuZGVmaW5lZFxuICAgIHRoaXMuYWZ0ZXJFYWNoID0gdW5kZWZpbmVkXG4gICAgdGhpcy5hZnRlckFsbCA9IHVuZGVmaW5lZFxufVxuXG4vLyBOYW1lZCBmb3IgZGVidWdnYWJpbGl0eVxuZXhwb3J0cy5Ta2lwID0gbmV3IGZ1bmN0aW9uIFNraXAoKSB7fSgpXG5cbmZ1bmN0aW9uIG1ha2VGaWx0ZXIob3B0cywgbmFtZSkge1xuICAgIGlmIChvcHRzID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcbiAgICBpZiAob3B0c1tuYW1lXSA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIEZpbHRlci5jcmVhdGUob3B0c1tuYW1lXSlcbn1cblxuZnVuY3Rpb24gQ29udGV4dChyb290LCBvcHRzKSB7XG4gICAgYXNzZXJ0KHJvb3QgIT0gbnVsbCAmJiB0eXBlb2Ygcm9vdCA9PT0gXCJvYmplY3RcIilcbiAgICBhc3NlcnQob3B0cyA9PSBudWxsIHx8IHR5cGVvZiBvcHRzID09PSBcIm9iamVjdFwiKVxuXG4gICAgdGhpcy5yb290ID0gcm9vdFxuICAgIHRoaXMudGVzdHMgPSBbXVxuICAgIHRoaXMuaXNTdWNjZXNzID0gdHJ1ZVxuICAgIHRoaXMub25seSA9IG1ha2VGaWx0ZXIob3B0cywgXCJvbmx5XCIpIHx8IG1ha2VGaWx0ZXIocm9vdC5vcHRpb25zLCBcIm9ubHlcIilcbiAgICB0aGlzLnNraXAgPSBtYWtlRmlsdGVyKG9wdHMsIFwic2tpcFwiKSB8fCBtYWtlRmlsdGVyKHJvb3Qub3B0aW9ucywgXCJza2lwXCIpXG59XG5cbi8qKlxuICogQmFzZSB0ZXN0cyAoaS5lLiBkZWZhdWx0IGV4cG9ydCwgcmVzdWx0IG9mIGBpbnRlcm5hbC5yb290KClgKS5cbiAqL1xuXG5leHBvcnRzLmNyZWF0ZVJvb3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBSb290KClcbn1cblxuLyoqXG4gKiBBIG5vcm1hbCB0ZXN0IHRocm91Z2ggYHQudGVzdCgpYC5cbiAqL1xuXG5leHBvcnRzLmFkZFRlc3QgPSBmdW5jdGlvbiAocGFyZW50LCBuYW1lLCBjYWxsYmFjaykge1xuICAgIGFzc2VydChwYXJlbnQgIT0gbnVsbCAmJiB0eXBlb2YgcGFyZW50ID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0eXBlb2YgbmFtZSA9PT0gXCJzdHJpbmdcIilcbiAgICBhc3NlcnQodHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpXG5cbiAgICB2YXIgaW5kZXggPSBwYXJlbnQudGVzdHMgIT0gbnVsbCA/IHBhcmVudC50ZXN0cy5sZW5ndGggOiAwXG4gICAgdmFyIGJhc2UgPSBuZXcgVGVzdChuYW1lLCBpbmRleCwgcGFyZW50LCBjYWxsYmFjaylcblxuICAgIGlmIChpbmRleCkge1xuICAgICAgICBwYXJlbnQudGVzdHMucHVzaChiYXNlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudC50ZXN0cyA9IFtiYXNlXVxuICAgIH1cbn1cblxuLyoqXG4gKiBDbGVhciB0aGUgdGVzdHMgaW4gcGxhY2UuXG4gKi9cbmV4cG9ydHMuY2xlYXJUZXN0cyA9IGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICBhc3NlcnQocGFyZW50ICE9IG51bGwgJiYgdHlwZW9mIHBhcmVudCA9PT0gXCJvYmplY3RcIilcbiAgICBwYXJlbnQudGVzdHMgPSBudWxsXG59XG5cbi8qKlxuICogRXhlY3V0ZSB0aGUgdGVzdHNcbiAqL1xuXG5leHBvcnRzLmRlZmF1bHRUaW1lb3V0ID0gMjAwMCAvLyBtc1xuZXhwb3J0cy5kZWZhdWx0U2xvdyA9IDc1IC8vIG1zXG5cbmZ1bmN0aW9uIG1ha2VTbGljZSh0ZXN0cywgbGVuZ3RoKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodGVzdHMpKVxuICAgIGFzc2VydCh0eXBlb2YgbGVuZ3RoID09PSBcIm51bWJlclwiKVxuXG4gICAgdmFyIHJldCA9IG5ldyBBcnJheShsZW5ndGgpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJldFtpXSA9IHtuYW1lOiB0ZXN0c1tpXS5uYW1lLCBpbmRleDogdGVzdHNbaV0uaW5kZXh9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiByZXBvcnRXaXRoKGNvbnRleHQsIGZ1bmMpIHtcbiAgICBhc3NlcnQoY29udGV4dCAhPSBudWxsICYmIHR5cGVvZiBjb250ZXh0ID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0eXBlb2YgZnVuYyA9PT0gXCJmdW5jdGlvblwiKVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoY29udGV4dC5yb290LnJlcG9ydGVyID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgcmV0dXJuIGZ1bmMoY29udGV4dC5yb290LnJlcG9ydGVyKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVwb3J0ZXJzID0gY29udGV4dC5yb290LnJlcG9ydGVyc1xuXG4gICAgICAgIC8vIFR3byBlYXN5IGNhc2VzLlxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICBpZiAocmVwb3J0ZXJzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGZ1bmMocmVwb3J0ZXJzWzBdKVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocmVwb3J0ZXJzLm1hcChmdW5jKSlcbiAgICB9KVxufVxuXG5mdW5jdGlvbiByZXBvcnRTdGFydChjb250ZXh0KSB7XG4gICAgYXNzZXJ0KGNvbnRleHQgIT0gbnVsbCAmJiB0eXBlb2YgY29udGV4dCA9PT0gXCJvYmplY3RcIilcblxuICAgIHJldHVybiByZXBvcnRXaXRoKGNvbnRleHQsIGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuU3RhcnQoKSlcbiAgICB9KVxufVxuXG5mdW5jdGlvbiByZXBvcnRFbnRlcihjb250ZXh0LCBkdXJhdGlvbikge1xuICAgIGFzc2VydChjb250ZXh0ICE9IG51bGwgJiYgdHlwZW9mIGNvbnRleHQgPT09IFwib2JqZWN0XCIpXG4gICAgYXNzZXJ0KHR5cGVvZiBkdXJhdGlvbiA9PT0gXCJudW1iZXJcIilcblxuICAgIHZhciB0ZXN0ID0gY29udGV4dC5yb290LmN1cnJlbnRcbiAgICB2YXIgc2xvdyA9IHRlc3Quc2xvdyB8fCBleHBvcnRzLmRlZmF1bHRTbG93XG5cbiAgICByZXR1cm4gcmVwb3J0V2l0aChjb250ZXh0LCBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgdmFyIHBhdGggPSBtYWtlU2xpY2UoY29udGV4dC50ZXN0cywgY29udGV4dC50ZXN0cy5sZW5ndGgpXG5cbiAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLkVudGVyKHBhdGgsIGR1cmF0aW9uLCBzbG93KSlcbiAgICB9KVxufVxuXG5mdW5jdGlvbiByZXBvcnRMZWF2ZShjb250ZXh0KSB7XG4gICAgYXNzZXJ0KGNvbnRleHQgIT0gbnVsbCAmJiB0eXBlb2YgY29udGV4dCA9PT0gXCJvYmplY3RcIilcblxuICAgIHJldHVybiByZXBvcnRXaXRoKGNvbnRleHQsIGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuTGVhdmUoXG4gICAgICAgICAgICBtYWtlU2xpY2UoY29udGV4dC50ZXN0cywgY29udGV4dC50ZXN0cy5sZW5ndGgpKSlcbiAgICB9KVxufVxuXG5mdW5jdGlvbiByZXBvcnRQYXNzKGNvbnRleHQsIGR1cmF0aW9uKSB7XG4gICAgYXNzZXJ0KGNvbnRleHQgIT0gbnVsbCAmJiB0eXBlb2YgY29udGV4dCA9PT0gXCJvYmplY3RcIilcbiAgICBhc3NlcnQodHlwZW9mIGR1cmF0aW9uID09PSBcIm51bWJlclwiKVxuXG4gICAgdmFyIHRlc3QgPSBjb250ZXh0LnJvb3QuY3VycmVudFxuICAgIHZhciBzbG93ID0gdGVzdC5zbG93IHx8IGV4cG9ydHMuZGVmYXVsdFNsb3dcblxuICAgIHJldHVybiByZXBvcnRXaXRoKGNvbnRleHQsIGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICB2YXIgcGF0aCA9IG1ha2VTbGljZShjb250ZXh0LnRlc3RzLCBjb250ZXh0LnRlc3RzLmxlbmd0aClcblxuICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuUGFzcyhwYXRoLCBkdXJhdGlvbiwgc2xvdykpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gcmVwb3J0RmFpbChjb250ZXh0LCBlcnJvciwgZHVyYXRpb24pIHtcbiAgICBhc3NlcnQoY29udGV4dCAhPSBudWxsICYmIHR5cGVvZiBjb250ZXh0ID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0eXBlb2YgZHVyYXRpb24gPT09IFwibnVtYmVyXCIpXG5cbiAgICB2YXIgdGVzdCA9IGNvbnRleHQucm9vdC5jdXJyZW50XG4gICAgdmFyIHNsb3cgPSB0ZXN0LnNsb3cgfHwgZXhwb3J0cy5kZWZhdWx0U2xvd1xuICAgIHZhciBpc0ZhaWxhYmxlID0gdGVzdC5pc0ZhaWxhYmxlXG5cbiAgICByZXR1cm4gcmVwb3J0V2l0aChjb250ZXh0LCBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgdmFyIHBhdGggPSBtYWtlU2xpY2UoY29udGV4dC50ZXN0cywgY29udGV4dC50ZXN0cy5sZW5ndGgpXG5cbiAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLkZhaWwoXG4gICAgICAgICAgICBwYXRoLCBlcnJvciwgZHVyYXRpb24sIHNsb3csIGlzRmFpbGFibGUpKVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHJlcG9ydFNraXAoY29udGV4dCkge1xuICAgIGFzc2VydChjb250ZXh0ICE9IG51bGwgJiYgdHlwZW9mIGNvbnRleHQgPT09IFwib2JqZWN0XCIpXG5cbiAgICByZXR1cm4gcmVwb3J0V2l0aChjb250ZXh0LCBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlNraXAoXG4gICAgICAgICAgICBtYWtlU2xpY2UoY29udGV4dC50ZXN0cywgY29udGV4dC50ZXN0cy5sZW5ndGgpKSlcbiAgICB9KVxufVxuXG5mdW5jdGlvbiByZXBvcnRFbmQoY29udGV4dCkge1xuICAgIGFzc2VydChjb250ZXh0ICE9IG51bGwgJiYgdHlwZW9mIGNvbnRleHQgPT09IFwib2JqZWN0XCIpXG5cbiAgICByZXR1cm4gcmVwb3J0V2l0aChjb250ZXh0LCBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLkVuZCgpKVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHJlcG9ydEVycm9yKGNvbnRleHQsIGVycm9yKSB7XG4gICAgYXNzZXJ0KGNvbnRleHQgIT0gbnVsbCAmJiB0eXBlb2YgY29udGV4dCA9PT0gXCJvYmplY3RcIilcblxuICAgIHJldHVybiByZXBvcnRXaXRoKGNvbnRleHQsIGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuRXJyb3IoZXJyb3IpKVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHJlcG9ydEhvb2soY29udGV4dCwgdGVzdCwgZXJyb3IpIHtcbiAgICBhc3NlcnQoY29udGV4dCAhPSBudWxsICYmIHR5cGVvZiBjb250ZXh0ID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0ZXN0ICE9IG51bGwgJiYgdHlwZW9mIHRlc3QgPT09IFwib2JqZWN0XCIpXG5cbiAgICByZXR1cm4gcmVwb3J0V2l0aChjb250ZXh0LCBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLkhvb2soXG4gICAgICAgICAgICBtYWtlU2xpY2UoY29udGV4dC50ZXN0cywgY29udGV4dC50ZXN0cy5sZW5ndGgpLFxuICAgICAgICAgICAgbWFrZVNsaWNlKGNvbnRleHQudGVzdHMsIGNvbnRleHQudGVzdHMuaW5kZXhPZih0ZXN0KSArIDEpLFxuICAgICAgICAgICAgZXJyb3IpKVxuICAgIH0pXG59XG5cbi8vIFBoYW50b21KUyBhbmQgSUUgZG9uJ3QgYWRkIHRoZSBzdGFjayB1bnRpbCBpdCdzIHRocm93bi4gSW4gZmFpbGluZyBhc3luY1xuLy8gdGVzdHMsIGl0J3MgYWxyZWFkeSB0aHJvd24gaW4gYSBzZW5zZSwgc28gdGhpcyBzaG91bGQgYmUgbm9ybWFsaXplZCB3aXRoXG4vLyBvdGhlciB0ZXN0IHR5cGVzLlxudmFyIGFkZFN0YWNrID0gdHlwZW9mIG5ldyBFcnJvcigpLnN0YWNrICE9PSBcInN0cmluZ1wiXG4gICAgPyBmdW5jdGlvbiBhZGRTdGFjayhlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yICYmIGUuc3RhY2sgPT0gbnVsbCkgdGhyb3cgZVxuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgcmV0dXJuIGVcbiAgICAgICAgfVxuICAgIH1cbiAgICA6IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlIH1cblxuZnVuY3Rpb24gZ2V0VGhlbihyZXMpIHtcbiAgICBpZiAodHlwZW9mIHJlcyA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgcmVzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIHJlcy50aGVuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbn1cblxuZnVuY3Rpb24gQXN5bmNTdGF0ZShjb250ZXh0LCBzdGFydCwgcmVzb2x2ZSwgY291bnQpIHtcbiAgICBhc3NlcnQoY29udGV4dCAhPSBudWxsICYmIHR5cGVvZiBjb250ZXh0ID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0eXBlb2Ygc3RhcnQgPT09IFwibnVtYmVyXCIpXG4gICAgYXNzZXJ0KHR5cGVvZiByZXNvbHZlID09PSBcImZ1bmN0aW9uXCIpXG4gICAgYXNzZXJ0KHR5cGVvZiBjb3VudCA9PT0gXCJudW1iZXJcIilcblxuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHRcbiAgICB0aGlzLnN0YXJ0ID0gc3RhcnRcbiAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlXG4gICAgdGhpcy5jb3VudCA9IGNvdW50XG4gICAgdGhpcy50aW1lciA9IHVuZGVmaW5lZFxufVxuXG52YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpXG5cbmZ1bmN0aW9uIGFzeW5jRmluaXNoKHN0YXRlLCBhdHRlbXB0KSB7XG4gICAgYXNzZXJ0KHN0YXRlICE9IG51bGwgJiYgdHlwZW9mIHN0YXRlID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydChhdHRlbXB0ICE9IG51bGwgJiYgdHlwZW9mIGF0dGVtcHQgPT09IFwib2JqZWN0XCIpXG5cbiAgICAvLyBDYXB0dXJlIGltbWVkaWF0ZWx5LiBXb3JzdCBjYXNlIHNjZW5hcmlvLCBpdCBnZXRzIHRocm93biBhd2F5LlxuICAgIHZhciBlbmQgPSBub3coKVxuXG4gICAgaWYgKHN0YXRlLnRpbWVyKSB7XG4gICAgICAgIGNsZWFyVGltZW91dC5jYWxsKGdsb2JhbCwgc3RhdGUudGltZXIpXG4gICAgICAgIHN0YXRlLnRpbWVyID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGF0dGVtcHQuY2F1Z2h0ICYmIHN0YXRlLmNvdW50IDwgc3RhdGUuY29udGV4dC5yb290LmN1cnJlbnQuYXR0ZW1wdHMpIHtcbiAgICAgICAgLy8gRG9uJ3QgcmVjdXJzZSBzeW5jaHJvbm91c2x5LCBzaW5jZSBpdCBtYXkgYmUgcmVzb2x2ZWQgc3luY2hyb25vdXNseVxuICAgICAgICBzdGF0ZS5yZXNvbHZlKHAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaW52b2tlSW5pdChzdGF0ZS5jb250ZXh0LCBzdGF0ZS5jb3VudCArIDEpXG4gICAgICAgIH0pKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLnJlc29sdmUobmV3IFJlc3VsdChlbmQgLSBzdGF0ZS5zdGFydCwgYXR0ZW1wdCkpXG4gICAgfVxufVxuXG4vLyBBdm9pZCBjcmVhdGluZyBhIGNsb3N1cmUgaWYgcG9zc2libGUsIGluIGNhc2UgaXQgZG9lc24ndCByZXR1cm4gYSB0aGVuYWJsZS5cbmZ1bmN0aW9uIGludm9rZUluaXQoY29udGV4dCwgY291bnQpIHtcbiAgICBhc3NlcnQoY29udGV4dCAhPSBudWxsICYmIHR5cGVvZiBjb250ZXh0ID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0eXBlb2YgY291bnQgPT09IFwibnVtYmVyXCIpXG5cbiAgICB2YXIgdGVzdCA9IGNvbnRleHQucm9vdC5jdXJyZW50XG4gICAgdmFyIHN0YXJ0ID0gbm93KClcbiAgICB2YXIgdHJ5Qm9keSA9IHRyeTAodGVzdC5jYWxsYmFjaylcbiAgICB2YXIgc3luY0VuZCA9IG5vdygpXG5cbiAgICAvLyBOb3RlOiBzeW5jaHJvbm91cyBmYWlsdXJlcyBhcmUgdGVzdCBmYWlsdXJlcywgbm90IGZhdGFsIGVycm9ycy5cbiAgICBpZiAodHJ5Qm9keS5jYXVnaHQpIHtcbiAgICAgICAgaWYgKGNvdW50IDwgdGVzdC5hdHRlbXB0cykgcmV0dXJuIGludm9rZUluaXQoY29udGV4dCwgY291bnQgKyAxKVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBSZXN1bHQoc3luY0VuZCAtIHN0YXJ0LCB0cnlCb2R5KSlcbiAgICB9XG5cbiAgICB2YXIgdHJ5VGhlbiA9IHRyeTEoZ2V0VGhlbiwgdW5kZWZpbmVkLCB0cnlCb2R5LnZhbHVlKVxuXG4gICAgaWYgKHRyeVRoZW4uY2F1Z2h0KSB7XG4gICAgICAgIGlmIChjb3VudCA8IHRlc3QuYXR0ZW1wdHMpIHJldHVybiBpbnZva2VJbml0KGNvbnRleHQsIGNvdW50ICsgMSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgUmVzdWx0KHN5bmNFbmQgLSBzdGFydCwgdHJ5VGhlbikpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0cnlUaGVuLnZhbHVlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgUmVzdWx0KHN5bmNFbmQgLSBzdGFydCwgdHJ5VGhlbikpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IG5ldyBBc3luY1N0YXRlKGNvbnRleHQsIHN0YXJ0LCByZXNvbHZlLCBjb3VudClcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRyeTIodHJ5VGhlbi52YWx1ZSwgdHJ5Qm9keS52YWx1ZSxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHRyeVBhc3MoKSlcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09IG51bGwpIHJldHVyblxuICAgICAgICAgICAgICAgIGFzeW5jRmluaXNoKHN0YXRlLCB0cnlGYWlsKGFkZFN0YWNrKGUpKSlcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSlcblxuICAgICAgICBpZiAoc3RhdGUgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgIGlmIChyZXN1bHQuY2F1Z2h0KSB7XG4gICAgICAgICAgICBhc3luY0ZpbmlzaChzdGF0ZSwgcmVzdWx0KVxuICAgICAgICAgICAgc3RhdGUgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2V0IHRoZSB0aW1lb3V0ICphZnRlciogaW5pdGlhbGl6YXRpb24uIFRoZSB0aW1lb3V0IHdpbGwgbGlrZWx5IGJlXG4gICAgICAgIC8vIHNwZWNpZmllZCBkdXJpbmcgaW5pdGlhbGl6YXRpb24uXG4gICAgICAgIHZhciBtYXhUaW1lb3V0ID0gdGVzdC50aW1lb3V0IHx8IGV4cG9ydHMuZGVmYXVsdFRpbWVvdXRcblxuICAgICAgICAvLyBTZXR0aW5nIGEgdGltZW91dCBpcyBwb2ludGxlc3MgaWYgaXQncyBpbmZpbml0ZS5cbiAgICAgICAgaWYgKG1heFRpbWVvdXQgIT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICBzdGF0ZS50aW1lciA9IHNldFRpbWVvdXQuY2FsbChnbG9iYWwsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHRyeUZhaWwoYWRkU3RhY2soXG4gICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcihcIlRpbWVvdXQgb2YgXCIgKyBtYXhUaW1lb3V0ICsgXCIgcmVhY2hlZFwiKSkpKVxuICAgICAgICAgICAgICAgIHN0YXRlID0gdW5kZWZpbmVkXG4gICAgICAgICAgICB9LCBtYXhUaW1lb3V0KVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gRXJyb3JXcmFwKHRlc3QsIGVycm9yKSB7XG4gICAgYXNzZXJ0KHRlc3QgIT0gbnVsbCAmJiB0eXBlb2YgdGVzdCA9PT0gXCJvYmplY3RcIilcblxuICAgIHRoaXMudGVzdCA9IHRlc3RcbiAgICB0aGlzLmVycm9yID0gZXJyb3Jcbn1cbm1ldGhvZHMoRXJyb3JXcmFwLCBFcnJvciwge25hbWU6IFwiRXJyb3JXcmFwXCJ9KVxuXG5mdW5jdGlvbiBpbnZva2VIb29rKHRlc3QsIGxpc3QsIHN0YWdlKSB7XG4gICAgYXNzZXJ0KHRlc3QgIT0gbnVsbCAmJiB0eXBlb2YgdGVzdCA9PT0gXCJvYmplY3RcIilcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShsaXN0KSlcbiAgICByZXR1cm4gcGVhY2gobGlzdCwgZnVuY3Rpb24gKGhvb2spIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBob29rKClcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yV3JhcCh0ZXN0LCBuZXcgUmVwb3J0cy5Ib29rRXJyb3Ioc3RhZ2UsIGhvb2ssIGUpKVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZnVuY3Rpb24gaW52b2tlQmVmb3JlRWFjaCh0ZXN0KSB7XG4gICAgYXNzZXJ0KHRlc3QgIT0gbnVsbCAmJiB0eXBlb2YgdGVzdCA9PT0gXCJvYmplY3RcIilcblxuICAgIGlmICh0ZXN0LnJvb3QgPT09IHRlc3QpIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5iZWZvcmVFYWNoLCBIb29rU3RhZ2UuQmVmb3JlRWFjaClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52b2tlQmVmb3JlRWFjaCh0ZXN0LnBhcmVudCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmJlZm9yZUVhY2gsIEhvb2tTdGFnZS5CZWZvcmVFYWNoKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlQWZ0ZXJFYWNoKHRlc3QpIHtcbiAgICBhc3NlcnQodGVzdCAhPSBudWxsICYmIHR5cGVvZiB0ZXN0ID09PSBcIm9iamVjdFwiKVxuXG4gICAgaWYgKHRlc3Qucm9vdCA9PT0gdGVzdCkge1xuICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmFmdGVyRWFjaCwgSG9va1N0YWdlLkFmdGVyRWFjaClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmFmdGVyRWFjaCwgSG9va1N0YWdlLkFmdGVyRWFjaClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gaW52b2tlQWZ0ZXJFYWNoKHRlc3QucGFyZW50KSB9KVxuICAgIH1cbn1cblxuLyoqXG4gKiBUaGlzIGNoZWNrcyBpZiB0aGUgdGVzdCB3YXMgd2hpdGVsaXN0ZWQgd2l0aCBgdC5vbmx5YCBvciB0aGUgYG9ubHlgIG9wdGlvbixcbiAqIGFuZCBmb3IgY29udmVuaWVuY2UsIHJldHVybnMgYHRydWVgIGlmIG5vIHdoaXRlbGlzdCB3YXMgc3BlY2lmaWVkLlxuICovXG5mdW5jdGlvbiBpc09ubHkoY29udGV4dCkge1xuICAgIGFzc2VydChjb250ZXh0ICE9IG51bGwgJiYgdHlwZW9mIGNvbnRleHQgPT09IFwib2JqZWN0XCIpXG5cbiAgICBpZiAoY29udGV4dC5vbmx5ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKEZpbHRlci50ZXN0KGNvbnRleHQudGVzdHMsIGNvbnRleHQub25seSkgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQucm9vdC5vbmx5ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKEZpbHRlci50ZXN0KGNvbnRleHQudGVzdHMsIGNvbnRleHQucm9vdC5vbmx5KSA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIFRoaXMgY2hlY2tzIGlmIHRoZSB0ZXN0IHdhcyBibGFja2xpc3RlZCB2aWEgdGhlIGBza2lwYCBvcHRpb24uXG4gKi9cbmZ1bmN0aW9uIGlzU2tpcHBlZChjb250ZXh0KSB7XG4gICAgYXNzZXJ0KGNvbnRleHQgIT0gbnVsbCAmJiB0eXBlb2YgY29udGV4dCA9PT0gXCJvYmplY3RcIilcblxuICAgIHJldHVybiBjb250ZXh0LnNraXAgIT0gbnVsbCAmJiBGaWx0ZXIudGVzdChjb250ZXh0LnRlc3RzLCBjb250ZXh0LnNraXApXG59XG5cbmZ1bmN0aW9uIHJ1bkNoaWxkVGVzdHModGVzdCwgY29udGV4dCkge1xuICAgIGFzc2VydCh0ZXN0ICE9IG51bGwgJiYgdHlwZW9mIHRlc3QgPT09IFwib2JqZWN0XCIpXG4gICAgYXNzZXJ0KGNvbnRleHQgIT0gbnVsbCAmJiB0eXBlb2YgY29udGV4dCA9PT0gXCJvYmplY3RcIilcblxuICAgIGlmICh0ZXN0LnRlc3RzID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcblxuICAgIGZ1bmN0aW9uIGxlYXZlKCkge1xuICAgICAgICB0ZXN0LnJvb3QuY3VycmVudCA9IHRlc3RcbiAgICAgICAgY29udGV4dC50ZXN0cy5wb3AoKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJ1bkNoaWxkKGNoaWxkKSB7XG4gICAgICAgIHRlc3Qucm9vdC5jdXJyZW50ID0gY2hpbGRcbiAgICAgICAgY29udGV4dC50ZXN0cy5wdXNoKGNoaWxkKVxuXG4gICAgICAgIHJldHVybiBpbnZva2VCZWZvcmVFYWNoKHRlc3QpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bk5vcm1hbENoaWxkKGNoaWxkLCBjb250ZXh0KSB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBpbnZva2VBZnRlckVhY2godGVzdCkgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3JXcmFwKSkgdGhyb3cgZVxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydEhvb2soY29udGV4dCwgZS50ZXN0LCBlLmVycm9yKVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihsZWF2ZSwgZnVuY3Rpb24gKGUpIHsgbGVhdmUoKTsgdGhyb3cgZSB9KVxuICAgIH1cblxuICAgIHZhciByYW4gPSBmYWxzZVxuXG4gICAgcmV0dXJuIHBlYWNoKHRlc3QudGVzdHMsIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICBjb250ZXh0LnRlc3RzLnB1c2goY2hpbGQpXG4gICAgICAgIGlmICghaXNPbmx5KGNvbnRleHQpKSB7XG4gICAgICAgICAgICBjb250ZXh0LnRlc3RzLnBvcCgpXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgfSBlbHNlIGlmIChpc1NraXBwZWQoY29udGV4dCkpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBwcmUtc2tpcHBlZCB0ZXN0cy5cbiAgICAgICAgICAgIHJldHVybiByZXBvcnRTa2lwKGNvbnRleHQpLnRoZW4oXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkgeyBjb250ZXh0LnRlc3RzLnBvcCgpIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGUpIHsgY29udGV4dC50ZXN0cy5wb3AoKTsgdGhyb3cgZSB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJhbikge1xuICAgICAgICAgICAgY29udGV4dC50ZXN0cy5wb3AoKVxuICAgICAgICAgICAgcmV0dXJuIHJ1bkNoaWxkKGNoaWxkKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29udGV4dC50ZXN0cy5wb3AoKVxuICAgICAgICAgICAgcmFuID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5iZWZvcmVBbGwsIEhvb2tTdGFnZS5CZWZvcmVBbGwpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBydW5DaGlsZChjaGlsZCkgfSlcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXJhbikgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmFmdGVyQWxsLCBIb29rU3RhZ2UuQWZ0ZXJBbGwpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gY2xlYXJDaGlsZHJlbih0ZXN0KSB7XG4gICAgYXNzZXJ0KHRlc3QgIT0gbnVsbCAmJiB0eXBlb2YgdGVzdCA9PT0gXCJvYmplY3RcIilcblxuICAgIGlmICh0ZXN0LnRlc3RzID09IG51bGwpIHJldHVyblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGVzdC50ZXN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0ZXN0LnRlc3RzW2ldLnRlc3RzID0gdW5kZWZpbmVkXG4gICAgfVxufVxuXG5mdW5jdGlvbiBydW5Ob3JtYWxDaGlsZCh0ZXN0LCBjb250ZXh0KSB7XG4gICAgYXNzZXJ0KHRlc3QgIT0gbnVsbCAmJiB0eXBlb2YgdGVzdCA9PT0gXCJvYmplY3RcIilcbiAgICBhc3NlcnQoY29udGV4dCAhPSBudWxsICYmIHR5cGVvZiBjb250ZXh0ID09PSBcIm9iamVjdFwiKVxuXG4gICAgdGVzdC5sb2NrZWQgPSBmYWxzZVxuXG4gICAgcmV0dXJuIGludm9rZUluaXQoY29udGV4dCwgMSlcbiAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkgeyB0ZXN0LmxvY2tlZCA9IHRydWU7IHJldHVybiByZXN1bHQgfSxcbiAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7IHRlc3QubG9ja2VkID0gdHJ1ZTsgdGhyb3cgZXJyb3IgfSlcbiAgICAudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgIGlmIChyZXN1bHQuY2F1Z2h0KSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnZhbHVlID09PSBleHBvcnRzLlNraXApIHJldHVybiByZXBvcnRTa2lwKGNvbnRleHQpXG4gICAgICAgICAgICBpZiAoIXRlc3QuaXNGYWlsYWJsZSkgY29udGV4dC5pc1N1Y2Nlc3MgPSBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydEZhaWwoY29udGV4dCwgcmVzdWx0LnZhbHVlLCByZXN1bHQudGltZSlcbiAgICAgICAgfSBlbHNlIGlmICh0ZXN0LnRlc3RzICE9IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFJlcG9ydCB0aGlzIGFzIGlmIGl0IHdhcyBhIHBhcmVudCB0ZXN0IGlmIGl0J3MgcGFzc2luZyBhbmQgaGFzXG4gICAgICAgICAgICAvLyBjaGlsZHJlbi5cbiAgICAgICAgICAgIHJldHVybiByZXBvcnRFbnRlcihjb250ZXh0LCByZXN1bHQudGltZSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bkNoaWxkVGVzdHModGVzdCwgY29udGV4dCkgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJlcG9ydExlYXZlKGNvbnRleHQpIH0pXG4gICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3JXcmFwKSkgdGhyb3cgZVxuICAgICAgICAgICAgICAgIHJldHVybiByZXBvcnRMZWF2ZShjb250ZXh0KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydEhvb2soY29udGV4dCwgZS50ZXN0LCBlLmVycm9yKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydFBhc3MoY29udGV4dCwgcmVzdWx0LnRpbWUpXG4gICAgICAgIH1cbiAgICB9KVxuICAgIC50aGVuKFxuICAgICAgICBmdW5jdGlvbiAoKSB7IGNsZWFyQ2hpbGRyZW4odGVzdCkgfSxcbiAgICAgICAgZnVuY3Rpb24gKGUpIHsgY2xlYXJDaGlsZHJlbih0ZXN0KTsgdGhyb3cgZSB9KVxufVxuXG4vKipcbiAqIFRoaXMgcnVucyB0aGUgcm9vdCB0ZXN0IGFuZCByZXR1cm5zIGEgcHJvbWlzZSByZXNvbHZlZCB3aGVuIGl0J3MgZG9uZS5cbiAqL1xuZXhwb3J0cy5ydW5UZXN0ID0gZnVuY3Rpb24gKHJvb3QsIG9wdHMpIHtcbiAgICBhc3NlcnQocm9vdCAhPSBudWxsICYmIHR5cGVvZiByb290ID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydChvcHRzID09IG51bGwgfHwgdHlwZW9mIG9wdHMgPT09IFwib2JqZWN0XCIpXG5cbiAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KHJvb3QsIG9wdHMpXG5cbiAgICByb290LmxvY2tlZCA9IHRydWVcbiAgICByZXR1cm4gcmVwb3J0U3RhcnQoY29udGV4dClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBydW5DaGlsZFRlc3RzKHJvb3QsIGNvbnRleHQpIH0pXG4gICAgLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcldyYXApKSB0aHJvdyBlXG4gICAgICAgIHJldHVybiByZXBvcnRIb29rKGNvbnRleHQsIGUudGVzdCwgZS5lcnJvcilcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJlcG9ydEVuZChjb250ZXh0KSB9KVxuICAgIC8vIFRlbGwgdGhlIHJlcG9ydGVyIHNvbWV0aGluZyBoYXBwZW5lZC4gT3RoZXJ3aXNlLCBpdCdsbCBoYXZlIHRvIHdyYXAgdGhpc1xuICAgIC8vIG1ldGhvZCBpbiBhIHBsdWdpbiwgd2hpY2ggc2hvdWxkbid0IGJlIG5lY2Vzc2FyeS5cbiAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIHJlcG9ydEVycm9yKGNvbnRleHQsIGUpLnRoZW4oZnVuY3Rpb24gKCkgeyB0aHJvdyBlIH0pXG4gICAgfSlcbiAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2xlYXJDaGlsZHJlbihyb290KVxuICAgICAgICAgICAgcm9vdC5sb2NrZWQgPSBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpc1N1Y2Nlc3M6IGNvbnRleHQuaXNTdWNjZXNzLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgY2xlYXJDaGlsZHJlbihyb290KVxuICAgICAgICAgICAgcm9vdC5sb2NrZWQgPSBmYWxzZVxuICAgICAgICAgICAgdGhyb3cgZVxuICAgICAgICB9KVxufVxuXG4vLyBIZWxwIG9wdGltaXplIGZvciBpbmVmZmljaWVudCBleGNlcHRpb24gaGFuZGxpbmcgaW4gVjhcblxuZnVuY3Rpb24gdHJ5UGFzcyh2YWx1ZSkge1xuICAgIHJldHVybiB7Y2F1Z2h0OiBmYWxzZSwgdmFsdWU6IHZhbHVlfVxufVxuXG5mdW5jdGlvbiB0cnlGYWlsKGUpIHtcbiAgICByZXR1cm4ge2NhdWdodDogdHJ1ZSwgdmFsdWU6IGV9XG59XG5cbmZ1bmN0aW9uIHRyeTAoZnVuYykge1xuICAgIGFzc2VydCh0eXBlb2YgZnVuYyA9PT0gXCJmdW5jdGlvblwiKVxuXG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRyeVBhc3MoZnVuYygpKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHRyeUZhaWwoZSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyeTEoZnVuYywgaW5zdCwgYXJnMCkge1xuICAgIGFzc2VydCh0eXBlb2YgZnVuYyA9PT0gXCJmdW5jdGlvblwiKVxuXG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRyeVBhc3MoZnVuYy5jYWxsKGluc3QsIGFyZzApKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHRyeUZhaWwoZSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyeTIoZnVuYywgaW5zdCwgYXJnMCwgYXJnMSkge1xuICAgIGFzc2VydCh0eXBlb2YgZnVuYyA9PT0gXCJmdW5jdGlvblwiKVxuXG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRyeVBhc3MoZnVuYy5jYWxsKGluc3QsIGFyZzAsIGFyZzEpKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHRyeUZhaWwoZSlcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIFRoZSByZXBvcnRlciBhbmQgdGVzdCBpbml0aWFsaXphdGlvbiBzZXF1ZW5jZSwgYW5kIHNjcmlwdCBsb2FkaW5nLiBUaGlzXG4gKiBkb2Vzbid0IHVuZGVyc3RhbmQgYW55dGhpbmcgdmlldy13aXNlLlxuICovXG5cbnZhciBkZWZhdWx0VCA9IHJlcXVpcmUoXCIuLi8uLi9pbmRleFwiKVxuXG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcIi4uL3V0aWxcIikuYXNzZXJ0XG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuLi9tZXRob2RzXCIpXG52YXIgUiA9IHJlcXVpcmUoXCIuLi9yZXBvcnRlclwiKVxuXG52YXIgRCA9IHJlcXVpcmUoXCIuL2luamVjdFwiKVxudmFyIHJ1blRlc3RzID0gcmVxdWlyZShcIi4vcnVuLXRlc3RzXCIpXG52YXIgaW5qZWN0U3R5bGVzID0gcmVxdWlyZShcIi4vaW5qZWN0LXN0eWxlc1wiKVxudmFyIFZpZXcgPSByZXF1aXJlKFwiLi92aWV3XCIpXG5cbmZ1bmN0aW9uIFRyZWUobmFtZSkge1xuICAgIGFzc2VydChuYW1lID09IG51bGwgfHwgdHlwZW9mIG5hbWUgPT09IFwic3RyaW5nXCIpXG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMuc3RhdHVzID0gUi5TdGF0dXMuVW5rbm93blxuICAgIHRoaXMubm9kZSA9IG51bGxcbiAgICB0aGlzLmNoaWxkcmVuID0gT2JqZWN0LmNyZWF0ZShudWxsKVxufVxuXG52YXIgcmVwb3J0ZXIgPSBSLm9uKFwiZG9tXCIsIHtcbiAgICBhY2NlcHRzOiBbXSxcbiAgICBjcmVhdGU6IGZ1bmN0aW9uIChvcHRzLCBtZXRob2RzKSB7XG4gICAgICAgIGFzc2VydChvcHRzICE9IG51bGwgJiYgdHlwZW9mIG9wdHMgPT09IFwib2JqZWN0XCIpXG4gICAgICAgIGFzc2VydChtZXRob2RzICE9IG51bGwgJiYgdHlwZW9mIG1ldGhvZHMgPT09IFwib2JqZWN0XCIpXG5cbiAgICAgICAgdmFyIHJlcG9ydGVyID0gbmV3IFIuUmVwb3J0ZXIoVHJlZSwgdW5kZWZpbmVkLCBtZXRob2RzLCBmYWxzZSlcblxuICAgICAgICByZXBvcnRlci5vcHRzID0gb3B0c1xuICAgICAgICByZXR1cm4gcmVwb3J0ZXJcbiAgICB9LFxuXG4gICAgLy8gR2l2ZSB0aGUgYnJvd3NlciBhIGNoYW5jZSB0byByZXBhaW50IGJlZm9yZSBjb250aW51aW5nIChtaWNyb3Rhc2tzXG4gICAgLy8gbm9ybWFsbHkgYmxvY2sgcmVuZGVyaW5nKS5cbiAgICBhZnRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoVmlldy5uZXh0RnJhbWUpXG4gICAgfSxcblxuICAgIHJlcG9ydDogZnVuY3Rpb24gKF8sIHJlcG9ydCkge1xuICAgICAgICByZXR1cm4gVmlldy5yZXBvcnQoXywgcmVwb3J0KVxuICAgIH0sXG59KVxuXG5mdW5jdGlvbiBub29wKCkge31cblxuZnVuY3Rpb24gc2V0RGVmYXVsdHNDaGVja2VkKG9wdHMpIHtcbiAgICBhc3NlcnQob3B0cyAhPSBudWxsICYmIHR5cGVvZiBvcHRzID09PSBcIm9iamVjdFwiKVxuXG4gICAgaWYgKG9wdHMudGl0bGUgPT0gbnVsbCkgb3B0cy50aXRsZSA9IFwiVGhhbGxpdW0gdGVzdHNcIlxuICAgIGlmIChvcHRzLnRpbWVvdXQgPT0gbnVsbCkgb3B0cy50aW1lb3V0ID0gNTAwMFxuICAgIGlmIChvcHRzLmZpbGVzID09IG51bGwpIG9wdHMuZmlsZXMgPSBbXVxuICAgIGlmIChvcHRzLnByZWxvYWQgPT0gbnVsbCkgb3B0cy5wcmVsb2FkID0gbm9vcFxuICAgIGlmIChvcHRzLnByZXJ1biA9PSBudWxsKSBvcHRzLnByZXJ1biA9IG5vb3BcbiAgICBpZiAob3B0cy5wb3N0cnVuID09IG51bGwpIG9wdHMucG9zdHJ1biA9IG5vb3BcbiAgICBpZiAob3B0cy5lcnJvciA9PSBudWxsKSBvcHRzLmVycm9yID0gbm9vcFxuICAgIGlmIChvcHRzLnRoYWxsaXVtID09IG51bGwpIG9wdHMudGhhbGxpdW0gPSBkZWZhdWx0VFxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLnRpdGxlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb3B0cy50aXRsZWAgbXVzdCBiZSBhIHN0cmluZyBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHMudGltZW91dCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9wdHMudGltZW91dGAgbXVzdCBiZSBhIG51bWJlciBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkob3B0cy5maWxlcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvcHRzLmZpbGVzYCBtdXN0IGJlIGFuIGFycmF5IGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5wcmVsb2FkICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvcHRzLnByZWxvYWRgIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHMucHJlcnVuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvcHRzLnByZXJ1bmAgbXVzdCBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0cy5wb3N0cnVuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvcHRzLnBvc3RydW5gIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHMuZXJyb3IgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9wdHMuZXJyb3JgIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHMudGhhbGxpdW0gIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIFwiYG9wdHMudGhhbGxpdW1gIG11c3QgYmUgYSBUaGFsbGl1bSBpbnN0YW5jZSBpZiBwYXNzZWRcIilcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG9uUmVhZHkoaW5pdCkge1xuICAgIGFzc2VydCh0eXBlb2YgaW5pdCA9PT0gXCJmdW5jdGlvblwiKVxuXG4gICAgaWYgKEQuZG9jdW1lbnQuYm9keSAhPSBudWxsKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluaXQoKSlcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICAgICAgRC5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXNvbHZlKGluaXQoKSlcbiAgICAgICAgfSwgZmFsc2UpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gRE9NKG9wdHMpIHtcbiAgICBhc3NlcnQob3B0cyAhPSBudWxsICYmIHR5cGVvZiBvcHRzID09PSBcIm9iamVjdFwiKVxuXG4gICAgdGhpcy5fb3B0cyA9IG9wdHNcbiAgICB0aGlzLl9kZXN0cm95UHJvbWlzZSA9IHVuZGVmaW5lZFxuICAgIHRoaXMuX2RhdGEgPSBvblJlYWR5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2V0RGVmYXVsdHNDaGVja2VkKG9wdHMpXG4gICAgICAgIGlmICghRC5kb2N1bWVudC50aXRsZSkgRC5kb2N1bWVudC50aXRsZSA9IG9wdHMudGl0bGVcbiAgICAgICAgaW5qZWN0U3R5bGVzKClcbiAgICAgICAgdmFyIGRhdGEgPSBWaWV3LmluaXQob3B0cylcblxuICAgICAgICBvcHRzLnRoYWxsaXVtLnJlcG9ydGVyID0gcmVwb3J0ZXIoZGF0YS5zdGF0ZSlcbiAgICAgICAgcmV0dXJuIGRhdGFcbiAgICB9KVxufVxuXG5tZXRob2RzKERPTSwge1xuICAgIHJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fZGVzdHJveVByb21pc2UgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlRoZSB0ZXN0IHN1aXRlIG11c3Qgbm90IGJlIHJ1biBhZnRlciB0aGUgdmlldyBoYXMgYmVlbiBcIiArXG4gICAgICAgICAgICAgICAgXCJkZXRhY2hlZC5cIlxuICAgICAgICAgICAgKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBvcHRzID0gdGhpcy5fb3B0c1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBydW5UZXN0cyhvcHRzLCBkYXRhLnN0YXRlKVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBkZXRhY2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Rlc3Ryb3lQcm9taXNlICE9IG51bGwpIHJldHVybiB0aGlzLl9kZXN0cm95UHJvbWlzZVxuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgICAgICByZXR1cm4gdGhpcy5fZGVzdHJveVByb21pc2UgPSBzZWxmLl9kYXRhLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEuc3RhdGUubG9ja2VkID0gdHJ1ZVxuICAgICAgICAgICAgaWYgKGRhdGEuc3RhdGUuY3VycmVudFByb21pc2UgPT0gbnVsbCkgcmV0dXJuIGRhdGFcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnN0YXRlLmN1cnJlbnRQcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gZGF0YSB9KVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgc2VsZi5fb3B0cyA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgc2VsZi5fZGF0YSA9IHNlbGYuX2Rlc3Ryb3lQcm9taXNlXG5cbiAgICAgICAgICAgIHdoaWxlIChkYXRhLnJvb3QuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIGRhdGEucm9vdC5yZW1vdmVDaGlsZChkYXRhLnJvb3QuZmlyc3RDaGlsZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9LFxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cykge1xuICAgIGlmIChvcHRzID09IG51bGwpIHJldHVybiBuZXcgRE9NKHt9KVxuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdHMpKSByZXR1cm4gbmV3IERPTSh7ZmlsZXM6IG9wdHN9KVxuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gXCJvYmplY3RcIikgcmV0dXJuIG5ldyBET00ob3B0cylcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9wdHNgIG11c3QgYmUgYW4gb2JqZWN0IG9yIGFycmF5IG9mIGZpbGVzIGlmIHBhc3NlZFwiKVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbFwiKVxudmFyIEQgPSByZXF1aXJlKFwiLi9pbmplY3RcIilcbnZhciBhc3NlcnQgPSBVdGlsLmFzc2VydFxuXG4vKipcbiAqIFRoZSByZXBvcnRlciBzdHlsZXNoZWV0LiBIZXJlJ3MgdGhlIGZvcm1hdDpcbiAqXG4gKiAvLyBTaW5nbGUgaXRlbVxuICogXCIuc2VsZWN0b3JcIjoge1xuICogICAgIC8vIHByb3BzLi4uXG4gKiB9XG4gKlxuICogLy8gRHVwbGljYXRlIGVudHJpZXNcbiAqIFwiLnNlbGVjdG9yXCI6IHtcbiAqICAgICBcInByb3BcIjogW1xuICogICAgICAgICAvLyB2YWx1ZXMuLi5cbiAqICAgICBdLFxuICogfVxuICpcbiAqIC8vIER1cGxpY2F0ZSBzZWxlY3RvcnNcbiAqIFwiLnNlbGVjdG9yXCI6IFtcbiAqICAgICAvLyB2YWx1ZXMuLi5cbiAqIF1cbiAqXG4gKiAvLyBNZWRpYSBxdWVyeVxuICogXCJAbWVkaWEgc2NyZWVuXCI6IHtcbiAqICAgICAvLyBzZWxlY3RvcnMuLi5cbiAqIH1cbiAqXG4gKiBOb3RlIHRoYXQgQ1NTIHN0cmluZ3MgKm11c3QqIGJlIHF1b3RlZCBpbnNpZGUgdGhlIHZhbHVlLlxuICovXG5cbnZhciBzdHlsZXMgPSBVdGlsLmxhenkoZnVuY3Rpb24gKCkge1xuICAgIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbiAgICAvKipcbiAgICAgKiBQYXJ0aWFsbHkgdGFrZW4gYW5kIGFkYXB0ZWQgZnJvbSBub3JtYWxpemUuY3NzIChsaWNlbnNlZCB1bmRlciB0aGUgTUlUXG4gICAgICogTGljZW5zZSkuXG4gICAgICogaHR0cHM6Ly9naXRodWIuY29tL25lY29sYXMvbm9ybWFsaXplLmNzc1xuICAgICAqL1xuICAgIHZhciBzdHlsZU9iamVjdCA9IHtcbiAgICAgICAgXCIjdGxcIjoge1xuICAgICAgICAgICAgXCJmb250LWZhbWlseVwiOiBcInNhbnMtc2VyaWZcIixcbiAgICAgICAgICAgIFwibGluZS1oZWlnaHRcIjogXCIxLjE1XCIsXG4gICAgICAgICAgICBcIi1tcy10ZXh0LXNpemUtYWRqdXN0XCI6IFwiMTAwJVwiLFxuICAgICAgICAgICAgXCItd2Via2l0LXRleHQtc2l6ZS1hZGp1c3RcIjogXCIxMDAlXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgYnV0dG9uXCI6IHtcbiAgICAgICAgICAgIFwiZm9udC1mYW1pbHlcIjogXCJzYW5zLXNlcmlmXCIsXG4gICAgICAgICAgICBcImxpbmUtaGVpZ2h0XCI6IFwiMS4xNVwiLFxuICAgICAgICAgICAgXCJvdmVyZmxvd1wiOiBcInZpc2libGVcIixcbiAgICAgICAgICAgIFwiZm9udC1zaXplXCI6IFwiMTAwJVwiLFxuICAgICAgICAgICAgXCJtYXJnaW5cIjogXCIwXCIsXG4gICAgICAgICAgICBcInRleHQtdHJhbnNmb3JtXCI6IFwibm9uZVwiLFxuICAgICAgICAgICAgXCItd2Via2l0LWFwcGVhcmFuY2VcIjogXCJidXR0b25cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBoMVwiOiB7XG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjJlbVwiLFxuICAgICAgICAgICAgXCJtYXJnaW5cIjogXCIwLjY3ZW0gMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIGFcIjoge1xuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgICAgIFwiLXdlYmtpdC10ZXh0LWRlY29yYXRpb24tc2tpcFwiOiBcIm9iamVjdHNcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBhOmFjdGl2ZSwgI3RsIGE6aG92ZXJcIjoge1xuICAgICAgICAgICAgXCJvdXRsaW5lLXdpZHRoXCI6IFwiMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIGJ1dHRvbjo6LW1vei1mb2N1cy1pbm5lclwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1zdHlsZVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgIFwicGFkZGluZ1wiOiBcIjBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBidXR0b246LW1vei1mb2N1c3JpbmdcIjoge1xuICAgICAgICAgICAgb3V0bGluZTogXCIxcHggZG90dGVkIEJ1dHRvblRleHRcIixcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQmFzZSBzdHlsZXMuIE5vdGUgdGhhdCB0aGlzIENTUyBpcyBkZXNpZ25lZCB0byBpbnRlbnRpb25hbGx5IG92ZXJyaWRlXG4gICAgICAgICAqIG1vc3QgdGhpbmdzIHRoYXQgY291bGQgcHJvcGFnYXRlLlxuICAgICAgICAgKi9cbiAgICAgICAgXCIjdGwgKlwiOiBbXG4gICAgICAgICAgICB7XCJ0ZXh0LWFsaWduXCI6IFwibGVmdFwifSxcbiAgICAgICAgICAgIHtcInRleHQtYWxpZ25cIjogXCJzdGFydFwifSxcbiAgICAgICAgXSxcblxuICAgICAgICBcIiN0bCAudGwtcmVwb3J0LCAjdGwgLnRsLXJlcG9ydCB1bFwiOiB7XG4gICAgICAgICAgICBcImxpc3Qtc3R5bGUtdHlwZVwiOiBcIm5vbmVcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBsaSB+IC50bC1zdWl0ZVwiOiB7XG4gICAgICAgICAgICBcInBhZGRpbmctdG9wXCI6IFwiMWVtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXN1aXRlID4gaDJcIjoge1xuICAgICAgICAgICAgXCJjb2xvclwiOiBcImJsYWNrXCIsXG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjEuNWVtXCIsXG4gICAgICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IFwiYm9sZFwiLFxuICAgICAgICAgICAgXCJtYXJnaW4tYm90dG9tXCI6IFwiMC41ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtc3VpdGUgLnRsLXN1aXRlID4gaDJcIjoge1xuICAgICAgICAgICAgXCJmb250LXNpemVcIjogXCIxLjJlbVwiLFxuICAgICAgICAgICAgXCJtYXJnaW4tYm90dG9tXCI6IFwiMC4zZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtc3VpdGUgLnRsLXN1aXRlIC50bC1zdWl0ZSA+IGgyXCI6IHtcbiAgICAgICAgICAgIFwiZm9udC1zaXplXCI6IFwiMS4yZW1cIixcbiAgICAgICAgICAgIFwibWFyZ2luLWJvdHRvbVwiOiBcIjAuMmVtXCIsXG4gICAgICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IFwibm9ybWFsXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QgPiBoMlwiOiB7XG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiYmxhY2tcIixcbiAgICAgICAgICAgIFwiZm9udC1zaXplXCI6IFwiMWVtXCIsXG4gICAgICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IFwibm9ybWFsXCIsXG4gICAgICAgICAgICBcIm1hcmdpblwiOiBcIjBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdGVzdCA+IDpmaXJzdC1jaGlsZDo6YmVmb3JlXCI6IHtcbiAgICAgICAgICAgIFwiZGlzcGxheVwiOiBcImlubGluZS1ibG9ja1wiLFxuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcImJvbGRcIixcbiAgICAgICAgICAgIFwid2lkdGhcIjogXCIxLjJlbVwiLFxuICAgICAgICAgICAgXCJ0ZXh0LWFsaWduXCI6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICBcImZvbnQtZmFtaWx5XCI6IFwic2Fucy1zZXJpZlwiLFxuICAgICAgICAgICAgXCJ0ZXh0LXNoYWRvd1wiOiBcIjAgM3B4IDJweCAjOTY5Njk2XCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QudGwtZmFpbCA+IGgyLCAjdGwgLnRsLXRlc3QudGwtZXJyb3IgPiBoMlwiOiB7XG4gICAgICAgICAgICBjb2xvcjogXCIjYzAwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QudGwtc2tpcCA+IGgyXCI6IHtcbiAgICAgICAgICAgIGNvbG9yOiBcIiMwOGNcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdGVzdC50bC1wYXNzID4gOmZpcnN0LWNoaWxkOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCIn4pyTJ1wiLFxuICAgICAgICAgICAgY29sb3I6IFwiIzBjMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0LnRsLWZhaWwgPiA6Zmlyc3QtY2hpbGQ6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBjb250ZW50OiBcIifinJYnXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QudGwtZXJyb3IgPiA6Zmlyc3QtY2hpbGQ6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBjb250ZW50OiBcIichJ1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0LnRsLXNraXAgPiA6Zmlyc3QtY2hpbGQ6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBjb250ZW50OiBcIifiiJInXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXByZSwgI3RsIC50bC1kaWZmLWhlYWRlclwiOiB7XG4gICAgICAgICAgICAvLyBub3JtYWxpemUuY3NzOiBDb3JyZWN0IHRoZSBpbmhlcml0YW5jZSBhbmQgc2NhbGluZyBvZiBmb250IHNpemVcbiAgICAgICAgICAgIC8vIGluIGFsbCBicm93c2Vyc1xuICAgICAgICAgICAgXCJmb250LWZhbWlseVwiOiBcIm1vbm9zcGFjZSwgbW9ub3NwYWNlXCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmRcIjogXCIjZjBmMGYwXCIsXG4gICAgICAgICAgICBcIndoaXRlLXNwYWNlXCI6IFwicHJlXCIsXG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjAuODVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1wcmVcIjoge1xuICAgICAgICAgICAgXCJtaW4td2lkdGhcIjogXCIxMDAlXCIsXG4gICAgICAgICAgICBcImZsb2F0XCI6IFwibGVmdFwiLFxuICAgICAgICAgICAgXCJjbGVhclwiOiBcImxlZnRcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtbGluZVwiOiB7XG4gICAgICAgICAgICBkaXNwbGF5OiBcImJsb2NrXCIsXG4gICAgICAgICAgICBtYXJnaW46IFwiMCAwLjI1ZW1cIixcbiAgICAgICAgICAgIHdpZHRoOiBcIjk5JVwiLCAvLyBCZWNhdXNlIEZpcmVmb3ggc3Vja3NcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZGlmZi1oZWFkZXIgPiAqXCI6IHtcbiAgICAgICAgICAgIHBhZGRpbmc6IFwiMC4yNWVtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWRpZmYtaGVhZGVyXCI6IHtcbiAgICAgICAgICAgIFwicGFkZGluZ1wiOiBcIjAuMjVlbVwiLFxuICAgICAgICAgICAgXCJtYXJnaW4tYm90dG9tXCI6IFwiMC41ZW1cIixcbiAgICAgICAgICAgIFwiZGlzcGxheVwiOiBcImlubGluZS1ibG9ja1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1saW5lOmZpcnN0LWNoaWxkLCAjdGwgLnRsLWRpZmYtaGVhZGVyIH4gLnRsLWxpbmVcIjoge1xuICAgICAgICAgICAgXCJwYWRkaW5nLXRvcFwiOiBcIjAuMjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1saW5lOmxhc3QtY2hpbGRcIjoge1xuICAgICAgICAgICAgXCJwYWRkaW5nLWJvdHRvbVwiOiBcIjAuMjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1mYWlsIC50bC1kaXNwbGF5XCI6IHtcbiAgICAgICAgICAgIG1hcmdpbjogXCIwLjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaXNwbGF5ID4gKlwiOiB7XG4gICAgICAgICAgICBvdmVyZmxvdzogXCJhdXRvXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWRpc3BsYXkgPiA6bm90KDpsYXN0LWNoaWxkKVwiOiB7XG4gICAgICAgICAgICBcIm1hcmdpbi1ib3R0b21cIjogXCIwLjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaWZmLWFkZGVkXCI6IHtcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCIjMGMwXCIsXG4gICAgICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IFwiYm9sZFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaWZmLXJlbW92ZWRcIjoge1xuICAgICAgICAgICAgXCJjb2xvclwiOiBcIiNjMDBcIixcbiAgICAgICAgICAgIFwiZm9udC13ZWlnaHRcIjogXCJib2xkXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXN0YWNrIC50bC1saW5lXCI6IHtcbiAgICAgICAgICAgIGNvbG9yOiBcIiM4MDBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZGlmZjo6YmVmb3JlLCAjdGwgLnRsLXN0YWNrOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcIm5vcm1hbFwiLFxuICAgICAgICAgICAgXCJtYXJnaW5cIjogXCIwLjI1ZW0gMC4yNWVtIDAuMjVlbSAwXCIsXG4gICAgICAgICAgICBcImRpc3BsYXlcIjogXCJibG9ja1wiLFxuICAgICAgICAgICAgXCJmb250LXN0eWxlXCI6IFwiaXRhbGljXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWRpZmY6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBjb250ZW50OiBcIidEaWZmOidcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtc3RhY2s6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBjb250ZW50OiBcIidTdGFjazonXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWhlYWRlclwiOiB7XG4gICAgICAgICAgICBcInRleHQtYWxpZ25cIjogXCJyaWdodFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1oZWFkZXIgPiAqXCI6IHtcbiAgICAgICAgICAgIFwiZGlzcGxheVwiOiBcImlubGluZS1ibG9ja1wiLFxuICAgICAgICAgICAgXCJ0ZXh0LWFsaWduXCI6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICBcInBhZGRpbmdcIjogXCIwLjVlbSAwLjc1ZW1cIixcbiAgICAgICAgICAgIFwiYm9yZGVyXCI6IFwiMnB4IHNvbGlkICMwMGNcIixcbiAgICAgICAgICAgIFwiYm9yZGVyLXJhZGl1c1wiOiBcIjFlbVwiLFxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgICAgIFwibWFyZ2luXCI6IFwiMC4yNWVtIDAuNWVtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWhlYWRlciA+IDpmb2N1c1wiOiB7XG4gICAgICAgICAgICBvdXRsaW5lOiBcIm5vbmVcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtcnVuXCI6IHtcbiAgICAgICAgICAgIFwiYm9yZGVyLWNvbG9yXCI6IFwiIzA4MFwiLFxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwiIzBjMFwiLFxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIndoaXRlXCIsXG4gICAgICAgICAgICBcIndpZHRoXCI6IFwiNmVtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJ1bjpob3ZlclwiOiB7XG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjOGM4XCIsXG4gICAgICAgICAgICBcImNvbG9yXCI6IFwid2hpdGVcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXBhc3NcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMGMwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1mYWlsXCI6IHtcbiAgICAgICAgICAgIFwiYm9yZGVyLWNvbG9yXCI6IFwiI2MwMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10b2dnbGUudGwtc2tpcFwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiMwOGNcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXBhc3MudGwtYWN0aXZlLCAjdGwgLnRsLXRvZ2dsZS50bC1wYXNzOmFjdGl2ZVwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiMwODBcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiMwYzBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLWZhaWwudGwtYWN0aXZlLCAjdGwgLnRsLXRvZ2dsZS50bC1mYWlsOmFjdGl2ZVwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiM4MDBcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiNjMDBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXNraXAudGwtYWN0aXZlLCAjdGwgLnRsLXRvZ2dsZS50bC1za2lwOmFjdGl2ZVwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiMwNThcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiMwOGNcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXBhc3M6aG92ZXJcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMGMwXCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjYWZhXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1mYWlsOmhvdmVyXCI6IHtcbiAgICAgICAgICAgIFwiYm9yZGVyLWNvbG9yXCI6IFwiI2MwMFwiLFxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwiI2ZhYVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10b2dnbGUudGwtc2tpcDpob3ZlclwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiMwOGNcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiNiZGZcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtcmVwb3J0LnRsLXBhc3MgLnRsLXRlc3Q6bm90KC50bC1wYXNzKVwiOiB7XG4gICAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtcmVwb3J0LnRsLWZhaWwgLnRsLXRlc3Q6bm90KC50bC1mYWlsKVwiOiB7XG4gICAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtcmVwb3J0LnRsLXNraXAgLnRsLXRlc3Q6bm90KC50bC1za2lwKVwiOiB7XG4gICAgICAgICAgICBkaXNwbGF5OiBcIm5vbmVcIixcbiAgICAgICAgfSxcbiAgICB9XG5cbiAgICB2YXIgY3NzID0gXCJcIlxuXG4gICAgZnVuY3Rpb24gYXBwZW5kQmFzZShzZWxlY3RvciwgcHJvcHMpIHtcbiAgICAgICAgYXNzZXJ0KHR5cGVvZiBzZWxlY3RvciA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgY3NzICs9IHNlbGVjdG9yICsgXCJ7XCJcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9wcykpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBhcHBlbmRQcm9wcyhwcm9wc1tpXSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFwcGVuZFByb3BzKHByb3BzKVxuICAgICAgICB9XG5cbiAgICAgICAgY3NzICs9IFwifVwiXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXBwZW5kUHJvcHMocHJvcHMpIHtcbiAgICAgICAgYXNzZXJ0KHByb3BzICE9IG51bGwgJiYgdHlwZW9mIHByb3BzID09PSBcIm9iamVjdFwiKVxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHtcbiAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChwcm9wcywga2V5KSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcHJvcHNba2V5XSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICBhcHBlbmRCYXNlKGtleSwgcHJvcHNba2V5XSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjc3MgKz0ga2V5ICsgXCI6XCIgKyBwcm9wc1trZXldICsgXCI7XCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBzZWxlY3RvciBpbiBzdHlsZU9iamVjdCkge1xuICAgICAgICBpZiAoaGFzT3duLmNhbGwoc3R5bGVPYmplY3QsIHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgYXBwZW5kQmFzZShzZWxlY3Rvciwgc3R5bGVPYmplY3Rbc2VsZWN0b3JdKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNzcy5jb25jYXQoKSAvLyBIaW50IHRvIGZsYXR0ZW4uXG59KVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoRC5kb2N1bWVudC5oZWFkLnF1ZXJ5U2VsZWN0b3IoXCJzdHlsZVtkYXRhLXRsLXN0eWxlXVwiKSA9PSBudWxsKSB7XG4gICAgICAgIHZhciBzdHlsZSA9IEQuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpXG5cbiAgICAgICAgc3R5bGUudHlwZSA9IFwidGV4dC9jc3NcIlxuICAgICAgICBzdHlsZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLXRsLXN0eWxlXCIsIFwiXCIpXG4gICAgICAgIGlmIChzdHlsZS5zdHlsZVNoZWV0KSB7XG4gICAgICAgICAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSBzdHlsZXMoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoRC5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShzdHlsZXMoKSkpXG4gICAgICAgIH1cblxuICAgICAgICBELmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpXG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBUaGUgZ2xvYmFsIGluamVjdGlvbnMgZm9yIHRoZSBET00uIE1haW5seSBmb3IgZGVidWdnaW5nLlxuICovXG5cbmV4cG9ydHMuZG9jdW1lbnQgPSBnbG9iYWwuZG9jdW1lbnRcbmV4cG9ydHMud2luZG93ID0gZ2xvYmFsLndpbmRvd1xuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbFwiKVxudmFyIEQgPSByZXF1aXJlKFwiLi9pbmplY3RcIilcbnZhciBub3cgPSBEYXRlLm5vdyAvLyBBdm9pZCBTaW5vbidzIG1vY2tcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG52YXIgYXNzZXJ0ID0gVXRpbC5hc3NlcnRcblxuLyoqXG4gKiBUZXN0IHJ1bm5lciBhbmQgc2NyaXB0IGxvYWRlclxuICovXG5cbmZ1bmN0aW9uIHVuY2FjaGVkKGZpbGUpIHtcbiAgICBhc3NlcnQodHlwZW9mIGZpbGUgPT09IFwic3RyaW5nXCIpXG5cbiAgICBpZiAoZmlsZS5pbmRleE9mKFwiP1wiKSA8IDApIHtcbiAgICAgICAgcmV0dXJuIGZpbGUgKyBcIj9sb2FkZWQ9XCIgKyBub3coKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmaWxlICsgXCImbG9hZGVkPVwiICsgbm93KClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRTY3JpcHQoZmlsZSwgdGltZW91dCkge1xuICAgIGFzc2VydCh0eXBlb2YgZmlsZSA9PT0gXCJzdHJpbmdcIilcbiAgICBhc3NlcnQodHlwZW9mIHRpbWVvdXQgPT09IFwibnVtYmVyXCIpXG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICB2YXIgc2NyaXB0ID0gRC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpXG4gICAgICAgIHZhciB0aW1lciA9IGdsb2JhbC5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNsZWFyKClcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJUaW1lb3V0IGV4Y2VlZGVkIGxvYWRpbmcgJ1wiICsgZmlsZSArIFwiJ1wiKSlcbiAgICAgICAgfSwgdGltZW91dClcblxuICAgICAgICBmdW5jdGlvbiBjbGVhcihldikge1xuICAgICAgICAgICAgaWYgKGV2ICE9IG51bGwpIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgIGlmIChldiAhPSBudWxsKSBldi5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgZ2xvYmFsLmNsZWFyVGltZW91dCh0aW1lcilcbiAgICAgICAgICAgIHNjcmlwdC5vbmxvYWQgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIHNjcmlwdC5vbmVycm9yID0gdW5kZWZpbmVkXG4gICAgICAgICAgICBELmRvY3VtZW50LmhlYWQucmVtb3ZlQ2hpbGQoc2NyaXB0KVxuICAgICAgICB9XG5cbiAgICAgICAgc2NyaXB0LnNyYyA9IHVuY2FjaGVkKGZpbGUpXG4gICAgICAgIHNjcmlwdC5hc3luYyA9IHRydWVcbiAgICAgICAgc2NyaXB0LmRlZmVyID0gdHJ1ZVxuICAgICAgICBzY3JpcHQub25sb2FkID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBjbGVhcihldilcbiAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9XG5cbiAgICAgICAgc2NyaXB0Lm9uZXJyb3IgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGNsZWFyKGV2KVxuICAgICAgICAgICAgcmVqZWN0KGV2KVxuICAgICAgICB9XG5cbiAgICAgICAgRC5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdClcbiAgICB9KVxufVxuXG5mdW5jdGlvbiB0cnlEZWxldGUoa2V5KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIpXG5cbiAgICB0cnkge1xuICAgICAgICBkZWxldGUgZ2xvYmFsW2tleV1cbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIC8vIGlnbm9yZVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVzY3JpcHRvckNoYW5nZWQoYSwgYikge1xuICAgIC8vIE5vdGU6IGlmIHRoZSBkZXNjcmlwdG9yIHdhcyByZW1vdmVkLCBpdCB3b3VsZCd2ZSBiZWVuIGRlbGV0ZWQsIGFueXdheXMuXG4gICAgaWYgKGEgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKGEuY29uZmlndXJhYmxlICE9PSBiLmNvbmZpZ3VyYWJsZSkgcmV0dXJuIHRydWVcbiAgICBpZiAoYS5lbnVtZXJhYmxlICE9PSBiLmVudW1lcmFibGUpIHJldHVybiB0cnVlXG4gICAgaWYgKGEud3JpdGFibGUgIT09IGIud3JpdGFibGUpIHJldHVybiB0cnVlXG4gICAgaWYgKGEuZ2V0ICE9PSBiLmdldCkgcmV0dXJuIHRydWVcbiAgICBpZiAoYS5zZXQgIT09IGIuc2V0KSByZXR1cm4gdHJ1ZVxuICAgIGlmIChhLnZhbHVlICE9PSBiLnZhbHVlKSByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBmYWxzZVxufVxuXG4vLyBUaGVzZSBmaXJlIGRlcHJlY2F0aW9uIHdhcm5pbmdzLCBhbmQgdGh1cyBzaG91bGQgYmUgYXZvaWRlZC5cbnZhciBibGFja2xpc3QgPSBPYmplY3QuZnJlZXplKHtcbiAgICB3ZWJraXRTdG9yYWdlSW5mbzogdHJ1ZSxcbiAgICB3ZWJraXRJbmRleGVkREI6IHRydWUsXG59KVxuXG5mdW5jdGlvbiBmaW5kR2xvYmFscygpIHtcbiAgICB2YXIgZm91bmQgPSBPYmplY3Qua2V5cyhnbG9iYWwpXG4gICAgdmFyIGdsb2JhbHMgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZvdW5kLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBmb3VuZFtpXVxuXG4gICAgICAgIGlmICghaGFzT3duLmNhbGwoYmxhY2tsaXN0LCBrZXkpKSB7XG4gICAgICAgICAgICBnbG9iYWxzW2tleV0gPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGdsb2JhbCwga2V5KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdsb2JhbHNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cywgc3RhdGUpIHtcbiAgICBhc3NlcnQob3B0cyAhPSBudWxsICYmIHR5cGVvZiBvcHRzID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydChzdGF0ZSAhPSBudWxsICYmIHR5cGVvZiBzdGF0ZSA9PT0gXCJvYmplY3RcIilcblxuICAgIGlmIChzdGF0ZS5sb2NrZWQpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgIFwiVGhlIHRlc3Qgc3VpdGUgbXVzdCBub3QgYmUgcnVuIGFmdGVyIHRoZSB2aWV3IGhhcyBiZWVuIGRldGFjaGVkLlwiXG4gICAgICAgICkpXG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLmN1cnJlbnRQcm9taXNlICE9IG51bGwpIHJldHVybiBzdGF0ZS5jdXJyZW50UHJvbWlzZVxuXG4gICAgb3B0cy50aGFsbGl1bS5jbGVhclRlc3RzKClcblxuICAgIC8vIERldGVjdCBhbmQgcmVtb3ZlIGdsb2JhbHMgY3JlYXRlZCBieSBsb2FkZWQgc2NyaXB0cy5cbiAgICB2YXIgZ2xvYmFscyA9IGZpbmRHbG9iYWxzKClcblxuICAgIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgICAgIHZhciBmb3VuZCA9IE9iamVjdC5rZXlzKGdsb2JhbClcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZvdW5kLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gZm91bmRbaV1cblxuICAgICAgICAgICAgaWYgKCFoYXNPd24uY2FsbChnbG9iYWxzLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgdHJ5RGVsZXRlKGtleSlcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGVzY3JpcHRvckNoYW5nZWQoXG4gICAgICAgICAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihnbG9iYWwsIGtleSksXG4gICAgICAgICAgICAgICAgZ2xvYmFsc1trZXldXG4gICAgICAgICAgICApKSB7XG4gICAgICAgICAgICAgICAgdHJ5RGVsZXRlKGtleSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRlLmN1cnJlbnRQcm9taXNlID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXRlLmN1cnJlbnRQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHN0YXRlLnBhc3MudGV4dENvbnRlbnQgPSBcIjBcIlxuICAgICAgICBzdGF0ZS5mYWlsLnRleHRDb250ZW50ID0gXCIwXCJcbiAgICAgICAgc3RhdGUuc2tpcC50ZXh0Q29udGVudCA9IFwiMFwiXG4gICAgICAgIHJldHVybiBvcHRzLnByZWxvYWQoKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gVXRpbC5wZWFjaChvcHRzLmZpbGVzLCBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgcmV0dXJuIGxvYWRTY3JpcHQoZmlsZSwgb3B0cy50aW1lb3V0KVxuICAgICAgICB9KVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gb3B0cy5wcmVydW4oKSB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG9wdHMudGhhbGxpdW0ucnVuKCkgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBvcHRzLnBvc3RydW4oKSB9KVxuICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG9wdHMuZXJyb3IoZSkpLnRoZW4oZnVuY3Rpb24gKCkgeyB0aHJvdyBlIH0pXG4gICAgfSlcbiAgICAudGhlbihcbiAgICAgICAgZnVuY3Rpb24gKCkgeyBjbGVhbnVwKCkgfSxcbiAgICAgICAgZnVuY3Rpb24gKGUpIHsgY2xlYW51cCgpOyB0aHJvdyBlIH0pXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgZGlmZiA9IHJlcXVpcmUoXCJkaWZmXCIpXG52YXIgaW5zcGVjdCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKS5pbnNwZWN0XG5cbnZhciBSID0gcmVxdWlyZShcIi4uL3JlcG9ydGVyXCIpXG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcIi4uL3V0aWxcIikuYXNzZXJ0XG5cbnZhciBEID0gcmVxdWlyZShcIi4vaW5qZWN0XCIpXG52YXIgcnVuVGVzdHMgPSByZXF1aXJlKFwiLi9ydW4tdGVzdHNcIilcblxuLyoqXG4gKiBWaWV3IGxvZ2ljXG4gKi9cblxuZnVuY3Rpb24gdCh0ZXh0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiB0ZXh0ID09PSBcInN0cmluZ1wiKVxuICAgIHJldHVybiBELmRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpXG59XG5cbmZ1bmN0aW9uIGgodHlwZSwgYXR0cnMsIGNoaWxkcmVuKSB7XG4gICAgYXNzZXJ0KHR5cGVvZiB0eXBlID09PSBcInN0cmluZ1wiKVxuICAgIHZhciBwYXJ0cyA9IHR5cGUuc3BsaXQoL1xccysvZylcblxuICAgIGlmIChBcnJheS5pc0FycmF5KGF0dHJzKSkge1xuICAgICAgICBjaGlsZHJlbiA9IGF0dHJzXG4gICAgICAgIGF0dHJzID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGF0dHJzID09IG51bGwpIGF0dHJzID0ge31cbiAgICBpZiAoY2hpbGRyZW4gPT0gbnVsbCkgY2hpbGRyZW4gPSBbXVxuXG4gICAgdHlwZSA9IHBhcnRzWzBdXG4gICAgYXR0cnMuY2xhc3NOYW1lID0gcGFydHMuc2xpY2UoMSkuam9pbihcIiBcIilcblxuICAgIHZhciBlbGVtID0gRC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KHR5cGUpXG5cbiAgICBPYmplY3Qua2V5cyhhdHRycykuZm9yRWFjaChmdW5jdGlvbiAoYXR0cikge1xuICAgICAgICBlbGVtW2F0dHJdID0gYXR0cnNbYXR0cl1cbiAgICB9KVxuXG4gICAgY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgaWYgKGNoaWxkICE9IG51bGwpIGVsZW0uYXBwZW5kQ2hpbGQoY2hpbGQpXG4gICAgfSlcblxuICAgIHJldHVybiBlbGVtXG59XG5cbmZ1bmN0aW9uIHVuaWZpZWREaWZmKGVycikge1xuICAgIGFzc2VydChlcnIgIT0gbnVsbCAmJiB0eXBlb2YgZXJyID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydChlcnIubmFtZSA9PT0gXCJBc3NlcnRpb25FcnJvclwiKVxuXG4gICAgdmFyIGFjdHVhbCA9IGluc3BlY3QoZXJyLmFjdHVhbClcbiAgICB2YXIgZXhwZWN0ZWQgPSBpbnNwZWN0KGVyci5leHBlY3RlZClcbiAgICB2YXIgbXNnID0gZGlmZi5jcmVhdGVQYXRjaChcInN0cmluZ1wiLCBhY3R1YWwsIGV4cGVjdGVkKVxuICAgICAgICAuc3BsaXQoL1xccj9cXG58XFxyL2cpLnNsaWNlKDQpXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGxpbmUpIHsgcmV0dXJuICEvXlxcQFxcQHxeXFxcXCBObyBuZXdsaW5lLy50ZXN0KGxpbmUpIH0pXG4gICAgdmFyIGVuZCA9IG1zZy5sZW5ndGhcblxuICAgIHdoaWxlIChlbmQgIT09IDAgJiYgL15cXHMqJC9nLnRlc3QobXNnW2VuZCAtIDFdKSkgZW5kLS1cbiAgICByZXR1cm4gaChcImRpdiB0bC1kaWZmXCIsIFtcbiAgICAgICAgaChcImRpdiB0bC1kaWZmLWhlYWRlclwiLCBbXG4gICAgICAgICAgICBoKFwic3BhbiB0bC1kaWZmLWFkZGVkXCIsIFt0KFwiKyBleHBlY3RlZFwiKV0pLFxuICAgICAgICAgICAgaChcInNwYW4gdGwtZGlmZi1yZW1vdmVkXCIsIFt0KFwiLSBhY3R1YWxcIildKSxcbiAgICAgICAgXSksXG4gICAgICAgIGgoXCJkaXYgdGwtcHJlXCIsICFlbmRcbiAgICAgICAgICAgID8gW2goXCJzcGFuIHRsLWxpbmUgdGwtZGlmZi1hZGRlZFwiLCBbdChcIiAobm9uZSlcIildKV1cbiAgICAgICAgICAgIDogbXNnLnNsaWNlKDAsIGVuZClcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGxpbmUpIHsgcmV0dXJuIGxpbmUudHJpbVJpZ2h0KCkgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAobGluZVswXSA9PT0gXCIrXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoXCJzcGFuIHRsLWxpbmUgdGwtZGlmZi1hZGRlZFwiLCBbdChsaW5lKV0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsaW5lWzBdID09PSBcIi1cIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaChcInNwYW4gdGwtbGluZSB0bC1kaWZmLXJlbW92ZWRcIiwgW3QobGluZSldKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoKFwic3BhbiB0bC1saW5lIHRsLWRpZmYtbm9uZVwiLCBbdChsaW5lKV0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgKSxcbiAgICBdKVxufVxuXG5mdW5jdGlvbiB0b0xpbmVzKHN0cikge1xuICAgIGFzc2VydCh0eXBlb2Ygc3RyID09PSBcInN0cmluZ1wiKVxuXG4gICAgcmV0dXJuIGgoXCJkaXYgdGwtcHJlXCIsIHN0ci5zcGxpdCgvXFxyP1xcbnxcXHIvZykubWFwKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgIHJldHVybiBoKFwic3BhbiB0bC1saW5lXCIsIFt0KGxpbmUudHJpbVJpZ2h0KCkpXSlcbiAgICB9KSlcbn1cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IoZSwgc2hvd0RpZmYpIHtcbiAgICB2YXIgc3RhY2sgPSBSLnJlYWRTdGFjayhlKVxuXG4gICAgcmV0dXJuIGgoXCJkaXYgdGwtZGlzcGxheVwiLCBbXG4gICAgICAgIGgoXCJkaXYgdGwtbWVzc2FnZVwiLCBbdG9MaW5lcyhlLm5hbWUgKyBcIjogXCIgKyBlLm1lc3NhZ2UpXSksXG4gICAgICAgIHNob3dEaWZmID8gdW5pZmllZERpZmYoZSkgOiB1bmRlZmluZWQsXG4gICAgICAgIHN0YWNrID8gaChcImRpdiB0bC1zdGFja1wiLCBbdG9MaW5lcyhzdGFjayldKSA6IHVuZGVmaW5lZCxcbiAgICBdKVxufVxuXG5mdW5jdGlvbiBzaG93VGVzdChfLCByZXBvcnQsIGNsYXNzTmFtZSwgY2hpbGQpIHtcbiAgICBhc3NlcnQoXyAhPSBudWxsICYmIHR5cGVvZiBfID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydChyZXBvcnQgIT0gbnVsbCAmJiB0eXBlb2YgcmVwb3J0ID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0eXBlb2YgY2xhc3NOYW1lID09PSBcInN0cmluZ1wiKVxuICAgIGFzc2VydChjaGlsZCA9PSBudWxsIHx8IHR5cGVvZiBjaGlsZCA9PT0gXCJvYmplY3RcIilcblxuICAgIHZhciBlbmQgPSByZXBvcnQucGF0aC5sZW5ndGggLSAxXG4gICAgdmFyIG5hbWUgPSByZXBvcnQucGF0aFtlbmRdLm5hbWVcbiAgICB2YXIgcGFyZW50ID0gXy5nZXQocmVwb3J0LnBhdGgsIGVuZClcbiAgICB2YXIgc3BlZWQgPSBSLnNwZWVkKHJlcG9ydClcblxuICAgIGlmIChzcGVlZCA9PT0gXCJmYXN0XCIpIHtcbiAgICAgICAgcGFyZW50Lm5vZGUuYXBwZW5kQ2hpbGQoaChcImxpIFwiICsgY2xhc3NOYW1lICsgXCIgdGwtZmFzdFwiLCBbXG4gICAgICAgICAgICBoKFwiaDJcIiwgW3QobmFtZSldKSxcbiAgICAgICAgICAgIGNoaWxkLFxuICAgICAgICBdKSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXJlbnQubm9kZS5hcHBlbmRDaGlsZChoKFwibGkgXCIgKyBjbGFzc05hbWUgKyBcIiB0bC1cIiArIHNwZWVkLCBbXG4gICAgICAgICAgICBoKFwiaDJcIiwgW1xuICAgICAgICAgICAgICAgIHQobmFtZSArIFwiIChcIiksXG4gICAgICAgICAgICAgICAgaChcInNwYW4gdGwtZHVyYXRpb25cIiwgW3QoUi5mb3JtYXRUaW1lKHJlcG9ydC5kdXJhdGlvbikpXSksXG4gICAgICAgICAgICAgICAgdChcIilcIiksXG4gICAgICAgICAgICBdKSxcbiAgICAgICAgICAgIGNoaWxkLFxuICAgICAgICBdKSlcbiAgICB9XG5cbiAgICBfLm9wdHMuZHVyYXRpb24udGV4dENvbnRlbnQgPSBSLmZvcm1hdFRpbWUoXy5kdXJhdGlvbilcbn1cblxuZnVuY3Rpb24gc2hvd1NraXAoXywgcmVwb3J0KSB7XG4gICAgYXNzZXJ0KF8gIT0gbnVsbCAmJiB0eXBlb2YgXyA9PT0gXCJvYmplY3RcIilcbiAgICBhc3NlcnQocmVwb3J0ICE9IG51bGwgJiYgdHlwZW9mIHJlcG9ydCA9PT0gXCJvYmplY3RcIilcblxuICAgIHZhciBlbmQgPSByZXBvcnQucGF0aC5sZW5ndGggLSAxXG4gICAgdmFyIG5hbWUgPSByZXBvcnQucGF0aFtlbmRdLm5hbWVcbiAgICB2YXIgcGFyZW50ID0gXy5nZXQocmVwb3J0LnBhdGgsIGVuZClcblxuICAgIHBhcmVudC5ub2RlLmFwcGVuZENoaWxkKGgoXCJsaSB0bC10ZXN0IHRsLXNraXBcIiwgW1xuICAgICAgICBoKFwiaDJcIiwgW3QobmFtZSldKSxcbiAgICBdKSlcbn1cblxuZXhwb3J0cy5uZXh0RnJhbWUgPSBuZXh0RnJhbWVcbmZ1bmN0aW9uIG5leHRGcmFtZShmdW5jKSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBmdW5jID09PSBcImZ1bmN0aW9uXCIpXG5cbiAgICBpZiAoRC53aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgICAgIEQud2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGdsb2JhbC5zZXRUaW1lb3V0KGZ1bmMsIDApXG4gICAgfVxufVxuXG5leHBvcnRzLnJlcG9ydCA9IGZ1bmN0aW9uIChfLCByZXBvcnQpIHtcbiAgICBhc3NlcnQoXyAhPSBudWxsICYmIHR5cGVvZiBfID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydChyZXBvcnQgIT0gbnVsbCAmJiB0eXBlb2YgcmVwb3J0ID09PSBcIm9iamVjdFwiKVxuXG4gICAgaWYgKHJlcG9ydC5pc1N0YXJ0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgLy8gQ2xlYXIgdGhlIGVsZW1lbnQgZmlyc3QsIGp1c3QgaW4gY2FzZS5cbiAgICAgICAgICAgIHdoaWxlIChfLm9wdHMucmVwb3J0LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICBfLm9wdHMucmVwb3J0LnJlbW92ZUNoaWxkKF8ub3B0cy5yZXBvcnQuZmlyc3RDaGlsZClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRGVmZXIgdGhlIG5leHQgZnJhbWUsIHNvIHRoZSBjdXJyZW50IGNoYW5nZXMgY2FuIGJlIHNlbnQsIGluIGNhc2VcbiAgICAgICAgICAgIC8vIGl0J3MgY2xlYXJpbmcgb2xkIHRlc3QgcmVzdWx0cyBmcm9tIGEgbGFyZ2Ugc3VpdGUuIChDaHJvbWUgZG9lc1xuICAgICAgICAgICAgLy8gYmV0dGVyIGJhdGNoaW5nIHRoaXMgd2F5LCBhdCBsZWFzdC4pXG4gICAgICAgICAgICBuZXh0RnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF8uZ2V0KFtdLCAwKS5ub2RlID0gXy5vcHRzLnJlcG9ydFxuICAgICAgICAgICAgICAgIF8ub3B0cy5kdXJhdGlvbi50ZXh0Q29udGVudCA9IFIuZm9ybWF0VGltZSgwKVxuICAgICAgICAgICAgICAgIF8ub3B0cy5wYXNzLnRleHRDb250ZW50ID0gXCIwXCJcbiAgICAgICAgICAgICAgICBfLm9wdHMuZmFpbC50ZXh0Q29udGVudCA9IFwiMFwiXG4gICAgICAgICAgICAgICAgXy5vcHRzLnNraXAudGV4dENvbnRlbnQgPSBcIjBcIlxuICAgICAgICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IGgoXCJ1bFwiKVxuXG4gICAgICAgIF8uZ2V0KHJlcG9ydC5wYXRoKS5ub2RlID0gY2hpbGRcbiAgICAgICAgc2hvd1Rlc3QoXywgcmVwb3J0LCBcInRsLXN1aXRlIHRsLXBhc3NcIiwgY2hpbGQpXG4gICAgICAgIF8ub3B0cy5wYXNzLnRleHRDb250ZW50ID0gXy5wYXNzXG4gICAgfSBlbHNlIGlmIChyZXBvcnQuaXNQYXNzKSB7XG4gICAgICAgIHNob3dUZXN0KF8sIHJlcG9ydCwgXCJ0bC10ZXN0IHRsLXBhc3NcIilcbiAgICAgICAgXy5vcHRzLnBhc3MudGV4dENvbnRlbnQgPSBfLnBhc3NcbiAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgc2hvd1Rlc3QoXywgcmVwb3J0LCBcInRsLXRlc3QgdGwtZmFpbFwiLCBmb3JtYXRFcnJvcihyZXBvcnQuZXJyb3IsXG4gICAgICAgICAgICByZXBvcnQuZXJyb3IubmFtZSA9PT0gXCJBc3NlcnRpb25FcnJvclwiICYmXG4gICAgICAgICAgICAgICAgcmVwb3J0LmVycm9yLnNob3dEaWZmICE9PSBmYWxzZSkpXG4gICAgICAgIF8ub3B0cy5mYWlsLnRleHRDb250ZW50ID0gXy5mYWlsXG4gICAgfSBlbHNlIGlmIChyZXBvcnQuaXNTa2lwKSB7XG4gICAgICAgIHNob3dTa2lwKF8sIHJlcG9ydCwgXCJ0bC10ZXN0IHRsLXNraXBcIilcbiAgICAgICAgXy5vcHRzLnNraXAudGV4dENvbnRlbnQgPSBfLnNraXBcbiAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0Vycm9yKSB7XG4gICAgICAgIF8ub3B0cy5yZXBvcnQuYXBwZW5kQ2hpbGQoaChcImxpIHRsLWVycm9yXCIsIFtcbiAgICAgICAgICAgIGgoXCJoMlwiLCBbdChcIkludGVybmFsIGVycm9yXCIpXSksXG4gICAgICAgICAgICBmb3JtYXRFcnJvcihyZXBvcnQuZXJyb3IsIGZhbHNlKSxcbiAgICAgICAgXSkpXG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBtYWtlQ291bnRlcihzdGF0ZSwgY2hpbGQsIGxhYmVsLCBuYW1lKSB7XG4gICAgYXNzZXJ0KHN0YXRlICE9IG51bGwgJiYgdHlwZW9mIHN0YXRlID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydChjaGlsZCAhPSBudWxsICYmIHR5cGVvZiBjaGlsZCA9PT0gXCJvYmplY3RcIilcbiAgICBhc3NlcnQodHlwZW9mIGxhYmVsID09PSBcInN0cmluZ1wiKVxuICAgIGFzc2VydCh0eXBlb2YgbmFtZSA9PT0gXCJzdHJpbmdcIilcblxuICAgIHJldHVybiBoKFwiYnV0dG9uIHRsLXRvZ2dsZSBcIiArIG5hbWUsIHtcbiAgICAgICAgb25jbGljazogZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgICAgICAgICBpZiAoL1xcYnRsLWFjdGl2ZVxcYi8udGVzdCh0aGlzLmNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXGJ0bC1hY3RpdmVcXGIvZywgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICBzdGF0ZS5yZXBvcnQuY2xhc3NOYW1lID0gc3RhdGUucmVwb3J0LmNsYXNzTmFtZVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKFwiXFxcXGJcIiArIG5hbWUgKyBcIlxcXFxiXCIsIFwiZ1wiKSwgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICBzdGF0ZS5hY3RpdmUgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLmFjdGl2ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmFjdGl2ZS5jbGFzc05hbWUgPSBzdGF0ZS5hY3RpdmUuY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxidGwtYWN0aXZlXFxiL2csIFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzdGF0ZS5hY3RpdmUgPSB0aGlzXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc05hbWUgKz0gXCIgdGwtYWN0aXZlXCJcbiAgICAgICAgICAgICAgICBzdGF0ZS5yZXBvcnQuY2xhc3NOYW1lID0gc3RhdGUucmVwb3J0LmNsYXNzTmFtZVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxidGwtKHBhc3N8ZmFpbHxza2lwKVxcYi9nLCBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgLnRyaW0oKSArIFwiIFwiICsgbmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sIFt0KGxhYmVsKSwgY2hpbGRdKVxufVxuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAob3B0cykge1xuICAgIGFzc2VydChvcHRzICE9IG51bGwgJiYgdHlwZW9mIG9wdHMgPT09IFwib2JqZWN0XCIpXG4gICAgdmFyIHN0YXRlID0ge1xuICAgICAgICBjdXJyZW50UHJvbWlzZTogdW5kZWZpbmVkLFxuICAgICAgICBsb2NrZWQ6IGZhbHNlLFxuICAgICAgICBkdXJhdGlvbjogaChcImVtXCIsIFt0KFIuZm9ybWF0VGltZSgwKSldKSxcbiAgICAgICAgcGFzczogaChcImVtXCIsIFt0KFwiMFwiKV0pLFxuICAgICAgICBmYWlsOiBoKFwiZW1cIiwgW3QoXCIwXCIpXSksXG4gICAgICAgIHNraXA6IGgoXCJlbVwiLCBbdChcIjBcIildKSxcbiAgICAgICAgcmVwb3J0OiBoKFwidWwgdGwtcmVwb3J0XCIpLFxuICAgICAgICBhY3RpdmU6IHVuZGVmaW5lZCxcbiAgICB9XG5cbiAgICB2YXIgaGVhZGVyID0gaChcImRpdiB0bC1oZWFkZXJcIiwgW1xuICAgICAgICBoKFwiZGl2IHRsLWR1cmF0aW9uXCIsIFt0KFwiRHVyYXRpb246IFwiKSwgc3RhdGUuZHVyYXRpb25dKSxcbiAgICAgICAgbWFrZUNvdW50ZXIoc3RhdGUsIHN0YXRlLnBhc3MsIFwiUGFzc2VzOiBcIiwgXCJ0bC1wYXNzXCIpLFxuICAgICAgICBtYWtlQ291bnRlcihzdGF0ZSwgc3RhdGUuZmFpbCwgXCJGYWlsdXJlczogXCIsIFwidGwtZmFpbFwiKSxcbiAgICAgICAgbWFrZUNvdW50ZXIoc3RhdGUsIHN0YXRlLnNraXAsIFwiU2tpcHBlZDogXCIsIFwidGwtc2tpcFwiKSxcbiAgICAgICAgaChcImJ1dHRvbiB0bC1ydW5cIiwge1xuICAgICAgICAgICAgb25jbGljazogZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICAgICAgcnVuVGVzdHMob3B0cywgc3RhdGUpXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LCBbdChcIlJ1blwiKV0pLFxuICAgIF0pXG5cbiAgICB2YXIgcm9vdCA9IEQuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0bFwiKVxuXG4gICAgaWYgKHJvb3QgPT0gbnVsbCkge1xuICAgICAgICBELmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocm9vdCA9IGgoXCJkaXZcIiwge2lkOiBcInRsXCJ9LCBbXG4gICAgICAgICAgICBoZWFkZXIsXG4gICAgICAgICAgICBzdGF0ZS5yZXBvcnQsXG4gICAgICAgIF0pKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIENsZWFyIHRoZSBlbGVtZW50IGZpcnN0LCBqdXN0IGluIGNhc2UuXG4gICAgICAgIHdoaWxlIChyb290LmZpcnN0Q2hpbGQpIHJvb3QucmVtb3ZlQ2hpbGQocm9vdC5maXJzdENoaWxkKVxuICAgICAgICByb290LmFwcGVuZENoaWxkKGhlYWRlcilcbiAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChzdGF0ZS5yZXBvcnQpXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcm9vdDogcm9vdCxcbiAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKEJhc2UsIFN1cGVyKSB7XG4gICAgaWYgKHR5cGVvZiBCYXNlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGJhc2UgdG8gYmUgYSBmdW5jdGlvblwiKVxuICAgIH1cblxuICAgIHZhciBzdGFydCA9IDJcblxuICAgIGlmICh0eXBlb2YgU3VwZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBCYXNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3VwZXIucHJvdG90eXBlKVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQmFzZS5wcm90b3R5cGUsIFwiY29uc3RydWN0b3JcIiwge1xuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIHZhbHVlOiBCYXNlLFxuICAgICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0ID0gMVxuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbWV0aG9kcyA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGlmIChtZXRob2RzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWV0aG9kcyAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBtZXRob2RzIHRvIGJlIGFuIG9iamVjdFwiKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1ldGhvZHMpXG5cbiAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwga2V5cy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2tdXG4gICAgICAgICAgICAgICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG1ldGhvZHMsIGtleSlcblxuICAgICAgICAgICAgICAgIGRlc2MuZW51bWVyYWJsZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJhc2UucHJvdG90eXBlLCBrZXksIGRlc2MpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuLi9tZXRob2RzXCIpXG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcIi4uL3V0aWxcIikuYXNzZXJ0XG5cbi8qKlxuICogVGhpcyBjb250YWlucyB0aGUgYnJvd3NlciBjb25zb2xlIHN0dWZmLlxuICovXG5cbmV4cG9ydHMuc3ltYm9scyA9IE9iamVjdC5mcmVlemUoe1xuICAgIFBhc3M6IFwi4pyTXCIsXG4gICAgRmFpbDogXCLinJZcIixcbiAgICBEb3Q6IFwi4oCkXCIsXG4gICAgRG90RmFpbDogXCIhXCIsXG59KVxuXG5leHBvcnRzLndpbmRvd1dpZHRoID0gNzVcbmV4cG9ydHMubmV3bGluZSA9IFwiXFxuXCJcblxuLy8gQ29sb3Igc3VwcG9ydCBpcyB1bmZvcmNlZCBhbmQgdW5zdXBwb3J0ZWQsIHNpbmNlIHlvdSBjYW4gb25seSBzcGVjaWZ5XG4vLyBsaW5lLWJ5LWxpbmUgY29sb3JzIHZpYSBDU1MsIGFuZCBldmVuIHRoYXQgaXNuJ3QgdmVyeSBwb3J0YWJsZS5cbmV4cG9ydHMuY29sb3JTdXBwb3J0ID0ge1xuICAgIGlzU3VwcG9ydGVkOiBmYWxzZSxcbiAgICBpc0ZvcmNlZDogZmFsc2UsXG59XG5cbi8qKlxuICogU2luY2UgYnJvd3NlcnMgZG9uJ3QgaGF2ZSB1bmJ1ZmZlcmVkIG91dHB1dCwgdGhpcyBraW5kIG9mIHNpbXVsYXRlcyBpdC5cbiAqL1xuXG5leHBvcnRzLkRlZmF1bHRzID0gRGVmYXVsdHNcbmZ1bmN0aW9uIERlZmF1bHRzKG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSBvcHRzXG4gICAgdGhpcy5hY2MgPSBcIlwiXG59XG5cbm1ldGhvZHMoRGVmYXVsdHMsIHtcbiAgICB3cml0ZTogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBhc3NlcnQodHlwZW9mIHN0ciA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgdmFyIG5ld2xpbmUgPSB0aGlzLm9wdHMubmV3bGluZVxuXG4gICAgICAgIHRoaXMuYWNjICs9IHN0clxuICAgICAgICB2YXIgaW5kZXggPSBzdHIuaW5kZXhPZihuZXdsaW5lKVxuXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICAgICAgICB2YXIgbGluZXMgPSBzdHIuc3BsaXQobmV3bGluZSlcblxuICAgICAgICAgICAgdGhpcy5hY2MgPSBsaW5lcy5wb3AoKVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZ2xvYmFsLmNvbnNvbGUubG9nKGxpbmVzW2ldKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmFjYyAhPT0gXCJcIikge1xuICAgICAgICAgICAgZ2xvYmFsLmNvbnNvbGUubG9nKHRoaXMuYWNjKVxuICAgICAgICAgICAgdGhpcy5hY2MgPSBcIlwiXG4gICAgICAgIH1cbiAgICB9LFxufSlcblxudmFyIGFjYyA9IFwiXCJcblxuZXhwb3J0cy5kZWZhdWx0cyA9IHtcbiAgICB3cml0ZTogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBhc3NlcnQodHlwZW9mIHN0ciA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgYWNjICs9IHN0clxuICAgICAgICB2YXIgaW5kZXggPSBzdHIuaW5kZXhPZihleHBvcnRzLm5ld2xpbmUpXG5cbiAgICAgICAgaWYgKGluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHZhciBsaW5lcyA9IHN0ci5zcGxpdChleHBvcnRzLm5ld2xpbmUpXG5cbiAgICAgICAgICAgIGFjYyA9IGxpbmVzLnBvcCgpXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBnbG9iYWwuY29uc29sZS5sb2cobGluZXNbaV0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGFjYyAhPT0gXCJcIikge1xuICAgICAgICAgICAgZ2xvYmFsLmNvbnNvbGUubG9nKGFjYylcbiAgICAgICAgICAgIGFjYyA9IFwiXCJcbiAgICAgICAgfVxuICAgIH0sXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgZGlmZiA9IHJlcXVpcmUoXCJkaWZmXCIpXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBpbnNwZWN0ID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpLmluc3BlY3RcbnZhciBVdGlsID0gcmVxdWlyZShcIi4uL3V0aWxcIilcbnZhciBDb25zb2xlID0gcmVxdWlyZShcIi4uL3JlcGxhY2VkL2NvbnNvbGVcIilcbnZhciBhc3NlcnQgPSBVdGlsLmFzc2VydFxuXG52YXIgUmVwb3J0ZXIgPSByZXF1aXJlKFwiLi9yZXBvcnRlclwiKVxudmFyIFJVdGlsID0gcmVxdWlyZShcIi4vdXRpbFwiKVxuXG5mdW5jdGlvbiBwcmludFRpbWUoXywgcCwgc3RyKSB7XG4gICAgYXNzZXJ0KF8gIT0gbnVsbCAmJiB0eXBlb2YgXyA9PT0gXCJvYmplY3RcIilcbiAgICBhc3NlcnQocCAhPSBudWxsICYmIHR5cGVvZiBwID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0eXBlb2YgcC50aGVuID09PSBcImZ1bmN0aW9uXCIpXG4gICAgYXNzZXJ0KHR5cGVvZiBzdHIgPT09IFwic3RyaW5nXCIpXG5cbiAgICBpZiAoIV8udGltZVByaW50ZWQpIHtcbiAgICAgICAgXy50aW1lUHJpbnRlZCA9IHRydWVcbiAgICAgICAgc3RyICs9IFJVdGlsLmNvbG9yKFwibGlnaHRcIiwgXCIgKFwiICsgUlV0aWwuZm9ybWF0VGltZShfLmR1cmF0aW9uKSArIFwiKVwiKVxuICAgIH1cblxuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChzdHIpIH0pXG59XG5cbmZ1bmN0aW9uIHVuaWZpZWREaWZmKGVycikge1xuICAgIGFzc2VydChlcnIgIT0gbnVsbCAmJiB0eXBlb2YgZXJyID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydChlcnIubmFtZSA9PT0gXCJBc3NlcnRpb25FcnJvclwiKVxuXG4gICAgdmFyIGFjdHVhbCA9IGluc3BlY3QoZXJyLmFjdHVhbClcbiAgICB2YXIgZXhwZWN0ZWQgPSBpbnNwZWN0KGVyci5leHBlY3RlZClcbiAgICB2YXIgbXNnID0gZGlmZi5jcmVhdGVQYXRjaChcInN0cmluZ1wiLCBhY3R1YWwsIGV4cGVjdGVkKVxuICAgIHZhciBoZWFkZXIgPSBDb25zb2xlLm5ld2xpbmUgK1xuICAgICAgICBSVXRpbC5jb2xvcihcImRpZmYgYWRkZWRcIiwgXCIrIGV4cGVjdGVkXCIpICsgXCIgXCIgK1xuICAgICAgICBSVXRpbC5jb2xvcihcImRpZmYgcmVtb3ZlZFwiLCBcIi0gYWN0dWFsXCIpICtcbiAgICAgICAgQ29uc29sZS5uZXdsaW5lICsgQ29uc29sZS5uZXdsaW5lXG5cbiAgICByZXR1cm4gaGVhZGVyICsgbXNnLnNwbGl0KC9cXHI/XFxufFxcci9nKS5zbGljZSg0KVxuICAgIC5maWx0ZXIoZnVuY3Rpb24gKGxpbmUpIHsgcmV0dXJuICEvXlxcQFxcQHxeXFxcXCBObyBuZXdsaW5lLy50ZXN0KGxpbmUpIH0pXG4gICAgLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICBzd2l0Y2ggKGxpbmVbMF0pIHtcbiAgICAgICAgY2FzZSBcIitcIjogcmV0dXJuIFJVdGlsLmNvbG9yKFwiZGlmZiBhZGRlZFwiLCBsaW5lLnRyaW1SaWdodCgpKVxuICAgICAgICBjYXNlIFwiLVwiOiByZXR1cm4gUlV0aWwuY29sb3IoXCJkaWZmIHJlbW92ZWRcIiwgbGluZS50cmltUmlnaHQoKSlcbiAgICAgICAgZGVmYXVsdDogcmV0dXJuIGxpbmUudHJpbVJpZ2h0KClcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLmpvaW4oQ29uc29sZS5uZXdsaW5lKVxufVxuXG5mdW5jdGlvbiBmb3JtYXRGYWlsKHN0cikge1xuICAgIHJldHVybiBzdHIudHJpbVJpZ2h0KClcbiAgICAuc3BsaXQoL1xccj9cXG58XFxyL2cpXG4gICAgLm1hcChmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gUlV0aWwuY29sb3IoXCJmYWlsXCIsIGxpbmUudHJpbVJpZ2h0KCkpIH0pXG4gICAgLmpvaW4oQ29uc29sZS5uZXdsaW5lKVxufVxuXG5mdW5jdGlvbiBnZXREaWZmU3RhY2soZSkge1xuICAgIGFzc2VydChlIGluc3RhbmNlb2YgRXJyb3IpXG5cbiAgICB2YXIgZGVzY3JpcHRpb24gPSBmb3JtYXRGYWlsKGUubmFtZSArIFwiOiBcIiArIGUubWVzc2FnZSlcblxuICAgIGlmIChlLm5hbWUgPT09IFwiQXNzZXJ0aW9uRXJyb3JcIiAmJiBlLnNob3dEaWZmICE9PSBmYWxzZSkge1xuICAgICAgICBkZXNjcmlwdGlvbiArPSBDb25zb2xlLm5ld2xpbmUgKyB1bmlmaWVkRGlmZihlKVxuICAgIH1cblxuICAgIHZhciBzdHJpcHBlZCA9IGZvcm1hdEZhaWwoUlV0aWwucmVhZFN0YWNrKGUpKVxuXG4gICAgaWYgKHN0cmlwcGVkID09PSBcIlwiKSByZXR1cm4gZGVzY3JpcHRpb25cbiAgICByZXR1cm4gZGVzY3JpcHRpb24gKyBDb25zb2xlLm5ld2xpbmUgKyBzdHJpcHBlZFxufVxuXG5mdW5jdGlvbiBpbnNwZWN0VHJpbW1lZChvYmplY3QpIHtcbiAgICByZXR1cm4gaW5zcGVjdChvYmplY3QpLnRyaW1SaWdodCgpXG4gICAgLnNwbGl0KC9cXHI/XFxufFxcci9nKVxuICAgIC5tYXAoZnVuY3Rpb24gKGxpbmUpIHsgcmV0dXJuIGxpbmUudHJpbVJpZ2h0KCkgfSlcbiAgICAuam9pbihDb25zb2xlLm5ld2xpbmUpXG59XG5cbmZ1bmN0aW9uIHByaW50RmFpbExpc3QoXywgZXJyKSB7XG4gICAgYXNzZXJ0KF8gIT0gbnVsbCAmJiB0eXBlb2YgXyA9PT0gXCJvYmplY3RcIilcblxuICAgIHZhciBzdHIgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGdldERpZmZTdGFjayhlcnIpIDogaW5zcGVjdFRyaW1tZWQoZXJyKVxuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgvXFxyP1xcbi9nKVxuXG4gICAgcmV0dXJuIF8ucHJpbnQoXCIgICAgXCIgKyBwYXJ0c1swXSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBVdGlsLnBlYWNoKHBhcnRzLnNsaWNlKDEpLCBmdW5jdGlvbiAocGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQocGFydCA/IFwiICAgICAgXCIgKyBwYXJ0IDogXCJcIilcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvcHRzLCBtZXRob2RzKSB7XG4gICAgcmV0dXJuIG5ldyBDb25zb2xlUmVwb3J0ZXIob3B0cywgbWV0aG9kcylcbn1cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBtb3N0IGNvbnNvbGUgcmVwb3J0ZXJzLlxuICpcbiAqIE5vdGU6IHByaW50aW5nIGlzIGFzeW5jaHJvbm91cywgYmVjYXVzZSBvdGhlcndpc2UsIGlmIGVub3VnaCBlcnJvcnMgZXhpc3QsXG4gKiBOb2RlIHdpbGwgZXZlbnR1YWxseSBzdGFydCBkcm9wcGluZyBsaW5lcyBzZW50IHRvIGl0cyBidWZmZXIsIGVzcGVjaWFsbHkgd2hlblxuICogc3RhY2sgdHJhY2VzIGdldCBpbnZvbHZlZC4gSWYgVGhhbGxpdW0ncyBvdXRwdXQgaXMgcmVkaXJlY3RlZCwgdGhhdCBjYW4gYmUgYVxuICogYmlnIHByb2JsZW0gZm9yIGNvbnN1bWVycywgYXMgdGhleSBvbmx5IGhhdmUgcGFydCBvZiB0aGUgb3V0cHV0LCBhbmQgd29uJ3QgYmVcbiAqIGFibGUgdG8gc2VlIGFsbCB0aGUgZXJyb3JzIGxhdGVyLiBBbHNvLCBpZiBjb25zb2xlIHdhcm5pbmdzIGNvbWUgdXAgZW4tbWFzc2UsXG4gKiB0aGF0IHdvdWxkIGFsc28gY29udHJpYnV0ZS4gU28sIHdlIGhhdmUgdG8gd2FpdCBmb3IgZWFjaCBsaW5lIHRvIGZsdXNoIGJlZm9yZVxuICogd2UgY2FuIGNvbnRpbnVlLCBzbyB0aGUgZnVsbCBvdXRwdXQgbWFrZXMgaXRzIHdheSB0byB0aGUgY29uc29sZS5cbiAqXG4gKiBTb21lIHRlc3QgZnJhbWV3b3JrcyBsaWtlIFRhcGUgbWlzcyB0aGlzLCB0aG91Z2guXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgVGhlIG9wdGlvbnMgZm9yIHRoZSByZXBvcnRlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdHMud3JpdGUgVGhlIHVuYnVmZmVycmVkIHdyaXRlciBmb3IgdGhlIHJlcG9ydGVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0cy5yZXNldCBBIHJlc2V0IGZ1bmN0aW9uIGZvciB0aGUgcHJpbnRlciArIHdyaXRlci5cbiAqIEBwYXJhbSB7U3RyaW5nW119IGFjY2VwdHMgVGhlIG9wdGlvbnMgYWNjZXB0ZWQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpbml0IFRoZSBpbml0IGZ1bmN0aW9uIGZvciB0aGUgc3ViY2xhc3MgcmVwb3J0ZXInc1xuICogICAgICAgICAgICAgICAgICAgICAgICBpc29sYXRlZCBzdGF0ZSAoY3JlYXRlZCBieSBmYWN0b3J5KS5cbiAqL1xuZnVuY3Rpb24gQ29uc29sZVJlcG9ydGVyKG9wdHMsIG1ldGhvZHMpIHtcbiAgICBhc3NlcnQob3B0cyA9PSBudWxsIHx8IHR5cGVvZiBvcHRzID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydChtZXRob2RzICE9IG51bGwgJiYgdHlwZW9mIG1ldGhvZHMgPT09IFwib2JqZWN0XCIpXG5cbiAgICBSZXBvcnRlci5jYWxsKHRoaXMsIFJVdGlsLlRyZWUsIG9wdHMsIG1ldGhvZHMsIHRydWUpXG5cbiAgICBpZiAoIUNvbnNvbGUuY29sb3JTdXBwb3J0LmlzRm9yY2VkICYmXG4gICAgICAgICAgICBtZXRob2RzLmFjY2VwdHMuaW5kZXhPZihcImNvbG9yXCIpID49IDApIHtcbiAgICAgICAgdGhpcy5vcHRzLmNvbG9yID0gb3B0cy5jb2xvclxuICAgIH1cblxuICAgIFJVdGlsLmRlZmF1bHRpZnkodGhpcywgb3B0cywgXCJ3cml0ZVwiKVxuICAgIHRoaXMucmVzZXQoKVxufVxuXG5tZXRob2RzKENvbnNvbGVSZXBvcnRlciwgUmVwb3J0ZXIsIHtcbiAgICBwcmludDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBpZiAoc3RyID09IG51bGwpIHN0ciA9IFwiXCJcbiAgICAgICAgYXNzZXJ0KHR5cGVvZiBzdHIgPT09IFwic3RyaW5nXCIpXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5vcHRzLndyaXRlKHN0ciArIFwiXFxuXCIpKVxuICAgIH0sXG5cbiAgICB3cml0ZTogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBpZiAoc3RyICE9IG51bGwpIHtcbiAgICAgICAgICAgIGFzc2VydCh0eXBlb2Ygc3RyID09PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLm9wdHMud3JpdGUoc3RyKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHByaW50UmVzdWx0czogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgICAgICBpZiAoIXRoaXMudGVzdHMgJiYgIXRoaXMuc2tpcCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJpbnQoXG4gICAgICAgICAgICAgICAgUlV0aWwuY29sb3IoXCJwbGFpblwiLCBcIiAgMCB0ZXN0c1wiKSArXG4gICAgICAgICAgICAgICAgUlV0aWwuY29sb3IoXCJsaWdodFwiLCBcIiAoMG1zKVwiKSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNlbGYucHJpbnQoKSB9KVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMucHJpbnQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBwID0gUHJvbWlzZS5yZXNvbHZlKClcblxuICAgICAgICAgICAgaWYgKHNlbGYucGFzcykge1xuICAgICAgICAgICAgICAgIHAgPSBwcmludFRpbWUoc2VsZiwgcCxcbiAgICAgICAgICAgICAgICAgICAgUlV0aWwuY29sb3IoXCJicmlnaHQgcGFzc1wiLCBcIiAgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgUlV0aWwuY29sb3IoXCJncmVlblwiLCBzZWxmLnBhc3MgKyBcIiBwYXNzaW5nXCIpKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2VsZi5za2lwKSB7XG4gICAgICAgICAgICAgICAgcCA9IHByaW50VGltZShzZWxmLCBwLFxuICAgICAgICAgICAgICAgICAgICBSVXRpbC5jb2xvcihcInNraXBcIiwgXCIgIFwiICsgc2VsZi5za2lwICsgXCIgc2tpcHBlZFwiKSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNlbGYuZmFpbCkge1xuICAgICAgICAgICAgICAgIHAgPSBwcmludFRpbWUoc2VsZiwgcCxcbiAgICAgICAgICAgICAgICAgICAgUlV0aWwuY29sb3IoXCJicmlnaHQgZmFpbFwiLCBcIiAgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgUlV0aWwuY29sb3IoXCJmYWlsXCIsIHNlbGYuZmFpbCArIFwiIGZhaWxpbmdcIikpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNlbGYucHJpbnQoKSB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gVXRpbC5wZWFjaChzZWxmLmVycm9ycywgZnVuY3Rpb24gKHJlcG9ydCwgaSkge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gaSArIDEgKyBcIikgXCIgKyBSVXRpbC5qb2luUGF0aChyZXBvcnQpICtcbiAgICAgICAgICAgICAgICAgICAgUlV0aWwuZm9ybWF0UmVzdChyZXBvcnQpXG5cbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5wcmludChcIiAgXCIgKyBSVXRpbC5jb2xvcihcInBsYWluXCIsIG5hbWUgKyBcIjpcIikpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJpbnRGYWlsTGlzdChzZWxmLCByZXBvcnQuZXJyb3IpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBzZWxmLnByaW50KCkgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIHByaW50RXJyb3I6IGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgYXNzZXJ0KHJlcG9ydCAhPSBudWxsICYmIHR5cGVvZiByZXBvcnQgPT09IFwib2JqZWN0XCIpXG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciBsaW5lcyA9IHJlcG9ydC5lcnJvciBpbnN0YW5jZW9mIEVycm9yXG4gICAgICAgICAgICA/IFJVdGlsLmdldFN0YWNrKHJlcG9ydC5lcnJvcilcbiAgICAgICAgICAgIDogaW5zcGVjdFRyaW1tZWQocmVwb3J0LmVycm9yKVxuXG4gICAgICAgIHJldHVybiB0aGlzLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gVXRpbC5wZWFjaChsaW5lcy5zcGxpdCgvXFxyP1xcbi9nKSwgZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5wcmludChsaW5lKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBVdGlsID0gcmVxdWlyZShcIi4vdXRpbFwiKVxuXG5leHBvcnRzLm9uID0gcmVxdWlyZShcIi4vb25cIilcbmV4cG9ydHMuY29uc29sZVJlcG9ydGVyID0gcmVxdWlyZShcIi4vY29uc29sZS1yZXBvcnRlclwiKVxuZXhwb3J0cy5SZXBvcnRlciA9IHJlcXVpcmUoXCIuL3JlcG9ydGVyXCIpXG5leHBvcnRzLmNvbG9yID0gVXRpbC5jb2xvclxuZXhwb3J0cy5mb3JtYXRSZXN0ID0gVXRpbC5mb3JtYXRSZXN0XG5leHBvcnRzLmZvcm1hdFRpbWUgPSBVdGlsLmZvcm1hdFRpbWVcbmV4cG9ydHMuZ2V0U3RhY2sgPSBVdGlsLmdldFN0YWNrXG5leHBvcnRzLmpvaW5QYXRoID0gVXRpbC5qb2luUGF0aFxuZXhwb3J0cy5yZWFkU3RhY2sgPSBVdGlsLnJlYWRTdGFja1xuZXhwb3J0cy5zZXRDb2xvciA9IFV0aWwuc2V0Q29sb3JcbmV4cG9ydHMuc3BlZWQgPSBVdGlsLnNwZWVkXG5leHBvcnRzLlN0YXR1cyA9IFV0aWwuU3RhdHVzXG5leHBvcnRzLnVuc2V0Q29sb3IgPSBVdGlsLnVuc2V0Q29sb3JcbmV4cG9ydHMuQ29uc29sZSA9IHJlcXVpcmUoXCIuLi9yZXBsYWNlZC9jb25zb2xlXCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgU3RhdHVzID0gcmVxdWlyZShcIi4vdXRpbFwiKS5TdGF0dXNcblxuLy8gQmVjYXVzZSBFUzUgc3Vja3MuIChBbmQsIGl0J3MgYnJlYWtpbmcgbXkgUGhhbnRvbUpTIGJ1aWxkcylcbmZ1bmN0aW9uIHNldE5hbWUocmVwb3J0ZXIsIG5hbWUpIHtcbiAgICB0cnkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocmVwb3J0ZXIsIFwibmFtZVwiLCB7dmFsdWU6IG5hbWV9KVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gaWdub3JlXG4gICAgfVxufVxuXG4vKipcbiAqIEEgbWFjcm8gb2Ygc29ydHMsIHRvIHNpbXBsaWZ5IGNyZWF0aW5nIHJlcG9ydGVycy4gSXQgYWNjZXB0cyBhbiBvYmplY3Qgd2l0aFxuICogdGhlIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuICpcbiAqIGBhY2NlcHRzOiBzdHJpbmdbXWAgLSBUaGUgcHJvcGVydGllcyBhY2NlcHRlZC4gRXZlcnl0aGluZyBlbHNlIGlzIGlnbm9yZWQsXG4gKiBhbmQgaXQncyBwYXJ0aWFsbHkgdGhlcmUgZm9yIGRvY3VtZW50YXRpb24uIFRoaXMgcGFyYW1ldGVyIGlzIHJlcXVpcmVkLlxuICpcbiAqIGBjcmVhdGUob3B0cywgbWV0aG9kcylgIC0gQ3JlYXRlIGEgbmV3IHJlcG9ydGVyIGluc3RhbmNlLiAgVGhpcyBwYXJhbWV0ZXIgaXNcbiAqIHJlcXVpcmVkLiBOb3RlIHRoYXQgYG1ldGhvZHNgIHJlZmVycyB0byB0aGUgcGFyYW1ldGVyIG9iamVjdCBpdHNlbGYuXG4gKlxuICogYGluaXQoc3RhdGUsIG9wdHMpYCAtIEluaXRpYWxpemUgZXh0cmEgcmVwb3J0ZXIgc3RhdGUsIGlmIGFwcGxpY2FibGUuXG4gKlxuICogYGJlZm9yZShyZXBvcnRlcilgIC0gRG8gdGhpbmdzIGJlZm9yZSBlYWNoIGV2ZW50LCByZXR1cm5pbmcgYSBwb3NzaWJsZVxuICogdGhlbmFibGUgd2hlbiBkb25lLiBUaGlzIGRlZmF1bHRzIHRvIGEgbm8tb3AuXG4gKlxuICogYGFmdGVyKHJlcG9ydGVyKWAgLSBEbyB0aGluZ3MgYWZ0ZXIgZWFjaCBldmVudCwgcmV0dXJuaW5nIGEgcG9zc2libGVcbiAqIHRoZW5hYmxlIHdoZW4gZG9uZS4gVGhpcyBkZWZhdWx0cyB0byBhIG5vLW9wLlxuICpcbiAqIGByZXBvcnQocmVwb3J0ZXIsIHJlcG9ydClgIC0gSGFuZGxlIGEgdGVzdCByZXBvcnQuIFRoaXMgbWF5IHJldHVybiBhIHBvc3NpYmxlXG4gKiB0aGVuYWJsZSB3aGVuIGRvbmUsIGFuZCBpdCBpcyByZXF1aXJlZC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobmFtZSwgbWV0aG9kcykge1xuICAgIHNldE5hbWUocmVwb3J0ZXIsIG5hbWUpXG4gICAgcmVwb3J0ZXJbbmFtZV0gPSByZXBvcnRlclxuICAgIHJldHVybiByZXBvcnRlclxuICAgIGZ1bmN0aW9uIHJlcG9ydGVyKG9wdHMpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEluc3RlYWQgb2Ygc2lsZW50bHkgZmFpbGluZyB0byB3b3JrLCBsZXQncyBlcnJvciBvdXQgZWFybHkuXG4gICAgICAgICAqL1xuICAgICAgICBpZiAob3B0cyAhPSBudWxsICYmIHR5cGVvZiBvcHRzICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT3B0aW9ucyBtdXN0IGJlIGFuIG9iamVjdCBpZiBwYXNzZWQuXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgXyA9IG1ldGhvZHMuY3JlYXRlKG9wdHMsIG1ldGhvZHMpXG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgICAgIC8vIE9ubHkgc29tZSBldmVudHMgaGF2ZSBjb21tb24gc3RlcHMuXG4gICAgICAgICAgICBpZiAocmVwb3J0LmlzU3RhcnQpIHtcbiAgICAgICAgICAgICAgICBfLnJ1bm5pbmcgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyIHx8IHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLlBhc3NpbmdcbiAgICAgICAgICAgICAgICBfLmR1cmF0aW9uICs9IHJlcG9ydC5kdXJhdGlvblxuICAgICAgICAgICAgICAgIF8udGVzdHMrK1xuICAgICAgICAgICAgICAgIF8ucGFzcysrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLkZhaWxpbmdcbiAgICAgICAgICAgICAgICBfLmR1cmF0aW9uICs9IHJlcG9ydC5kdXJhdGlvblxuICAgICAgICAgICAgICAgIF8udGVzdHMrK1xuICAgICAgICAgICAgICAgIF8uZmFpbCsrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0hvb2spIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLkZhaWxpbmdcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucm9vdFBhdGgpLnN0YXR1cyA9IFN0YXR1cy5GYWlsaW5nXG4gICAgICAgICAgICAgICAgXy5mYWlsKytcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICAgICAgICAgIF8uZ2V0KHJlcG9ydC5wYXRoKS5zdGF0dXMgPSBTdGF0dXMuU2tpcHBlZFxuICAgICAgICAgICAgICAgIC8vIFNraXBwZWQgdGVzdHMgYXJlbid0IGNvdW50ZWQgaW4gdGhlIHRvdGFsIHRlc3QgY291bnRcbiAgICAgICAgICAgICAgICBfLnNraXArK1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICAgICAgICAgIHR5cGVvZiBtZXRob2RzLmJlZm9yZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgID8gbWV0aG9kcy5iZWZvcmUoXylcbiAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBtZXRob2RzLnJlcG9ydChfLCByZXBvcnQpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBtZXRob2RzLmFmdGVyID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgPyBtZXRob2RzLmFmdGVyKF8pXG4gICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChyZXBvcnQuaXNFbmQgfHwgcmVwb3J0LmlzRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgXy5yZXNldCgpXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgXy5vcHRzLnJlc2V0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfLm9wdHMucmVzZXQoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuLi9tZXRob2RzXCIpXG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcIi4uL3V0aWxcIikuYXNzZXJ0XG52YXIgQ29uc29sZSA9IHJlcXVpcmUoXCIuLi9yZXBsYWNlZC9jb25zb2xlXCIpXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbmZ1bmN0aW9uIFN0YXRlKHJlcG9ydGVyKSB7XG4gICAgYXNzZXJ0KHJlcG9ydGVyICE9IG51bGwgJiYgdHlwZW9mIHJlcG9ydGVyID09PSBcIm9iamVjdFwiKVxuXG4gICAgaWYgKHR5cGVvZiByZXBvcnRlci5tZXRob2RzLmluaXQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAoMCwgcmVwb3J0ZXIubWV0aG9kcy5pbml0KSh0aGlzLCByZXBvcnRlci5vcHRzKVxuICAgIH1cbn1cblxuLyoqXG4gKiBUaGlzIGhlbHBzIHNwZWVkIHVwIGdldHRpbmcgcHJldmlvdXMgdHJlZXMsIHNvIGEgcG90ZW50aWFsbHkgZXhwZW5zaXZlXG4gKiB0cmVlIHNlYXJjaCBkb2Vzbid0IGhhdmUgdG8gYmUgcGVyZm9ybWVkLlxuICpcbiAqIChUaGlzIGRvZXMgYWN0dWFsbHkgbWFrZSBhIHNsaWdodCBwZXJmIGRpZmZlcmVuY2UgaW4gdGhlIHRlc3RzLilcbiAqL1xuZnVuY3Rpb24gaXNSZXBlYXQoY2FjaGUsIHBhdGgpIHtcbiAgICBhc3NlcnQoY2FjaGUgIT0gbnVsbCAmJiB0eXBlb2YgY2FjaGUgPT09IFwib2JqZWN0XCIpXG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkocGF0aCkpXG5cbiAgICAvLyBDYW4ndCBiZSBhIHJlcGVhdCB0aGUgZmlyc3QgdGltZS5cbiAgICBpZiAoY2FjaGUucGF0aCA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgICBpZiAocGF0aC5sZW5ndGggIT09IGNhY2hlLnBhdGgubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICBpZiAocGF0aCA9PT0gY2FjaGUucGF0aCkgcmV0dXJuIHRydWVcblxuICAgIC8vIEl0J3MgdW5saWtlbHkgdGhlIG5lc3Rpbmcgd2lsbCBiZSBjb25zaXN0ZW50bHkgbW9yZSB0aGFuIGEgZmV3IGxldmVsc1xuICAgIC8vIGRlZXAgKD49IDUpLCBzbyB0aGlzIHNob3VsZG4ndCBib2cgYW55dGhpbmcgZG93bi5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHBhdGhbaV0gIT09IGNhY2hlLnBhdGhbaV0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FjaGUucGF0aCA9IHBhdGhcbiAgICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIFN1cGVyY2xhc3MgZm9yIGFsbCByZXBvcnRlcnMuIFRoaXMgY292ZXJzIHRoZSBzdGF0ZSBmb3IgcHJldHR5IG11Y2ggZXZlcnlcbiAqIHJlcG9ydGVyLlxuICpcbiAqIE5vdGUgdGhhdCBpZiB5b3UgZGVsYXkgdGhlIGluaXRpYWwgcmVzZXQsIHlvdSBzdGlsbCBtdXN0IGNhbGwgaXQgYmVmb3JlIHRoZVxuICogY29uc3RydWN0b3IgZmluaXNoZXMuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0ZXJcbmZ1bmN0aW9uIFJlcG9ydGVyKFRyZWUsIG9wdHMsIG1ldGhvZHMsIGRlbGF5KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBUcmVlID09PSBcImZ1bmN0aW9uXCIpXG4gICAgYXNzZXJ0KG9wdHMgPT0gbnVsbCB8fCB0eXBlb2Ygb3B0cyA9PT0gXCJvYmplY3RcIilcbiAgICBhc3NlcnQobWV0aG9kcyAhPSBudWxsICYmIHR5cGVvZiBtZXRob2RzID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydCh0eXBlb2YgZGVsYXkgPT09IFwiYm9vbGVhblwiKVxuXG4gICAgdGhpcy5UcmVlID0gVHJlZVxuICAgIHRoaXMuaXNTdXBwb3J0ZWQgPSBDb25zb2xlLmNvbG9yU3VwcG9ydC5pc1N1cHBvcnRlZFxuICAgIHRoaXMub3B0cyA9IHt9XG4gICAgdGhpcy5tZXRob2RzID0gbWV0aG9kc1xuICAgIFV0aWwuZGVmYXVsdGlmeSh0aGlzLCBvcHRzLCBcInJlc2V0XCIpXG4gICAgaWYgKCFkZWxheSkgdGhpcy5yZXNldCgpXG59XG5cbm1ldGhvZHMoUmVwb3J0ZXIsIHtcbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLnRpbWVQcmludGVkID0gZmFsc2VcbiAgICAgICAgdGhpcy50ZXN0cyA9IDBcbiAgICAgICAgdGhpcy5wYXNzID0gMFxuICAgICAgICB0aGlzLmZhaWwgPSAwXG4gICAgICAgIHRoaXMuc2tpcCA9IDBcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IDBcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXVxuICAgICAgICB0aGlzLnN0YXRlID0gbmV3IFN0YXRlKHRoaXMpXG4gICAgICAgIHRoaXMuYmFzZSA9IG5ldyB0aGlzLlRyZWUodW5kZWZpbmVkKVxuICAgICAgICB0aGlzLmNhY2hlID0ge3BhdGg6IHVuZGVmaW5lZCwgcmVzdWx0OiB1bmRlZmluZWQsIGVuZDogMH1cbiAgICB9LFxuXG4gICAgcHVzaEVycm9yOiBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgICAgIGFzc2VydChyZXBvcnQgIT0gbnVsbCAmJiB0eXBlb2YgcmVwb3J0ID09PSBcIm9iamVjdFwiKVxuXG4gICAgICAgIHRoaXMuZXJyb3JzLnB1c2gocmVwb3J0KVxuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uIChwYXRoLCBlbmQpIHtcbiAgICAgICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkocGF0aCkpXG4gICAgICAgIGFzc2VydChlbmQgPT0gbnVsbCB8fCB0eXBlb2YgZW5kID09PSBcIm51bWJlclwiKVxuXG4gICAgICAgIGlmIChlbmQgPT0gbnVsbCkgZW5kID0gcGF0aC5sZW5ndGhcbiAgICAgICAgaWYgKGVuZCA9PT0gMCkgcmV0dXJuIHRoaXMuYmFzZVxuICAgICAgICBpZiAoaXNSZXBlYXQodGhpcy5jYWNoZSwgcGF0aCwgZW5kKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGUucmVzdWx0XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSB0aGlzLmJhc2VcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZW50cnkgPSBwYXRoW2ldXG5cbiAgICAgICAgICAgIGlmIChoYXNPd24uY2FsbChjaGlsZC5jaGlsZHJlbiwgZW50cnkuaW5kZXgpKSB7XG4gICAgICAgICAgICAgICAgY2hpbGQgPSBjaGlsZC5jaGlsZHJlbltlbnRyeS5pbmRleF1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2hpbGQgPSBjaGlsZC5jaGlsZHJlbltlbnRyeS5pbmRleF0gPSBuZXcgdGhpcy5UcmVlKGVudHJ5Lm5hbWUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhY2hlLmVuZCA9IGVuZFxuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZS5yZXN1bHQgPSBjaGlsZFxuICAgIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbFwiKVxudmFyIENvbnNvbGUgPSByZXF1aXJlKFwiLi4vcmVwbGFjZWQvY29uc29sZVwiKVxudmFyIGFzc2VydCA9IFV0aWwuYXNzZXJ0XG5cbi8qXG4gKiBTdGFjayBub3JtYWxpemF0aW9uXG4gKi9cblxuLy8gRXhwb3J0ZWQgZm9yIGRlYnVnZ2luZ1xuZXhwb3J0cy5yZWFkU3RhY2sgPSByZWFkU3RhY2tcbmZ1bmN0aW9uIHJlYWRTdGFjayhlKSB7XG4gICAgdmFyIHN0YWNrID0gVXRpbC5nZXRTdGFjayhlKVxuXG4gICAgLy8gSWYgaXQgZG9lc24ndCBzdGFydCB3aXRoIHRoZSBtZXNzYWdlLCBqdXN0IHJldHVybiB0aGUgc3RhY2suXG4gICAgLy8gIEZpcmVmb3gsIFNhZmFyaSAgICAgICAgICAgICAgICBDaHJvbWUsIElFXG4gICAgaWYgKC9eKEApP1xcUytcXDpcXGQrLy50ZXN0KHN0YWNrKSB8fCAvXlxccyphdC8udGVzdChzdGFjaykpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdExpbmVCcmVha3Moc3RhY2spXG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gc3RhY2suaW5kZXhPZihlLm1lc3NhZ2UpXG5cbiAgICBpZiAoaW5kZXggPCAwKSByZXR1cm4gZm9ybWF0TGluZUJyZWFrcyhVdGlsLmdldFN0YWNrKGUpKVxuICAgIHZhciByZSA9IC9cXHI/XFxuL2dcblxuICAgIHJlLmxhc3RJbmRleCA9IGluZGV4ICsgZS5tZXNzYWdlLmxlbmd0aFxuICAgIGlmICghcmUudGVzdChzdGFjaykpIHJldHVybiBcIlwiXG4gICAgcmV0dXJuIGZvcm1hdExpbmVCcmVha3Moc3RhY2suc2xpY2UocmUubGFzdEluZGV4KSlcbn1cblxuZnVuY3Rpb24gZm9ybWF0TGluZUJyZWFrcyhzdHIpIHtcbiAgICBhc3NlcnQodHlwZW9mIHN0ciA9PT0gXCJzdHJpbmdcIilcblxuICAgIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8W15cXHJcXG5cXFNdKyQvZywgXCJcIilcbiAgICAgICAgLnJlcGxhY2UoL1xccyooXFxyP1xcbnxcXHIpXFxzKi9nLCBDb25zb2xlLm5ld2xpbmUpXG59XG5cbmV4cG9ydHMuZ2V0U3RhY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcikpIHJldHVybiBmb3JtYXRMaW5lQnJlYWtzKFV0aWwuZ2V0U3RhY2soZSkpXG4gICAgdmFyIGRlc2NyaXB0aW9uID0gKGUubmFtZSArIFwiOiBcIiArIGUubWVzc2FnZSlcbiAgICAgICAgLnJlcGxhY2UoL1xccyskL2dtLCBcIlwiKVxuICAgICAgICAucmVwbGFjZSgvXFxyP1xcbnxcXHIvZywgQ29uc29sZS5uZXdsaW5lKVxuICAgIHZhciBzdHJpcHBlZCA9IHJlYWRTdGFjayhlKVxuXG4gICAgaWYgKHN0cmlwcGVkID09PSBcIlwiKSByZXR1cm4gZGVzY3JpcHRpb25cbiAgICByZXR1cm4gZGVzY3JpcHRpb24gKyBDb25zb2xlLm5ld2xpbmUgKyBzdHJpcHBlZFxufVxuXG4vLyBDb2xvciBwYWxldHRlIHB1bGxlZCBmcm9tIE1vY2hhXG5mdW5jdGlvbiBjb2xvclRvTnVtYmVyKG5hbWUpIHtcbiAgICBhc3NlcnQodHlwZW9mIG5hbWUgPT09IFwic3RyaW5nXCIpXG5cbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICBjYXNlIFwicGFzc1wiOiByZXR1cm4gOTBcbiAgICBjYXNlIFwiZmFpbFwiOiByZXR1cm4gMzFcblxuICAgIGNhc2UgXCJicmlnaHQgcGFzc1wiOiByZXR1cm4gOTJcbiAgICBjYXNlIFwiYnJpZ2h0IGZhaWxcIjogcmV0dXJuIDkxXG4gICAgY2FzZSBcImJyaWdodCB5ZWxsb3dcIjogcmV0dXJuIDkzXG5cbiAgICBjYXNlIFwic2tpcFwiOiByZXR1cm4gMzZcbiAgICBjYXNlIFwic3VpdGVcIjogcmV0dXJuIDBcbiAgICBjYXNlIFwicGxhaW5cIjogcmV0dXJuIDBcblxuICAgIGNhc2UgXCJlcnJvciB0aXRsZVwiOiByZXR1cm4gMFxuICAgIGNhc2UgXCJlcnJvciBtZXNzYWdlXCI6IHJldHVybiAzMVxuICAgIGNhc2UgXCJlcnJvciBzdGFja1wiOiByZXR1cm4gOTBcblxuICAgIGNhc2UgXCJjaGVja21hcmtcIjogcmV0dXJuIDMyXG4gICAgY2FzZSBcImZhc3RcIjogcmV0dXJuIDkwXG4gICAgY2FzZSBcIm1lZGl1bVwiOiByZXR1cm4gMzNcbiAgICBjYXNlIFwic2xvd1wiOiByZXR1cm4gMzFcbiAgICBjYXNlIFwiZ3JlZW5cIjogcmV0dXJuIDMyXG4gICAgY2FzZSBcImxpZ2h0XCI6IHJldHVybiA5MFxuXG4gICAgY2FzZSBcImRpZmYgZ3V0dGVyXCI6IHJldHVybiA5MFxuICAgIGNhc2UgXCJkaWZmIGFkZGVkXCI6IHJldHVybiAzMlxuICAgIGNhc2UgXCJkaWZmIHJlbW92ZWRcIjogcmV0dXJuIDMxXG4gICAgZGVmYXVsdDogdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgbmFtZTogXFxcIlwiICsgbmFtZSArIFwiXFxcIlwiKVxuICAgIH1cbn1cblxuLy8gVE9ETzogdXNlIHRoZSBzdGF0ZSB0byBjYWxjdWxhdGUgdGhpcyBpbnN0ZWFkIG9mIHJlbHlpbmcgb24gYSBnbG9iYWwuLi5cbmV4cG9ydHMuY29sb3IgPSBjb2xvclxuZnVuY3Rpb24gY29sb3IobmFtZSwgc3RyKSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBuYW1lID09PSBcInN0cmluZ1wiKVxuICAgIGFzc2VydCh0eXBlb2Ygc3RyID09PSBcInN0cmluZ1wiKVxuXG4gICAgaWYgKENvbnNvbGUuY29sb3JTdXBwb3J0LmlzU3VwcG9ydGVkKSB7XG4gICAgICAgIHJldHVybiBcIlxcdTAwMWJbXCIgKyBjb2xvclRvTnVtYmVyKG5hbWUpICsgXCJtXCIgKyBzdHIgKyBcIlxcdTAwMWJbMG1cIlxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzdHJcbiAgICB9XG59XG5cbmV4cG9ydHMuc2V0Q29sb3IgPSBmdW5jdGlvbiAoXykge1xuICAgIGFzc2VydChfICE9IG51bGwgJiYgdHlwZW9mIF8gPT09IFwib2JqZWN0XCIpXG4gICAgaWYgKF8ub3B0cy5jb2xvciAhPSBudWxsKSB7XG4gICAgICAgIENvbnNvbGUuY29sb3JTdXBwb3J0LmlzU3VwcG9ydGVkID0gISFfLm9wdHMuY29sb3JcbiAgICB9XG59XG5cbmV4cG9ydHMudW5zZXRDb2xvciA9IGZ1bmN0aW9uIChfKSB7XG4gICAgYXNzZXJ0KF8gIT0gbnVsbCAmJiB0eXBlb2YgXyA9PT0gXCJvYmplY3RcIilcbiAgICBpZiAoXy5vcHRzLmNvbG9yICE9IG51bGwgJiYgIUNvbnNvbGUuY29sb3JTdXBwb3J0LmlzRm9yY2VkKSB7XG4gICAgICAgIENvbnNvbGUuY29sb3JTdXBwb3J0LmlzU3VwcG9ydGVkID0gdGhpcy5vbGRTdXBwb3J0ZWRcbiAgICB9XG59XG5cbnZhciBTdGF0dXMgPSBleHBvcnRzLlN0YXR1cyA9IE9iamVjdC5mcmVlemUoe1xuICAgIFVua25vd246IDAsXG4gICAgU2tpcHBlZDogMSxcbiAgICBQYXNzaW5nOiAyLFxuICAgIEZhaWxpbmc6IDMsXG59KVxuXG5leHBvcnRzLlRyZWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICBhc3NlcnQodmFsdWUgPT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpXG5cbiAgICB0aGlzLnZhbHVlID0gdmFsdWVcbiAgICB0aGlzLnN0YXR1cyA9IFN0YXR1cy5Vbmtub3duXG4gICAgdGhpcy5jaGlsZHJlbiA9IE9iamVjdC5jcmVhdGUobnVsbClcbn1cblxuZXhwb3J0cy5kZWZhdWx0aWZ5ID0gZnVuY3Rpb24gKF8sIG9wdHMsIHByb3ApIHtcbiAgICBhc3NlcnQoXyAhPSBudWxsICYmIHR5cGVvZiBfID09PSBcIm9iamVjdFwiKVxuICAgIGFzc2VydChvcHRzID09IG51bGwgfHwgdHlwZW9mIG9wdHMgPT09IFwib2JqZWN0XCIpXG4gICAgYXNzZXJ0KHR5cGVvZiBwcm9wID09PSBcInN0cmluZ1wiKVxuXG4gICAgaWYgKF8ubWV0aG9kcy5hY2NlcHRzLmluZGV4T2YocHJvcCkgPj0gMCkge1xuICAgICAgICB2YXIgdXNlZCA9IG9wdHMgIT0gbnVsbCAmJiB0eXBlb2Ygb3B0c1twcm9wXSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICA/IG9wdHNcbiAgICAgICAgICAgIDogQ29uc29sZS5kZWZhdWx0c1xuXG4gICAgICAgIF8ub3B0c1twcm9wXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodXNlZFtwcm9wXS5hcHBseSh1c2VkLCBhcmd1bWVudHMpKVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBqb2luUGF0aChyZXBvcnRQYXRoKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkocmVwb3J0UGF0aCkpXG5cbiAgICB2YXIgcGF0aCA9IFwiXCJcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVwb3J0UGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBwYXRoICs9IFwiIFwiICsgcmVwb3J0UGF0aFtpXS5uYW1lXG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGguc2xpY2UoMSlcbn1cblxuZXhwb3J0cy5qb2luUGF0aCA9IGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICBhc3NlcnQocmVwb3J0ICE9IG51bGwgJiYgdHlwZW9mIHJlcG9ydCA9PT0gXCJvYmplY3RcIilcblxuICAgIHJldHVybiBqb2luUGF0aChyZXBvcnQucGF0aClcbn1cblxuZXhwb3J0cy5zcGVlZCA9IGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICBhc3NlcnQocmVwb3J0ICE9IG51bGwgJiYgdHlwZW9mIHJlcG9ydCA9PT0gXCJvYmplY3RcIilcblxuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gcmVwb3J0LnNsb3cpIHJldHVybiBcInNsb3dcIlxuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gcmVwb3J0LnNsb3cgLyAyKSByZXR1cm4gXCJtZWRpdW1cIlxuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gMCkgcmV0dXJuIFwiZmFzdFwiXG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJEdXJhdGlvbiBtdXN0IG5vdCBiZSBuZWdhdGl2ZVwiKVxufVxuXG5leHBvcnRzLmZvcm1hdFRpbWUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBzID0gMTAwMCAvKiBtcyAqL1xuICAgIHZhciBtID0gNjAgKiBzXG4gICAgdmFyIGggPSA2MCAqIG1cbiAgICB2YXIgZCA9IDI0ICogaFxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChtcykge1xuICAgICAgICBhc3NlcnQodHlwZW9mIG1zID09PSBcIm51bWJlclwiKVxuXG4gICAgICAgIGlmIChtcyA+PSBkKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgXCJkXCJcbiAgICAgICAgaWYgKG1zID49IGgpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyBcImhcIlxuICAgICAgICBpZiAobXMgPj0gbSkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArIFwibVwiXG4gICAgICAgIGlmIChtcyA+PSBzKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgXCJzXCJcbiAgICAgICAgcmV0dXJuIG1zICsgXCJtc1wiXG4gICAgfVxufSkoKVxuXG5leHBvcnRzLmZvcm1hdFJlc3QgPSBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgYXNzZXJ0KHJlcG9ydCAhPSBudWxsICYmIHR5cGVvZiByZXBvcnQgPT09IFwib2JqZWN0XCIpXG5cbiAgICBpZiAoIXJlcG9ydC5pc0hvb2spIHJldHVybiBcIlwiXG4gICAgdmFyIHBhdGggPSBcIiAoXCJcblxuICAgIGlmIChyZXBvcnQucm9vdFBhdGgubGVuZ3RoKSB7XG4gICAgICAgIHBhdGggKz0gcmVwb3J0LnN0YWdlXG4gICAgICAgIGlmIChyZXBvcnQubmFtZSkgcGF0aCArPSBcIiDigJIgXCIgKyByZXBvcnQubmFtZVxuICAgICAgICBpZiAocmVwb3J0LnBhdGgubGVuZ3RoID4gcmVwb3J0LnJvb3RQYXRoLmxlbmd0aCArIDEpIHtcbiAgICAgICAgICAgIHBhdGggKz0gXCIsIGluIFwiICsgam9pblBhdGgocmVwb3J0LnJvb3RQYXRoKVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGF0aCArPSBcImdsb2JhbCBcIiArIHJlcG9ydC5zdGFnZVxuICAgICAgICBpZiAocmVwb3J0Lm5hbWUpIHBhdGggKz0gXCIg4oCSIFwiICsgcmVwb3J0Lm5hbWVcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aCArIFwiKVwiXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuL21ldGhvZHNcIilcblxuLy8gUXVpY2sgYXNzZXJ0XG5leHBvcnRzLmFzc2VydCA9IGFzc2VydFxuZnVuY3Rpb24gYXNzZXJ0KGNvbmQpIHtcbiAgICBpZiAoIWNvbmQpIHRocm93IG5ldyBBc3NlcnRGYWlsKClcbn1cblxuLy8gUXVpY2sgaGFjayB0byBlbnN1cmUgdGhlcmUncyBhIHN0YWNrXG52YXIgY2FwdHVyZVN0YWNrVHJhY2UgPSB0eXBlb2YgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09IFwiZnVuY3Rpb25cIlxuICAgID8gRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgOiBmdW5jdGlvbiAoaW5zdCkge1xuICAgICAgICB2YXIgZSA9IG5ldyBFcnJvcigpXG5cbiAgICAgICAgZS5uYW1lID0gaW5zdC5uYW1lXG4gICAgICAgIGluc3Quc3RhY2sgPSBleHBvcnRzLmdldFN0YWNrKGUpXG4gICAgfVxuXG5mdW5jdGlvbiBBc3NlcnRGYWlsKCkge1xuICAgIGNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIGFzc2VydClcbn1cblxubWV0aG9kcyhBc3NlcnRGYWlsLCBFcnJvciwge1xuICAgIG5hbWU6IFwiQXNzZXJ0aW9uIGZhaWxlZFwiLFxufSlcblxuZXhwb3J0cy5nZXRUeXBlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBcIm51bGxcIlxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkgcmV0dXJuIFwiYXJyYXlcIlxuICAgIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuLy8gUGhhbnRvbUpTLCBJRSwgYW5kIHBvc3NpYmx5IEVkZ2UgZG9uJ3Qgc2V0IHRoZSBzdGFjayB0cmFjZSB1bnRpbCB0aGUgZXJyb3IgaXNcbi8vIHRocm93bi4gTm90ZSB0aGF0IHRoaXMgcHJlZmVycyBhbiBleGlzdGluZyBzdGFjayBmaXJzdCwgc2luY2Ugbm9uLW5hdGl2ZVxuLy8gZXJyb3JzIGxpa2VseSBhbHJlYWR5IGNvbnRhaW4gdGhpcy4gTm90ZSB0aGF0IHRoaXMgaXNuJ3QgbmVjZXNzYXJ5IGluIHRoZVxuLy8gQ0xJIC0gdGhhdCBvbmx5IHRhcmdldHMgTm9kZS5cbmV4cG9ydHMuZ2V0U3RhY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBzdGFjayA9IGUuc3RhY2tcblxuICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcikgfHwgc3RhY2sgIT0gbnVsbCkgcmV0dXJuIHN0YWNrXG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBlXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZS5zdGFja1xuICAgIH1cbn1cblxuZXhwb3J0cy5wY2FsbCA9IGZ1bmN0aW9uIChmdW5jKSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBmdW5jID09PSBcImZ1bmN0aW9uXCIpXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMoZnVuY3Rpb24gKGUsIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZSAhPSBudWxsID8gcmVqZWN0KGUpIDogcmVzb2x2ZSh2YWx1ZSlcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnRzLnBlYWNoID0gZnVuY3Rpb24gKGxpc3QsIGZ1bmMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShsaXN0KSlcbiAgICBhc3NlcnQodHlwZW9mIGZ1bmMgPT09IFwiZnVuY3Rpb25cIilcblxuICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aFxuICAgIHZhciBwID0gUHJvbWlzZS5yZXNvbHZlKClcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgcCA9IHAudGhlbihmdW5jLmJpbmQodW5kZWZpbmVkLCBsaXN0W2ldLCBpKSlcbiAgICB9XG5cbiAgICByZXR1cm4gcFxufVxuXG4vKipcbiAqIEEgbGF6eSBhY2Nlc3NvciwgY29tcGxldGUgd2l0aCB0aHJvd24gZXJyb3IgbWVtb2l6YXRpb24gYW5kIGEgZGVjZW50IGFtb3VudFxuICogb2Ygb3B0aW1pemF0aW9uLCBzaW5jZSBpdCdzIHVzZWQgaW4gYSBsb3Qgb2YgY29kZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB1c2VzIHJlZmVyZW5jZSBpbmRpcmVjdGlvbiBhbmQgZGlyZWN0IG11dGF0aW9uIHRvIGtlZXAgb25seVxuICoganVzdCB0aGUgY29tcHV0YXRpb24gbm9uLWNvbnN0YW50LCBzbyBlbmdpbmVzIGNhbiBhdm9pZCBjbG9zdXJlIGFsbG9jYXRpb24uXG4gKiBBbHNvLCBgY3JlYXRlYCBpcyBpbnRlbnRpb25hbGx5IGtlcHQgKm91dCogb2YgYW55IGNsb3N1cmUsIHNvIGl0IGNhbiBiZSBtb3JlXG4gKiBlYXNpbHkgY29sbGVjdGVkLlxuICovXG5mdW5jdGlvbiBMYXp5KGNyZWF0ZSkge1xuICAgIHRoaXMudmFsdWUgPSBjcmVhdGVcbiAgICB0aGlzLmdldCA9IHRoaXMuaW5pdFxufVxuXG5tZXRob2RzKExhenksIHtcbiAgICByZWN1cnNpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkxhenkgZnVuY3Rpb25zIG11c3Qgbm90IGJlIGNhbGxlZCByZWN1cnNpdmVseSFcIilcbiAgICB9LFxuXG4gICAgcmV0dXJuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlXG4gICAgfSxcblxuICAgIHRocm93OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IHRoaXMudmFsdWVcbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmdldCA9IHRoaXMucmVjdXJzaXZlXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSAoMCwgdGhpcy52YWx1ZSkoKVxuICAgICAgICAgICAgdGhpcy5nZXQgPSB0aGlzLnJldHVyblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IGVcbiAgICAgICAgICAgIHRoaXMuZ2V0ID0gdGhpcy50aHJvd1xuICAgICAgICAgICAgdGhyb3cgdGhpcy52YWx1ZVxuICAgICAgICB9XG4gICAgfSxcbn0pXG5cbmV4cG9ydHMubGF6eSA9IGZ1bmN0aW9uIChjcmVhdGUpIHtcbiAgICBhc3NlcnQodHlwZW9mIGNyZWF0ZSA9PT0gXCJmdW5jdGlvblwiKVxuXG4gICAgdmFyIHJlZiA9IG5ldyBMYXp5KGNyZWF0ZSlcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiByZWYuZ2V0KClcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKiBnbG9iYWwgdCAqL1xuXG5yZXF1aXJlKFwiLi4vbGliL2Jyb3dzZXItYnVuZGxlXCIpXG5yZXF1aXJlKFwiLi9pbmRleFwiKVxudC5zdXBwb3J0ID0gcmVxdWlyZShcIi4vc3VwcG9ydFwiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3XG4gKiBUaGlzIG1vZHVsZSBleHBvcnRzIHRoZSBmb2xsb3dpbmcgdXRpbGl0eSBmdW5jdGlvbnM6XG4gKlxuICogLSBgQ29tbW9uLnNob3dEZXByZWNhdGlvbigpYCAtIEFsbG93IGRlcHJlY2F0aW9uIG1lc3NhZ2VzIHRvIGJlIHNob3duLlxuICogLSBgQ29tbW9uLmhpZGVEZXByZWNhdGlvbigpYCAtIFByZXZlbnQgZGVwcmVjYXRpb24gbWVzc2FnZXMgZnJvbSBiZWluZyBzaG93bi5cbiAqIC0gYENvbW1vbi53YXJuKC4uLmFyZ3MpYCAtIFByaW50IGEgZGVwcmVjYXRpb24gd2FybmluZ1xuICogLSBgQ29tbW9uLmRlcHJlY2F0ZShtZXNzYWdlLCBmdW5jKWAgLSBXcmFwIGEgZnVuY3Rpb24gdG8gcHJpbnQgYSBkZXByZWNhdGlvblxuICogICBtZXNzYWdlIGJlZm9yZSBpdHMgZmlyc3QgdXNlLlxuICovXG5cbi8vIFRvIHN1cHByZXNzIGRlcHJlY2F0aW9uIG1lc3NhZ2VzXG52YXIgc3VwcHJlc3NEZXByZWNhdGlvbiA9IHRydWVcblxuZXhwb3J0cy5zaG93RGVwcmVjYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgc3VwcHJlc3NEZXByZWNhdGlvbiA9IGZhbHNlXG59XG5cbmV4cG9ydHMuaGlkZURlcHJlY2F0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHN1cHByZXNzRGVwcmVjYXRpb24gPSB0cnVlXG59XG5cbnZhciBjb25zb2xlID0gZ2xvYmFsLmNvbnNvbGVcbnZhciBzaG91bGRQcmludCA9IGNvbnNvbGUgIT0gbnVsbCAmJiB0eXBlb2YgY29uc29sZS53YXJuID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAhKGdsb2JhbC5wcm9jZXNzICE9IG51bGwgJiYgZ2xvYmFsLnByb2Nlc3MuZW52ICE9IG51bGwgJiZcbiAgICAgICAgZ2xvYmFsLnByb2Nlc3MuZW52Lk5PX01JR1JBVEVfV0FSTilcblxuZXhwb3J0cy53YXJuID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChzaG91bGRQcmludCAmJiAhc3VwcHJlc3NEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLndhcm4uYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxuICAgIH1cbn1cblxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbiAobWVzc2FnZSwgZnVuYykge1xuICAgIHZhciBwcmludGVkID0gIXNob3VsZFByaW50XG5cbiAgICAvKiogQHRoaXMgKi9cbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXN1cHByZXNzRGVwcmVjYXRpb24pIHtcbiAgICAgICAgICAgIGlmICghcHJpbnRlZCkge1xuICAgICAgICAgICAgICAgIHByaW50ZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgY29uc29sZS50cmFjZSgpXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1lc3NhZ2UgPSB1bmRlZmluZWRcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIEJhY2twb3J0IHdyYXBwZXIgdG8gd2FybiBhYm91dCBtb3N0IG9mIHRoZSBtYWpvciBicmVha2luZyBjaGFuZ2VzIGZyb20gdGhlXG4gKiBsYXN0IG1ham9yIHZlcnNpb24uXG4gKlxuICogSXQgY29uc2lzdHMgb2Ygc29sZWx5IGludGVybmFsIG1vbmtleSBwYXRjaGluZyB0byByZXZpdmUgc3VwcG9ydCBvZiBwcmV2aW91c1xuICogdmVyc2lvbnMsIGFsdGhvdWdoIEkgdHJpZWQgdG8gbGltaXQgaG93IG11Y2gga25vd2xlZGdlIG9mIHRoZSBpbnRlcm5hbHMgdGhpc1xuICogcmVxdWlyZXMuXG4gKi9cblxudmFyIENvbW1vbiA9IHJlcXVpcmUoXCIuL2NvbW1vblwiKVxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbGliL21ldGhvZHNcIilcbnZhciBUaGFsbGl1bSA9IHJlcXVpcmUoXCIuLi9saWIvYXBpL3RoYWxsaXVtXCIpXG52YXIgUmVmbGVjdCA9IHJlcXVpcmUoXCIuLi9saWIvYXBpL3JlZmxlY3RcIilcblxuLy8gTm90ZTogaGVyZSdzIGEgc2FtcGxlIHRlbXBsYXRlIG9mIGhvdyBlYWNoIG5vdGljZSBzaG91bGQgYmUgc3RydWN0dXJlZDpcbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogLSBgcmVmbGVjdC5pc0ZvbygpYCBpcyBkZXByZWNhdGVkIGluIGZhdm9yIG9mIHRoZSBgcmVmbGVjdC5pc0Zvb2AgZ2V0dGVyLiAqXG4gKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICovXG5cbi8qICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKlxuICogLSBgdC50ZXN0U2tpcCgpYCBpcyBkZXByZWNhdGVkIGluIGZhdm9yIG9mIGNhbGxpbmcgYHQuc2tpcCgpYCB3aXRoaW4gdGhlICAqXG4gKiAgIHRlc3QgYm9keS4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKi9cbnZhciB0bFRlc3QgPSBUaGFsbGl1bS5wcm90b3R5cGUudGVzdFxudmFyIHRsU2tpcCA9IFRoYWxsaXVtLnByb3RvdHlwZS5za2lwXG5cbm1ldGhvZHMoVGhhbGxpdW0sIHtcbiAgICB0ZXN0U2tpcDogQ29tbW9uLmRlcHJlY2F0ZShcbiAgICAgICAgXCJgdC50ZXN0U2tpcGAgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIGNhbGwgYHQuc2tpcCgpYCBpbnNpZGUgdGhlIHRlc3QgXCIgK1xuICAgICAgICBcImJvZHkgaW5zdGVhZC5cIixcbiAgICAgICAgLyoqIEB0aGlzICovIGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzLCBtYXgtbGVuXG4gICAgICAgICAgICByZXR1cm4gdGxUZXN0LmNhbGwodGhpcywgbmFtZSwgdGxTa2lwLmJpbmQodGhpcykpXG4gICAgICAgIH0pLFxufSlcblxuLyogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqXG4gKiAtIGByZWZsZWN0LnRlc3RTa2lwKClgIGlzIGRlcHJlY2F0ZWQgaW4gZmF2b3Igb2YgY2FsbGluZyBgcmVmbGVjdC5za2lwKClgICpcbiAqICAgd2l0aGluIHRoZSB0ZXN0IGJvZHkuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqICogKiAqL1xudmFyIHJlZmxlY3RUZXN0ID0gVGhhbGxpdW0ucHJvdG90eXBlLnRlc3RcbnZhciByZWZsZWN0U2tpcCA9IFRoYWxsaXVtLnByb3RvdHlwZS5za2lwXG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIHRlc3RTa2lwOiBDb21tb24uZGVwcmVjYXRlKFxuICAgICAgICBcImByZWZsZWN0LnRlc3RTa2lwYCBpcyBkZXByZWNhdGVkLiBQbGVhc2UgY2FsbCBgcmVmbGVjdC5za2lwKClgIFwiICtcbiAgICAgICAgXCJpbnNpZGUgdGhlIHRlc3QgYm9keSBpbnN0ZWFkLlwiLFxuICAgICAgICAvKiogQHRoaXMgKi8gZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnMsIG1heC1sZW5cbiAgICAgICAgICAgIHJldHVybiByZWZsZWN0VGVzdC5jYWxsKHRoaXMsIG5hbWUsIHJlZmxlY3RTa2lwLmJpbmQodGhpcykpXG4gICAgICAgIH0pLFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogUmVwbGFjZXMgdGhlIG9sZCBgdC5jYWxsYCBub24taW52YXNpdmVseS5cbiAqL1xuZXhwb3J0cy5jYWxsID0gZnVuY3Rpb24gKHQsIHBsdWdpbikge1xuICAgIHZhciByZWZsZWN0ID0gdC5yZWZsZWN0XG4gICAgdmFyIGFyZ3MgPSBbcmVmbGVjdF1cblxuICAgIGZvciAodmFyIGkgPSAyOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHBsdWdpbi5hcHBseShyZWZsZWN0LCBhcmdzKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoeHMsIGYpIHtcbiAgICBpZiAoeHMubWFwKSByZXR1cm4geHMubWFwKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB4ID0geHNbaV07XG4gICAgICAgIGlmIChoYXNPd24uY2FsbCh4cywgaSkpIHJlcy5wdXNoKGYoeCwgaSwgeHMpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn07XG5cbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuIiwidmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHhzLCBmLCBhY2MpIHtcbiAgICB2YXIgaGFzQWNjID0gYXJndW1lbnRzLmxlbmd0aCA+PSAzO1xuICAgIGlmIChoYXNBY2MgJiYgeHMucmVkdWNlKSByZXR1cm4geHMucmVkdWNlKGYsIGFjYyk7XG4gICAgaWYgKHhzLnJlZHVjZSkgcmV0dXJuIHhzLnJlZHVjZShmKTtcbiAgICBcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghaGFzT3duLmNhbGwoeHMsIGkpKSBjb250aW51ZTtcbiAgICAgICAgaWYgKCFoYXNBY2MpIHtcbiAgICAgICAgICAgIGFjYyA9IHhzW2ldO1xuICAgICAgICAgICAgaGFzQWNjID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGFjYyA9IGYoYWNjLCB4c1tpXSwgaSk7XG4gICAgfVxuICAgIHJldHVybiBhY2M7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9zdWJzdGFjay9ub2RlLWJyb3dzZXJpZnkvaXNzdWVzLzE2NzRcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwidXRpbC1pbnNwZWN0XCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgaW5zcGVjdCA9IGV4cG9ydHMuaW5zcGVjdCA9IHJlcXVpcmUoXCIuL2luc3BlY3RcIilcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG52YXIgQXNzZXJ0aW9uRXJyb3JcblxuLy8gUGhhbnRvbUpTLCBJRSwgYW5kIHBvc3NpYmx5IEVkZ2UgZG9uJ3Qgc2V0IHRoZSBzdGFjayB0cmFjZSB1bnRpbCB0aGUgZXJyb3IgaXNcbi8vIHRocm93bi4gTm90ZSB0aGF0IHRoaXMgcHJlZmVycyBhbiBleGlzdGluZyBzdGFjayBmaXJzdCwgc2luY2Ugbm9uLW5hdGl2ZVxuLy8gZXJyb3JzIGxpa2VseSBhbHJlYWR5IGNvbnRhaW4gdGhpcy5cbmZ1bmN0aW9uIGdldFN0YWNrKGUpIHtcbiAgICB2YXIgc3RhY2sgPSBlLnN0YWNrXG5cbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpIHx8IHN0YWNrICE9IG51bGwpIHJldHVybiBzdGFja1xuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhyb3cgZVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGUuc3RhY2tcbiAgICB9XG59XG5cbnRyeSB7XG4gICAgQXNzZXJ0aW9uRXJyb3IgPSBuZXcgRnVuY3Rpb24oWyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ldy1mdW5jXG4gICAgICAgIFwiJ3VzZSBzdHJpY3QnO1wiLFxuICAgICAgICBcImNsYXNzIEFzc2VydGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1wiLFxuICAgICAgICBcIiAgICBjb25zdHJ1Y3RvcihtZXNzYWdlLCBleHBlY3RlZCwgYWN0dWFsKSB7XCIsXG4gICAgICAgIFwiICAgICAgICBzdXBlcihtZXNzYWdlKVwiLFxuICAgICAgICBcIiAgICAgICAgdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkXCIsXG4gICAgICAgIFwiICAgICAgICB0aGlzLmFjdHVhbCA9IGFjdHVhbFwiLFxuICAgICAgICBcIiAgICB9XCIsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIFwiICAgIGdldCBuYW1lKCkge1wiLFxuICAgICAgICBcIiAgICAgICAgcmV0dXJuICdBc3NlcnRpb25FcnJvcidcIixcbiAgICAgICAgXCIgICAgfVwiLFxuICAgICAgICBcIn1cIixcbiAgICAgICAgLy8gY2hlY2sgbmF0aXZlIHN1YmNsYXNzaW5nIHN1cHBvcnRcbiAgICAgICAgXCJuZXcgQXNzZXJ0aW9uRXJyb3IoJ21lc3NhZ2UnLCAxLCAyKVwiLFxuICAgICAgICBcInJldHVybiBBc3NlcnRpb25FcnJvclwiLFxuICAgIF0uam9pbihcIlxcblwiKSkoKVxufSBjYXRjaCAoZSkge1xuICAgIEFzc2VydGlvbkVycm9yID0gdHlwZW9mIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgPyBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihtZXNzYWdlLCBleHBlY3RlZCwgYWN0dWFsKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiXCJcbiAgICAgICAgICAgIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZFxuICAgICAgICAgICAgdGhpcy5hY3R1YWwgPSBhY3R1YWxcbiAgICAgICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpXG4gICAgICAgIH1cbiAgICAgICAgOiBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihtZXNzYWdlLCBleHBlY3RlZCwgYWN0dWFsKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiXCJcbiAgICAgICAgICAgIHRoaXMuZXhwZWN0ZWQgPSBleHBlY3RlZFxuICAgICAgICAgICAgdGhpcy5hY3R1YWwgPSBhY3R1YWxcbiAgICAgICAgICAgIHZhciBlID0gbmV3IEVycm9yKG1lc3NhZ2UpXG5cbiAgICAgICAgICAgIGUubmFtZSA9IFwiQXNzZXJ0aW9uRXJyb3JcIlxuICAgICAgICAgICAgdGhpcy5zdGFjayA9IGdldFN0YWNrKGUpXG4gICAgICAgIH1cblxuICAgIEFzc2VydGlvbkVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFzc2VydGlvbkVycm9yLnByb3RvdHlwZSwgXCJjb25zdHJ1Y3RvclwiLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogQXNzZXJ0aW9uRXJyb3IsXG4gICAgfSlcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShBc3NlcnRpb25FcnJvci5wcm90b3R5cGUsIFwibmFtZVwiLCB7XG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogXCJBc3NlcnRpb25FcnJvclwiLFxuICAgIH0pXG59XG5cbmV4cG9ydHMuQXNzZXJ0aW9uRXJyb3IgPSBBc3NlcnRpb25FcnJvclxuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1zZWxmLWNvbXBhcmUgKi9cbi8vIEZvciBiZXR0ZXIgTmFOIGhhbmRsaW5nXG5leHBvcnRzLnN0cmljdElzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYSA9PT0gYiB8fCBhICE9PSBhICYmIGIgIT09IGJcbn1cblxuZXhwb3J0cy5sb29zZUlzID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYSA9PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxufVxuXG4vKiBlc2xpbnQtZW5hYmxlIG5vLXNlbGYtY29tcGFyZSAqL1xuXG52YXIgdGVtcGxhdGVSZWdleHAgPSAvKC4/KVxceyguKz8pXFx9L2dcblxuZXhwb3J0cy5lc2NhcGUgPSBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gICAgaWYgKHR5cGVvZiBzdHJpbmcgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBzdHJpbmdgIG11c3QgYmUgYSBzdHJpbmdcIilcbiAgICB9XG5cbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UodGVtcGxhdGVSZWdleHAsIGZ1bmN0aW9uIChtLCBwcmUpIHtcbiAgICAgICAgcmV0dXJuIHByZSArIFwiXFxcXFwiICsgbS5zbGljZSgxKVxuICAgIH0pXG59XG5cbi8vIFRoaXMgZm9ybWF0cyB0aGUgYXNzZXJ0aW9uIGVycm9yIG1lc3NhZ2VzLlxuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbiAobWVzc2FnZSwgYXJncywgcHJldHRpZnkpIHtcbiAgICBpZiAocHJldHRpZnkgPT0gbnVsbCkgcHJldHRpZnkgPSBpbnNwZWN0XG5cbiAgICBpZiAodHlwZW9mIG1lc3NhZ2UgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBtZXNzYWdlYCBtdXN0IGJlIGEgc3RyaW5nXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBhcmdzICE9PSBcIm9iamVjdFwiIHx8IGFyZ3MgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBhcmdzYCBtdXN0IGJlIGFuIG9iamVjdFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcHJldHRpZnkgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYHByZXR0aWZ5YCBtdXN0IGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIG1lc3NhZ2UucmVwbGFjZSh0ZW1wbGF0ZVJlZ2V4cCwgZnVuY3Rpb24gKG0sIHByZSwgcHJvcCkge1xuICAgICAgICBpZiAocHJlID09PSBcIlxcXFxcIikge1xuICAgICAgICAgICAgcmV0dXJuIG0uc2xpY2UoMSlcbiAgICAgICAgfSBlbHNlIGlmIChoYXNPd24uY2FsbChhcmdzLCBwcm9wKSkge1xuICAgICAgICAgICAgcmV0dXJuIHByZSArIHByZXR0aWZ5KGFyZ3NbcHJvcF0sIHtkZXB0aDogNX0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlICsgbVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZXhwb3J0cy5mYWlsID0gZnVuY3Rpb24gKG1lc3NhZ2UsIGFyZ3MsIHByZXR0aWZ5KSB7XG4gICAgaWYgKGFyZ3MgPT0gbnVsbCkgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1lc3NhZ2UpXG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgICAgICBleHBvcnRzLmZvcm1hdChtZXNzYWdlLCBhcmdzLCBwcmV0dGlmeSksXG4gICAgICAgIGFyZ3MuZXhwZWN0ZWQsXG4gICAgICAgIGFyZ3MuYWN0dWFsKVxufVxuXG4vLyBUaGUgYmFzaWMgYXNzZXJ0LCBsaWtlIGBhc3NlcnQub2tgLCBidXQgZ2l2ZXMgeW91IGFuIG9wdGlvbmFsIG1lc3NhZ2UuXG5leHBvcnRzLmFzc2VydCA9IGZ1bmN0aW9uICh0ZXN0LCBtZXNzYWdlKSB7XG4gICAgaWYgKCF0ZXN0KSB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSlcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qIGdsb2JhbCBQcm9taXNlICovXG5cbnZhciB0eXBlID0gcmVxdWlyZShcIi4vbGliL3R5cGVcIilcbnZhciBlcXVhbCA9IHJlcXVpcmUoXCIuL2xpYi9lcXVhbFwiKVxudmFyIHRocm93c0FzeW5jID0gcmVxdWlyZShcIi4vbGliL3Rocm93cy1hc3luY1wiKVxudmFyIGhhcyA9IHJlcXVpcmUoXCIuL2xpYi9oYXNcIilcbnZhciBpbmNsdWRlcyA9IHJlcXVpcmUoXCIuL2xpYi9pbmNsdWRlc1wiKVxudmFyIGhhc0tleXMgPSByZXF1aXJlKFwiLi9saWIvaGFzLWtleXNcIilcblxuZnVuY3Rpb24gdW5hcnkobWV0aG9kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKS50aGVuKG1ldGhvZClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJpbmFyeShtZXRob2QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBleHBlY3RlZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgbWV0aG9kKHZhbHVlLCBleHBlY3RlZClcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRlcm5hcnkobWV0aG9kKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgYSwgYikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHZhbHVlKS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgbWV0aG9kKHZhbHVlLCBhLCBiKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gb3B0VGVybmFyeShtZXRob2QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwgYSwgYikge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG9iamVjdCkudGhlbihmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgbWV0aG9kKG9iamVjdCwgYSwgYilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG9iamVjdCkudGhlbihmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgbWV0aG9kKG9iamVjdCwgYSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydHMub2sgPSB1bmFyeSh0eXBlLm9rKVxuZXhwb3J0cy5ub3RPayA9IHVuYXJ5KHR5cGUubm90T2spXG5leHBvcnRzLmlzQm9vbGVhbiA9IHVuYXJ5KHR5cGUuaXNCb29sZWFuKVxuZXhwb3J0cy5ub3RCb29sZWFuID0gdW5hcnkodHlwZS5ub3RCb29sZWFuKVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gdW5hcnkodHlwZS5pc0Z1bmN0aW9uKVxuZXhwb3J0cy5ub3RGdW5jdGlvbiA9IHVuYXJ5KHR5cGUubm90RnVuY3Rpb24pXG5leHBvcnRzLmlzTnVtYmVyID0gdW5hcnkodHlwZS5pc051bWJlcilcbmV4cG9ydHMubm90TnVtYmVyID0gdW5hcnkodHlwZS5ub3ROdW1iZXIpXG5leHBvcnRzLmlzT2JqZWN0ID0gdW5hcnkodHlwZS5pc09iamVjdClcbmV4cG9ydHMubm90T2JqZWN0ID0gdW5hcnkodHlwZS5ub3RPYmplY3QpXG5leHBvcnRzLmlzU3RyaW5nID0gdW5hcnkodHlwZS5pc1N0cmluZylcbmV4cG9ydHMubm90U3RyaW5nID0gdW5hcnkodHlwZS5ub3RTdHJpbmcpXG5leHBvcnRzLmlzU3ltYm9sID0gdW5hcnkodHlwZS5pc1N5bWJvbClcbmV4cG9ydHMubm90U3ltYm9sID0gdW5hcnkodHlwZS5ub3RTeW1ib2wpXG5leHBvcnRzLmV4aXN0cyA9IHVuYXJ5KHR5cGUuZXhpc3RzKVxuZXhwb3J0cy5ub3RFeGlzdHMgPSB1bmFyeSh0eXBlLm5vdEV4aXN0cylcbmV4cG9ydHMuaXNBcnJheSA9IHVuYXJ5KHR5cGUuaXNBcnJheSlcbmV4cG9ydHMubm90QXJyYXkgPSB1bmFyeSh0eXBlLm5vdEFycmF5KVxuXG5leHBvcnRzLmlzID0gZnVuY3Rpb24gKFR5cGUsIG9iamVjdCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUob2JqZWN0KS50aGVuKGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgdHlwZS5pcyhUeXBlLCBvYmplY3QpXG4gICAgfSlcbn1cblxuZXhwb3J0cy5ub3QgPSBmdW5jdGlvbiAoVHlwZSwgb2JqZWN0KSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShvYmplY3QpLnRoZW4oZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICB0eXBlLm5vdChUeXBlLCBvYmplY3QpXG4gICAgfSlcbn1cblxuZXhwb3J0cy5lcXVhbCA9IGJpbmFyeShlcXVhbC5lcXVhbClcbmV4cG9ydHMubm90RXF1YWwgPSBiaW5hcnkoZXF1YWwubm90RXF1YWwpXG5leHBvcnRzLmVxdWFsTG9vc2UgPSBiaW5hcnkoZXF1YWwuZXF1YWxMb29zZSlcbmV4cG9ydHMubm90RXF1YWxMb29zZSA9IGJpbmFyeShlcXVhbC5ub3RFcXVhbExvb3NlKVxuZXhwb3J0cy5kZWVwRXF1YWwgPSBiaW5hcnkoZXF1YWwuZGVlcEVxdWFsKVxuZXhwb3J0cy5ub3REZWVwRXF1YWwgPSBiaW5hcnkoZXF1YWwubm90RGVlcEVxdWFsKVxuZXhwb3J0cy5tYXRjaCA9IGJpbmFyeShlcXVhbC5tYXRjaClcbmV4cG9ydHMubm90TWF0Y2ggPSBiaW5hcnkoZXF1YWwubm90TWF0Y2gpXG5leHBvcnRzLmF0TGVhc3QgPSBiaW5hcnkoZXF1YWwuYXRMZWFzdClcbmV4cG9ydHMuYXRNb3N0ID0gYmluYXJ5KGVxdWFsLmF0TW9zdClcbmV4cG9ydHMuYWJvdmUgPSBiaW5hcnkoZXF1YWwuYWJvdmUpXG5leHBvcnRzLmJlbG93ID0gYmluYXJ5KGVxdWFsLmJlbG93KVxuZXhwb3J0cy5iZXR3ZWVuID0gdGVybmFyeShlcXVhbC5iZXR3ZWVuKVxuZXhwb3J0cy5jbG9zZVRvID0gdGVybmFyeShlcXVhbC5jbG9zZVRvKVxuZXhwb3J0cy5ub3RDbG9zZVRvID0gdGVybmFyeShlcXVhbC5ub3RDbG9zZVRvKVxuXG5leHBvcnRzLnRocm93cyA9IHRocm93c0FzeW5jLnRocm93c1xuZXhwb3J0cy50aHJvd3NNYXRjaCA9IHRocm93c0FzeW5jLnRocm93c01hdGNoXG5cbmV4cG9ydHMuaGFzT3duID0gb3B0VGVybmFyeShoYXMuaGFzT3duKVxuZXhwb3J0cy5ub3RIYXNPd24gPSBvcHRUZXJuYXJ5KGhhcy5ub3RIYXNPd24pXG5leHBvcnRzLmhhc093bkxvb3NlID0gb3B0VGVybmFyeShoYXMuaGFzT3duTG9vc2UpXG5leHBvcnRzLm5vdEhhc093bkxvb3NlID0gb3B0VGVybmFyeShoYXMubm90SGFzT3duTG9vc2UpXG5leHBvcnRzLmhhc0tleSA9IG9wdFRlcm5hcnkoaGFzLmhhc0tleSlcbmV4cG9ydHMubm90SGFzS2V5ID0gb3B0VGVybmFyeShoYXMubm90SGFzS2V5KVxuZXhwb3J0cy5oYXNLZXlMb29zZSA9IG9wdFRlcm5hcnkoaGFzLmhhc0tleUxvb3NlKVxuZXhwb3J0cy5ub3RIYXNLZXlMb29zZSA9IG9wdFRlcm5hcnkoaGFzLm5vdEhhc0tleUxvb3NlKVxuZXhwb3J0cy5oYXMgPSBvcHRUZXJuYXJ5KGhhcy5oYXMpXG5leHBvcnRzLm5vdEhhcyA9IG9wdFRlcm5hcnkoaGFzLm5vdEhhcylcbmV4cG9ydHMuaGFzTG9vc2UgPSBvcHRUZXJuYXJ5KGhhcy5oYXNMb29zZSlcbmV4cG9ydHMubm90SGFzTG9vc2UgPSBvcHRUZXJuYXJ5KGhhcy5ub3RIYXNMb29zZSlcblxuZXhwb3J0cy5pbmNsdWRlcyA9IGJpbmFyeShpbmNsdWRlcy5pbmNsdWRlcylcbmV4cG9ydHMuaW5jbHVkZXNEZWVwID0gYmluYXJ5KGluY2x1ZGVzLmluY2x1ZGVzRGVlcClcbmV4cG9ydHMuaW5jbHVkZXNNYXRjaCA9IGJpbmFyeShpbmNsdWRlcy5pbmNsdWRlc01hdGNoKVxuZXhwb3J0cy5pbmNsdWRlc0FueSA9IGJpbmFyeShpbmNsdWRlcy5pbmNsdWRlc0FueSlcbmV4cG9ydHMuaW5jbHVkZXNBbnlEZWVwID0gYmluYXJ5KGluY2x1ZGVzLmluY2x1ZGVzQW55RGVlcClcbmV4cG9ydHMuaW5jbHVkZXNBbnlNYXRjaCA9IGJpbmFyeShpbmNsdWRlcy5pbmNsdWRlc0FueU1hdGNoKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbCA9IGJpbmFyeShpbmNsdWRlcy5ub3RJbmNsdWRlc0FsbClcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxEZWVwID0gYmluYXJ5KGluY2x1ZGVzLm5vdEluY2x1ZGVzQWxsRGVlcClcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxNYXRjaCA9IGJpbmFyeShpbmNsdWRlcy5ub3RJbmNsdWRlc0FsbE1hdGNoKVxuZXhwb3J0cy5ub3RJbmNsdWRlcyA9IGJpbmFyeShpbmNsdWRlcy5ub3RJbmNsdWRlcylcbmV4cG9ydHMubm90SW5jbHVkZXNEZWVwID0gYmluYXJ5KGluY2x1ZGVzLm5vdEluY2x1ZGVzRGVlcClcbmV4cG9ydHMubm90SW5jbHVkZXNNYXRjaCA9IGJpbmFyeShpbmNsdWRlcy5ub3RJbmNsdWRlc01hdGNoKVxuXG5leHBvcnRzLmhhc0tleXMgPSBiaW5hcnkoaGFzS2V5cy5oYXNLZXlzKVxuZXhwb3J0cy5oYXNLZXlzRGVlcCA9IGJpbmFyeShoYXNLZXlzLmhhc0tleXNEZWVwKVxuZXhwb3J0cy5oYXNLZXlzTWF0Y2ggPSBiaW5hcnkoaGFzS2V5cy5oYXNLZXlzTWF0Y2gpXG5leHBvcnRzLmhhc0tleXNBbnkgPSBiaW5hcnkoaGFzS2V5cy5oYXNLZXlzQW55KVxuZXhwb3J0cy5oYXNLZXlzQW55RGVlcCA9IGJpbmFyeShoYXNLZXlzLmhhc0tleXNBbnlEZWVwKVxuZXhwb3J0cy5oYXNLZXlzQW55TWF0Y2ggPSBiaW5hcnkoaGFzS2V5cy5oYXNLZXlzQW55TWF0Y2gpXG5leHBvcnRzLm5vdEhhc0tleXNBbGwgPSBiaW5hcnkoaGFzS2V5cy5ub3RIYXNLZXlzQWxsKVxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsRGVlcCA9IGJpbmFyeShoYXNLZXlzLm5vdEhhc0tleXNBbGxEZWVwKVxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsTWF0Y2ggPSBiaW5hcnkoaGFzS2V5cy5ub3RIYXNLZXlzQWxsTWF0Y2gpXG5leHBvcnRzLm5vdEhhc0tleXMgPSBiaW5hcnkoaGFzS2V5cy5ub3RIYXNLZXlzKVxuZXhwb3J0cy5ub3RIYXNLZXlzRGVlcCA9IGJpbmFyeShoYXNLZXlzLm5vdEhhc0tleXNEZWVwKVxuZXhwb3J0cy5ub3RIYXNLZXlzTWF0Y2ggPSBiaW5hcnkoaGFzS2V5cy5ub3RIYXNLZXlzTWF0Y2gpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIENvcmUgVERELXN0eWxlIGFzc2VydGlvbnMuIFRoZXNlIGFyZSBkb25lIGJ5IGEgY29tcG9zaXRpb24gb2YgRFNMcywgc2luY2VcbiAqIHRoZXJlIGlzICpzbyogbXVjaCByZXBldGl0aW9uLiBBbHNvLCB0aGlzIGlzIHNwbGl0IGludG8gc2V2ZXJhbCBuYW1lc3BhY2VzIHRvXG4gKiBrZWVwIHRoZSBmaWxlIHNpemUgbWFuYWdlYWJsZS5cbiAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxudmFyIHR5cGUgPSByZXF1aXJlKFwiLi9saWIvdHlwZVwiKVxudmFyIGVxdWFsID0gcmVxdWlyZShcIi4vbGliL2VxdWFsXCIpXG52YXIgdGhyb3dzID0gcmVxdWlyZShcIi4vbGliL3Rocm93c1wiKVxudmFyIGhhcyA9IHJlcXVpcmUoXCIuL2xpYi9oYXNcIilcbnZhciBpbmNsdWRlcyA9IHJlcXVpcmUoXCIuL2xpYi9pbmNsdWRlc1wiKVxudmFyIGhhc0tleXMgPSByZXF1aXJlKFwiLi9saWIvaGFzLWtleXNcIilcblxuZXhwb3J0cy5Bc3NlcnRpb25FcnJvciA9IHV0aWwuQXNzZXJ0aW9uRXJyb3JcbmV4cG9ydHMuYXNzZXJ0ID0gdXRpbC5hc3NlcnRcbmV4cG9ydHMuZmFpbCA9IHV0aWwuZmFpbFxuXG5leHBvcnRzLm9rID0gdHlwZS5va1xuZXhwb3J0cy5ub3RPayA9IHR5cGUubm90T2tcbmV4cG9ydHMuaXNCb29sZWFuID0gdHlwZS5pc0Jvb2xlYW5cbmV4cG9ydHMubm90Qm9vbGVhbiA9IHR5cGUubm90Qm9vbGVhblxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gdHlwZS5pc0Z1bmN0aW9uXG5leHBvcnRzLm5vdEZ1bmN0aW9uID0gdHlwZS5ub3RGdW5jdGlvblxuZXhwb3J0cy5pc051bWJlciA9IHR5cGUuaXNOdW1iZXJcbmV4cG9ydHMubm90TnVtYmVyID0gdHlwZS5ub3ROdW1iZXJcbmV4cG9ydHMuaXNPYmplY3QgPSB0eXBlLmlzT2JqZWN0XG5leHBvcnRzLm5vdE9iamVjdCA9IHR5cGUubm90T2JqZWN0XG5leHBvcnRzLmlzU3RyaW5nID0gdHlwZS5pc1N0cmluZ1xuZXhwb3J0cy5ub3RTdHJpbmcgPSB0eXBlLm5vdFN0cmluZ1xuZXhwb3J0cy5pc1N5bWJvbCA9IHR5cGUuaXNTeW1ib2xcbmV4cG9ydHMubm90U3ltYm9sID0gdHlwZS5ub3RTeW1ib2xcbmV4cG9ydHMuZXhpc3RzID0gdHlwZS5leGlzdHNcbmV4cG9ydHMubm90RXhpc3RzID0gdHlwZS5ub3RFeGlzdHNcbmV4cG9ydHMuaXNBcnJheSA9IHR5cGUuaXNBcnJheVxuZXhwb3J0cy5ub3RBcnJheSA9IHR5cGUubm90QXJyYXlcbmV4cG9ydHMuaXMgPSB0eXBlLmlzXG5leHBvcnRzLm5vdCA9IHR5cGUubm90XG5cbmV4cG9ydHMuZXF1YWwgPSBlcXVhbC5lcXVhbFxuZXhwb3J0cy5ub3RFcXVhbCA9IGVxdWFsLm5vdEVxdWFsXG5leHBvcnRzLmVxdWFsTG9vc2UgPSBlcXVhbC5lcXVhbExvb3NlXG5leHBvcnRzLm5vdEVxdWFsTG9vc2UgPSBlcXVhbC5ub3RFcXVhbExvb3NlXG5leHBvcnRzLmRlZXBFcXVhbCA9IGVxdWFsLmRlZXBFcXVhbFxuZXhwb3J0cy5ub3REZWVwRXF1YWwgPSBlcXVhbC5ub3REZWVwRXF1YWxcbmV4cG9ydHMubWF0Y2ggPSBlcXVhbC5tYXRjaFxuZXhwb3J0cy5ub3RNYXRjaCA9IGVxdWFsLm5vdE1hdGNoXG5leHBvcnRzLmF0TGVhc3QgPSBlcXVhbC5hdExlYXN0XG5leHBvcnRzLmF0TW9zdCA9IGVxdWFsLmF0TW9zdFxuZXhwb3J0cy5hYm92ZSA9IGVxdWFsLmFib3ZlXG5leHBvcnRzLmJlbG93ID0gZXF1YWwuYmVsb3dcbmV4cG9ydHMuYmV0d2VlbiA9IGVxdWFsLmJldHdlZW5cbmV4cG9ydHMuY2xvc2VUbyA9IGVxdWFsLmNsb3NlVG9cbmV4cG9ydHMubm90Q2xvc2VUbyA9IGVxdWFsLm5vdENsb3NlVG9cblxuZXhwb3J0cy50aHJvd3MgPSB0aHJvd3MudGhyb3dzXG5leHBvcnRzLnRocm93c01hdGNoID0gdGhyb3dzLnRocm93c01hdGNoXG5cbmV4cG9ydHMuaGFzT3duID0gaGFzLmhhc093blxuZXhwb3J0cy5ub3RIYXNPd24gPSBoYXMubm90SGFzT3duXG5leHBvcnRzLmhhc093bkxvb3NlID0gaGFzLmhhc093bkxvb3NlXG5leHBvcnRzLm5vdEhhc093bkxvb3NlID0gaGFzLm5vdEhhc093bkxvb3NlXG5leHBvcnRzLmhhc0tleSA9IGhhcy5oYXNLZXlcbmV4cG9ydHMubm90SGFzS2V5ID0gaGFzLm5vdEhhc0tleVxuZXhwb3J0cy5oYXNLZXlMb29zZSA9IGhhcy5oYXNLZXlMb29zZVxuZXhwb3J0cy5ub3RIYXNLZXlMb29zZSA9IGhhcy5ub3RIYXNLZXlMb29zZVxuZXhwb3J0cy5oYXMgPSBoYXMuaGFzXG5leHBvcnRzLm5vdEhhcyA9IGhhcy5ub3RIYXNcbmV4cG9ydHMuaGFzTG9vc2UgPSBoYXMuaGFzTG9vc2VcbmV4cG9ydHMubm90SGFzTG9vc2UgPSBoYXMubm90SGFzTG9vc2VcblxuLyoqXG4gKiBUaGVyZSdzIDIgc2V0cyBvZiAxMiBwZXJtdXRhdGlvbnMgaGVyZSBmb3IgYGluY2x1ZGVzYCBhbmQgYGhhc0tleXNgLCBpbnN0ZWFkXG4gKiBvZiBOIHNldHMgb2YgMiAod2hpY2ggd291bGQgZml0IHRoZSBgZm9vYC9gbm90Rm9vYCBpZGlvbSBiZXR0ZXIpLCBzbyBpdCdzXG4gKiBlYXNpZXIgdG8ganVzdCBtYWtlIGEgY291cGxlIHNlcGFyYXRlIERTTHMgYW5kIHVzZSB0aGF0IHRvIGRlZmluZSBldmVyeXRoaW5nLlxuICpcbiAqIEhlcmUncyB0aGUgdG9wIGxldmVsOlxuICpcbiAqIC0gc2hhbGxvd1xuICogLSBzdHJpY3QgZGVlcFxuICogLSBzdHJ1Y3R1cmFsIGRlZXBcbiAqXG4gKiBBbmQgdGhlIHNlY29uZCBsZXZlbDpcbiAqXG4gKiAtIGluY2x1ZGVzIGFsbC9ub3QgbWlzc2luZyBzb21lXG4gKiAtIGluY2x1ZGVzIHNvbWUvbm90IG1pc3NpbmcgYWxsXG4gKiAtIG5vdCBpbmNsdWRpbmcgYWxsL21pc3Npbmcgc29tZVxuICogLSBub3QgaW5jbHVkaW5nIHNvbWUvbWlzc2luZyBhbGxcbiAqXG4gKiBIZXJlJ3MgYW4gZXhhbXBsZSB1c2luZyB0aGUgbmFtaW5nIHNjaGVtZSBmb3IgYGhhc0tleXMqYFxuICpcbiAqICAgICAgICAgICAgICAgfCAgICAgc2hhbGxvdyAgICAgfCAgICBzdHJpY3QgZGVlcCAgICAgIHwgICBzdHJ1Y3R1cmFsIGRlZXBcbiAqIC0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBpbmNsdWRlcyBhbGwgIHwgYGhhc0tleXNgICAgICAgIHwgYGhhc0tleXNEZWVwYCAgICAgICB8IGBoYXNLZXlzTWF0Y2hgXG4gKiBpbmNsdWRlcyBzb21lIHwgYGhhc0tleXNBbnlgICAgIHwgYGhhc0tleXNBbnlEZWVwYCAgICB8IGBoYXNLZXlzQW55TWF0Y2hgXG4gKiBtaXNzaW5nIHNvbWUgIHwgYG5vdEhhc0tleXNBbGxgIHwgYG5vdEhhc0tleXNBbGxEZWVwYCB8IGBub3RIYXNLZXlzQWxsTWF0Y2hgXG4gKiBtaXNzaW5nIGFsbCAgIHwgYG5vdEhhc0tleXNgICAgIHwgYG5vdEhhc0tleXNEZWVwYCAgICB8IGBub3RIYXNLZXlzTWF0Y2hgXG4gKlxuICogTm90ZSB0aGF0IHRoZSBgaGFzS2V5c2Agc2hhbGxvdyBjb21wYXJpc29uIHZhcmlhbnRzIGFyZSBhbHNvIG92ZXJsb2FkZWQgdG9cbiAqIGNvbnN1bWUgZWl0aGVyIGFuIGFycmF5IChpbiB3aGljaCBpdCBzaW1wbHkgY2hlY2tzIGFnYWluc3QgYSBsaXN0IG9mIGtleXMpIG9yXG4gKiBhbiBvYmplY3QgKHdoZXJlIGl0IGRvZXMgYSBmdWxsIGRlZXAgY29tcGFyaXNvbikuXG4gKi9cblxuZXhwb3J0cy5pbmNsdWRlcyA9IGluY2x1ZGVzLmluY2x1ZGVzXG5leHBvcnRzLmluY2x1ZGVzRGVlcCA9IGluY2x1ZGVzLmluY2x1ZGVzRGVlcFxuZXhwb3J0cy5pbmNsdWRlc01hdGNoID0gaW5jbHVkZXMuaW5jbHVkZXNNYXRjaFxuZXhwb3J0cy5pbmNsdWRlc0FueSA9IGluY2x1ZGVzLmluY2x1ZGVzQW55XG5leHBvcnRzLmluY2x1ZGVzQW55RGVlcCA9IGluY2x1ZGVzLmluY2x1ZGVzQW55RGVlcFxuZXhwb3J0cy5pbmNsdWRlc0FueU1hdGNoID0gaW5jbHVkZXMuaW5jbHVkZXNBbnlNYXRjaFxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbCA9IGluY2x1ZGVzLm5vdEluY2x1ZGVzQWxsXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsRGVlcCA9IGluY2x1ZGVzLm5vdEluY2x1ZGVzQWxsRGVlcFxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbE1hdGNoID0gaW5jbHVkZXMubm90SW5jbHVkZXNBbGxNYXRjaFxuZXhwb3J0cy5ub3RJbmNsdWRlcyA9IGluY2x1ZGVzLm5vdEluY2x1ZGVzXG5leHBvcnRzLm5vdEluY2x1ZGVzRGVlcCA9IGluY2x1ZGVzLm5vdEluY2x1ZGVzRGVlcFxuZXhwb3J0cy5ub3RJbmNsdWRlc01hdGNoID0gaW5jbHVkZXMubm90SW5jbHVkZXNNYXRjaFxuXG5leHBvcnRzLmhhc0tleXMgPSBoYXNLZXlzLmhhc0tleXNcbmV4cG9ydHMuaGFzS2V5c0RlZXAgPSBoYXNLZXlzLmhhc0tleXNEZWVwXG5leHBvcnRzLmhhc0tleXNNYXRjaCA9IGhhc0tleXMuaGFzS2V5c01hdGNoXG5leHBvcnRzLmhhc0tleXNBbnkgPSBoYXNLZXlzLmhhc0tleXNBbnlcbmV4cG9ydHMuaGFzS2V5c0FueURlZXAgPSBoYXNLZXlzLmhhc0tleXNBbnlEZWVwXG5leHBvcnRzLmhhc0tleXNBbnlNYXRjaCA9IGhhc0tleXMuaGFzS2V5c0FueU1hdGNoXG5leHBvcnRzLm5vdEhhc0tleXNBbGwgPSBoYXNLZXlzLm5vdEhhc0tleXNBbGxcbmV4cG9ydHMubm90SGFzS2V5c0FsbERlZXAgPSBoYXNLZXlzLm5vdEhhc0tleXNBbGxEZWVwXG5leHBvcnRzLm5vdEhhc0tleXNBbGxNYXRjaCA9IGhhc0tleXMubm90SGFzS2V5c0FsbE1hdGNoXG5leHBvcnRzLm5vdEhhc0tleXMgPSBoYXNLZXlzLm5vdEhhc0tleXNcbmV4cG9ydHMubm90SGFzS2V5c0RlZXAgPSBoYXNLZXlzLm5vdEhhc0tleXNEZWVwXG5leHBvcnRzLm5vdEhhc0tleXNNYXRjaCA9IGhhc0tleXMubm90SGFzS2V5c01hdGNoXG5cbmV4cG9ydHMuYXN5bmMgPSByZXF1aXJlKFwiLi9hc3luY1wiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1hdGNoID0gcmVxdWlyZShcImNsZWFuLW1hdGNoXCIpXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxuXG5mdW5jdGlvbiBiaW5hcnkobnVtZXJpYywgY29tcGFyYXRvciwgbWVzc2FnZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYWN0dWFsLCBleHBlY3RlZCkge1xuICAgICAgICBpZiAobnVtZXJpYykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhY3R1YWwgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBleHBlY3RlZGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb21wYXJhdG9yKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogYWN0dWFsLCBleHBlY3RlZDogZXhwZWN0ZWR9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnRzLmVxdWFsID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiB1dGlsLnN0cmljdElzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubm90RXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuICF1dGlsLnN0cmljdElzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmVxdWFsTG9vc2UgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIHV0aWwubG9vc2VJcyhhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbG9vc2VseSBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubm90RXF1YWxMb29zZSA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gIXV0aWwubG9vc2VJcyhhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGxvb3NlbHkgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmF0TGVhc3QgPSBiaW5hcnkodHJ1ZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+PSBiIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhdCBsZWFzdCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYXRNb3N0ID0gYmluYXJ5KHRydWUsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPD0gYiB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYXQgbW9zdCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYWJvdmUgPSBiaW5hcnkodHJ1ZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA+IGIgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFib3ZlIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5iZWxvdyA9IGJpbmFyeSh0cnVlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhIDwgYiB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYmVsb3cge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmJldHdlZW4gPSBmdW5jdGlvbiAoYWN0dWFsLCBsb3dlciwgdXBwZXIpIHtcbiAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbG93ZXIgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBsb3dlcmAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdXBwZXIgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImB1cHBlcmAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIC8vIFRoZSBuZWdhdGlvbiBpcyB0byBhZGRyZXNzIE5hTnMgYXMgd2VsbCwgd2l0aG91dCB3cml0aW5nIGEgdG9uIG9mIHNwZWNpYWxcbiAgICAvLyBjYXNlIGJvaWxlcnBsYXRlXG4gICAgaWYgKCEoYWN0dWFsID49IGxvd2VyICYmIGFjdHVhbCA8PSB1cHBlcikpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYmV0d2VlbiB7bG93ZXJ9IGFuZCB7dXBwZXJ9XCIsIHtcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgbG93ZXI6IGxvd2VyLFxuICAgICAgICAgICAgdXBwZXI6IHVwcGVyLFxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5kZWVwRXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIG1hdGNoLnN0cmljdChhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZGVlcGx5IGVxdWFsIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5ub3REZWVwRXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuICFtYXRjaC5zdHJpY3QoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBkZWVwbHkgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm1hdGNoID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBtYXRjaC5sb29zZShhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2gge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm5vdE1hdGNoID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiAhbWF0Y2gubG9vc2UoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCB7ZXhwZWN0ZWR9XCIpXG5cbi8vIFVzZXMgZGl2aXNpb24gdG8gYWxsb3cgZm9yIGEgbW9yZSByb2J1c3QgY29tcGFyaXNvbiBvZiBmbG9hdHMuIEFsc28sIHRoaXNcbi8vIGhhbmRsZXMgbmVhci16ZXJvIGNvbXBhcmlzb25zIGNvcnJlY3RseSwgYXMgd2VsbCBhcyBhIHplcm8gdG9sZXJhbmNlIChpLmUuXG4vLyBleGFjdCBjb21wYXJpc29uKS5cbmZ1bmN0aW9uIGNsb3NlVG8oZXhwZWN0ZWQsIGFjdHVhbCwgdG9sZXJhbmNlKSB7XG4gICAgaWYgKHRvbGVyYW5jZSA9PT0gSW5maW5pdHkgfHwgYWN0dWFsID09PSBleHBlY3RlZCkgcmV0dXJuIHRydWVcbiAgICBpZiAodG9sZXJhbmNlID09PSAwKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoYWN0dWFsID09PSAwKSByZXR1cm4gTWF0aC5hYnMoZXhwZWN0ZWQpIDwgdG9sZXJhbmNlXG4gICAgaWYgKGV4cGVjdGVkID09PSAwKSByZXR1cm4gTWF0aC5hYnMoYWN0dWFsKSA8IHRvbGVyYW5jZVxuICAgIHJldHVybiBNYXRoLmFicyhleHBlY3RlZCAvIGFjdHVhbCAtIDEpIDwgdG9sZXJhbmNlXG59XG5cbi8vIE5vdGU6IHRoZXNlIHR3byBhbHdheXMgZmFpbCB3aGVuIGRlYWxpbmcgd2l0aCBOYU5zLlxuZXhwb3J0cy5jbG9zZVRvID0gZnVuY3Rpb24gKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkge1xuICAgIGlmICh0eXBlb2YgYWN0dWFsICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYWN0dWFsYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBleHBlY3RlZCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGV4cGVjdGVkYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHRvbGVyYW5jZSA9PSBudWxsKSB0b2xlcmFuY2UgPSAxZS0xMFxuXG4gICAgaWYgKHR5cGVvZiB0b2xlcmFuY2UgIT09IFwibnVtYmVyXCIgfHwgdG9sZXJhbmNlIDwgMCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJgdG9sZXJhbmNlYCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlciBpZiBnaXZlblwiKVxuICAgIH1cblxuICAgIGlmIChhY3R1YWwgIT09IGFjdHVhbCB8fCBleHBlY3RlZCAhPT0gZXhwZWN0ZWQgfHwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmUsIG1heC1sZW5cbiAgICAgICAgICAgICFjbG9zZVRvKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgY2xvc2UgdG8ge2V4cGVjdGVkfVwiLCB7XG4gICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90Q2xvc2VUbyA9IGZ1bmN0aW9uIChleHBlY3RlZCwgYWN0dWFsLCB0b2xlcmFuY2UpIHtcbiAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFjdHVhbGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZXhwZWN0ZWQgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBleHBlY3RlZGAgbXVzdCBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIGlmICh0b2xlcmFuY2UgPT0gbnVsbCkgdG9sZXJhbmNlID0gMWUtMTBcblxuICAgIGlmICh0eXBlb2YgdG9sZXJhbmNlICE9PSBcIm51bWJlclwiIHx8IHRvbGVyYW5jZSA8IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIFwiYHRvbGVyYW5jZWAgbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBudW1iZXIgaWYgZ2l2ZW5cIilcbiAgICB9XG5cbiAgICBpZiAoZXhwZWN0ZWQgIT09IGV4cGVjdGVkIHx8IGFjdHVhbCAhPT0gYWN0dWFsIHx8IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlLCBtYXgtbGVuXG4gICAgICAgICAgICBjbG9zZVRvKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGNsb3NlIHRvIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1hdGNoID0gcmVxdWlyZShcImNsZWFuLW1hdGNoXCIpXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuZnVuY3Rpb24gaGFzS2V5cyhhbGwsIG9iamVjdCwga2V5cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGVzdCA9IGhhc093bi5jYWxsKG9iamVjdCwga2V5c1tpXSlcblxuICAgICAgICBpZiAodGVzdCAhPT0gYWxsKSByZXR1cm4gIWFsbFxuICAgIH1cblxuICAgIHJldHVybiBhbGxcbn1cblxuZnVuY3Rpb24gaGFzVmFsdWVzKGZ1bmMsIGFsbCwgb2JqZWN0LCBrZXlzKSB7XG4gICAgaWYgKG9iamVjdCA9PT0ga2V5cykgcmV0dXJuIHRydWVcbiAgICB2YXIgbGlzdCA9IE9iamVjdC5rZXlzKGtleXMpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGxpc3RbaV1cbiAgICAgICAgdmFyIHRlc3QgPSBoYXNPd24uY2FsbChvYmplY3QsIGtleSkgJiYgZnVuYyhrZXlzW2tleV0sIG9iamVjdFtrZXldKVxuXG4gICAgICAgIGlmICh0ZXN0ICE9PSBhbGwpIHJldHVybiB0ZXN0XG4gICAgfVxuXG4gICAgcmV0dXJuIGFsbFxufVxuXG5mdW5jdGlvbiBtYWtlSGFzT3ZlcmxvYWQoYWxsLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5cykge1xuICAgICAgICBpZiAodHlwZW9mIG9iamVjdCAhPT0gXCJvYmplY3RcIiB8fCBvYmplY3QgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvYmplY3RgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGtleXMgIT09IFwib2JqZWN0XCIgfHwga2V5cyA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGtleXNgIG11c3QgYmUgYW4gb2JqZWN0IG9yIGFycmF5XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXlzKSkge1xuICAgICAgICAgICAgaWYgKGtleXMubGVuZ3RoICYmIGhhc0tleXMoYWxsLCBvYmplY3QsIGtleXMpID09PSBpbnZlcnQpIHtcbiAgICAgICAgICAgICAgICB1dGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogb2JqZWN0LCBrZXlzOiBrZXlzfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChPYmplY3Qua2V5cyhrZXlzKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChoYXNWYWx1ZXModXRpbC5zdHJpY3RJcywgYWxsLCBvYmplY3QsIGtleXMpID09PSBpbnZlcnQpIHtcbiAgICAgICAgICAgICAgICB1dGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogb2JqZWN0LCBrZXlzOiBrZXlzfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbWFrZUhhc0tleXMoZnVuYywgYWxsLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5cykge1xuICAgICAgICBpZiAodHlwZW9mIG9iamVjdCAhPT0gXCJvYmplY3RcIiB8fCBvYmplY3QgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvYmplY3RgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGtleXMgIT09IFwib2JqZWN0XCIgfHwga2V5cyA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGtleXNgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBleGNsdXNpdmUgb3IgdG8gaW52ZXJ0IHRoZSByZXN1bHQgaWYgYGludmVydGAgaXMgdHJ1ZVxuICAgICAgICBpZiAoT2JqZWN0LmtleXMoa2V5cykubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoaGFzVmFsdWVzKGZ1bmMsIGFsbCwgb2JqZWN0LCBrZXlzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICAgICAgdXRpbC5mYWlsKG1lc3NhZ2UsIHthY3R1YWw6IG9iamVjdCwga2V5czoga2V5c30pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cblxuZXhwb3J0cy5oYXNLZXlzID0gbWFrZUhhc092ZXJsb2FkKHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNEZWVwID0gbWFrZUhhc0tleXMobWF0Y2guc3RyaWN0LCB0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzTWF0Y2ggPSBtYWtlSGFzS2V5cyhtYXRjaC5sb29zZSwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNBbnkgPSBtYWtlSGFzT3ZlcmxvYWQoZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcbmV4cG9ydHMuaGFzS2V5c0FueURlZXAgPSBtYWtlSGFzS2V5cyhtYXRjaC5zdHJpY3QsIGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNBbnlNYXRjaCA9IG1ha2VIYXNLZXlzKG1hdGNoLmxvb3NlLCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IGtleSBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c0FsbCA9IG1ha2VIYXNPdmVybG9hZCh0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsRGVlcCA9IG1ha2VIYXNLZXlzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c0FsbE1hdGNoID0gbWFrZUhhc0tleXMobWF0Y2gubG9vc2UsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzID0gbWFrZUhhc092ZXJsb2FkKGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXNEZWVwID0gbWFrZUhhc0tleXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzTWF0Y2ggPSBtYWtlSGFzS2V5cyhtYXRjaC5sb29zZSwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSBrZXkgaW4ge2tleXN9XCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuZnVuY3Rpb24gaGFzKF8pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuLCBtYXgtcGFyYW1zXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgaWYgKCFfLmhhcyhvYmplY3QsIGtleSkgfHxcbiAgICAgICAgICAgICAgICAgICAgIXV0aWwuc3RyaWN0SXMoXy5nZXQob2JqZWN0LCBrZXkpLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB1dGlsLmZhaWwoXy5tZXNzYWdlc1swXSwge1xuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCFfLmhhcyhvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIHV0aWwuZmFpbChfLm1lc3NhZ2VzWzFdLCB7XG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBoYXNMb29zZShfKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKCFfLmhhcyhvYmplY3QsIGtleSkgfHwgIXV0aWwubG9vc2VJcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSkge1xuICAgICAgICAgICAgdXRpbC5mYWlsKF8ubWVzc2FnZXNbMF0sIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIG5vdEhhcyhfKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlbiwgbWF4LXBhcmFtc1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICAgIGlmIChfLmhhcyhvYmplY3QsIGtleSkgJiZcbiAgICAgICAgICAgICAgICAgICAgdXRpbC5zdHJpY3RJcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHV0aWwuZmFpbChfLm1lc3NhZ2VzWzJdLCB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXy5oYXMob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwoXy5tZXNzYWdlc1szXSwge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbm90SGFzTG9vc2UoXykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW4sIG1heC1wYXJhbXNcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoXy5oYXMob2JqZWN0LCBrZXkpICYmIHV0aWwubG9vc2VJcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSkge1xuICAgICAgICAgICAgdXRpbC5mYWlsKF8ubWVzc2FnZXNbMl0sIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc093bktleShvYmplY3QsIGtleSkgeyByZXR1cm4gaGFzT3duLmNhbGwob2JqZWN0LCBrZXkpIH1cbmZ1bmN0aW9uIGhhc0luS2V5KG9iamVjdCwga2V5KSB7IHJldHVybiBrZXkgaW4gb2JqZWN0IH1cbmZ1bmN0aW9uIGhhc0luQ29sbChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0LmhhcyhrZXkpIH1cbmZ1bmN0aW9uIGhhc09iamVjdEdldChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0W2tleV0gfVxuZnVuY3Rpb24gaGFzQ29sbEdldChvYmplY3QsIGtleSkgeyByZXR1cm4gb2JqZWN0LmdldChrZXkpIH1cblxuZnVuY3Rpb24gY3JlYXRlSGFzKGhhcywgZ2V0LCBtZXNzYWdlcykge1xuICAgIHJldHVybiB7aGFzOiBoYXMsIGdldDogZ2V0LCBtZXNzYWdlczogbWVzc2FnZXN9XG59XG5cbnZhciBoYXNPd25NZXRob2RzID0gY3JlYXRlSGFzKGhhc093bktleSwgaGFzT2JqZWN0R2V0LCBbXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIG93biBrZXkge2tleX0gZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBvd24ga2V5IHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIG93biBrZXkge2tleX0gZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIG93biBrZXkge2V4cGVjdGVkfVwiLFxuXSlcblxudmFyIGhhc0tleU1ldGhvZHMgPSBjcmVhdGVIYXMoaGFzSW5LZXksIGhhc09iamVjdEdldCwgW1xuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlblxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHthY3R1YWx9XCIsXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBrZXkge2V4cGVjdGVkfVwiLFxuXSlcblxudmFyIGhhc01ldGhvZHMgPSBjcmVhdGVIYXMoaGFzSW5Db2xsLCBoYXNDb2xsR2V0LCBbXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG5leHBvcnRzLmhhc093biA9IGhhcyhoYXNPd25NZXRob2RzKVxuZXhwb3J0cy5ub3RIYXNPd24gPSBub3RIYXMoaGFzT3duTWV0aG9kcylcbmV4cG9ydHMuaGFzT3duTG9vc2UgPSBoYXNMb29zZShoYXNPd25NZXRob2RzKVxuZXhwb3J0cy5ub3RIYXNPd25Mb29zZSA9IG5vdEhhc0xvb3NlKGhhc093bk1ldGhvZHMpXG5cbmV4cG9ydHMuaGFzS2V5ID0gaGFzKGhhc0tleU1ldGhvZHMpXG5leHBvcnRzLm5vdEhhc0tleSA9IG5vdEhhcyhoYXNLZXlNZXRob2RzKVxuZXhwb3J0cy5oYXNLZXlMb29zZSA9IGhhc0xvb3NlKGhhc0tleU1ldGhvZHMpXG5leHBvcnRzLm5vdEhhc0tleUxvb3NlID0gbm90SGFzTG9vc2UoaGFzS2V5TWV0aG9kcylcblxuZXhwb3J0cy5oYXMgPSBoYXMoaGFzTWV0aG9kcylcbmV4cG9ydHMubm90SGFzID0gbm90SGFzKGhhc01ldGhvZHMpXG5leHBvcnRzLmhhc0xvb3NlID0gaGFzTG9vc2UoaGFzTWV0aG9kcylcbmV4cG9ydHMubm90SGFzTG9vc2UgPSBub3RIYXNMb29zZShoYXNNZXRob2RzKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1hdGNoID0gcmVxdWlyZShcImNsZWFuLW1hdGNoXCIpXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxuXG5mdW5jdGlvbiBpbmNsdWRlcyhmdW5jLCBhbGwsIGFycmF5LCB2YWx1ZXMpIHtcbiAgICAvLyBDaGVhcCBjYXNlcyBmaXJzdFxuICAgIGlmICghQXJyYXkuaXNBcnJheShhcnJheSkpIHJldHVybiBmYWxzZVxuICAgIGlmIChhcnJheSA9PT0gdmFsdWVzKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChhbGwgJiYgYXJyYXkubGVuZ3RoIDwgdmFsdWVzLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbaV1cbiAgICAgICAgdmFyIHRlc3QgPSBmYWxzZVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYXJyYXkubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChmdW5jKHZhbHVlLCBhcnJheVtqXSkpIHtcbiAgICAgICAgICAgICAgICB0ZXN0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGVzdCAhPT0gYWxsKSByZXR1cm4gdGVzdFxuICAgIH1cblxuICAgIHJldHVybiBhbGxcbn1cblxuZnVuY3Rpb24gZGVmaW5lSW5jbHVkZXMoZnVuYywgYWxsLCBpbnZlcnQsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFycmF5LCB2YWx1ZXMpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBhcnJheWAgbXVzdCBiZSBhbiBhcnJheVwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlcykpIHZhbHVlcyA9IFt2YWx1ZXNdXG5cbiAgICAgICAgaWYgKHZhbHVlcy5sZW5ndGggJiYgaW5jbHVkZXMoZnVuYywgYWxsLCBhcnJheSwgdmFsdWVzKSA9PT0gaW52ZXJ0KSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogYXJyYXksIHZhbHVlczogdmFsdWVzfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG5leHBvcnRzLmluY2x1ZGVzID0gZGVmaW5lSW5jbHVkZXModXRpbC5zdHJpY3RJcywgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzRGVlcCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5pbmNsdWRlc01hdGNoID0gZGVmaW5lSW5jbHVkZXMobWF0Y2gubG9vc2UsIHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNBbnkgPSBkZWZpbmVJbmNsdWRlcyh1dGlsLnN0cmljdElzLCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNBbnlEZWVwID0gZGVmaW5lSW5jbHVkZXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzQW55TWF0Y2ggPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5sb29zZSwgZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbCA9IGRlZmluZUluY2x1ZGVzKHV0aWwuc3RyaWN0SXMsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbERlZXAgPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5zdHJpY3QsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxNYXRjaCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLmxvb3NlLCB0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzID0gZGVmaW5lSW5jbHVkZXModXRpbC5zdHJpY3RJcywgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzRGVlcCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLnN0cmljdCwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc01hdGNoID0gZGVmaW5lSW5jbHVkZXMobWF0Y2gubG9vc2UsIGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qIGdsb2JhbCBQcm9taXNlICovXG5cbnZhciB1dGlsID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpXG52YXIgY29tbW9uID0gcmVxdWlyZShcIi4vdGhyb3dzLWNvbW1vblwiKVxuXG5leHBvcnRzLnRocm93cyA9IGZ1bmN0aW9uIChUeXBlLCBjYWxsYmFjaykge1xuICAgIGlmIChjYWxsYmFjayA9PSBudWxsKSB7XG4gICAgICAgIGNhbGxiYWNrID0gVHlwZVxuICAgICAgICBUeXBlID0gbnVsbFxuICAgIH1cblxuICAgIGlmIChUeXBlICE9IG51bGwgJiYgdHlwZW9mIFR5cGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYFR5cGVgIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBjYWxsYmFja2AgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oY2FsbGJhY2spXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyBuZXcgdXRpbC5Bc3NlcnRpb25FcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIHRocm93XCIpXG4gICAgfSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKFR5cGUgIT0gbnVsbCAmJiAhKGUgaW5zdGFuY2VvZiBUeXBlKSkge1xuICAgICAgICAgICAgdXRpbC5mYWlsKFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3cgYW4gaW5zdGFuY2Ugb2YgXCIgK1xuICAgICAgICAgICAgICAgIGNvbW1vbi5nZXROYW1lKFR5cGUpICsgXCIsIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLFxuICAgICAgICAgICAgICAgIHthY3R1YWw6IGV9KVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZXhwb3J0cy50aHJvd3NNYXRjaCA9IGZ1bmN0aW9uIChtYXRjaGVyLCBjYWxsYmFjaykge1xuICAgIGlmICh0eXBlb2YgbWF0Y2hlciAhPT0gXCJzdHJpbmdcIiAmJlxuICAgICAgICAgICAgdHlwZW9mIG1hdGNoZXIgIT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICAgICAgIShtYXRjaGVyIGluc3RhbmNlb2YgUmVnRXhwKSAmJlxuICAgICAgICAgICAgIWNvbW1vbi5pc1BsYWluT2JqZWN0KG1hdGNoZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBcImBtYXRjaGVyYCBtdXN0IGJlIGEgc3RyaW5nLCBmdW5jdGlvbiwgUmVnRXhwLCBvciBvYmplY3RcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBjYWxsYmFja2AgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oY2FsbGJhY2spXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyBuZXcgdXRpbC5Bc3NlcnRpb25FcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIHRocm93XCIpXG4gICAgfSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCFjb21tb24udGhyb3dzTWF0Y2hUZXN0KG1hdGNoZXIsIGUpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwoXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBjYWxsYmFjayB0byAgdGhyb3cgYW4gZXJyb3IgdGhhdCBtYXRjaGVzIFwiICtcbiAgICAgICAgICAgICAgICBcIntleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLFxuICAgICAgICAgICAgICAgIHtleHBlY3RlZDogbWF0Y2hlciwgYWN0dWFsOiBlfSlcbiAgICAgICAgfVxuICAgIH0pXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxuXG5leHBvcnRzLmdldE5hbWUgPSBmdW5jdGlvbiAoZnVuYykge1xuICAgIHZhciBuYW1lID0gZnVuYy5uYW1lXG5cbiAgICBpZiAobmFtZSA9PSBudWxsKSBuYW1lID0gZnVuYy5kaXNwbGF5TmFtZVxuICAgIGlmIChuYW1lKSByZXR1cm4gdXRpbC5lc2NhcGUobmFtZSlcbiAgICByZXR1cm4gXCI8YW5vbnltb3VzPlwiXG59XG5cbmV4cG9ydHMudGhyb3dzTWF0Y2hUZXN0ID0gZnVuY3Rpb24gKG1hdGNoZXIsIGUpIHtcbiAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09IFwic3RyaW5nXCIpIHJldHVybiBlLm1lc3NhZ2UgPT09IG1hdGNoZXJcbiAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuICEhbWF0Y2hlcihlKVxuICAgIGlmIChtYXRjaGVyIGluc3RhbmNlb2YgUmVnRXhwKSByZXR1cm4gISFtYXRjaGVyLnRlc3QoZS5tZXNzYWdlKVxuXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhtYXRjaGVyKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldXG5cbiAgICAgICAgaWYgKCEoa2V5IGluIGUpIHx8ICF1dGlsLnN0cmljdElzKG1hdGNoZXJba2V5XSwgZVtrZXldKSkgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cblxuZXhwb3J0cy5pc1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCB8fCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KSA9PT0gT2JqZWN0LnByb3RvdHlwZVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIHV0aWwgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0LXV0aWxcIilcbnZhciBjb21tb24gPSByZXF1aXJlKFwiLi90aHJvd3MtY29tbW9uXCIpXG5cbmV4cG9ydHMudGhyb3dzID0gZnVuY3Rpb24gKFR5cGUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBUeXBlXG4gICAgICAgIFR5cGUgPSBudWxsXG4gICAgfVxuXG4gICAgaWYgKFR5cGUgIT0gbnVsbCAmJiB0eXBlb2YgVHlwZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgVHlwZWAgbXVzdCBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGNhbGxiYWNrYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICBjYWxsYmFjaygpIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FsbGJhY2stcmV0dXJuXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoVHlwZSAhPSBudWxsICYmICEoZSBpbnN0YW5jZW9mIFR5cGUpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwoXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBjYWxsYmFjayB0byB0aHJvdyBhbiBpbnN0YW5jZSBvZiBcIiArXG4gICAgICAgICAgICAgICAgY29tbW9uLmdldE5hbWUoVHlwZSkgKyBcIiwgYnV0IGZvdW5kIHthY3R1YWx9XCIsXG4gICAgICAgICAgICAgICAge2FjdHVhbDogZX0pXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IHV0aWwuQXNzZXJ0aW9uRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byB0aHJvd1wiKVxufVxuXG5leHBvcnRzLnRocm93c01hdGNoID0gZnVuY3Rpb24gKG1hdGNoZXIsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyICE9PSBcInN0cmluZ1wiICYmXG4gICAgICAgICAgICB0eXBlb2YgbWF0Y2hlciAhPT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICAhKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApICYmXG4gICAgICAgICAgICAhY29tbW9uLmlzUGxhaW5PYmplY3QobWF0Y2hlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIFwiYG1hdGNoZXJgIG11c3QgYmUgYSBzdHJpbmcsIGZ1bmN0aW9uLCBSZWdFeHAsIG9yIG9iamVjdFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGNhbGxiYWNrYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICBjYWxsYmFjaygpIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY2FsbGJhY2stcmV0dXJuXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoIWNvbW1vbi50aHJvd3NNYXRjaFRlc3QobWF0Y2hlciwgZSkpIHtcbiAgICAgICAgICAgIHV0aWwuZmFpbChcbiAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIGNhbGxiYWNrIHRvICB0aHJvdyBhbiBlcnJvciB0aGF0IG1hdGNoZXMgXCIgK1xuICAgICAgICAgICAgICAgIFwie2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsXG4gICAgICAgICAgICAgICAge2V4cGVjdGVkOiBtYXRjaGVyLCBhY3R1YWw6IGV9KVxuICAgICAgICB9XG4gICAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRocm93IG5ldyB1dGlsLkFzc2VydGlvbkVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3cuXCIpXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxuXG5leHBvcnRzLm9rID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoIXgpIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIHRydXRoeVwiLCB7YWN0dWFsOiB4fSlcbn1cblxuZXhwb3J0cy5ub3RPayA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHgpIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGZhbHN5XCIsIHthY3R1YWw6IHh9KVxufVxuXG5leHBvcnRzLmlzQm9vbGVhbiA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcImJvb2xlYW5cIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhIGJvb2xlYW5cIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdEJvb2xlYW4gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGEgYm9vbGVhblwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBmdW5jdGlvblwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90RnVuY3Rpb24gPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhIGZ1bmN0aW9uXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc051bWJlciA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGEgbnVtYmVyXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3ROdW1iZXIgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBudW1iZXJcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzT2JqZWN0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwib2JqZWN0XCIgfHwgeCA9PSBudWxsKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFuIG9iamVjdFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90T2JqZWN0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiYgeCAhPSBudWxsKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhbiBvYmplY3RcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzU3RyaW5nID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBzdHJpbmdcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdFN0cmluZyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhIHN0cmluZ1wiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNTeW1ib2wgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJzeW1ib2xcIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhIHN5bWJvbFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90U3ltYm9sID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwic3ltYm9sXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGEgc3ltYm9sXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5leGlzdHMgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh4ID09IG51bGwpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gZXhpc3RcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdEV4aXN0cyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggIT0gbnVsbCkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgZXhpc3RcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzQXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh4KSkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhbiBhcnJheVwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90QXJyYXkgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHgpKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhbiBhcnJheVwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXMgPSBmdW5jdGlvbiAoVHlwZSwgb2JqZWN0KSB7XG4gICAgaWYgKHR5cGVvZiBUeXBlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBUeXBlYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICBpZiAoIShvYmplY3QgaW5zdGFuY2VvZiBUeXBlKSkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBiZSBhbiBpbnN0YW5jZSBvZiB7ZXhwZWN0ZWR9XCIsIHtcbiAgICAgICAgICAgIGV4cGVjdGVkOiBUeXBlLFxuICAgICAgICAgICAgYWN0dWFsOiBvYmplY3QuY29uc3RydWN0b3IsXG4gICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90ID0gZnVuY3Rpb24gKFR5cGUsIG9iamVjdCkge1xuICAgIGlmICh0eXBlb2YgVHlwZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgVHlwZWAgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpXG4gICAgfVxuXG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFR5cGUpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGJlIGFuIGluc3RhbmNlIG9mIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgZXhwZWN0ZWQ6IFR5cGUsXG4gICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBjbGVhbi1tYXRjaFxuICpcbiAqIEEgc2ltcGxlLCBmYXN0IEVTMjAxNSsgYXdhcmUgZGVlcCBtYXRjaGluZyB1dGlsaXR5LlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNiBhbmQgbGF0ZXIsIElzaWFoIE1lYWRvd3MgPG1lQGlzaWFobWVhZG93cy5jb20+LlxuICpcbiAqIFBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxuICogcHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLCBwcm92aWRlZCB0aGF0IHRoZSBhYm92ZVxuICogY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBhcHBlYXIgaW4gYWxsIGNvcGllcy5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXG4gKiBSRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcbiAqIEFORCBGSVRORVNTLiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIERJUkVDVCxcbiAqIElORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxuICogTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcbiAqIE9USEVSIFRPUlRJT1VTIEFDVElPTiwgQVJJU0lORyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1JcbiAqIFBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXG4gKi9cblxuLyogZXNsaW50LWRpc2FibGUgKi9cbjsoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIiAmJiBleHBvcnRzICE9IG51bGwpIHtcbiAgICAgICAgZmFjdG9yeShnbG9iYWwsIGV4cG9ydHMpXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgZGVmaW5lKFwiY2xlYW4tbWF0Y2hcIiwgW1wiZXhwb3J0c1wiXSwgZnVuY3Rpb24gKGV4cG9ydHMpIHtcbiAgICAgICAgICAgIGZhY3RvcnkoZ2xvYmFsLCBleHBvcnRzKVxuICAgICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoZ2xvYmFsLCBnbG9iYWwubWF0Y2ggPSB7fSlcbiAgICB9XG59KSh0eXBlb2YgZ2xvYmFsID09PSBcIm9iamVjdFwiICYmIGdsb2JhbCAhPT0gbnVsbCA/IGdsb2JhbFxuICAgIDogdHlwZW9mIHNlbGYgPT09IFwib2JqZWN0XCIgJiYgc2VsZiAhPT0gbnVsbCA/IHNlbGZcbiAgICA6IHR5cGVvZiB3aW5kb3cgPT09IFwib2JqZWN0XCIgJiYgd2luZG93ICE9PSBudWxsID8gd2luZG93XG4gICAgOiB0aGlzLFxuZnVuY3Rpb24gKGdsb2JhbCwgZXhwb3J0cykge1xuICAgIC8qIGVzbGludC1lbmFibGUgKi9cbiAgICBcInVzZSBzdHJpY3RcIlxuXG4gICAgLyogZ2xvYmFsIFN5bWJvbCwgVWludDhBcnJheSwgRGF0YVZpZXcsIEFycmF5QnVmZmVyLCBBcnJheUJ1ZmZlclZpZXcsIE1hcCxcbiAgICBTZXQgKi9cblxuICAgIC8qKlxuICAgICAqIERlZXAgbWF0Y2hpbmcgYWxnb3JpdGhtLCB3aXRoIHplcm8gZGVwZW5kZW5jaWVzLiBOb3RlIHRoZSBmb2xsb3dpbmc6XG4gICAgICpcbiAgICAgKiAtIFRoaXMgaXMgcmVsYXRpdmVseSBwZXJmb3JtYW5jZS10dW5lZCwgYWx0aG91Z2ggaXQgcHJlZmVycyBoaWdoXG4gICAgICogICBjb3JyZWN0bmVzcy4gUGF0Y2ggd2l0aCBjYXJlLCBzaW5jZSBwZXJmb3JtYW5jZSBpcyBhIGNvbmNlcm4uXG4gICAgICogLSBUaGlzIGRvZXMgcGFjayBhICpsb3QqIG9mIGZlYXR1cmVzLCB3aGljaCBzaG91bGQgZXhwbGFpbiB0aGUgbGVuZ3RoLlxuICAgICAqIC0gU29tZSBvZiB0aGUgZHVwbGljYXRpb24gaXMgaW50ZW50aW9uYWwuIEl0J3MgZ2VuZXJhbGx5IGNvbW1lbnRlZCwgYnV0XG4gICAgICogICBpdCdzIG1haW5seSBmb3IgcGVyZm9ybWFuY2UsIHNpbmNlIHRoZSBlbmdpbmUgbmVlZHMgaXRzIHR5cGUgaW5mby5cbiAgICAgKiAtIFBvbHlmaWxsZWQgY29yZS1qcyBTeW1ib2xzIGZyb20gY3Jvc3Mtb3JpZ2luIGNvbnRleHRzIHdpbGwgbmV2ZXJcbiAgICAgKiAgIHJlZ2lzdGVyIGFzIGJlaW5nIGFjdHVhbCBTeW1ib2xzLlxuICAgICAqXG4gICAgICogQW5kIGluIGNhc2UgeW91J3JlIHdvbmRlcmluZyBhYm91dCB0aGUgbG9uZ2VyIGZ1bmN0aW9ucyBhbmQgb2NjYXNpb25hbFxuICAgICAqIHJlcGV0aXRpb24sIGl0J3MgYmVjYXVzZSBWOCdzIGlubGluZXIgaXNuJ3QgYWx3YXlzIGludGVsbGlnZW50IGVub3VnaCB0b1xuICAgICAqIGRlYWwgd2l0aCB0aGUgc3VwZXIgaGlnaGx5IHBvbHltb3JwaGljIGRhdGEgdGhpcyBvZnRlbiBkZWFscyB3aXRoLCBhbmQgSlNcbiAgICAgKiBkb2Vzbid0IGhhdmUgY29tcGlsZS10aW1lIG1hY3Jvcy5cbiAgICAgKi9cblxuICAgIHZhciBvYmplY3RUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdcbiAgICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG4gICAgdmFyIHN1cHBvcnRzVW5pY29kZSA9IGhhc093bi5jYWxsKFJlZ0V4cC5wcm90b3R5cGUsIFwidW5pY29kZVwiKVxuICAgIHZhciBzdXBwb3J0c1N0aWNreSA9IGhhc093bi5jYWxsKFJlZ0V4cC5wcm90b3R5cGUsIFwic3RpY2t5XCIpXG5cbiAgICAvLyBMZWdhY3kgZW5naW5lcyBoYXZlIHNldmVyYWwgaXNzdWVzIHdoZW4gaXQgY29tZXMgdG8gYHR5cGVvZmAuXG4gICAgdmFyIGlzRnVuY3Rpb24gPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBTbG93SXNGdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZVxuXG4gICAgICAgICAgICB2YXIgdGFnID0gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSlcblxuICAgICAgICAgICAgcmV0dXJuIHRhZyA9PT0gXCJbb2JqZWN0IEZ1bmN0aW9uXVwiIHx8XG4gICAgICAgICAgICAgICAgdGFnID09PSBcIltvYmplY3QgR2VuZXJhdG9yRnVuY3Rpb25dXCIgfHxcbiAgICAgICAgICAgICAgICB0YWcgPT09IFwiW29iamVjdCBBc3luY0Z1bmN0aW9uXVwiIHx8XG4gICAgICAgICAgICAgICAgdGFnID09PSBcIltvYmplY3QgUHJveHldXCJcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGlzUG9pc29uZWQob2JqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0ICE9IG51bGwgJiYgdHlwZW9mIG9iamVjdCAhPT0gXCJmdW5jdGlvblwiXG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbiBTYWZhcmkgMTAsIGB0eXBlb2YgUHJveHkgPT09IFwib2JqZWN0XCJgXG4gICAgICAgIGlmIChpc1BvaXNvbmVkKGdsb2JhbC5Qcm94eSkpIHJldHVybiBTbG93SXNGdW5jdGlvblxuXG4gICAgICAgIC8vIEluIFNhZmFyaSA4LCBzZXZlcmFsIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9ycyBhcmVcbiAgICAgICAgLy8gYHR5cGVvZiBDID09PSBcIm9iamVjdFwiYFxuICAgICAgICBpZiAoaXNQb2lzb25lZChnbG9iYWwuSW50OEFycmF5KSkgcmV0dXJuIFNsb3dJc0Z1bmN0aW9uXG5cbiAgICAgICAgLy8gSW4gb2xkIFY4LCBSZWdFeHBzIGFyZSBjYWxsYWJsZVxuICAgICAgICBpZiAodHlwZW9mIC94LyA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gU2xvd0lzRnVuY3Rpb24gLy8gZXNsaW50LWRpc2FibGUtbGluZVxuXG4gICAgICAgIC8vIExlYXZlIHRoaXMgZm9yIG5vcm1hbCB0aGluZ3MuIEl0J3MgZWFzaWx5IGlubGluZWQuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgfVxuICAgIH0pKClcblxuICAgIC8vIFNldCB1cCBvdXIgb3duIGJ1ZmZlciBjaGVjay4gV2Ugc2hvdWxkIGFsd2F5cyBhY2NlcHQgdGhlIHBvbHlmaWxsLCBldmVuXG4gICAgLy8gaW4gTm9kZS4gTm90ZSB0aGF0IGl0IHVzZXMgYGdsb2JhbC5CdWZmZXJgIHRvIGF2b2lkIGluY2x1ZGluZyBgYnVmZmVyYCBpblxuICAgIC8vIHRoZSBidW5kbGUuXG5cbiAgICB2YXIgQnVmZmVyTmF0aXZlID0gMFxuICAgIHZhciBCdWZmZXJQb2x5ZmlsbCA9IDFcbiAgICB2YXIgQnVmZmVyU2FmYXJpID0gMlxuXG4gICAgdmFyIGJ1ZmZlclN1cHBvcnQgPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBGYWtlQnVmZmVyKCkge31cbiAgICAgICAgRmFrZUJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRydWUgfVxuXG4gICAgICAgIC8vIE9ubHkgU2FmYXJpIDUtNyBoYXMgZXZlciBoYWQgdGhpcyBpc3N1ZS5cbiAgICAgICAgaWYgKG5ldyBGYWtlQnVmZmVyKCkuY29uc3RydWN0b3IgIT09IEZha2VCdWZmZXIpIHJldHVybiBCdWZmZXJTYWZhcmlcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5CdWZmZXIpKSByZXR1cm4gQnVmZmVyUG9seWZpbGxcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIpKSByZXR1cm4gQnVmZmVyUG9seWZpbGxcbiAgICAgICAgLy8gQXZvaWQgZ2xvYmFsIHBvbHlmaWxsc1xuICAgICAgICBpZiAoZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcihuZXcgRmFrZUJ1ZmZlcigpKSkgcmV0dXJuIEJ1ZmZlclBvbHlmaWxsXG4gICAgICAgIHJldHVybiBCdWZmZXJOYXRpdmVcbiAgICB9KSgpXG5cbiAgICB2YXIgZ2xvYmFsSXNCdWZmZXIgPSBidWZmZXJTdXBwb3J0ID09PSBCdWZmZXJOYXRpdmVcbiAgICAgICAgPyBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyXG4gICAgICAgIDogdW5kZWZpbmVkXG5cbiAgICBmdW5jdGlvbiBpc0J1ZmZlcihvYmplY3QpIHtcbiAgICAgICAgaWYgKGJ1ZmZlclN1cHBvcnQgPT09IEJ1ZmZlck5hdGl2ZSAmJiBnbG9iYWxJc0J1ZmZlcihvYmplY3QpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9IGVsc2UgaWYgKGJ1ZmZlclN1cHBvcnQgPT09IEJ1ZmZlclNhZmFyaSAmJiBvYmplY3QuX2lzQnVmZmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIEIgPSBvYmplY3QuY29uc3RydWN0b3JcblxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oQikpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oQi5pc0J1ZmZlcikpIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gQi5pc0J1ZmZlcihvYmplY3QpXG4gICAgfVxuXG4gICAgLy8gY29yZS1qcycgc3ltYm9scyBhcmUgb2JqZWN0cywgYW5kIHNvbWUgb2xkIHZlcnNpb25zIG9mIFY4IGVycm9uZW91c2x5IGhhZFxuICAgIC8vIGB0eXBlb2YgU3ltYm9sKCkgPT09IFwib2JqZWN0XCJgLlxuICAgIHZhciBzeW1ib2xzQXJlT2JqZWN0cyA9IGlzRnVuY3Rpb24oZ2xvYmFsLlN5bWJvbCkgJiZcbiAgICAgICAgdHlwZW9mIFN5bWJvbCgpID09PSBcIm9iamVjdFwiXG5cbiAgICAvLyBgY29udGV4dGAgaXMgYSBiaXQgZmllbGQsIHdpdGggdGhlIGZvbGxvd2luZyBiaXRzLiBUaGlzIGlzIG5vdCBhcyBtdWNoXG4gICAgLy8gZm9yIHBlcmZvcm1hbmNlIHRoYW4gdG8ganVzdCByZWR1Y2UgdGhlIG51bWJlciBvZiBwYXJhbWV0ZXJzIEkgbmVlZCB0byBiZVxuICAgIC8vIHRocm93aW5nIGFyb3VuZC5cbiAgICB2YXIgU3RyaWN0ID0gMVxuICAgIHZhciBJbml0aWFsID0gMlxuICAgIHZhciBTYW1lUHJvdG8gPSA0XG5cbiAgICBleHBvcnRzLmxvb3NlID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoKGEsIGIsIEluaXRpYWwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKVxuICAgIH1cblxuICAgIGV4cG9ydHMuc3RyaWN0ID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoKGEsIGIsIFN0cmljdCB8IEluaXRpYWwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKVxuICAgIH1cblxuICAgIC8vIEZlYXR1cmUtdGVzdCBkZWxheWVkIHN0YWNrIGFkZGl0aW9ucyBhbmQgZXh0cmEga2V5cy4gUGhhbnRvbUpTIGFuZCBJRVxuICAgIC8vIGJvdGggd2FpdCB1bnRpbCB0aGUgZXJyb3Igd2FzIGFjdHVhbGx5IHRocm93biBmaXJzdCwgYW5kIGFzc2lnbiB0aGVtIGFzXG4gICAgLy8gb3duIHByb3BlcnRpZXMsIHdoaWNoIGlzIHVuaGVscGZ1bCBmb3IgYXNzZXJ0aW9ucy4gVGhpcyByZXR1cm5zIGFcbiAgICAvLyBmdW5jdGlvbiB0byBzcGVlZCB1cCBjYXNlcyB3aGVyZSBgT2JqZWN0LmtleXNgIGlzIHN1ZmZpY2llbnQgKGUuZy4gaW5cbiAgICAvLyBDaHJvbWUvRkYvTm9kZSkuXG4gICAgLy9cbiAgICAvLyBUaGlzIHdvdWxkbid0IGJlIG5lY2Vzc2FyeSBpZiB0aG9zZSBlbmdpbmVzIHdvdWxkIG1ha2UgdGhlIHN0YWNrIGFcbiAgICAvLyBnZXR0ZXIsIGFuZCByZWNvcmQgaXQgd2hlbiB0aGUgZXJyb3Igd2FzIGNyZWF0ZWQsIG5vdCB3aGVuIGl0IHdhcyB0aHJvd24uXG4gICAgLy8gSXQgc3BlY2lmaWNhbGx5IGZpbHRlcnMgb3V0IGVycm9ycyBhbmQgb25seSBjaGVja3MgZXhpc3RpbmcgZGVzY3JpcHRvcnMsXG4gICAgLy8ganVzdCB0byBrZWVwIHRoZSBtZXNzIGZyb20gYWZmZWN0aW5nIGV2ZXJ5dGhpbmcgKGl0J3Mgbm90IGZ1bGx5IGNvcnJlY3QsXG4gICAgLy8gYnV0IGl0J3MgbmVjZXNzYXJ5KS5cbiAgICB2YXIgcmVxdWlyZXNQcm94eSA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0ZXN0ID0gbmV3IEVycm9yKClcbiAgICAgICAgdmFyIG9sZCA9IE9iamVjdC5jcmVhdGUobnVsbClcblxuICAgICAgICBPYmplY3Qua2V5cyh0ZXN0KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHsgb2xkW2tleV0gPSB0cnVlIH0pXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93IHRlc3RcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgICAgLy8gaWdub3JlXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGVzdCkuc29tZShmdW5jdGlvbiAoa2V5KSB7IHJldHVybiAhb2xkW2tleV0gfSlcbiAgICB9KSgpXG5cbiAgICBmdW5jdGlvbiBpc0lnbm9yZWQob2JqZWN0LCBrZXkpIHtcbiAgICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgY2FzZSBcImxpbmVcIjogaWYgKHR5cGVvZiBvYmplY3QubGluZSAhPT0gXCJudW1iZXJcIikgcmV0dXJuIGZhbHNlOyBicmVha1xuICAgICAgICBjYXNlIFwic291cmNlVVJMXCI6XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdC5zb3VyY2VVUkwgIT09IFwic3RyaW5nXCIpIHJldHVybiBmYWxzZTsgYnJlYWtcbiAgICAgICAgY2FzZSBcInN0YWNrXCI6IGlmICh0eXBlb2Ygb2JqZWN0LnN0YWNrICE9PSBcInN0cmluZ1wiKSByZXR1cm4gZmFsc2U7IGJyZWFrXG4gICAgICAgIGRlZmF1bHQ6IHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwga2V5KVxuXG4gICAgICAgIHJldHVybiAhZGVzYy5jb25maWd1cmFibGUgJiYgZGVzYy5lbnVtZXJhYmxlICYmICFkZXNjLndyaXRhYmxlXG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyBvbmx5IGludm9rZWQgd2l0aCBlcnJvcnMsIHNvIGl0J3Mgbm90IGdvaW5nIHRvIHByZXNlbnQgYVxuICAgIC8vIHNpZ25pZmljYW50IHNsb3cgZG93bi5cbiAgICBmdW5jdGlvbiBnZXRLZXlzU3RyaXBwZWQob2JqZWN0KSB7XG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqZWN0KVxuICAgICAgICB2YXIgY291bnQgPSAwXG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWlzSWdub3JlZChvYmplY3QsIGtleXNbaV0pKSBrZXlzW2NvdW50KytdID0ga2V5c1tpXVxuICAgICAgICB9XG5cbiAgICAgICAga2V5cy5sZW5ndGggPSBjb3VudFxuICAgICAgICByZXR1cm4ga2V5c1xuICAgIH1cblxuICAgIC8vIFdheSBmYXN0ZXIsIHNpbmNlIHR5cGVkIGFycmF5IGluZGljZXMgYXJlIGFsd2F5cyBkZW5zZSBhbmQgY29udGFpblxuICAgIC8vIG51bWJlcnMuXG5cbiAgICAvLyBTZXR1cCBmb3IgYGlzQnVmZmVyT3JWaWV3YCBhbmQgYGlzVmlld2BcbiAgICB2YXIgQXJyYXlCdWZmZXJOb25lID0gMFxuICAgIHZhciBBcnJheUJ1ZmZlckxlZ2FjeSA9IDFcbiAgICB2YXIgQXJyYXlCdWZmZXJDdXJyZW50ID0gMlxuXG4gICAgdmFyIGFycmF5QnVmZmVyU3VwcG9ydCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghaXNGdW5jdGlvbihnbG9iYWwuVWludDhBcnJheSkpIHJldHVybiBBcnJheUJ1ZmZlck5vbmVcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5EYXRhVmlldykpIHJldHVybiBBcnJheUJ1ZmZlck5vbmVcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5BcnJheUJ1ZmZlcikpIHJldHVybiBBcnJheUJ1ZmZlck5vbmVcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oZ2xvYmFsLkFycmF5QnVmZmVyLmlzVmlldykpIHJldHVybiBBcnJheUJ1ZmZlckN1cnJlbnRcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oZ2xvYmFsLkFycmF5QnVmZmVyVmlldykpIHJldHVybiBBcnJheUJ1ZmZlckxlZ2FjeVxuICAgICAgICByZXR1cm4gQXJyYXlCdWZmZXJOb25lXG4gICAgfSkoKVxuXG4gICAgLy8gSWYgdHlwZWQgYXJyYXlzIGFyZW4ndCBzdXBwb3J0ZWQgKHRoZXkgd2VyZW4ndCB0ZWNobmljYWxseSBwYXJ0IG9mXG4gICAgLy8gRVM1LCBidXQgbWFueSBlbmdpbmVzIGltcGxlbWVudGVkIEtocm9ub3MnIHNwZWMgYmVmb3JlIEVTNiksIHRoZW5cbiAgICAvLyBqdXN0IGZhbGwgYmFjayB0byBnZW5lcmljIGJ1ZmZlciBkZXRlY3Rpb24uXG5cbiAgICBmdW5jdGlvbiBmbG9hdElzKGEsIGIpIHtcbiAgICAgICAgLy8gU28gTmFOcyBhcmUgY29uc2lkZXJlZCBlcXVhbC5cbiAgICAgICAgcmV0dXJuIGEgPT09IGIgfHwgYSAhPT0gYSAmJiBiICE9PSBiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlLCBtYXgtbGVuXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hWaWV3KGEsIGIpIHtcbiAgICAgICAgdmFyIGNvdW50ID0gYS5sZW5ndGhcblxuICAgICAgICBpZiAoY291bnQgIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICAgICAgICB3aGlsZSAoY291bnQpIHtcbiAgICAgICAgICAgIGNvdW50LS1cbiAgICAgICAgICAgIGlmICghZmxvYXRJcyhhW2NvdW50XSwgYltjb3VudF0pKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgdmFyIGlzVmlldyA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChhcnJheUJ1ZmZlclN1cHBvcnQgPT09IEFycmF5QnVmZmVyTm9uZSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICAvLyBFUzYgdHlwZWQgYXJyYXlzXG4gICAgICAgIGlmIChhcnJheUJ1ZmZlclN1cHBvcnQgPT09IEFycmF5QnVmZmVyQ3VycmVudCkgcmV0dXJuIEFycmF5QnVmZmVyLmlzVmlld1xuICAgICAgICAvLyBsZWdhY3kgdHlwZWQgYXJyYXlzXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBpc1ZpZXcob2JqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgQXJyYXlCdWZmZXJWaWV3XG4gICAgICAgIH1cbiAgICB9KSgpXG5cbiAgICAvLyBTdXBwb3J0IGNoZWNraW5nIG1hcHMgYW5kIHNldHMgZGVlcGx5LiBUaGV5IGFyZSBvYmplY3QtbGlrZSBlbm91Z2ggdG9cbiAgICAvLyBjb3VudCwgYW5kIGFyZSB1c2VmdWwgaW4gdGhlaXIgb3duIHJpZ2h0LiBUaGUgY29kZSBpcyByYXRoZXIgbWVzc3ksIGJ1dFxuICAgIC8vIG1haW5seSB0byBrZWVwIHRoZSBvcmRlci1pbmRlcGVuZGVudCBjaGVja2luZyBmcm9tIGJlY29taW5nIGluc2FuZWx5XG4gICAgLy8gc2xvdy5cbiAgICB2YXIgc3VwcG9ydHNNYXAgPSBpc0Z1bmN0aW9uKGdsb2JhbC5NYXApXG4gICAgdmFyIHN1cHBvcnRzU2V0ID0gaXNGdW5jdGlvbihnbG9iYWwuU2V0KVxuXG4gICAgLy8gT25lIG9mIHRoZSBzZXRzIGFuZCBib3RoIG1hcHMnIGtleXMgYXJlIGNvbnZlcnRlZCB0byBhcnJheXMgZm9yIGZhc3RlclxuICAgIC8vIGhhbmRsaW5nLlxuICAgIGZ1bmN0aW9uIGtleUxpc3QobWFwKSB7XG4gICAgICAgIHZhciBsaXN0ID0gbmV3IEFycmF5KG1hcC5zaXplKVxuICAgICAgICB2YXIgaSA9IDBcbiAgICAgICAgdmFyIGl0ZXIgPSBtYXAua2V5cygpXG5cbiAgICAgICAgZm9yICh2YXIgbmV4dCA9IGl0ZXIubmV4dCgpOyAhbmV4dC5kb25lOyBuZXh0ID0gaXRlci5uZXh0KCkpIHtcbiAgICAgICAgICAgIGxpc3RbaSsrXSA9IG5leHQudmFsdWVcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaXN0XG4gICAgfVxuXG4gICAgLy8gVGhlIHBhaXIgb2YgYXJyYXlzIGFyZSBhbGlnbmVkIGluIGEgc2luZ2xlIE8obl4yKSBvcGVyYXRpb24gKG1vZCBkZWVwXG4gICAgLy8gbWF0Y2hpbmcgYW5kIHJvdGF0aW9uKSwgYWRhcHRpbmcgdG8gTyhuKSB3aGVuIHRoZXkncmUgYWxyZWFkeSBhbGlnbmVkLlxuICAgIGZ1bmN0aW9uIG1hdGNoS2V5KGN1cnJlbnQsIGFrZXlzLCBzdGFydCwgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0ICsgMTsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gYWtleXNbaV1cblxuICAgICAgICAgICAgaWYgKG1hdGNoKGN1cnJlbnQsIGtleSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogb25jZSBlbmdpbmVzIGFjdHVhbGx5IG9wdGltaXplIGBjb3B5V2l0aGluYCwgdXNlIHRoYXRcbiAgICAgICAgICAgICAgICAvLyBpbnN0ZWFkLiBJdCdsbCBiZSBtdWNoIGZhc3RlciB0aGFuIHRoaXMgbG9vcC5cbiAgICAgICAgICAgICAgICB3aGlsZSAoaSA+IHN0YXJ0KSBha2V5c1tpXSA9IGFrZXlzWy0taV1cbiAgICAgICAgICAgICAgICBha2V5c1tpXSA9IGtleVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaFZhbHVlcyhhLCBiLCBha2V5cywgYmtleXMsIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghbWF0Y2goYS5nZXQoYWtleXNbaV0pLCBiLmdldChia2V5c1tpXSksXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBQb3NzaWJseSBleHBlbnNpdmUgb3JkZXItaW5kZXBlbmRlbnQga2V5LXZhbHVlIG1hdGNoLiBGaXJzdCwgdHJ5IHRvIGF2b2lkXG4gICAgLy8gaXQgYnkgY29uc2VydmF0aXZlbHkgYXNzdW1pbmcgZXZlcnl0aGluZyBpcyBpbiBvcmRlciAtIGEgY2hlYXAgTyhuKSBpc1xuICAgIC8vIGFsd2F5cyBuaWNlciB0aGFuIGFuIGV4cGVuc2l2ZSBPKG5eMikuXG4gICAgZnVuY3Rpb24gbWF0Y2hNYXAoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIHZhciBlbmQgPSBhLnNpemVcbiAgICAgICAgdmFyIGFrZXlzID0ga2V5TGlzdChhKVxuICAgICAgICB2YXIgYmtleXMgPSBrZXlMaXN0KGIpXG4gICAgICAgIHZhciBpID0gMFxuXG4gICAgICAgIHdoaWxlIChpICE9PSBlbmQgJiYgbWF0Y2goYWtleXNbaV0sIGJrZXlzW2ldLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgIGkrK1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGkgPT09IGVuZCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoVmFsdWVzKGEsIGIsIGFrZXlzLCBia2V5cywgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERvbid0IGNvbXBhcmUgdGhlIHNhbWUga2V5IHR3aWNlXG4gICAgICAgIGlmICghbWF0Y2hLZXkoYmtleXNbaV0sIGFrZXlzLCBpLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgYWJvdmUgZmFpbHMsIHdoaWxlIHdlJ3JlIGF0IGl0LCBsZXQncyBzb3J0IHRoZW0gYXMgd2UgZ28sIHNvXG4gICAgICAgIC8vIHRoZSBrZXkgb3JkZXIgbWF0Y2hlcy5cbiAgICAgICAgd2hpbGUgKCsraSA8IGVuZCkge1xuICAgICAgICAgICAgdmFyIGtleSA9IGJrZXlzW2ldXG5cbiAgICAgICAgICAgIC8vIEFkYXB0IGlmIHRoZSBrZXlzIGFyZSBhbHJlYWR5IGluIG9yZGVyLCB3aGljaCBpcyBmcmVxdWVudGx5IHRoZVxuICAgICAgICAgICAgLy8gY2FzZS5cbiAgICAgICAgICAgIGlmICghbWF0Y2goa2V5LCBha2V5c1tpXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpICYmXG4gICAgICAgICAgICAgICAgICAgICFtYXRjaEtleShrZXksIGFrZXlzLCBpLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hdGNoVmFsdWVzKGEsIGIsIGFrZXlzLCBia2V5cywgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNBbGxJZGVudGljYWwoYWxpc3QsIGIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFiLmhhcyhhbGlzdFtpXSkpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBDb21wYXJlIHRoZSB2YWx1ZXMgc3RydWN0dXJhbGx5LCBhbmQgaW5kZXBlbmRlbnQgb2Ygb3JkZXIuXG4gICAgZnVuY3Rpb24gc2VhcmNoRm9yKGF2YWx1ZSwgb2JqZWN0cywgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIGZvciAodmFyIGogaW4gb2JqZWN0cykge1xuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKG9iamVjdHMsIGopKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKGF2YWx1ZSwgb2JqZWN0c1tqXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvYmplY3RzW2pdXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFzU3RydWN0dXJlKHZhbHVlLCBjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgfHxcbiAgICAgICAgICAgICAgICAhKGNvbnRleHQgJiBTdHJpY3QpICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzeW1ib2xcIlxuICAgIH1cblxuICAgIC8vIFRoZSBzZXQgYWxnb3JpdGhtIGlzIHN0cnVjdHVyZWQgYSBsaXR0bGUgZGlmZmVyZW50bHkuIEl0IHRha2VzIG9uZSBvZiB0aGVcbiAgICAvLyBzZXRzIGludG8gYW4gYXJyYXksIGRvZXMgYSBjaGVhcCBpZGVudGl0eSBjaGVjaywgdGhlbiBkb2VzIHRoZSBkZWVwXG4gICAgLy8gY2hlY2suXG4gICAgZnVuY3Rpb24gbWF0Y2hTZXQoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIC8vIFRoaXMgaXMgdG8gdHJ5IHRvIGF2b2lkIGFuIGV4cGVuc2l2ZSBzdHJ1Y3R1cmFsIG1hdGNoIG9uIHRoZSBrZXlzLlxuICAgICAgICAvLyBUZXN0IGZvciBpZGVudGl0eSBmaXJzdC5cbiAgICAgICAgdmFyIGFsaXN0ID0ga2V5TGlzdChhKVxuXG4gICAgICAgIGlmIChoYXNBbGxJZGVudGljYWwoYWxpc3QsIGIpKSByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIHZhciBpdGVyID0gYi52YWx1ZXMoKVxuICAgICAgICB2YXIgY291bnQgPSAwXG4gICAgICAgIHZhciBvYmplY3RzXG5cbiAgICAgICAgLy8gR2F0aGVyIGFsbCB0aGUgb2JqZWN0c1xuICAgICAgICBmb3IgKHZhciBuZXh0ID0gaXRlci5uZXh0KCk7ICFuZXh0LmRvbmU7IG5leHQgPSBpdGVyLm5leHQoKSkge1xuICAgICAgICAgICAgdmFyIGJ2YWx1ZSA9IG5leHQudmFsdWVcblxuICAgICAgICAgICAgaWYgKGhhc1N0cnVjdHVyZShidmFsdWUsIGNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIG1hcCBsYXppbHkuIE5vdGUgdGhhdCB0aGlzIGFsc28gZ3JhYnNcbiAgICAgICAgICAgICAgICAvLyBTeW1ib2xzIHdoZW4gbm90IHN0cmljdGx5IG1hdGNoaW5nLCBzaW5jZSB0aGVpciBkZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgIC8vIGlzIGNvbXBhcmVkLlxuICAgICAgICAgICAgICAgIGlmIChjb3VudCA9PT0gMCkgb2JqZWN0cyA9IE9iamVjdC5jcmVhdGUobnVsbClcbiAgICAgICAgICAgICAgICBvYmplY3RzW2NvdW50KytdID0gYnZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBldmVyeXRoaW5nIGlzIGEgcHJpbWl0aXZlLCB0aGVuIGFib3J0LlxuICAgICAgICBpZiAoY291bnQgPT09IDApIHJldHVybiBmYWxzZVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhlIG9iamVjdCwgcmVtb3ZpbmcgZWFjaCBvbmUgcmVtYWluaW5nIHdoZW4gbWF0Y2hlZCAoYW5kXG4gICAgICAgIC8vIGFib3J0aW5nIGlmIG5vbmUgY2FuIGJlKS5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYXZhbHVlID0gYWxpc3RbaV1cblxuICAgICAgICAgICAgaWYgKGhhc1N0cnVjdHVyZShhdmFsdWUsIGNvbnRleHQpICYmXG4gICAgICAgICAgICAgICAgICAgICFzZWFyY2hGb3IoYXZhbHVlLCBvYmplY3RzLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hSZWdFeHAoYSwgYikge1xuICAgICAgICByZXR1cm4gYS5zb3VyY2UgPT09IGIuc291cmNlICYmXG4gICAgICAgICAgICBhLmdsb2JhbCA9PT0gYi5nbG9iYWwgJiZcbiAgICAgICAgICAgIGEuaWdub3JlQ2FzZSA9PT0gYi5pZ25vcmVDYXNlICYmXG4gICAgICAgICAgICBhLm11bHRpbGluZSA9PT0gYi5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgICghc3VwcG9ydHNVbmljb2RlIHx8IGEudW5pY29kZSA9PT0gYi51bmljb2RlKSAmJlxuICAgICAgICAgICAgKCFzdXBwb3J0c1N0aWNreSB8fCBhLnN0aWNreSA9PT0gYi5zdGlja3kpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hQcmVwYXJlRGVzY2VuZChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgLy8gQ2hlY2sgZm9yIGNpcmN1bGFyIHJlZmVyZW5jZXMgYWZ0ZXIgdGhlIGZpcnN0IGxldmVsLCB3aGVyZSBpdCdzXG4gICAgICAgIC8vIHJlZHVuZGFudC4gTm90ZSB0aGF0IHRoZXkgaGF2ZSB0byBwb2ludCB0byB0aGUgc2FtZSBsZXZlbCB0byBhY3R1YWxseVxuICAgICAgICAvLyBiZSBjb25zaWRlcmVkIGRlZXBseSBlcXVhbC5cbiAgICAgICAgaWYgKCEoY29udGV4dCAmIEluaXRpYWwpKSB7XG4gICAgICAgICAgICB2YXIgbGVmdEluZGV4ID0gbGVmdC5pbmRleE9mKGEpXG4gICAgICAgICAgICB2YXIgcmlnaHRJbmRleCA9IHJpZ2h0LmluZGV4T2YoYilcblxuICAgICAgICAgICAgaWYgKGxlZnRJbmRleCAhPT0gcmlnaHRJbmRleCkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAobGVmdEluZGV4ID49IDApIHJldHVybiB0cnVlXG5cbiAgICAgICAgICAgIGxlZnQucHVzaChhKVxuICAgICAgICAgICAgcmlnaHQucHVzaChiKVxuXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbWF0Y2hJbm5lcihhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcblxuICAgICAgICAgICAgbGVmdC5wb3AoKVxuICAgICAgICAgICAgcmlnaHQucG9wKClcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoSW5uZXIoYSwgYiwgY29udGV4dCAmIH5Jbml0aWFsLCBbYV0sIFtiXSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoU2FtZVByb3RvKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICBpZiAoc3ltYm9sc0FyZU9iamVjdHMgJiYgYSBpbnN0YW5jZW9mIFN5bWJvbCkge1xuICAgICAgICAgICAgcmV0dXJuICEoY29udGV4dCAmIFN0cmljdCkgJiYgYS50b1N0cmluZygpID09PSBiLnRvU3RyaW5nKClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhIGluc3RhbmNlb2YgUmVnRXhwKSByZXR1cm4gbWF0Y2hSZWdFeHAoYSwgYilcbiAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBEYXRlKSByZXR1cm4gYS52YWx1ZU9mKCkgPT09IGIudmFsdWVPZigpXG4gICAgICAgIGlmIChhcnJheUJ1ZmZlclN1cHBvcnQgIT09IEFycmF5QnVmZmVyTm9uZSkge1xuICAgICAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBEYXRhVmlldykge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaFZpZXcoXG4gICAgICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGEuYnVmZmVyLCBhLmJ5dGVPZmZzZXQsIGEuYnl0ZUxlbmd0aCksXG4gICAgICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGIuYnVmZmVyLCBiLmJ5dGVPZmZzZXQsIGIuYnl0ZUxlbmd0aCkpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoVmlldyhuZXcgVWludDhBcnJheShhKSwgbmV3IFVpbnQ4QXJyYXkoYikpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNWaWV3KGEpKSByZXR1cm4gbWF0Y2hWaWV3KGEsIGIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNCdWZmZXIoYSkpIHJldHVybiBtYXRjaFZpZXcoYSwgYilcblxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydHNNYXAgJiYgYSBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGlmIChhLnNpemUgPT09IDApIHJldHVybiB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydHNTZXQgJiYgYSBpbnN0YW5jZW9mIFNldCkge1xuICAgICAgICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGlmIChhLnNpemUgPT09IDApIHJldHVybiB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYikgIT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChiKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWF0Y2hQcmVwYXJlRGVzY2VuZChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICB9XG5cbiAgICAvLyBNb3N0IHNwZWNpYWwgY2FzZXMgcmVxdWlyZSBib3RoIHR5cGVzIHRvIG1hdGNoLCBhbmQgaWYgb25seSBvbmUgb2YgdGhlbVxuICAgIC8vIGFyZSwgdGhlIG9iamVjdHMgdGhlbXNlbHZlcyBkb24ndCBtYXRjaC5cbiAgICBmdW5jdGlvbiBtYXRjaERpZmZlcmVudFByb3RvKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICBpZiAoc3ltYm9sc0FyZU9iamVjdHMpIHtcbiAgICAgICAgICAgIGlmIChhIGluc3RhbmNlb2YgU3ltYm9sIHx8IGIgaW5zdGFuY2VvZiBTeW1ib2wpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIGlmIChjb250ZXh0ICYgU3RyaWN0KSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGFycmF5QnVmZmVyU3VwcG9ydCAhPT0gQXJyYXlCdWZmZXJOb25lKSB7XG4gICAgICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzVmlldyhhKSB8fCBpc1ZpZXcoYikpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGEpIHx8IEFycmF5LmlzQXJyYXkoYikpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoc3VwcG9ydHNNYXAgJiYgKGEgaW5zdGFuY2VvZiBNYXAgfHwgYiBpbnN0YW5jZW9mIE1hcCkpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoc3VwcG9ydHNTZXQgJiYgKGEgaW5zdGFuY2VvZiBTZXQgfHwgYiBpbnN0YW5jZW9mIFNldCkpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYikgIT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAoYS5sZW5ndGggPT09IDApIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYikgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gbWF0Y2hQcmVwYXJlRGVzY2VuZChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgaWYgKGEgPT09IGIpIHJldHVybiB0cnVlXG4gICAgICAgIC8vIE5hTnMgYXJlIGVxdWFsXG4gICAgICAgIGlmIChhICE9PSBhKSByZXR1cm4gYiAhPT0gYiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxuICAgICAgICBpZiAoYSA9PT0gbnVsbCB8fCBiID09PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKHR5cGVvZiBhID09PSBcInN5bWJvbFwiICYmIHR5cGVvZiBiID09PSBcInN5bWJvbFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gIShjb250ZXh0ICYgU3RyaWN0KSAmJiBhLnRvU3RyaW5nKCkgPT09IGIudG9TdHJpbmcoKVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgYSAhPT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgYiAhPT0gXCJvYmplY3RcIikgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgLy8gVXN1YWxseSwgYm90aCBvYmplY3RzIGhhdmUgaWRlbnRpY2FsIHByb3RvdHlwZXMsIGFuZCB0aGF0IGFsbG93cyBmb3JcbiAgICAgICAgLy8gaGFsZiB0aGUgdHlwZSBjaGVja2luZy5cbiAgICAgICAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZihhKSA9PT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGIpKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hTYW1lUHJvdG8oYSwgYiwgY29udGV4dCB8IFNhbWVQcm90bywgbGVmdCwgcmlnaHQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hEaWZmZXJlbnRQcm90byhhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoQXJyYXlMaWtlKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghbWF0Y2goYVtpXSwgYltpXSwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgLy8gUGhhbnRvbUpTIGFuZCBTbGltZXJKUyBib3RoIGhhdmUgbXlzdGVyaW91cyBpc3N1ZXMgd2hlcmUgYEVycm9yYCBpc1xuICAgIC8vIHNvbWV0aW1lcyBlcnJvbmVvdXNseSBvZiBhIGRpZmZlcmVudCBgd2luZG93YCwgYW5kIGl0IHNob3dzIHVwIGluIHRoZVxuICAgIC8vIHRlc3RzLiBUaGlzIG1lYW5zIEkgaGF2ZSB0byB1c2UgYSBtdWNoIHNsb3dlciBhbGdvcml0aG0gdG8gZGV0ZWN0IEVycm9ycy5cbiAgICAvL1xuICAgIC8vIFBoYW50b21KUzogaHR0cHM6Ly9naXRodWIuY29tL3BldGthYW50b25vdi9ibHVlYmlyZC9pc3N1ZXMvMTE0NlxuICAgIC8vIFNsaW1lckpTOiBodHRwczovL2dpdGh1Yi5jb20vbGF1cmVudGovc2xpbWVyanMvaXNzdWVzLzQwMFxuICAgIC8vXG4gICAgLy8gKFllcywgdGhlIFBoYW50b21KUyBidWcgaXMgZGV0YWlsZWQgaW4gdGhlIEJsdWViaXJkIGlzc3VlIHRyYWNrZXIuKVxuICAgIHZhciBjaGVja0Nyb3NzT3JpZ2luID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGdsb2JhbC53aW5kb3cgPT0gbnVsbCB8fCBnbG9iYWwud2luZG93Lm5hdmlnYXRvciA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gL3NsaW1lcmpzfHBoYW50b21qcy9pLnRlc3QoZ2xvYmFsLndpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIH0pKClcblxuICAgIHZhciBlcnJvclN0cmluZ1R5cGVzID0ge1xuICAgICAgICBcIltvYmplY3QgRXJyb3JdXCI6IHRydWUsXG4gICAgICAgIFwiW29iamVjdCBFdmFsRXJyb3JdXCI6IHRydWUsXG4gICAgICAgIFwiW29iamVjdCBSYW5nZUVycm9yXVwiOiB0cnVlLFxuICAgICAgICBcIltvYmplY3QgUmVmZXJlbmNlRXJyb3JdXCI6IHRydWUsXG4gICAgICAgIFwiW29iamVjdCBTeW50YXhFcnJvcl1cIjogdHJ1ZSxcbiAgICAgICAgXCJbb2JqZWN0IFR5cGVFcnJvcl1cIjogdHJ1ZSxcbiAgICAgICAgXCJbb2JqZWN0IFVSSUVycm9yXVwiOiB0cnVlLFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzUHJveGllZEVycm9yKG9iamVjdCkge1xuICAgICAgICB3aGlsZSAob2JqZWN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChlcnJvclN0cmluZ1R5cGVzW29iamVjdFRvU3RyaW5nLmNhbGwob2JqZWN0KV0pIHJldHVybiB0cnVlXG4gICAgICAgICAgICBvYmplY3QgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hJbm5lcihhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1zdGF0ZW1lbnRzLCBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIHZhciBha2V5cywgYmtleXNcbiAgICAgICAgdmFyIGlzVW5wcm94aWVkRXJyb3IgPSBmYWxzZVxuXG4gICAgICAgIGlmIChjb250ZXh0ICYgU2FtZVByb3RvKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaEFycmF5TGlrZShhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN1cHBvcnRzTWFwICYmIGEgaW5zdGFuY2VvZiBNYXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hNYXAoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdXBwb3J0c1NldCAmJiBhIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoU2V0KGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChhKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaEFycmF5TGlrZShhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlcXVpcmVzUHJveHkgJiZcbiAgICAgICAgICAgICAgICAgICAgKGNoZWNrQ3Jvc3NPcmlnaW4gPyBpc1Byb3hpZWRFcnJvcihhKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBhIGluc3RhbmNlb2YgRXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgYWtleXMgPSBnZXRLZXlzU3RyaXBwZWQoYSlcbiAgICAgICAgICAgICAgICBia2V5cyA9IGdldEtleXNTdHJpcHBlZChiKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBha2V5cyA9IE9iamVjdC5rZXlzKGEpXG4gICAgICAgICAgICAgICAgYmtleXMgPSBPYmplY3Qua2V5cyhiKVxuICAgICAgICAgICAgICAgIGlzVW5wcm94aWVkRXJyb3IgPSBhIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoQXJyYXlMaWtlKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB3ZSByZXF1aXJlIGEgcHJveHksIGJlIHBlcm1pc3NpdmUgYW5kIGNoZWNrIHRoZSBgdG9TdHJpbmdgXG4gICAgICAgICAgICAvLyB0eXBlLiBUaGlzIGlzIHNvIGl0IHdvcmtzIGNyb3NzLW9yaWdpbiBpbiBQaGFudG9tSlMgaW5cbiAgICAgICAgICAgIC8vIHBhcnRpY3VsYXIuXG4gICAgICAgICAgICBpZiAoY2hlY2tDcm9zc09yaWdpbiA/IGlzUHJveGllZEVycm9yKGEpIDogYSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBha2V5cyA9IE9iamVjdC5rZXlzKGEpXG4gICAgICAgICAgICBia2V5cyA9IE9iamVjdC5rZXlzKGIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY291bnQgPSBha2V5cy5sZW5ndGhcblxuICAgICAgICBpZiAoY291bnQgIT09IGJrZXlzLmxlbmd0aCkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgLy8gU2hvcnRjdXQgaWYgdGhlcmUncyBub3RoaW5nIHRvIG1hdGNoXG4gICAgICAgIGlmIChjb3VudCA9PT0gMCkgcmV0dXJuIHRydWVcblxuICAgICAgICB2YXIgaVxuXG4gICAgICAgIGlmIChpc1VucHJveGllZEVycm9yKSB7XG4gICAgICAgICAgICAvLyBTaG9ydGN1dCBpZiB0aGUgcHJvcGVydGllcyBhcmUgZGlmZmVyZW50LlxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoYWtleXNbaV0gIT09IFwic3RhY2tcIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWhhc093bi5jYWxsKGIsIGFrZXlzW2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBWZXJpZnkgdGhhdCBhbGwgdGhlIGFrZXlzJyB2YWx1ZXMgbWF0Y2hlZC5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFrZXlzW2ldICE9PSBcInN0YWNrXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICFtYXRjaChhW2FrZXlzW2ldXSwgYltha2V5c1tpXV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFNob3J0Y3V0IGlmIHRoZSBwcm9wZXJ0aWVzIGFyZSBkaWZmZXJlbnQuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwoYiwgYWtleXNbaV0pKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVmVyaWZ5IHRoYXQgYWxsIHRoZSBha2V5cycgdmFsdWVzIG1hdGNoZWQuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICghbWF0Y2goYVtha2V5c1tpXV0sIGJbYWtleXNbaV1dLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG59KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBzZW1pXG4iLCIvLyBTZWU6IGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC9nb29nbGUtZGlmZi1tYXRjaC1wYXRjaC93aWtpL0FQSVxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRDaGFuZ2VzVG9ETVAoY2hhbmdlcykge1xuICBsZXQgcmV0ID0gW10sXG4gICAgICBjaGFuZ2UsXG4gICAgICBvcGVyYXRpb247XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgIGNoYW5nZSA9IGNoYW5nZXNbaV07XG4gICAgaWYgKGNoYW5nZS5hZGRlZCkge1xuICAgICAgb3BlcmF0aW9uID0gMTtcbiAgICB9IGVsc2UgaWYgKGNoYW5nZS5yZW1vdmVkKSB7XG4gICAgICBvcGVyYXRpb24gPSAtMTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3BlcmF0aW9uID0gMDtcbiAgICB9XG5cbiAgICByZXQucHVzaChbb3BlcmF0aW9uLCBjaGFuZ2UudmFsdWVdKTtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRDaGFuZ2VzVG9YTUwoY2hhbmdlcykge1xuICBsZXQgcmV0ID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBjaGFuZ2UgPSBjaGFuZ2VzW2ldO1xuICAgIGlmIChjaGFuZ2UuYWRkZWQpIHtcbiAgICAgIHJldC5wdXNoKCc8aW5zPicpO1xuICAgIH0gZWxzZSBpZiAoY2hhbmdlLnJlbW92ZWQpIHtcbiAgICAgIHJldC5wdXNoKCc8ZGVsPicpO1xuICAgIH1cblxuICAgIHJldC5wdXNoKGVzY2FwZUhUTUwoY2hhbmdlLnZhbHVlKSk7XG5cbiAgICBpZiAoY2hhbmdlLmFkZGVkKSB7XG4gICAgICByZXQucHVzaCgnPC9pbnM+Jyk7XG4gICAgfSBlbHNlIGlmIChjaGFuZ2UucmVtb3ZlZCkge1xuICAgICAgcmV0LnB1c2goJzwvZGVsPicpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmV0LmpvaW4oJycpO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVIVE1MKHMpIHtcbiAgbGV0IG4gPSBzO1xuICBuID0gbi5yZXBsYWNlKC8mL2csICcmYW1wOycpO1xuICBuID0gbi5yZXBsYWNlKC88L2csICcmbHQ7Jyk7XG4gIG4gPSBuLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbiAgbiA9IG4ucmVwbGFjZSgvXCIvZywgJyZxdW90OycpO1xuXG4gIHJldHVybiBuO1xufVxuIiwiaW1wb3J0IERpZmYgZnJvbSAnLi9iYXNlJztcblxuZXhwb3J0IGNvbnN0IGFycmF5RGlmZiA9IG5ldyBEaWZmKCk7XG5hcnJheURpZmYudG9rZW5pemUgPSBhcnJheURpZmYuam9pbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZS5zbGljZSgpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRpZmZBcnJheXMob2xkQXJyLCBuZXdBcnIsIGNhbGxiYWNrKSB7IHJldHVybiBhcnJheURpZmYuZGlmZihvbGRBcnIsIG5ld0FyciwgY2FsbGJhY2spOyB9XG4iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBEaWZmKCkge31cblxuRGlmZi5wcm90b3R5cGUgPSB7XG4gIGRpZmYob2xkU3RyaW5nLCBuZXdTdHJpbmcsIG9wdGlvbnMgPSB7fSkge1xuICAgIGxldCBjYWxsYmFjayA9IG9wdGlvbnMuY2FsbGJhY2s7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBkb25lKHZhbHVlKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sodW5kZWZpbmVkLCB2YWx1ZSk7IH0sIDApO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBbGxvdyBzdWJjbGFzc2VzIHRvIG1hc3NhZ2UgdGhlIGlucHV0IHByaW9yIHRvIHJ1bm5pbmdcbiAgICBvbGRTdHJpbmcgPSB0aGlzLmNhc3RJbnB1dChvbGRTdHJpbmcpO1xuICAgIG5ld1N0cmluZyA9IHRoaXMuY2FzdElucHV0KG5ld1N0cmluZyk7XG5cbiAgICBvbGRTdHJpbmcgPSB0aGlzLnJlbW92ZUVtcHR5KHRoaXMudG9rZW5pemUob2xkU3RyaW5nKSk7XG4gICAgbmV3U3RyaW5nID0gdGhpcy5yZW1vdmVFbXB0eSh0aGlzLnRva2VuaXplKG5ld1N0cmluZykpO1xuXG4gICAgbGV0IG5ld0xlbiA9IG5ld1N0cmluZy5sZW5ndGgsIG9sZExlbiA9IG9sZFN0cmluZy5sZW5ndGg7XG4gICAgbGV0IGVkaXRMZW5ndGggPSAxO1xuICAgIGxldCBtYXhFZGl0TGVuZ3RoID0gbmV3TGVuICsgb2xkTGVuO1xuICAgIGxldCBiZXN0UGF0aCA9IFt7IG5ld1BvczogLTEsIGNvbXBvbmVudHM6IFtdIH1dO1xuXG4gICAgLy8gU2VlZCBlZGl0TGVuZ3RoID0gMCwgaS5lLiB0aGUgY29udGVudCBzdGFydHMgd2l0aCB0aGUgc2FtZSB2YWx1ZXNcbiAgICBsZXQgb2xkUG9zID0gdGhpcy5leHRyYWN0Q29tbW9uKGJlc3RQYXRoWzBdLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgMCk7XG4gICAgaWYgKGJlc3RQYXRoWzBdLm5ld1BvcyArIDEgPj0gbmV3TGVuICYmIG9sZFBvcyArIDEgPj0gb2xkTGVuKSB7XG4gICAgICAvLyBJZGVudGl0eSBwZXIgdGhlIGVxdWFsaXR5IGFuZCB0b2tlbml6ZXJcbiAgICAgIHJldHVybiBkb25lKFt7dmFsdWU6IHRoaXMuam9pbihuZXdTdHJpbmcpLCBjb3VudDogbmV3U3RyaW5nLmxlbmd0aH1dKTtcbiAgICB9XG5cbiAgICAvLyBNYWluIHdvcmtlciBtZXRob2QuIGNoZWNrcyBhbGwgcGVybXV0YXRpb25zIG9mIGEgZ2l2ZW4gZWRpdCBsZW5ndGggZm9yIGFjY2VwdGFuY2UuXG4gICAgZnVuY3Rpb24gZXhlY0VkaXRMZW5ndGgoKSB7XG4gICAgICBmb3IgKGxldCBkaWFnb25hbFBhdGggPSAtMSAqIGVkaXRMZW5ndGg7IGRpYWdvbmFsUGF0aCA8PSBlZGl0TGVuZ3RoOyBkaWFnb25hbFBhdGggKz0gMikge1xuICAgICAgICBsZXQgYmFzZVBhdGg7XG4gICAgICAgIGxldCBhZGRQYXRoID0gYmVzdFBhdGhbZGlhZ29uYWxQYXRoIC0gMV0sXG4gICAgICAgICAgICByZW1vdmVQYXRoID0gYmVzdFBhdGhbZGlhZ29uYWxQYXRoICsgMV0sXG4gICAgICAgICAgICBvbGRQb3MgPSAocmVtb3ZlUGF0aCA/IHJlbW92ZVBhdGgubmV3UG9zIDogMCkgLSBkaWFnb25hbFBhdGg7XG4gICAgICAgIGlmIChhZGRQYXRoKSB7XG4gICAgICAgICAgLy8gTm8gb25lIGVsc2UgaXMgZ29pbmcgdG8gYXR0ZW1wdCB0byB1c2UgdGhpcyB2YWx1ZSwgY2xlYXIgaXRcbiAgICAgICAgICBiZXN0UGF0aFtkaWFnb25hbFBhdGggLSAxXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjYW5BZGQgPSBhZGRQYXRoICYmIGFkZFBhdGgubmV3UG9zICsgMSA8IG5ld0xlbixcbiAgICAgICAgICAgIGNhblJlbW92ZSA9IHJlbW92ZVBhdGggJiYgMCA8PSBvbGRQb3MgJiYgb2xkUG9zIDwgb2xkTGVuO1xuICAgICAgICBpZiAoIWNhbkFkZCAmJiAhY2FuUmVtb3ZlKSB7XG4gICAgICAgICAgLy8gSWYgdGhpcyBwYXRoIGlzIGEgdGVybWluYWwgdGhlbiBwcnVuZVxuICAgICAgICAgIGJlc3RQYXRoW2RpYWdvbmFsUGF0aF0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZWxlY3QgdGhlIGRpYWdvbmFsIHRoYXQgd2Ugd2FudCB0byBicmFuY2ggZnJvbS4gV2Ugc2VsZWN0IHRoZSBwcmlvclxuICAgICAgICAvLyBwYXRoIHdob3NlIHBvc2l0aW9uIGluIHRoZSBuZXcgc3RyaW5nIGlzIHRoZSBmYXJ0aGVzdCBmcm9tIHRoZSBvcmlnaW5cbiAgICAgICAgLy8gYW5kIGRvZXMgbm90IHBhc3MgdGhlIGJvdW5kcyBvZiB0aGUgZGlmZiBncmFwaFxuICAgICAgICBpZiAoIWNhbkFkZCB8fCAoY2FuUmVtb3ZlICYmIGFkZFBhdGgubmV3UG9zIDwgcmVtb3ZlUGF0aC5uZXdQb3MpKSB7XG4gICAgICAgICAgYmFzZVBhdGggPSBjbG9uZVBhdGgocmVtb3ZlUGF0aCk7XG4gICAgICAgICAgc2VsZi5wdXNoQ29tcG9uZW50KGJhc2VQYXRoLmNvbXBvbmVudHMsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYmFzZVBhdGggPSBhZGRQYXRoOyAgIC8vIE5vIG5lZWQgdG8gY2xvbmUsIHdlJ3ZlIHB1bGxlZCBpdCBmcm9tIHRoZSBsaXN0XG4gICAgICAgICAgYmFzZVBhdGgubmV3UG9zKys7XG4gICAgICAgICAgc2VsZi5wdXNoQ29tcG9uZW50KGJhc2VQYXRoLmNvbXBvbmVudHMsIHRydWUsIHVuZGVmaW5lZCk7XG4gICAgICAgIH1cblxuICAgICAgICBvbGRQb3MgPSBzZWxmLmV4dHJhY3RDb21tb24oYmFzZVBhdGgsIG5ld1N0cmluZywgb2xkU3RyaW5nLCBkaWFnb25hbFBhdGgpO1xuXG4gICAgICAgIC8vIElmIHdlIGhhdmUgaGl0IHRoZSBlbmQgb2YgYm90aCBzdHJpbmdzLCB0aGVuIHdlIGFyZSBkb25lXG4gICAgICAgIGlmIChiYXNlUGF0aC5uZXdQb3MgKyAxID49IG5ld0xlbiAmJiBvbGRQb3MgKyAxID49IG9sZExlbikge1xuICAgICAgICAgIHJldHVybiBkb25lKGJ1aWxkVmFsdWVzKHNlbGYsIGJhc2VQYXRoLmNvbXBvbmVudHMsIG5ld1N0cmluZywgb2xkU3RyaW5nLCBzZWxmLnVzZUxvbmdlc3RUb2tlbikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIE90aGVyd2lzZSB0cmFjayB0aGlzIHBhdGggYXMgYSBwb3RlbnRpYWwgY2FuZGlkYXRlIGFuZCBjb250aW51ZS5cbiAgICAgICAgICBiZXN0UGF0aFtkaWFnb25hbFBhdGhdID0gYmFzZVBhdGg7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZWRpdExlbmd0aCsrO1xuICAgIH1cblxuICAgIC8vIFBlcmZvcm1zIHRoZSBsZW5ndGggb2YgZWRpdCBpdGVyYXRpb24uIElzIGEgYml0IGZ1Z2x5IGFzIHRoaXMgaGFzIHRvIHN1cHBvcnQgdGhlXG4gICAgLy8gc3luYyBhbmQgYXN5bmMgbW9kZSB3aGljaCBpcyBuZXZlciBmdW4uIExvb3BzIG92ZXIgZXhlY0VkaXRMZW5ndGggdW50aWwgYSB2YWx1ZVxuICAgIC8vIGlzIHByb2R1Y2VkLlxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgKGZ1bmN0aW9uIGV4ZWMoKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gVGhpcyBzaG91bGQgbm90IGhhcHBlbiwgYnV0IHdlIHdhbnQgdG8gYmUgc2FmZS5cbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgIGlmIChlZGl0TGVuZ3RoID4gbWF4RWRpdExlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFleGVjRWRpdExlbmd0aCgpKSB7XG4gICAgICAgICAgICBleGVjKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAwKTtcbiAgICAgIH0oKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdoaWxlIChlZGl0TGVuZ3RoIDw9IG1heEVkaXRMZW5ndGgpIHtcbiAgICAgICAgbGV0IHJldCA9IGV4ZWNFZGl0TGVuZ3RoKCk7XG4gICAgICAgIGlmIChyZXQpIHtcbiAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHB1c2hDb21wb25lbnQoY29tcG9uZW50cywgYWRkZWQsIHJlbW92ZWQpIHtcbiAgICBsZXQgbGFzdCA9IGNvbXBvbmVudHNbY29tcG9uZW50cy5sZW5ndGggLSAxXTtcbiAgICBpZiAobGFzdCAmJiBsYXN0LmFkZGVkID09PSBhZGRlZCAmJiBsYXN0LnJlbW92ZWQgPT09IHJlbW92ZWQpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gY2xvbmUgaGVyZSBhcyB0aGUgY29tcG9uZW50IGNsb25lIG9wZXJhdGlvbiBpcyBqdXN0XG4gICAgICAvLyBhcyBzaGFsbG93IGFycmF5IGNsb25lXG4gICAgICBjb21wb25lbnRzW2NvbXBvbmVudHMubGVuZ3RoIC0gMV0gPSB7Y291bnQ6IGxhc3QuY291bnQgKyAxLCBhZGRlZDogYWRkZWQsIHJlbW92ZWQ6IHJlbW92ZWQgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29tcG9uZW50cy5wdXNoKHtjb3VudDogMSwgYWRkZWQ6IGFkZGVkLCByZW1vdmVkOiByZW1vdmVkIH0pO1xuICAgIH1cbiAgfSxcbiAgZXh0cmFjdENvbW1vbihiYXNlUGF0aCwgbmV3U3RyaW5nLCBvbGRTdHJpbmcsIGRpYWdvbmFsUGF0aCkge1xuICAgIGxldCBuZXdMZW4gPSBuZXdTdHJpbmcubGVuZ3RoLFxuICAgICAgICBvbGRMZW4gPSBvbGRTdHJpbmcubGVuZ3RoLFxuICAgICAgICBuZXdQb3MgPSBiYXNlUGF0aC5uZXdQb3MsXG4gICAgICAgIG9sZFBvcyA9IG5ld1BvcyAtIGRpYWdvbmFsUGF0aCxcblxuICAgICAgICBjb21tb25Db3VudCA9IDA7XG4gICAgd2hpbGUgKG5ld1BvcyArIDEgPCBuZXdMZW4gJiYgb2xkUG9zICsgMSA8IG9sZExlbiAmJiB0aGlzLmVxdWFscyhuZXdTdHJpbmdbbmV3UG9zICsgMV0sIG9sZFN0cmluZ1tvbGRQb3MgKyAxXSkpIHtcbiAgICAgIG5ld1BvcysrO1xuICAgICAgb2xkUG9zKys7XG4gICAgICBjb21tb25Db3VudCsrO1xuICAgIH1cblxuICAgIGlmIChjb21tb25Db3VudCkge1xuICAgICAgYmFzZVBhdGguY29tcG9uZW50cy5wdXNoKHtjb3VudDogY29tbW9uQ291bnR9KTtcbiAgICB9XG5cbiAgICBiYXNlUGF0aC5uZXdQb3MgPSBuZXdQb3M7XG4gICAgcmV0dXJuIG9sZFBvcztcbiAgfSxcblxuICBlcXVhbHMobGVmdCwgcmlnaHQpIHtcbiAgICByZXR1cm4gbGVmdCA9PT0gcmlnaHQ7XG4gIH0sXG4gIHJlbW92ZUVtcHR5KGFycmF5KSB7XG4gICAgbGV0IHJldCA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJheVtpXSkge1xuICAgICAgICByZXQucHVzaChhcnJheVtpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH0sXG4gIGNhc3RJbnB1dCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfSxcbiAgdG9rZW5pemUodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUuc3BsaXQoJycpO1xuICB9LFxuICBqb2luKGNoYXJzKSB7XG4gICAgcmV0dXJuIGNoYXJzLmpvaW4oJycpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBidWlsZFZhbHVlcyhkaWZmLCBjb21wb25lbnRzLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgdXNlTG9uZ2VzdFRva2VuKSB7XG4gIGxldCBjb21wb25lbnRQb3MgPSAwLFxuICAgICAgY29tcG9uZW50TGVuID0gY29tcG9uZW50cy5sZW5ndGgsXG4gICAgICBuZXdQb3MgPSAwLFxuICAgICAgb2xkUG9zID0gMDtcblxuICBmb3IgKDsgY29tcG9uZW50UG9zIDwgY29tcG9uZW50TGVuOyBjb21wb25lbnRQb3MrKykge1xuICAgIGxldCBjb21wb25lbnQgPSBjb21wb25lbnRzW2NvbXBvbmVudFBvc107XG4gICAgaWYgKCFjb21wb25lbnQucmVtb3ZlZCkge1xuICAgICAgaWYgKCFjb21wb25lbnQuYWRkZWQgJiYgdXNlTG9uZ2VzdFRva2VuKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IG5ld1N0cmluZy5zbGljZShuZXdQb3MsIG5ld1BvcyArIGNvbXBvbmVudC5jb3VudCk7XG4gICAgICAgIHZhbHVlID0gdmFsdWUubWFwKGZ1bmN0aW9uKHZhbHVlLCBpKSB7XG4gICAgICAgICAgbGV0IG9sZFZhbHVlID0gb2xkU3RyaW5nW29sZFBvcyArIGldO1xuICAgICAgICAgIHJldHVybiBvbGRWYWx1ZS5sZW5ndGggPiB2YWx1ZS5sZW5ndGggPyBvbGRWYWx1ZSA6IHZhbHVlO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb21wb25lbnQudmFsdWUgPSBkaWZmLmpvaW4odmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29tcG9uZW50LnZhbHVlID0gZGlmZi5qb2luKG5ld1N0cmluZy5zbGljZShuZXdQb3MsIG5ld1BvcyArIGNvbXBvbmVudC5jb3VudCkpO1xuICAgICAgfVxuICAgICAgbmV3UG9zICs9IGNvbXBvbmVudC5jb3VudDtcblxuICAgICAgLy8gQ29tbW9uIGNhc2VcbiAgICAgIGlmICghY29tcG9uZW50LmFkZGVkKSB7XG4gICAgICAgIG9sZFBvcyArPSBjb21wb25lbnQuY291bnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbXBvbmVudC52YWx1ZSA9IGRpZmYuam9pbihvbGRTdHJpbmcuc2xpY2Uob2xkUG9zLCBvbGRQb3MgKyBjb21wb25lbnQuY291bnQpKTtcbiAgICAgIG9sZFBvcyArPSBjb21wb25lbnQuY291bnQ7XG5cbiAgICAgIC8vIFJldmVyc2UgYWRkIGFuZCByZW1vdmUgc28gcmVtb3ZlcyBhcmUgb3V0cHV0IGZpcnN0IHRvIG1hdGNoIGNvbW1vbiBjb252ZW50aW9uXG4gICAgICAvLyBUaGUgZGlmZmluZyBhbGdvcml0aG0gaXMgdGllZCB0byBhZGQgdGhlbiByZW1vdmUgb3V0cHV0IGFuZCB0aGlzIGlzIHRoZSBzaW1wbGVzdFxuICAgICAgLy8gcm91dGUgdG8gZ2V0IHRoZSBkZXNpcmVkIG91dHB1dCB3aXRoIG1pbmltYWwgb3ZlcmhlYWQuXG4gICAgICBpZiAoY29tcG9uZW50UG9zICYmIGNvbXBvbmVudHNbY29tcG9uZW50UG9zIC0gMV0uYWRkZWQpIHtcbiAgICAgICAgbGV0IHRtcCA9IGNvbXBvbmVudHNbY29tcG9uZW50UG9zIC0gMV07XG4gICAgICAgIGNvbXBvbmVudHNbY29tcG9uZW50UG9zIC0gMV0gPSBjb21wb25lbnRzW2NvbXBvbmVudFBvc107XG4gICAgICAgIGNvbXBvbmVudHNbY29tcG9uZW50UG9zXSA9IHRtcDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBTcGVjaWFsIGNhc2UgaGFuZGxlIGZvciB3aGVuIG9uZSB0ZXJtaW5hbCBpcyBpZ25vcmVkLiBGb3IgdGhpcyBjYXNlIHdlIG1lcmdlIHRoZVxuICAvLyB0ZXJtaW5hbCBpbnRvIHRoZSBwcmlvciBzdHJpbmcgYW5kIGRyb3AgdGhlIGNoYW5nZS5cbiAgbGV0IGxhc3RDb21wb25lbnQgPSBjb21wb25lbnRzW2NvbXBvbmVudExlbiAtIDFdO1xuICBpZiAoY29tcG9uZW50TGVuID4gMVxuICAgICAgJiYgKGxhc3RDb21wb25lbnQuYWRkZWQgfHwgbGFzdENvbXBvbmVudC5yZW1vdmVkKVxuICAgICAgJiYgZGlmZi5lcXVhbHMoJycsIGxhc3RDb21wb25lbnQudmFsdWUpKSB7XG4gICAgY29tcG9uZW50c1tjb21wb25lbnRMZW4gLSAyXS52YWx1ZSArPSBsYXN0Q29tcG9uZW50LnZhbHVlO1xuICAgIGNvbXBvbmVudHMucG9wKCk7XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50cztcbn1cblxuZnVuY3Rpb24gY2xvbmVQYXRoKHBhdGgpIHtcbiAgcmV0dXJuIHsgbmV3UG9zOiBwYXRoLm5ld1BvcywgY29tcG9uZW50czogcGF0aC5jb21wb25lbnRzLnNsaWNlKDApIH07XG59XG4iLCJpbXBvcnQgRGlmZiBmcm9tICcuL2Jhc2UnO1xuXG5leHBvcnQgY29uc3QgY2hhcmFjdGVyRGlmZiA9IG5ldyBEaWZmKCk7XG5leHBvcnQgZnVuY3Rpb24gZGlmZkNoYXJzKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykgeyByZXR1cm4gY2hhcmFjdGVyRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjayk7IH1cbiIsImltcG9ydCBEaWZmIGZyb20gJy4vYmFzZSc7XG5cbmV4cG9ydCBjb25zdCBjc3NEaWZmID0gbmV3IERpZmYoKTtcbmNzc0RpZmYudG9rZW5pemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUuc3BsaXQoLyhbe306OyxdfFxccyspLyk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGlmZkNzcyhvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHsgcmV0dXJuIGNzc0RpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spOyB9XG4iLCJpbXBvcnQgRGlmZiBmcm9tICcuL2Jhc2UnO1xuaW1wb3J0IHtsaW5lRGlmZn0gZnJvbSAnLi9saW5lJztcblxuY29uc3Qgb2JqZWN0UHJvdG90eXBlVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5cbmV4cG9ydCBjb25zdCBqc29uRGlmZiA9IG5ldyBEaWZmKCk7XG4vLyBEaXNjcmltaW5hdGUgYmV0d2VlbiB0d28gbGluZXMgb2YgcHJldHR5LXByaW50ZWQsIHNlcmlhbGl6ZWQgSlNPTiB3aGVyZSBvbmUgb2YgdGhlbSBoYXMgYVxuLy8gZGFuZ2xpbmcgY29tbWEgYW5kIHRoZSBvdGhlciBkb2Vzbid0LiBUdXJucyBvdXQgaW5jbHVkaW5nIHRoZSBkYW5nbGluZyBjb21tYSB5aWVsZHMgdGhlIG5pY2VzdCBvdXRwdXQ6XG5qc29uRGlmZi51c2VMb25nZXN0VG9rZW4gPSB0cnVlO1xuXG5qc29uRGlmZi50b2tlbml6ZSA9IGxpbmVEaWZmLnRva2VuaXplO1xuanNvbkRpZmYuY2FzdElucHV0ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgY29uc3Qge3VuZGVmaW5lZFJlcGxhY2VtZW50fSA9IHRoaXMub3B0aW9ucztcblxuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHZhbHVlIDogSlNPTi5zdHJpbmdpZnkoY2Fub25pY2FsaXplKHZhbHVlKSwgZnVuY3Rpb24oaywgdikge1xuICAgIGlmICh0eXBlb2YgdiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRSZXBsYWNlbWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gdjtcbiAgfSwgJyAgJyk7XG59O1xuanNvbkRpZmYuZXF1YWxzID0gZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuIERpZmYucHJvdG90eXBlLmVxdWFscyhsZWZ0LnJlcGxhY2UoLywoW1xcclxcbl0pL2csICckMScpLCByaWdodC5yZXBsYWNlKC8sKFtcXHJcXG5dKS9nLCAnJDEnKSk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGlmZkpzb24ob2xkT2JqLCBuZXdPYmosIG9wdGlvbnMpIHsgcmV0dXJuIGpzb25EaWZmLmRpZmYob2xkT2JqLCBuZXdPYmosIG9wdGlvbnMpOyB9XG5cbi8vIFRoaXMgZnVuY3Rpb24gaGFuZGxlcyB0aGUgcHJlc2VuY2Ugb2YgY2lyY3VsYXIgcmVmZXJlbmNlcyBieSBiYWlsaW5nIG91dCB3aGVuIGVuY291bnRlcmluZyBhblxuLy8gb2JqZWN0IHRoYXQgaXMgYWxyZWFkeSBvbiB0aGUgXCJzdGFja1wiIG9mIGl0ZW1zIGJlaW5nIHByb2Nlc3NlZC5cbmV4cG9ydCBmdW5jdGlvbiBjYW5vbmljYWxpemUob2JqLCBzdGFjaywgcmVwbGFjZW1lbnRTdGFjaykge1xuICBzdGFjayA9IHN0YWNrIHx8IFtdO1xuICByZXBsYWNlbWVudFN0YWNrID0gcmVwbGFjZW1lbnRTdGFjayB8fCBbXTtcblxuICBsZXQgaTtcblxuICBmb3IgKGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpICs9IDEpIHtcbiAgICBpZiAoc3RhY2tbaV0gPT09IG9iaikge1xuICAgICAgcmV0dXJuIHJlcGxhY2VtZW50U3RhY2tbaV07XG4gICAgfVxuICB9XG5cbiAgbGV0IGNhbm9uaWNhbGl6ZWRPYmo7XG5cbiAgaWYgKCdbb2JqZWN0IEFycmF5XScgPT09IG9iamVjdFByb3RvdHlwZVRvU3RyaW5nLmNhbGwob2JqKSkge1xuICAgIHN0YWNrLnB1c2gob2JqKTtcbiAgICBjYW5vbmljYWxpemVkT2JqID0gbmV3IEFycmF5KG9iai5sZW5ndGgpO1xuICAgIHJlcGxhY2VtZW50U3RhY2sucHVzaChjYW5vbmljYWxpemVkT2JqKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBjYW5vbmljYWxpemVkT2JqW2ldID0gY2Fub25pY2FsaXplKG9ialtpXSwgc3RhY2ssIHJlcGxhY2VtZW50U3RhY2spO1xuICAgIH1cbiAgICBzdGFjay5wb3AoKTtcbiAgICByZXBsYWNlbWVudFN0YWNrLnBvcCgpO1xuICAgIHJldHVybiBjYW5vbmljYWxpemVkT2JqO1xuICB9XG5cbiAgaWYgKG9iaiAmJiBvYmoudG9KU09OKSB7XG4gICAgb2JqID0gb2JqLnRvSlNPTigpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIG9iaiAhPT0gbnVsbCkge1xuICAgIHN0YWNrLnB1c2gob2JqKTtcbiAgICBjYW5vbmljYWxpemVkT2JqID0ge307XG4gICAgcmVwbGFjZW1lbnRTdGFjay5wdXNoKGNhbm9uaWNhbGl6ZWRPYmopO1xuICAgIGxldCBzb3J0ZWRLZXlzID0gW10sXG4gICAgICAgIGtleTtcbiAgICBmb3IgKGtleSBpbiBvYmopIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgc29ydGVkS2V5cy5wdXNoKGtleSk7XG4gICAgICB9XG4gICAgfVxuICAgIHNvcnRlZEtleXMuc29ydCgpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBzb3J0ZWRLZXlzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBrZXkgPSBzb3J0ZWRLZXlzW2ldO1xuICAgICAgY2Fub25pY2FsaXplZE9ialtrZXldID0gY2Fub25pY2FsaXplKG9ialtrZXldLCBzdGFjaywgcmVwbGFjZW1lbnRTdGFjayk7XG4gICAgfVxuICAgIHN0YWNrLnBvcCgpO1xuICAgIHJlcGxhY2VtZW50U3RhY2sucG9wKCk7XG4gIH0gZWxzZSB7XG4gICAgY2Fub25pY2FsaXplZE9iaiA9IG9iajtcbiAgfVxuICByZXR1cm4gY2Fub25pY2FsaXplZE9iajtcbn1cbiIsImltcG9ydCBEaWZmIGZyb20gJy4vYmFzZSc7XG5pbXBvcnQge2dlbmVyYXRlT3B0aW9uc30gZnJvbSAnLi4vdXRpbC9wYXJhbXMnO1xuXG5leHBvcnQgY29uc3QgbGluZURpZmYgPSBuZXcgRGlmZigpO1xubGluZURpZmYudG9rZW5pemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBsZXQgcmV0TGluZXMgPSBbXSxcbiAgICAgIGxpbmVzQW5kTmV3bGluZXMgPSB2YWx1ZS5zcGxpdCgvKFxcbnxcXHJcXG4pLyk7XG5cbiAgLy8gSWdub3JlIHRoZSBmaW5hbCBlbXB0eSB0b2tlbiB0aGF0IG9jY3VycyBpZiB0aGUgc3RyaW5nIGVuZHMgd2l0aCBhIG5ldyBsaW5lXG4gIGlmICghbGluZXNBbmROZXdsaW5lc1tsaW5lc0FuZE5ld2xpbmVzLmxlbmd0aCAtIDFdKSB7XG4gICAgbGluZXNBbmROZXdsaW5lcy5wb3AoKTtcbiAgfVxuXG4gIC8vIE1lcmdlIHRoZSBjb250ZW50IGFuZCBsaW5lIHNlcGFyYXRvcnMgaW50byBzaW5nbGUgdG9rZW5zXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXNBbmROZXdsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBsaW5lID0gbGluZXNBbmROZXdsaW5lc1tpXTtcblxuICAgIGlmIChpICUgMiAmJiAhdGhpcy5vcHRpb25zLm5ld2xpbmVJc1Rva2VuKSB7XG4gICAgICByZXRMaW5lc1tyZXRMaW5lcy5sZW5ndGggLSAxXSArPSBsaW5lO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmlnbm9yZVdoaXRlc3BhY2UpIHtcbiAgICAgICAgbGluZSA9IGxpbmUudHJpbSgpO1xuICAgICAgfVxuICAgICAgcmV0TGluZXMucHVzaChsaW5lKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV0TGluZXM7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGlmZkxpbmVzKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykgeyByZXR1cm4gbGluZURpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spOyB9XG5leHBvcnQgZnVuY3Rpb24gZGlmZlRyaW1tZWRMaW5lcyhvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHtcbiAgbGV0IG9wdGlvbnMgPSBnZW5lcmF0ZU9wdGlvbnMoY2FsbGJhY2ssIHtpZ25vcmVXaGl0ZXNwYWNlOiB0cnVlfSk7XG4gIHJldHVybiBsaW5lRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBvcHRpb25zKTtcbn1cbiIsImltcG9ydCBEaWZmIGZyb20gJy4vYmFzZSc7XG5cblxuZXhwb3J0IGNvbnN0IHNlbnRlbmNlRGlmZiA9IG5ldyBEaWZmKCk7XG5zZW50ZW5jZURpZmYudG9rZW5pemUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUuc3BsaXQoLyhcXFMuKz9bLiE/XSkoPz1cXHMrfCQpLyk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGlmZlNlbnRlbmNlcyhvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHsgcmV0dXJuIHNlbnRlbmNlRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjayk7IH1cbiIsImltcG9ydCBEaWZmIGZyb20gJy4vYmFzZSc7XG5pbXBvcnQge2dlbmVyYXRlT3B0aW9uc30gZnJvbSAnLi4vdXRpbC9wYXJhbXMnO1xuXG4vLyBCYXNlZCBvbiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MYXRpbl9zY3JpcHRfaW5fVW5pY29kZVxuLy9cbi8vIFJhbmdlcyBhbmQgZXhjZXB0aW9uczpcbi8vIExhdGluLTEgU3VwcGxlbWVudCwgMDA4MOKAkzAwRkZcbi8vICAtIFUrMDBENyAgw5cgTXVsdGlwbGljYXRpb24gc2lnblxuLy8gIC0gVSswMEY3ICDDtyBEaXZpc2lvbiBzaWduXG4vLyBMYXRpbiBFeHRlbmRlZC1BLCAwMTAw4oCTMDE3RlxuLy8gTGF0aW4gRXh0ZW5kZWQtQiwgMDE4MOKAkzAyNEZcbi8vIElQQSBFeHRlbnNpb25zLCAwMjUw4oCTMDJBRlxuLy8gU3BhY2luZyBNb2RpZmllciBMZXR0ZXJzLCAwMkIw4oCTMDJGRlxuLy8gIC0gVSswMkM3ICDLhyAmIzcxMTsgIENhcm9uXG4vLyAgLSBVKzAyRDggIMuYICYjNzI4OyAgQnJldmVcbi8vICAtIFUrMDJEOSAgy5kgJiM3Mjk7ICBEb3QgQWJvdmVcbi8vICAtIFUrMDJEQSAgy5ogJiM3MzA7ICBSaW5nIEFib3ZlXG4vLyAgLSBVKzAyREIgIMubICYjNzMxOyAgT2dvbmVrXG4vLyAgLSBVKzAyREMgIMucICYjNzMyOyAgU21hbGwgVGlsZGVcbi8vICAtIFUrMDJERCAgy50gJiM3MzM7ICBEb3VibGUgQWN1dGUgQWNjZW50XG4vLyBMYXRpbiBFeHRlbmRlZCBBZGRpdGlvbmFsLCAxRTAw4oCTMUVGRlxuY29uc3QgZXh0ZW5kZWRXb3JkQ2hhcnMgPSAvXlthLXpBLVpcXHV7QzB9LVxcdXtGRn1cXHV7RDh9LVxcdXtGNn1cXHV7Rjh9LVxcdXsyQzZ9XFx1ezJDOH0tXFx1ezJEN31cXHV7MkRFfS1cXHV7MkZGfVxcdXsxRTAwfS1cXHV7MUVGRn1dKyQvdTtcblxuY29uc3QgcmVXaGl0ZXNwYWNlID0gL1xcUy87XG5cbmV4cG9ydCBjb25zdCB3b3JkRGlmZiA9IG5ldyBEaWZmKCk7XG53b3JkRGlmZi5lcXVhbHMgPSBmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gbGVmdCA9PT0gcmlnaHQgfHwgKHRoaXMub3B0aW9ucy5pZ25vcmVXaGl0ZXNwYWNlICYmICFyZVdoaXRlc3BhY2UudGVzdChsZWZ0KSAmJiAhcmVXaGl0ZXNwYWNlLnRlc3QocmlnaHQpKTtcbn07XG53b3JkRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGxldCB0b2tlbnMgPSB2YWx1ZS5zcGxpdCgvKFxccyt8XFxiKS8pO1xuXG4gIC8vIEpvaW4gdGhlIGJvdW5kYXJ5IHNwbGl0cyB0aGF0IHdlIGRvIG5vdCBjb25zaWRlciB0byBiZSBib3VuZGFyaWVzLiBUaGlzIGlzIHByaW1hcmlseSB0aGUgZXh0ZW5kZWQgTGF0aW4gY2hhcmFjdGVyIHNldC5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgLy8gSWYgd2UgaGF2ZSBhbiBlbXB0eSBzdHJpbmcgaW4gdGhlIG5leHQgZmllbGQgYW5kIHdlIGhhdmUgb25seSB3b3JkIGNoYXJzIGJlZm9yZSBhbmQgYWZ0ZXIsIG1lcmdlXG4gICAgaWYgKCF0b2tlbnNbaSArIDFdICYmIHRva2Vuc1tpICsgMl1cbiAgICAgICAgICAmJiBleHRlbmRlZFdvcmRDaGFycy50ZXN0KHRva2Vuc1tpXSlcbiAgICAgICAgICAmJiBleHRlbmRlZFdvcmRDaGFycy50ZXN0KHRva2Vuc1tpICsgMl0pKSB7XG4gICAgICB0b2tlbnNbaV0gKz0gdG9rZW5zW2kgKyAyXTtcbiAgICAgIHRva2Vucy5zcGxpY2UoaSArIDEsIDIpO1xuICAgICAgaS0tO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0b2tlbnM7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGlmZldvcmRzKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykge1xuICBsZXQgb3B0aW9ucyA9IGdlbmVyYXRlT3B0aW9ucyhjYWxsYmFjaywge2lnbm9yZVdoaXRlc3BhY2U6IHRydWV9KTtcbiAgcmV0dXJuIHdvcmREaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIsIG9wdGlvbnMpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGRpZmZXb3Jkc1dpdGhTcGFjZShvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHtcbiAgcmV0dXJuIHdvcmREaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKTtcbn1cbiIsIi8qIFNlZSBMSUNFTlNFIGZpbGUgZm9yIHRlcm1zIG9mIHVzZSAqL1xuXG4vKlxuICogVGV4dCBkaWZmIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIFRoaXMgbGlicmFyeSBzdXBwb3J0cyB0aGUgZm9sbG93aW5nIEFQSVM6XG4gKiBKc0RpZmYuZGlmZkNoYXJzOiBDaGFyYWN0ZXIgYnkgY2hhcmFjdGVyIGRpZmZcbiAqIEpzRGlmZi5kaWZmV29yZHM6IFdvcmQgKGFzIGRlZmluZWQgYnkgXFxiIHJlZ2V4KSBkaWZmIHdoaWNoIGlnbm9yZXMgd2hpdGVzcGFjZVxuICogSnNEaWZmLmRpZmZMaW5lczogTGluZSBiYXNlZCBkaWZmXG4gKlxuICogSnNEaWZmLmRpZmZDc3M6IERpZmYgdGFyZ2V0ZWQgYXQgQ1NTIGNvbnRlbnRcbiAqXG4gKiBUaGVzZSBtZXRob2RzIGFyZSBiYXNlZCBvbiB0aGUgaW1wbGVtZW50YXRpb24gcHJvcG9zZWQgaW5cbiAqIFwiQW4gTyhORCkgRGlmZmVyZW5jZSBBbGdvcml0aG0gYW5kIGl0cyBWYXJpYXRpb25zXCIgKE15ZXJzLCAxOTg2KS5cbiAqIGh0dHA6Ly9jaXRlc2VlcnguaXN0LnBzdS5lZHUvdmlld2RvYy9zdW1tYXJ5P2RvaT0xMC4xLjEuNC42OTI3XG4gKi9cbmltcG9ydCBEaWZmIGZyb20gJy4vZGlmZi9iYXNlJztcbmltcG9ydCB7ZGlmZkNoYXJzfSBmcm9tICcuL2RpZmYvY2hhcmFjdGVyJztcbmltcG9ydCB7ZGlmZldvcmRzLCBkaWZmV29yZHNXaXRoU3BhY2V9IGZyb20gJy4vZGlmZi93b3JkJztcbmltcG9ydCB7ZGlmZkxpbmVzLCBkaWZmVHJpbW1lZExpbmVzfSBmcm9tICcuL2RpZmYvbGluZSc7XG5pbXBvcnQge2RpZmZTZW50ZW5jZXN9IGZyb20gJy4vZGlmZi9zZW50ZW5jZSc7XG5cbmltcG9ydCB7ZGlmZkNzc30gZnJvbSAnLi9kaWZmL2Nzcyc7XG5pbXBvcnQge2RpZmZKc29uLCBjYW5vbmljYWxpemV9IGZyb20gJy4vZGlmZi9qc29uJztcblxuaW1wb3J0IHtkaWZmQXJyYXlzfSBmcm9tICcuL2RpZmYvYXJyYXknO1xuXG5pbXBvcnQge2FwcGx5UGF0Y2gsIGFwcGx5UGF0Y2hlc30gZnJvbSAnLi9wYXRjaC9hcHBseSc7XG5pbXBvcnQge3BhcnNlUGF0Y2h9IGZyb20gJy4vcGF0Y2gvcGFyc2UnO1xuaW1wb3J0IHtzdHJ1Y3R1cmVkUGF0Y2gsIGNyZWF0ZVR3b0ZpbGVzUGF0Y2gsIGNyZWF0ZVBhdGNofSBmcm9tICcuL3BhdGNoL2NyZWF0ZSc7XG5cbmltcG9ydCB7Y29udmVydENoYW5nZXNUb0RNUH0gZnJvbSAnLi9jb252ZXJ0L2RtcCc7XG5pbXBvcnQge2NvbnZlcnRDaGFuZ2VzVG9YTUx9IGZyb20gJy4vY29udmVydC94bWwnO1xuXG5leHBvcnQge1xuICBEaWZmLFxuXG4gIGRpZmZDaGFycyxcbiAgZGlmZldvcmRzLFxuICBkaWZmV29yZHNXaXRoU3BhY2UsXG4gIGRpZmZMaW5lcyxcbiAgZGlmZlRyaW1tZWRMaW5lcyxcbiAgZGlmZlNlbnRlbmNlcyxcblxuICBkaWZmQ3NzLFxuICBkaWZmSnNvbixcblxuICBkaWZmQXJyYXlzLFxuXG4gIHN0cnVjdHVyZWRQYXRjaCxcbiAgY3JlYXRlVHdvRmlsZXNQYXRjaCxcbiAgY3JlYXRlUGF0Y2gsXG4gIGFwcGx5UGF0Y2gsXG4gIGFwcGx5UGF0Y2hlcyxcbiAgcGFyc2VQYXRjaCxcbiAgY29udmVydENoYW5nZXNUb0RNUCxcbiAgY29udmVydENoYW5nZXNUb1hNTCxcbiAgY2Fub25pY2FsaXplXG59O1xuIiwiaW1wb3J0IHtwYXJzZVBhdGNofSBmcm9tICcuL3BhcnNlJztcbmltcG9ydCBkaXN0YW5jZUl0ZXJhdG9yIGZyb20gJy4uL3V0aWwvZGlzdGFuY2UtaXRlcmF0b3InO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlQYXRjaChzb3VyY2UsIHVuaURpZmYsIG9wdGlvbnMgPSB7fSkge1xuICBpZiAodHlwZW9mIHVuaURpZmYgPT09ICdzdHJpbmcnKSB7XG4gICAgdW5pRGlmZiA9IHBhcnNlUGF0Y2godW5pRGlmZik7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheSh1bmlEaWZmKSkge1xuICAgIGlmICh1bmlEaWZmLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYXBwbHlQYXRjaCBvbmx5IHdvcmtzIHdpdGggYSBzaW5nbGUgaW5wdXQuJyk7XG4gICAgfVxuXG4gICAgdW5pRGlmZiA9IHVuaURpZmZbMF07XG4gIH1cblxuICAvLyBBcHBseSB0aGUgZGlmZiB0byB0aGUgaW5wdXRcbiAgbGV0IGxpbmVzID0gc291cmNlLnNwbGl0KC9cXHJcXG58W1xcblxcdlxcZlxcclxceDg1XS8pLFxuICAgICAgZGVsaW1pdGVycyA9IHNvdXJjZS5tYXRjaCgvXFxyXFxufFtcXG5cXHZcXGZcXHJcXHg4NV0vZykgfHwgW10sXG4gICAgICBodW5rcyA9IHVuaURpZmYuaHVua3MsXG5cbiAgICAgIGNvbXBhcmVMaW5lID0gb3B0aW9ucy5jb21wYXJlTGluZSB8fCAoKGxpbmVOdW1iZXIsIGxpbmUsIG9wZXJhdGlvbiwgcGF0Y2hDb250ZW50KSA9PiBsaW5lID09PSBwYXRjaENvbnRlbnQpLFxuICAgICAgZXJyb3JDb3VudCA9IDAsXG4gICAgICBmdXp6RmFjdG9yID0gb3B0aW9ucy5mdXp6RmFjdG9yIHx8IDAsXG4gICAgICBtaW5MaW5lID0gMCxcbiAgICAgIG9mZnNldCA9IDAsXG5cbiAgICAgIHJlbW92ZUVPRk5MLFxuICAgICAgYWRkRU9GTkw7XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGUgaHVuayBleGFjdGx5IGZpdHMgb24gdGhlIHByb3ZpZGVkIGxvY2F0aW9uXG4gICAqL1xuICBmdW5jdGlvbiBodW5rRml0cyhodW5rLCB0b1Bvcykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgaHVuay5saW5lcy5sZW5ndGg7IGorKykge1xuICAgICAgbGV0IGxpbmUgPSBodW5rLmxpbmVzW2pdLFxuICAgICAgICAgIG9wZXJhdGlvbiA9IGxpbmVbMF0sXG4gICAgICAgICAgY29udGVudCA9IGxpbmUuc3Vic3RyKDEpO1xuXG4gICAgICBpZiAob3BlcmF0aW9uID09PSAnICcgfHwgb3BlcmF0aW9uID09PSAnLScpIHtcbiAgICAgICAgLy8gQ29udGV4dCBzYW5pdHkgY2hlY2tcbiAgICAgICAgaWYgKCFjb21wYXJlTGluZSh0b1BvcyArIDEsIGxpbmVzW3RvUG9zXSwgb3BlcmF0aW9uLCBjb250ZW50KSkge1xuICAgICAgICAgIGVycm9yQ291bnQrKztcblxuICAgICAgICAgIGlmIChlcnJvckNvdW50ID4gZnV6ekZhY3Rvcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0b1BvcysrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gU2VhcmNoIGJlc3QgZml0IG9mZnNldHMgZm9yIGVhY2ggaHVuayBiYXNlZCBvbiB0aGUgcHJldmlvdXMgb25lc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGh1bmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGh1bmsgPSBodW5rc1tpXSxcbiAgICAgICAgbWF4TGluZSA9IGxpbmVzLmxlbmd0aCAtIGh1bmsub2xkTGluZXMsXG4gICAgICAgIGxvY2FsT2Zmc2V0ID0gMCxcbiAgICAgICAgdG9Qb3MgPSBvZmZzZXQgKyBodW5rLm9sZFN0YXJ0IC0gMTtcblxuICAgIGxldCBpdGVyYXRvciA9IGRpc3RhbmNlSXRlcmF0b3IodG9Qb3MsIG1pbkxpbmUsIG1heExpbmUpO1xuXG4gICAgZm9yICg7IGxvY2FsT2Zmc2V0ICE9PSB1bmRlZmluZWQ7IGxvY2FsT2Zmc2V0ID0gaXRlcmF0b3IoKSkge1xuICAgICAgaWYgKGh1bmtGaXRzKGh1bmssIHRvUG9zICsgbG9jYWxPZmZzZXQpKSB7XG4gICAgICAgIGh1bmsub2Zmc2V0ID0gb2Zmc2V0ICs9IGxvY2FsT2Zmc2V0O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobG9jYWxPZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFNldCBsb3dlciB0ZXh0IGxpbWl0IHRvIGVuZCBvZiB0aGUgY3VycmVudCBodW5rLCBzbyBuZXh0IG9uZXMgZG9uJ3QgdHJ5XG4gICAgLy8gdG8gZml0IG92ZXIgYWxyZWFkeSBwYXRjaGVkIHRleHRcbiAgICBtaW5MaW5lID0gaHVuay5vZmZzZXQgKyBodW5rLm9sZFN0YXJ0ICsgaHVuay5vbGRMaW5lcztcbiAgfVxuXG4gIC8vIEFwcGx5IHBhdGNoIGh1bmtzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaHVua3MubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgaHVuayA9IGh1bmtzW2ldLFxuICAgICAgICB0b1BvcyA9IGh1bmsub2Zmc2V0ICsgaHVuay5uZXdTdGFydCAtIDE7XG4gICAgaWYgKGh1bmsubmV3TGluZXMgPT0gMCkgeyB0b1BvcysrOyB9XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGh1bmsubGluZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGxldCBsaW5lID0gaHVuay5saW5lc1tqXSxcbiAgICAgICAgICBvcGVyYXRpb24gPSBsaW5lWzBdLFxuICAgICAgICAgIGNvbnRlbnQgPSBsaW5lLnN1YnN0cigxKSxcbiAgICAgICAgICBkZWxpbWl0ZXIgPSBodW5rLmxpbmVkZWxpbWl0ZXJzW2pdO1xuXG4gICAgICBpZiAob3BlcmF0aW9uID09PSAnICcpIHtcbiAgICAgICAgdG9Qb3MrKztcbiAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSAnLScpIHtcbiAgICAgICAgbGluZXMuc3BsaWNlKHRvUG9zLCAxKTtcbiAgICAgICAgZGVsaW1pdGVycy5zcGxpY2UodG9Qb3MsIDEpO1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSAnKycpIHtcbiAgICAgICAgbGluZXMuc3BsaWNlKHRvUG9zLCAwLCBjb250ZW50KTtcbiAgICAgICAgZGVsaW1pdGVycy5zcGxpY2UodG9Qb3MsIDAsIGRlbGltaXRlcik7XG4gICAgICAgIHRvUG9zKys7XG4gICAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbiA9PT0gJ1xcXFwnKSB7XG4gICAgICAgIGxldCBwcmV2aW91c09wZXJhdGlvbiA9IGh1bmsubGluZXNbaiAtIDFdID8gaHVuay5saW5lc1tqIC0gMV1bMF0gOiBudWxsO1xuICAgICAgICBpZiAocHJldmlvdXNPcGVyYXRpb24gPT09ICcrJykge1xuICAgICAgICAgIHJlbW92ZUVPRk5MID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChwcmV2aW91c09wZXJhdGlvbiA9PT0gJy0nKSB7XG4gICAgICAgICAgYWRkRU9GTkwgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSGFuZGxlIEVPRk5MIGluc2VydGlvbi9yZW1vdmFsXG4gIGlmIChyZW1vdmVFT0ZOTCkge1xuICAgIHdoaWxlICghbGluZXNbbGluZXMubGVuZ3RoIC0gMV0pIHtcbiAgICAgIGxpbmVzLnBvcCgpO1xuICAgICAgZGVsaW1pdGVycy5wb3AoKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoYWRkRU9GTkwpIHtcbiAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICBkZWxpbWl0ZXJzLnB1c2goJ1xcbicpO1xuICB9XG4gIGZvciAobGV0IF9rID0gMDsgX2sgPCBsaW5lcy5sZW5ndGggLSAxOyBfaysrKSB7XG4gICAgbGluZXNbX2tdID0gbGluZXNbX2tdICsgZGVsaW1pdGVyc1tfa107XG4gIH1cbiAgcmV0dXJuIGxpbmVzLmpvaW4oJycpO1xufVxuXG4vLyBXcmFwcGVyIHRoYXQgc3VwcG9ydHMgbXVsdGlwbGUgZmlsZSBwYXRjaGVzIHZpYSBjYWxsYmFja3MuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlQYXRjaGVzKHVuaURpZmYsIG9wdGlvbnMpIHtcbiAgaWYgKHR5cGVvZiB1bmlEaWZmID09PSAnc3RyaW5nJykge1xuICAgIHVuaURpZmYgPSBwYXJzZVBhdGNoKHVuaURpZmYpO1xuICB9XG5cbiAgbGV0IGN1cnJlbnRJbmRleCA9IDA7XG4gIGZ1bmN0aW9uIHByb2Nlc3NJbmRleCgpIHtcbiAgICBsZXQgaW5kZXggPSB1bmlEaWZmW2N1cnJlbnRJbmRleCsrXTtcbiAgICBpZiAoIWluZGV4KSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5jb21wbGV0ZSgpO1xuICAgIH1cblxuICAgIG9wdGlvbnMubG9hZEZpbGUoaW5kZXgsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5jb21wbGV0ZShlcnIpO1xuICAgICAgfVxuXG4gICAgICBsZXQgdXBkYXRlZENvbnRlbnQgPSBhcHBseVBhdGNoKGRhdGEsIGluZGV4LCBvcHRpb25zKTtcbiAgICAgIG9wdGlvbnMucGF0Y2hlZChpbmRleCwgdXBkYXRlZENvbnRlbnQsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIG9wdGlvbnMuY29tcGxldGUoZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb2Nlc3NJbmRleCgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcHJvY2Vzc0luZGV4KCk7XG59XG4iLCJpbXBvcnQge2RpZmZMaW5lc30gZnJvbSAnLi4vZGlmZi9saW5lJztcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cnVjdHVyZWRQYXRjaChvbGRGaWxlTmFtZSwgbmV3RmlsZU5hbWUsIG9sZFN0ciwgbmV3U3RyLCBvbGRIZWFkZXIsIG5ld0hlYWRlciwgb3B0aW9ucykge1xuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgaWYgKHR5cGVvZiBvcHRpb25zLmNvbnRleHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgb3B0aW9ucy5jb250ZXh0ID0gNDtcbiAgfVxuXG4gIGNvbnN0IGRpZmYgPSBkaWZmTGluZXMob2xkU3RyLCBuZXdTdHIsIG9wdGlvbnMpO1xuICBkaWZmLnB1c2goe3ZhbHVlOiAnJywgbGluZXM6IFtdfSk7ICAgLy8gQXBwZW5kIGFuIGVtcHR5IHZhbHVlIHRvIG1ha2UgY2xlYW51cCBlYXNpZXJcblxuICBmdW5jdGlvbiBjb250ZXh0TGluZXMobGluZXMpIHtcbiAgICByZXR1cm4gbGluZXMubWFwKGZ1bmN0aW9uKGVudHJ5KSB7IHJldHVybiAnICcgKyBlbnRyeTsgfSk7XG4gIH1cblxuICBsZXQgaHVua3MgPSBbXTtcbiAgbGV0IG9sZFJhbmdlU3RhcnQgPSAwLCBuZXdSYW5nZVN0YXJ0ID0gMCwgY3VyUmFuZ2UgPSBbXSxcbiAgICAgIG9sZExpbmUgPSAxLCBuZXdMaW5lID0gMTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaWZmLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY3VycmVudCA9IGRpZmZbaV0sXG4gICAgICAgICAgbGluZXMgPSBjdXJyZW50LmxpbmVzIHx8IGN1cnJlbnQudmFsdWUucmVwbGFjZSgvXFxuJC8sICcnKS5zcGxpdCgnXFxuJyk7XG4gICAgY3VycmVudC5saW5lcyA9IGxpbmVzO1xuXG4gICAgaWYgKGN1cnJlbnQuYWRkZWQgfHwgY3VycmVudC5yZW1vdmVkKSB7XG4gICAgICAvLyBJZiB3ZSBoYXZlIHByZXZpb3VzIGNvbnRleHQsIHN0YXJ0IHdpdGggdGhhdFxuICAgICAgaWYgKCFvbGRSYW5nZVN0YXJ0KSB7XG4gICAgICAgIGNvbnN0IHByZXYgPSBkaWZmW2kgLSAxXTtcbiAgICAgICAgb2xkUmFuZ2VTdGFydCA9IG9sZExpbmU7XG4gICAgICAgIG5ld1JhbmdlU3RhcnQgPSBuZXdMaW5lO1xuXG4gICAgICAgIGlmIChwcmV2KSB7XG4gICAgICAgICAgY3VyUmFuZ2UgPSBvcHRpb25zLmNvbnRleHQgPiAwID8gY29udGV4dExpbmVzKHByZXYubGluZXMuc2xpY2UoLW9wdGlvbnMuY29udGV4dCkpIDogW107XG4gICAgICAgICAgb2xkUmFuZ2VTdGFydCAtPSBjdXJSYW5nZS5sZW5ndGg7XG4gICAgICAgICAgbmV3UmFuZ2VTdGFydCAtPSBjdXJSYW5nZS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gT3V0cHV0IG91ciBjaGFuZ2VzXG4gICAgICBjdXJSYW5nZS5wdXNoKC4uLiBsaW5lcy5tYXAoZnVuY3Rpb24oZW50cnkpIHtcbiAgICAgICAgcmV0dXJuIChjdXJyZW50LmFkZGVkID8gJysnIDogJy0nKSArIGVudHJ5O1xuICAgICAgfSkpO1xuXG4gICAgICAvLyBUcmFjayB0aGUgdXBkYXRlZCBmaWxlIHBvc2l0aW9uXG4gICAgICBpZiAoY3VycmVudC5hZGRlZCkge1xuICAgICAgICBuZXdMaW5lICs9IGxpbmVzLmxlbmd0aDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9sZExpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZGVudGljYWwgY29udGV4dCBsaW5lcy4gVHJhY2sgbGluZSBjaGFuZ2VzXG4gICAgICBpZiAob2xkUmFuZ2VTdGFydCkge1xuICAgICAgICAvLyBDbG9zZSBvdXQgYW55IGNoYW5nZXMgdGhhdCBoYXZlIGJlZW4gb3V0cHV0IChvciBqb2luIG92ZXJsYXBwaW5nKVxuICAgICAgICBpZiAobGluZXMubGVuZ3RoIDw9IG9wdGlvbnMuY29udGV4dCAqIDIgJiYgaSA8IGRpZmYubGVuZ3RoIC0gMikge1xuICAgICAgICAgIC8vIE92ZXJsYXBwaW5nXG4gICAgICAgICAgY3VyUmFuZ2UucHVzaCguLi4gY29udGV4dExpbmVzKGxpbmVzKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZW5kIHRoZSByYW5nZSBhbmQgb3V0cHV0XG4gICAgICAgICAgbGV0IGNvbnRleHRTaXplID0gTWF0aC5taW4obGluZXMubGVuZ3RoLCBvcHRpb25zLmNvbnRleHQpO1xuICAgICAgICAgIGN1clJhbmdlLnB1c2goLi4uIGNvbnRleHRMaW5lcyhsaW5lcy5zbGljZSgwLCBjb250ZXh0U2l6ZSkpKTtcblxuICAgICAgICAgIGxldCBodW5rID0ge1xuICAgICAgICAgICAgb2xkU3RhcnQ6IG9sZFJhbmdlU3RhcnQsXG4gICAgICAgICAgICBvbGRMaW5lczogKG9sZExpbmUgLSBvbGRSYW5nZVN0YXJ0ICsgY29udGV4dFNpemUpLFxuICAgICAgICAgICAgbmV3U3RhcnQ6IG5ld1JhbmdlU3RhcnQsXG4gICAgICAgICAgICBuZXdMaW5lczogKG5ld0xpbmUgLSBuZXdSYW5nZVN0YXJ0ICsgY29udGV4dFNpemUpLFxuICAgICAgICAgICAgbGluZXM6IGN1clJhbmdlXG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZiAoaSA+PSBkaWZmLmxlbmd0aCAtIDIgJiYgbGluZXMubGVuZ3RoIDw9IG9wdGlvbnMuY29udGV4dCkge1xuICAgICAgICAgICAgLy8gRU9GIGlzIGluc2lkZSB0aGlzIGh1bmtcbiAgICAgICAgICAgIGxldCBvbGRFT0ZOZXdsaW5lID0gKC9cXG4kLy50ZXN0KG9sZFN0cikpO1xuICAgICAgICAgICAgbGV0IG5ld0VPRk5ld2xpbmUgPSAoL1xcbiQvLnRlc3QobmV3U3RyKSk7XG4gICAgICAgICAgICBpZiAobGluZXMubGVuZ3RoID09IDAgJiYgIW9sZEVPRk5ld2xpbmUpIHtcbiAgICAgICAgICAgICAgLy8gc3BlY2lhbCBjYXNlOiBvbGQgaGFzIG5vIGVvbCBhbmQgbm8gdHJhaWxpbmcgY29udGV4dDsgbm8tbmwgY2FuIGVuZCB1cCBiZWZvcmUgYWRkc1xuICAgICAgICAgICAgICBjdXJSYW5nZS5zcGxpY2UoaHVuay5vbGRMaW5lcywgMCwgJ1xcXFwgTm8gbmV3bGluZSBhdCBlbmQgb2YgZmlsZScpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghb2xkRU9GTmV3bGluZSB8fCAhbmV3RU9GTmV3bGluZSkge1xuICAgICAgICAgICAgICBjdXJSYW5nZS5wdXNoKCdcXFxcIE5vIG5ld2xpbmUgYXQgZW5kIG9mIGZpbGUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaHVua3MucHVzaChodW5rKTtcblxuICAgICAgICAgIG9sZFJhbmdlU3RhcnQgPSAwO1xuICAgICAgICAgIG5ld1JhbmdlU3RhcnQgPSAwO1xuICAgICAgICAgIGN1clJhbmdlID0gW107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG9sZExpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgbmV3TGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvbGRGaWxlTmFtZTogb2xkRmlsZU5hbWUsIG5ld0ZpbGVOYW1lOiBuZXdGaWxlTmFtZSxcbiAgICBvbGRIZWFkZXI6IG9sZEhlYWRlciwgbmV3SGVhZGVyOiBuZXdIZWFkZXIsXG4gICAgaHVua3M6IGh1bmtzXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUd29GaWxlc1BhdGNoKG9sZEZpbGVOYW1lLCBuZXdGaWxlTmFtZSwgb2xkU3RyLCBuZXdTdHIsIG9sZEhlYWRlciwgbmV3SGVhZGVyLCBvcHRpb25zKSB7XG4gIGNvbnN0IGRpZmYgPSBzdHJ1Y3R1cmVkUGF0Y2gob2xkRmlsZU5hbWUsIG5ld0ZpbGVOYW1lLCBvbGRTdHIsIG5ld1N0ciwgb2xkSGVhZGVyLCBuZXdIZWFkZXIsIG9wdGlvbnMpO1xuXG4gIGNvbnN0IHJldCA9IFtdO1xuICBpZiAob2xkRmlsZU5hbWUgPT0gbmV3RmlsZU5hbWUpIHtcbiAgICByZXQucHVzaCgnSW5kZXg6ICcgKyBvbGRGaWxlTmFtZSk7XG4gIH1cbiAgcmV0LnB1c2goJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgcmV0LnB1c2goJy0tLSAnICsgZGlmZi5vbGRGaWxlTmFtZSArICh0eXBlb2YgZGlmZi5vbGRIZWFkZXIgPT09ICd1bmRlZmluZWQnID8gJycgOiAnXFx0JyArIGRpZmYub2xkSGVhZGVyKSk7XG4gIHJldC5wdXNoKCcrKysgJyArIGRpZmYubmV3RmlsZU5hbWUgKyAodHlwZW9mIGRpZmYubmV3SGVhZGVyID09PSAndW5kZWZpbmVkJyA/ICcnIDogJ1xcdCcgKyBkaWZmLm5ld0hlYWRlcikpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGlmZi5odW5rcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGh1bmsgPSBkaWZmLmh1bmtzW2ldO1xuICAgIHJldC5wdXNoKFxuICAgICAgJ0BAIC0nICsgaHVuay5vbGRTdGFydCArICcsJyArIGh1bmsub2xkTGluZXNcbiAgICAgICsgJyArJyArIGh1bmsubmV3U3RhcnQgKyAnLCcgKyBodW5rLm5ld0xpbmVzXG4gICAgICArICcgQEAnXG4gICAgKTtcbiAgICByZXQucHVzaC5hcHBseShyZXQsIGh1bmsubGluZXMpO1xuICB9XG5cbiAgcmV0dXJuIHJldC5qb2luKCdcXG4nKSArICdcXG4nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGF0Y2goZmlsZU5hbWUsIG9sZFN0ciwgbmV3U3RyLCBvbGRIZWFkZXIsIG5ld0hlYWRlciwgb3B0aW9ucykge1xuICByZXR1cm4gY3JlYXRlVHdvRmlsZXNQYXRjaChmaWxlTmFtZSwgZmlsZU5hbWUsIG9sZFN0ciwgbmV3U3RyLCBvbGRIZWFkZXIsIG5ld0hlYWRlciwgb3B0aW9ucyk7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gcGFyc2VQYXRjaCh1bmlEaWZmLCBvcHRpb25zID0ge30pIHtcbiAgbGV0IGRpZmZzdHIgPSB1bmlEaWZmLnNwbGl0KC9cXHJcXG58W1xcblxcdlxcZlxcclxceDg1XS8pLFxuICAgICAgZGVsaW1pdGVycyA9IHVuaURpZmYubWF0Y2goL1xcclxcbnxbXFxuXFx2XFxmXFxyXFx4ODVdL2cpIHx8IFtdLFxuICAgICAgbGlzdCA9IFtdLFxuICAgICAgaSA9IDA7XG5cbiAgZnVuY3Rpb24gcGFyc2VJbmRleCgpIHtcbiAgICBsZXQgaW5kZXggPSB7fTtcbiAgICBsaXN0LnB1c2goaW5kZXgpO1xuXG4gICAgLy8gUGFyc2UgZGlmZiBtZXRhZGF0YVxuICAgIHdoaWxlIChpIDwgZGlmZnN0ci5sZW5ndGgpIHtcbiAgICAgIGxldCBsaW5lID0gZGlmZnN0cltpXTtcblxuICAgICAgLy8gRmlsZSBoZWFkZXIgZm91bmQsIGVuZCBwYXJzaW5nIGRpZmYgbWV0YWRhdGFcbiAgICAgIGlmICgvXihcXC1cXC1cXC18XFwrXFwrXFwrfEBAKVxccy8udGVzdChsaW5lKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gRGlmZiBpbmRleFxuICAgICAgbGV0IGhlYWRlciA9ICgvXig/OkluZGV4OnxkaWZmKD86IC1yIFxcdyspKylcXHMrKC4rPylcXHMqJC8pLmV4ZWMobGluZSk7XG4gICAgICBpZiAoaGVhZGVyKSB7XG4gICAgICAgIGluZGV4LmluZGV4ID0gaGVhZGVyWzFdO1xuICAgICAgfVxuXG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgLy8gUGFyc2UgZmlsZSBoZWFkZXJzIGlmIHRoZXkgYXJlIGRlZmluZWQuIFVuaWZpZWQgZGlmZiByZXF1aXJlcyB0aGVtLCBidXRcbiAgICAvLyB0aGVyZSdzIG5vIHRlY2huaWNhbCBpc3N1ZXMgdG8gaGF2ZSBhbiBpc29sYXRlZCBodW5rIHdpdGhvdXQgZmlsZSBoZWFkZXJcbiAgICBwYXJzZUZpbGVIZWFkZXIoaW5kZXgpO1xuICAgIHBhcnNlRmlsZUhlYWRlcihpbmRleCk7XG5cbiAgICAvLyBQYXJzZSBodW5rc1xuICAgIGluZGV4Lmh1bmtzID0gW107XG5cbiAgICB3aGlsZSAoaSA8IGRpZmZzdHIubGVuZ3RoKSB7XG4gICAgICBsZXQgbGluZSA9IGRpZmZzdHJbaV07XG5cbiAgICAgIGlmICgvXihJbmRleDp8ZGlmZnxcXC1cXC1cXC18XFwrXFwrXFwrKVxccy8udGVzdChsaW5lKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH0gZWxzZSBpZiAoL15AQC8udGVzdChsaW5lKSkge1xuICAgICAgICBpbmRleC5odW5rcy5wdXNoKHBhcnNlSHVuaygpKTtcbiAgICAgIH0gZWxzZSBpZiAobGluZSAmJiBvcHRpb25zLnN0cmljdCkge1xuICAgICAgICAvLyBJZ25vcmUgdW5leHBlY3RlZCBjb250ZW50IHVubGVzcyBpbiBzdHJpY3QgbW9kZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGluZSAnICsgKGkgKyAxKSArICcgJyArIEpTT04uc3RyaW5naWZ5KGxpbmUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBQYXJzZXMgdGhlIC0tLSBhbmQgKysrIGhlYWRlcnMsIGlmIG5vbmUgYXJlIGZvdW5kLCBubyBsaW5lc1xuICAvLyBhcmUgY29uc3VtZWQuXG4gIGZ1bmN0aW9uIHBhcnNlRmlsZUhlYWRlcihpbmRleCkge1xuICAgIGNvbnN0IGhlYWRlclBhdHRlcm4gPSAvXigtLS18XFwrXFwrXFwrKVxccysoW1xcUyBdKikoPzpcXHQoLio/KVxccyopPyQvO1xuICAgIGNvbnN0IGZpbGVIZWFkZXIgPSBoZWFkZXJQYXR0ZXJuLmV4ZWMoZGlmZnN0cltpXSk7XG4gICAgaWYgKGZpbGVIZWFkZXIpIHtcbiAgICAgIGxldCBrZXlQcmVmaXggPSBmaWxlSGVhZGVyWzFdID09PSAnLS0tJyA/ICdvbGQnIDogJ25ldyc7XG4gICAgICBpbmRleFtrZXlQcmVmaXggKyAnRmlsZU5hbWUnXSA9IGZpbGVIZWFkZXJbMl07XG4gICAgICBpbmRleFtrZXlQcmVmaXggKyAnSGVhZGVyJ10gPSBmaWxlSGVhZGVyWzNdO1xuXG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgLy8gUGFyc2VzIGEgaHVua1xuICAvLyBUaGlzIGFzc3VtZXMgdGhhdCB3ZSBhcmUgYXQgdGhlIHN0YXJ0IG9mIGEgaHVuay5cbiAgZnVuY3Rpb24gcGFyc2VIdW5rKCkge1xuICAgIGxldCBjaHVua0hlYWRlckluZGV4ID0gaSxcbiAgICAgICAgY2h1bmtIZWFkZXJMaW5lID0gZGlmZnN0cltpKytdLFxuICAgICAgICBjaHVua0hlYWRlciA9IGNodW5rSGVhZGVyTGluZS5zcGxpdCgvQEAgLShcXGQrKSg/OiwoXFxkKykpPyBcXCsoXFxkKykoPzosKFxcZCspKT8gQEAvKTtcblxuICAgIGxldCBodW5rID0ge1xuICAgICAgb2xkU3RhcnQ6ICtjaHVua0hlYWRlclsxXSxcbiAgICAgIG9sZExpbmVzOiArY2h1bmtIZWFkZXJbMl0gfHwgMSxcbiAgICAgIG5ld1N0YXJ0OiArY2h1bmtIZWFkZXJbM10sXG4gICAgICBuZXdMaW5lczogK2NodW5rSGVhZGVyWzRdIHx8IDEsXG4gICAgICBsaW5lczogW10sXG4gICAgICBsaW5lZGVsaW1pdGVyczogW11cbiAgICB9O1xuXG4gICAgbGV0IGFkZENvdW50ID0gMCxcbiAgICAgICAgcmVtb3ZlQ291bnQgPSAwO1xuICAgIGZvciAoOyBpIDwgZGlmZnN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gTGluZXMgc3RhcnRpbmcgd2l0aCAnLS0tJyBjb3VsZCBiZSBtaXN0YWtlbiBmb3IgdGhlIFwicmVtb3ZlIGxpbmVcIiBvcGVyYXRpb25cbiAgICAgIC8vIEJ1dCB0aGV5IGNvdWxkIGJlIHRoZSBoZWFkZXIgZm9yIHRoZSBuZXh0IGZpbGUuIFRoZXJlZm9yZSBwcnVuZSBzdWNoIGNhc2VzIG91dC5cbiAgICAgIGlmIChkaWZmc3RyW2ldLmluZGV4T2YoJy0tLSAnKSA9PT0gMFxuICAgICAgICAgICAgJiYgKGkgKyAyIDwgZGlmZnN0ci5sZW5ndGgpXG4gICAgICAgICAgICAmJiBkaWZmc3RyW2kgKyAxXS5pbmRleE9mKCcrKysgJykgPT09IDBcbiAgICAgICAgICAgICYmIGRpZmZzdHJbaSArIDJdLmluZGV4T2YoJ0BAJykgPT09IDApIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGxldCBvcGVyYXRpb24gPSBkaWZmc3RyW2ldWzBdO1xuXG4gICAgICBpZiAob3BlcmF0aW9uID09PSAnKycgfHwgb3BlcmF0aW9uID09PSAnLScgfHwgb3BlcmF0aW9uID09PSAnICcgfHwgb3BlcmF0aW9uID09PSAnXFxcXCcpIHtcbiAgICAgICAgaHVuay5saW5lcy5wdXNoKGRpZmZzdHJbaV0pO1xuICAgICAgICBodW5rLmxpbmVkZWxpbWl0ZXJzLnB1c2goZGVsaW1pdGVyc1tpXSB8fCAnXFxuJyk7XG5cbiAgICAgICAgaWYgKG9wZXJhdGlvbiA9PT0gJysnKSB7XG4gICAgICAgICAgYWRkQ291bnQrKztcbiAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09ICctJykge1xuICAgICAgICAgIHJlbW92ZUNvdW50Kys7XG4gICAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSAnICcpIHtcbiAgICAgICAgICBhZGRDb3VudCsrO1xuICAgICAgICAgIHJlbW92ZUNvdW50Kys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEhhbmRsZSB0aGUgZW1wdHkgYmxvY2sgY291bnQgY2FzZVxuICAgIGlmICghYWRkQ291bnQgJiYgaHVuay5uZXdMaW5lcyA9PT0gMSkge1xuICAgICAgaHVuay5uZXdMaW5lcyA9IDA7XG4gICAgfVxuICAgIGlmICghcmVtb3ZlQ291bnQgJiYgaHVuay5vbGRMaW5lcyA9PT0gMSkge1xuICAgICAgaHVuay5vbGRMaW5lcyA9IDA7XG4gICAgfVxuXG4gICAgLy8gUGVyZm9ybSBvcHRpb25hbCBzYW5pdHkgY2hlY2tpbmdcbiAgICBpZiAob3B0aW9ucy5zdHJpY3QpIHtcbiAgICAgIGlmIChhZGRDb3VudCAhPT0gaHVuay5uZXdMaW5lcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FkZGVkIGxpbmUgY291bnQgZGlkIG5vdCBtYXRjaCBmb3IgaHVuayBhdCBsaW5lICcgKyAoY2h1bmtIZWFkZXJJbmRleCArIDEpKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZW1vdmVDb3VudCAhPT0gaHVuay5vbGRMaW5lcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbW92ZWQgbGluZSBjb3VudCBkaWQgbm90IG1hdGNoIGZvciBodW5rIGF0IGxpbmUgJyArIChjaHVua0hlYWRlckluZGV4ICsgMSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBodW5rO1xuICB9XG5cbiAgd2hpbGUgKGkgPCBkaWZmc3RyLmxlbmd0aCkge1xuICAgIHBhcnNlSW5kZXgoKTtcbiAgfVxuXG4gIHJldHVybiBsaXN0O1xufVxuIiwiLy8gSXRlcmF0b3IgdGhhdCB0cmF2ZXJzZXMgaW4gdGhlIHJhbmdlIG9mIFttaW4sIG1heF0sIHN0ZXBwaW5nXG4vLyBieSBkaXN0YW5jZSBmcm9tIGEgZ2l2ZW4gc3RhcnQgcG9zaXRpb24uIEkuZS4gZm9yIFswLCA0XSwgd2l0aFxuLy8gc3RhcnQgb2YgMiwgdGhpcyB3aWxsIGl0ZXJhdGUgMiwgMywgMSwgNCwgMC5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHN0YXJ0LCBtaW5MaW5lLCBtYXhMaW5lKSB7XG4gIGxldCB3YW50Rm9yd2FyZCA9IHRydWUsXG4gICAgICBiYWNrd2FyZEV4aGF1c3RlZCA9IGZhbHNlLFxuICAgICAgZm9yd2FyZEV4aGF1c3RlZCA9IGZhbHNlLFxuICAgICAgbG9jYWxPZmZzZXQgPSAxO1xuXG4gIHJldHVybiBmdW5jdGlvbiBpdGVyYXRvcigpIHtcbiAgICBpZiAod2FudEZvcndhcmQgJiYgIWZvcndhcmRFeGhhdXN0ZWQpIHtcbiAgICAgIGlmIChiYWNrd2FyZEV4aGF1c3RlZCkge1xuICAgICAgICBsb2NhbE9mZnNldCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2FudEZvcndhcmQgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgaWYgdHJ5aW5nIHRvIGZpdCBiZXlvbmQgdGV4dCBsZW5ndGgsIGFuZCBpZiBub3QsIGNoZWNrIGl0IGZpdHNcbiAgICAgIC8vIGFmdGVyIG9mZnNldCBsb2NhdGlvbiAob3IgZGVzaXJlZCBsb2NhdGlvbiBvbiBmaXJzdCBpdGVyYXRpb24pXG4gICAgICBpZiAoc3RhcnQgKyBsb2NhbE9mZnNldCA8PSBtYXhMaW5lKSB7XG4gICAgICAgIHJldHVybiBsb2NhbE9mZnNldDtcbiAgICAgIH1cblxuICAgICAgZm9yd2FyZEV4aGF1c3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFiYWNrd2FyZEV4aGF1c3RlZCkge1xuICAgICAgaWYgKCFmb3J3YXJkRXhoYXVzdGVkKSB7XG4gICAgICAgIHdhbnRGb3J3YXJkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgaWYgdHJ5aW5nIHRvIGZpdCBiZWZvcmUgdGV4dCBiZWdpbm5pbmcsIGFuZCBpZiBub3QsIGNoZWNrIGl0IGZpdHNcbiAgICAgIC8vIGJlZm9yZSBvZmZzZXQgbG9jYXRpb25cbiAgICAgIGlmIChtaW5MaW5lIDw9IHN0YXJ0IC0gbG9jYWxPZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIC1sb2NhbE9mZnNldCsrO1xuICAgICAgfVxuXG4gICAgICBiYWNrd2FyZEV4aGF1c3RlZCA9IHRydWU7XG4gICAgICByZXR1cm4gaXRlcmF0b3IoKTtcbiAgICB9XG5cbiAgICAvLyBXZSB0cmllZCB0byBmaXQgaHVuayBiZWZvcmUgdGV4dCBiZWdpbm5pbmcgYW5kIGJleW9uZCB0ZXh0IGxlbmdodCwgdGhlblxuICAgIC8vIGh1bmsgY2FuJ3QgZml0IG9uIHRoZSB0ZXh0LiBSZXR1cm4gdW5kZWZpbmVkXG4gIH07XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVPcHRpb25zKG9wdGlvbnMsIGRlZmF1bHRzKSB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGRlZmF1bHRzLmNhbGxiYWNrID0gb3B0aW9ucztcbiAgfSBlbHNlIGlmIChvcHRpb25zKSB7XG4gICAgZm9yIChsZXQgbmFtZSBpbiBvcHRpb25zKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgZGVmYXVsdHNbbmFtZV0gPSBvcHRpb25zW25hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZGVmYXVsdHM7XG59XG4iLCJcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmb3JFYWNoIChvYmosIGZuLCBjdHgpIHtcbiAgICBpZiAodG9TdHJpbmcuY2FsbChmbikgIT09ICdbb2JqZWN0IEZ1bmN0aW9uXScpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaXRlcmF0b3IgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgfVxuICAgIHZhciBsID0gb2JqLmxlbmd0aDtcbiAgICBpZiAobCA9PT0gK2wpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGZuLmNhbGwoY3R4LCBvYmpbaV0sIGksIG9iaik7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBrIGluIG9iaikge1xuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKG9iaiwgaykpIHtcbiAgICAgICAgICAgICAgICBmbi5jYWxsKGN0eCwgb2JqW2tdLCBrLCBvYmopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxuIiwiXG52YXIgaW5kZXhPZiA9IFtdLmluZGV4T2Y7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYXJyLCBvYmope1xuICBpZiAoaW5kZXhPZikgcmV0dXJuIGFyci5pbmRleE9mKG9iaik7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKGFycltpXSA9PT0gb2JqKSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJyKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbnZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24gKGZuKSB7XG5cdHJldHVybiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nICYmICEoZm4gaW5zdGFuY2VvZiBSZWdFeHApKSB8fCB0b1N0cmluZy5jYWxsKGZuKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9yRWFjaChvYmosIGZuKSB7XG5cdGlmICghaXNGdW5jdGlvbihmbikpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdpdGVyYXRvciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblx0fVxuXHR2YXIgaSwgayxcblx0XHRpc1N0cmluZyA9IHR5cGVvZiBvYmogPT09ICdzdHJpbmcnLFxuXHRcdGwgPSBvYmoubGVuZ3RoLFxuXHRcdGNvbnRleHQgPSBhcmd1bWVudHMubGVuZ3RoID4gMiA/IGFyZ3VtZW50c1syXSA6IG51bGw7XG5cdGlmIChsID09PSArbCkge1xuXHRcdGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcblx0XHRcdGlmIChjb250ZXh0ID09PSBudWxsKSB7XG5cdFx0XHRcdGZuKGlzU3RyaW5nID8gb2JqLmNoYXJBdChpKSA6IG9ialtpXSwgaSwgb2JqKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZuLmNhbGwoY29udGV4dCwgaXNTdHJpbmcgPyBvYmouY2hhckF0KGkpIDogb2JqW2ldLCBpLCBvYmopO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRmb3IgKGsgaW4gb2JqKSB7XG5cdFx0XHRpZiAoaGFzT3duLmNhbGwob2JqLCBrKSkge1xuXHRcdFx0XHRpZiAoY29udGV4dCA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdGZuKG9ialtrXSwgaywgb2JqKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRmbi5jYWxsKGNvbnRleHQsIG9ialtrXSwgaywgb2JqKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxufTtcblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIG1vZGlmaWVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2VzLXNoaW1zL2VzNS1zaGltXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSxcblx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuXHRmb3JFYWNoID0gcmVxdWlyZSgnLi9mb3JlYWNoJyksXG5cdGlzQXJncyA9IHJlcXVpcmUoJy4vaXNBcmd1bWVudHMnKSxcblx0aGFzRG9udEVudW1CdWcgPSAhKHsndG9TdHJpbmcnOiBudWxsfSkucHJvcGVydHlJc0VudW1lcmFibGUoJ3RvU3RyaW5nJyksXG5cdGhhc1Byb3RvRW51bUJ1ZyA9IChmdW5jdGlvbiAoKSB7fSkucHJvcGVydHlJc0VudW1lcmFibGUoJ3Byb3RvdHlwZScpLFxuXHRkb250RW51bXMgPSBbXG5cdFx0XCJ0b1N0cmluZ1wiLFxuXHRcdFwidG9Mb2NhbGVTdHJpbmdcIixcblx0XHRcInZhbHVlT2ZcIixcblx0XHRcImhhc093blByb3BlcnR5XCIsXG5cdFx0XCJpc1Byb3RvdHlwZU9mXCIsXG5cdFx0XCJwcm9wZXJ0eUlzRW51bWVyYWJsZVwiLFxuXHRcdFwiY29uc3RydWN0b3JcIlxuXHRdO1xuXG52YXIga2V5c1NoaW0gPSBmdW5jdGlvbiBrZXlzKG9iamVjdCkge1xuXHR2YXIgaXNPYmplY3QgPSBvYmplY3QgIT09IG51bGwgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcsXG5cdFx0aXNGdW5jdGlvbiA9IHRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcblx0XHRpc0FyZ3VtZW50cyA9IGlzQXJncyhvYmplY3QpLFxuXHRcdHRoZUtleXMgPSBbXTtcblxuXHRpZiAoIWlzT2JqZWN0ICYmICFpc0Z1bmN0aW9uICYmICFpc0FyZ3VtZW50cykge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3Qua2V5cyBjYWxsZWQgb24gYSBub24tb2JqZWN0XCIpO1xuXHR9XG5cblx0aWYgKGlzQXJndW1lbnRzKSB7XG5cdFx0Zm9yRWFjaChvYmplY3QsIGZ1bmN0aW9uICh2YWx1ZSwgaW5kZXgpIHtcblx0XHRcdHRoZUtleXMucHVzaChpbmRleCk7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0dmFyIG5hbWUsXG5cdFx0XHRza2lwUHJvdG8gPSBoYXNQcm90b0VudW1CdWcgJiYgaXNGdW5jdGlvbjtcblxuXHRcdGZvciAobmFtZSBpbiBvYmplY3QpIHtcblx0XHRcdGlmICghKHNraXBQcm90byAmJiBuYW1lID09PSAncHJvdG90eXBlJykgJiYgaGFzLmNhbGwob2JqZWN0LCBuYW1lKSkge1xuXHRcdFx0XHR0aGVLZXlzLnB1c2gobmFtZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aWYgKGhhc0RvbnRFbnVtQnVnKSB7XG5cdFx0dmFyIGN0b3IgPSBvYmplY3QuY29uc3RydWN0b3IsXG5cdFx0XHRza2lwQ29uc3RydWN0b3IgPSBjdG9yICYmIGN0b3IucHJvdG90eXBlID09PSBvYmplY3Q7XG5cblx0XHRmb3JFYWNoKGRvbnRFbnVtcywgZnVuY3Rpb24gKGRvbnRFbnVtKSB7XG5cdFx0XHRpZiAoIShza2lwQ29uc3RydWN0b3IgJiYgZG9udEVudW0gPT09ICdjb25zdHJ1Y3RvcicpICYmIGhhcy5jYWxsKG9iamVjdCwgZG9udEVudW0pKSB7XG5cdFx0XHRcdHRoZUtleXMucHVzaChkb250RW51bSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblx0cmV0dXJuIHRoZUtleXM7XG59O1xuXG5rZXlzU2hpbS5zaGltID0gZnVuY3Rpb24gc2hpbU9iamVjdEtleXMoKSB7XG5cdGlmICghT2JqZWN0LmtleXMpIHtcblx0XHRPYmplY3Qua2V5cyA9IGtleXNTaGltO1xuXHR9XG5cdHJldHVybiBPYmplY3Qua2V5cyB8fCBrZXlzU2hpbTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5c1NoaW07XG5cbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQXJndW1lbnRzKHZhbHVlKSB7XG5cdHZhciBzdHIgPSB0b1N0cmluZy5jYWxsKHZhbHVlKTtcblx0dmFyIGlzQXJndW1lbnRzID0gc3RyID09PSAnW29iamVjdCBBcmd1bWVudHNdJztcblx0aWYgKCFpc0FyZ3VtZW50cykge1xuXHRcdGlzQXJndW1lbnRzID0gc3RyICE9PSAnW29iamVjdCBBcnJheV0nXG5cdFx0XHQmJiB2YWx1ZSAhPT0gbnVsbFxuXHRcdFx0JiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0J1xuXHRcdFx0JiYgdHlwZW9mIHZhbHVlLmxlbmd0aCA9PT0gJ251bWJlcidcblx0XHRcdCYmIHZhbHVlLmxlbmd0aCA+PSAwXG5cdFx0XHQmJiB0b1N0cmluZy5jYWxsKHZhbHVlLmNhbGxlZSkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cdH1cblx0cmV0dXJuIGlzQXJndW1lbnRzO1xufTtcblxuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIG1hcCA9IHJlcXVpcmUoJ2FycmF5LW1hcCcpO1xudmFyIGluZGV4T2YgPSByZXF1aXJlKCdpbmRleG9mJyk7XG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2lzYXJyYXknKTtcbnZhciBmb3JFYWNoID0gcmVxdWlyZSgnZm9yZWFjaCcpO1xudmFyIHJlZHVjZSA9IHJlcXVpcmUoJ2FycmF5LXJlZHVjZScpO1xudmFyIGdldE9iamVjdEtleXMgPSByZXF1aXJlKCdvYmplY3Qta2V5cycpO1xudmFyIEpTT04gPSByZXF1aXJlKCdqc29uMycpO1xuXG4vKipcbiAqIE1ha2Ugc3VyZSBgT2JqZWN0LmtleXNgIHdvcmsgZm9yIGB1bmRlZmluZWRgXG4gKiB2YWx1ZXMgdGhhdCBhcmUgc3RpbGwgdGhlcmUsIGxpa2UgYGRvY3VtZW50LmFsbGAuXG4gKiBodHRwOi8vbGlzdHMudzMub3JnL0FyY2hpdmVzL1B1YmxpYy9wdWJsaWMtaHRtbC8yMDA5SnVuLzA1NDYuaHRtbFxuICpcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIG9iamVjdEtleXModmFsKXtcbiAgaWYgKE9iamVjdC5rZXlzKSByZXR1cm4gT2JqZWN0LmtleXModmFsKTtcbiAgcmV0dXJuIGdldE9iamVjdEtleXModmFsKTtcbn1cblxuLyoqXG4gKiBNb2R1bGUgZXhwb3J0cy5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGluc3BlY3Q7XG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKiBAbGljZW5zZSBNSVQgKMKpIEpveWVudClcbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGhhc093bihvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBmb3JFYWNoKGFycmF5LCBmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duKHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGZvckVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gb2JqZWN0S2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbiAmJiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcykge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGluZGV4T2Yoa2V5cywgJ21lc3NhZ2UnKSA+PSAwIHx8IGluZGV4T2Yoa2V5cywgJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0gbWFwKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0geyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcikge1xuICAgIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IGRlc2M7XG4gIH1cbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093bih2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoaW5kZXhPZihjdHguc2VlbiwgZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gbWFwKHN0ci5zcGxpdCgnXFxuJyksIGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBtYXAoc3RyLnNwbGl0KCdcXG4nKSwgZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSByZWR1Y2Uob3V0cHV0LCBmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuZnVuY3Rpb24gX2V4dGVuZChvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gb2JqZWN0S2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59XG4iLCIvKiEgSlNPTiB2My4zLjAgfCBodHRwOi8vYmVzdGllanMuZ2l0aHViLmlvL2pzb24zIHwgQ29weXJpZ2h0IDIwMTItMjAxNCwgS2l0IENhbWJyaWRnZSB8IGh0dHA6Ly9raXQubWl0LWxpY2Vuc2Uub3JnICovXG47KGZ1bmN0aW9uIChyb290KSB7XG4gIC8vIERldGVjdCB0aGUgYGRlZmluZWAgZnVuY3Rpb24gZXhwb3NlZCBieSBhc3luY2hyb25vdXMgbW9kdWxlIGxvYWRlcnMuIFRoZVxuICAvLyBzdHJpY3QgYGRlZmluZWAgY2hlY2sgaXMgbmVjZXNzYXJ5IGZvciBjb21wYXRpYmlsaXR5IHdpdGggYHIuanNgLlxuICB2YXIgaXNMb2FkZXIgPSB0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZDtcblxuICAvLyBVc2UgdGhlIGBnbG9iYWxgIG9iamVjdCBleHBvc2VkIGJ5IE5vZGUgKGluY2x1ZGluZyBCcm93c2VyaWZ5IHZpYVxuICAvLyBgaW5zZXJ0LW1vZHVsZS1nbG9iYWxzYCksIE5hcndoYWwsIGFuZCBSaW5nbyBhcyB0aGUgZGVmYXVsdCBjb250ZXh0LlxuICAvLyBSaGlubyBleHBvcnRzIGEgYGdsb2JhbGAgZnVuY3Rpb24gaW5zdGVhZC5cbiAgdmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09IFwib2JqZWN0XCIgJiYgZ2xvYmFsO1xuICBpZiAoZnJlZUdsb2JhbCAmJiAoZnJlZUdsb2JhbFtcImdsb2JhbFwiXSA9PT0gZnJlZUdsb2JhbCB8fCBmcmVlR2xvYmFsW1wid2luZG93XCJdID09PSBmcmVlR2xvYmFsKSkge1xuICAgIHJvb3QgPSBmcmVlR2xvYmFsO1xuICB9XG5cbiAgLy8gUHVibGljOiBJbml0aWFsaXplcyBKU09OIDMgdXNpbmcgdGhlIGdpdmVuIGBjb250ZXh0YCBvYmplY3QsIGF0dGFjaGluZyB0aGVcbiAgLy8gYHN0cmluZ2lmeWAgYW5kIGBwYXJzZWAgZnVuY3Rpb25zIHRvIHRoZSBzcGVjaWZpZWQgYGV4cG9ydHNgIG9iamVjdC5cbiAgZnVuY3Rpb24gcnVuSW5Db250ZXh0KGNvbnRleHQsIGV4cG9ydHMpIHtcbiAgICBjb250ZXh0IHx8IChjb250ZXh0ID0gcm9vdFtcIk9iamVjdFwiXSgpKTtcbiAgICBleHBvcnRzIHx8IChleHBvcnRzID0gcm9vdFtcIk9iamVjdFwiXSgpKTtcblxuICAgIC8vIE5hdGl2ZSBjb25zdHJ1Y3RvciBhbGlhc2VzLlxuICAgIHZhciBOdW1iZXIgPSBjb250ZXh0W1wiTnVtYmVyXCJdIHx8IHJvb3RbXCJOdW1iZXJcIl0sXG4gICAgICAgIFN0cmluZyA9IGNvbnRleHRbXCJTdHJpbmdcIl0gfHwgcm9vdFtcIlN0cmluZ1wiXSxcbiAgICAgICAgT2JqZWN0ID0gY29udGV4dFtcIk9iamVjdFwiXSB8fCByb290W1wiT2JqZWN0XCJdLFxuICAgICAgICBEYXRlID0gY29udGV4dFtcIkRhdGVcIl0gfHwgcm9vdFtcIkRhdGVcIl0sXG4gICAgICAgIFN5bnRheEVycm9yID0gY29udGV4dFtcIlN5bnRheEVycm9yXCJdIHx8IHJvb3RbXCJTeW50YXhFcnJvclwiXSxcbiAgICAgICAgVHlwZUVycm9yID0gY29udGV4dFtcIlR5cGVFcnJvclwiXSB8fCByb290W1wiVHlwZUVycm9yXCJdLFxuICAgICAgICBNYXRoID0gY29udGV4dFtcIk1hdGhcIl0gfHwgcm9vdFtcIk1hdGhcIl0sXG4gICAgICAgIG5hdGl2ZUpTT04gPSBjb250ZXh0W1wiSlNPTlwiXSB8fCByb290W1wiSlNPTlwiXTtcblxuICAgIC8vIERlbGVnYXRlIHRvIHRoZSBuYXRpdmUgYHN0cmluZ2lmeWAgYW5kIGBwYXJzZWAgaW1wbGVtZW50YXRpb25zLlxuICAgIGlmICh0eXBlb2YgbmF0aXZlSlNPTiA9PSBcIm9iamVjdFwiICYmIG5hdGl2ZUpTT04pIHtcbiAgICAgIGV4cG9ydHMuc3RyaW5naWZ5ID0gbmF0aXZlSlNPTi5zdHJpbmdpZnk7XG4gICAgICBleHBvcnRzLnBhcnNlID0gbmF0aXZlSlNPTi5wYXJzZTtcbiAgICB9XG5cbiAgICAvLyBDb252ZW5pZW5jZSBhbGlhc2VzLlxuICAgIHZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGUsXG4gICAgICAgIGdldENsYXNzID0gb2JqZWN0UHJvdG8udG9TdHJpbmcsXG4gICAgICAgIGlzUHJvcGVydHksIGZvckVhY2gsIHVuZGVmO1xuXG4gICAgLy8gVGVzdCB0aGUgYERhdGUjZ2V0VVRDKmAgbWV0aG9kcy4gQmFzZWQgb24gd29yayBieSBAWWFmZmxlLlxuICAgIHZhciBpc0V4dGVuZGVkID0gbmV3IERhdGUoLTM1MDk4MjczMzQ1NzMyOTIpO1xuICAgIHRyeSB7XG4gICAgICAvLyBUaGUgYGdldFVUQ0Z1bGxZZWFyYCwgYE1vbnRoYCwgYW5kIGBEYXRlYCBtZXRob2RzIHJldHVybiBub25zZW5zaWNhbFxuICAgICAgLy8gcmVzdWx0cyBmb3IgY2VydGFpbiBkYXRlcyBpbiBPcGVyYSA+PSAxMC41My5cbiAgICAgIGlzRXh0ZW5kZWQgPSBpc0V4dGVuZGVkLmdldFVUQ0Z1bGxZZWFyKCkgPT0gLTEwOTI1MiAmJiBpc0V4dGVuZGVkLmdldFVUQ01vbnRoKCkgPT09IDAgJiYgaXNFeHRlbmRlZC5nZXRVVENEYXRlKCkgPT09IDEgJiZcbiAgICAgICAgLy8gU2FmYXJpIDwgMi4wLjIgc3RvcmVzIHRoZSBpbnRlcm5hbCBtaWxsaXNlY29uZCB0aW1lIHZhbHVlIGNvcnJlY3RseSxcbiAgICAgICAgLy8gYnV0IGNsaXBzIHRoZSB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhlIGRhdGUgbWV0aG9kcyB0byB0aGUgcmFuZ2Ugb2ZcbiAgICAgICAgLy8gc2lnbmVkIDMyLWJpdCBpbnRlZ2VycyAoWy0yICoqIDMxLCAyICoqIDMxIC0gMV0pLlxuICAgICAgICBpc0V4dGVuZGVkLmdldFVUQ0hvdXJzKCkgPT0gMTAgJiYgaXNFeHRlbmRlZC5nZXRVVENNaW51dGVzKCkgPT0gMzcgJiYgaXNFeHRlbmRlZC5nZXRVVENTZWNvbmRzKCkgPT0gNiAmJiBpc0V4dGVuZGVkLmdldFVUQ01pbGxpc2Vjb25kcygpID09IDcwODtcbiAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG5cbiAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBuYXRpdmUgYEpTT04uc3RyaW5naWZ5YCBhbmQgYHBhcnNlYFxuICAgIC8vIGltcGxlbWVudGF0aW9ucyBhcmUgc3BlYy1jb21wbGlhbnQuIEJhc2VkIG9uIHdvcmsgYnkgS2VuIFNueWRlci5cbiAgICBmdW5jdGlvbiBoYXMobmFtZSkge1xuICAgICAgaWYgKGhhc1tuYW1lXSAhPT0gdW5kZWYpIHtcbiAgICAgICAgLy8gUmV0dXJuIGNhY2hlZCBmZWF0dXJlIHRlc3QgcmVzdWx0LlxuICAgICAgICByZXR1cm4gaGFzW25hbWVdO1xuICAgICAgfVxuICAgICAgdmFyIGlzU3VwcG9ydGVkO1xuICAgICAgaWYgKG5hbWUgPT0gXCJidWctc3RyaW5nLWNoYXItaW5kZXhcIikge1xuICAgICAgICAvLyBJRSA8PSA3IGRvZXNuJ3Qgc3VwcG9ydCBhY2Nlc3Npbmcgc3RyaW5nIGNoYXJhY3RlcnMgdXNpbmcgc3F1YXJlXG4gICAgICAgIC8vIGJyYWNrZXQgbm90YXRpb24uIElFIDggb25seSBzdXBwb3J0cyB0aGlzIGZvciBwcmltaXRpdmVzLlxuICAgICAgICBpc1N1cHBvcnRlZCA9IFwiYVwiWzBdICE9IFwiYVwiO1xuICAgICAgfSBlbHNlIGlmIChuYW1lID09IFwianNvblwiKSB7XG4gICAgICAgIC8vIEluZGljYXRlcyB3aGV0aGVyIGJvdGggYEpTT04uc3RyaW5naWZ5YCBhbmQgYEpTT04ucGFyc2VgIGFyZVxuICAgICAgICAvLyBzdXBwb3J0ZWQuXG4gICAgICAgIGlzU3VwcG9ydGVkID0gaGFzKFwianNvbi1zdHJpbmdpZnlcIikgJiYgaGFzKFwianNvbi1wYXJzZVwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB2YWx1ZSwgc2VyaWFsaXplZCA9ICd7XCJhXCI6WzEsdHJ1ZSxmYWxzZSxudWxsLFwiXFxcXHUwMDAwXFxcXGJcXFxcblxcXFxmXFxcXHJcXFxcdFwiXX0nO1xuICAgICAgICAvLyBUZXN0IGBKU09OLnN0cmluZ2lmeWAuXG4gICAgICAgIGlmIChuYW1lID09IFwianNvbi1zdHJpbmdpZnlcIikge1xuICAgICAgICAgIHZhciBzdHJpbmdpZnkgPSBleHBvcnRzLnN0cmluZ2lmeSwgc3RyaW5naWZ5U3VwcG9ydGVkID0gdHlwZW9mIHN0cmluZ2lmeSA9PSBcImZ1bmN0aW9uXCIgJiYgaXNFeHRlbmRlZDtcbiAgICAgICAgICBpZiAoc3RyaW5naWZ5U3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAvLyBBIHRlc3QgZnVuY3Rpb24gb2JqZWN0IHdpdGggYSBjdXN0b20gYHRvSlNPTmAgbWV0aG9kLlxuICAgICAgICAgICAgKHZhbHVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH0pLnRvSlNPTiA9IHZhbHVlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgc3RyaW5naWZ5U3VwcG9ydGVkID1cbiAgICAgICAgICAgICAgICAvLyBGaXJlZm94IDMuMWIxIGFuZCBiMiBzZXJpYWxpemUgc3RyaW5nLCBudW1iZXIsIGFuZCBib29sZWFuXG4gICAgICAgICAgICAgICAgLy8gcHJpbWl0aXZlcyBhcyBvYmplY3QgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KDApID09PSBcIjBcIiAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCBiMiwgYW5kIEpTT04gMiBzZXJpYWxpemUgd3JhcHBlZCBwcmltaXRpdmVzIGFzIG9iamVjdFxuICAgICAgICAgICAgICAgIC8vIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgTnVtYmVyKCkpID09PSBcIjBcIiAmJlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgU3RyaW5nKCkpID09ICdcIlwiJyAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCAyIHRocm93IGFuIGVycm9yIGlmIHRoZSB2YWx1ZSBpcyBgbnVsbGAsIGB1bmRlZmluZWRgLCBvclxuICAgICAgICAgICAgICAgIC8vIGRvZXMgbm90IGRlZmluZSBhIGNhbm9uaWNhbCBKU09OIHJlcHJlc2VudGF0aW9uICh0aGlzIGFwcGxpZXMgdG9cbiAgICAgICAgICAgICAgICAvLyBvYmplY3RzIHdpdGggYHRvSlNPTmAgcHJvcGVydGllcyBhcyB3ZWxsLCAqdW5sZXNzKiB0aGV5IGFyZSBuZXN0ZWRcbiAgICAgICAgICAgICAgICAvLyB3aXRoaW4gYW4gb2JqZWN0IG9yIGFycmF5KS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoZ2V0Q2xhc3MpID09PSB1bmRlZiAmJlxuICAgICAgICAgICAgICAgIC8vIElFIDggc2VyaWFsaXplcyBgdW5kZWZpbmVkYCBhcyBgXCJ1bmRlZmluZWRcImAuIFNhZmFyaSA8PSA1LjEuNyBhbmRcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMyBwYXNzIHRoaXMgdGVzdC5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkodW5kZWYpID09PSB1bmRlZiAmJlxuICAgICAgICAgICAgICAgIC8vIFNhZmFyaSA8PSA1LjEuNyBhbmQgRkYgMy4xYjMgdGhyb3cgYEVycm9yYHMgYW5kIGBUeXBlRXJyb3JgcyxcbiAgICAgICAgICAgICAgICAvLyByZXNwZWN0aXZlbHksIGlmIHRoZSB2YWx1ZSBpcyBvbWl0dGVkIGVudGlyZWx5LlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSgpID09PSB1bmRlZiAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCAyIHRocm93IGFuIGVycm9yIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBub3QgYSBudW1iZXIsXG4gICAgICAgICAgICAgICAgLy8gc3RyaW5nLCBhcnJheSwgb2JqZWN0LCBCb29sZWFuLCBvciBgbnVsbGAgbGl0ZXJhbC4gVGhpcyBhcHBsaWVzIHRvXG4gICAgICAgICAgICAgICAgLy8gb2JqZWN0cyB3aXRoIGN1c3RvbSBgdG9KU09OYCBtZXRob2RzIGFzIHdlbGwsIHVubGVzcyB0aGV5IGFyZSBuZXN0ZWRcbiAgICAgICAgICAgICAgICAvLyBpbnNpZGUgb2JqZWN0IG9yIGFycmF5IGxpdGVyYWxzLiBZVUkgMy4wLjBiMSBpZ25vcmVzIGN1c3RvbSBgdG9KU09OYFxuICAgICAgICAgICAgICAgIC8vIG1ldGhvZHMgZW50aXJlbHkuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KHZhbHVlKSA9PT0gXCIxXCIgJiZcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoW3ZhbHVlXSkgPT0gXCJbMV1cIiAmJlxuICAgICAgICAgICAgICAgIC8vIFByb3RvdHlwZSA8PSAxLjYuMSBzZXJpYWxpemVzIGBbdW5kZWZpbmVkXWAgYXMgYFwiW11cImAgaW5zdGVhZCBvZlxuICAgICAgICAgICAgICAgIC8vIGBcIltudWxsXVwiYC5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoW3VuZGVmXSkgPT0gXCJbbnVsbF1cIiAmJlxuICAgICAgICAgICAgICAgIC8vIFlVSSAzLjAuMGIxIGZhaWxzIHRvIHNlcmlhbGl6ZSBgbnVsbGAgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG51bGwpID09IFwibnVsbFwiICYmXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgaGFsdHMgc2VyaWFsaXphdGlvbiBpZiBhbiBhcnJheSBjb250YWlucyBhIGZ1bmN0aW9uOlxuICAgICAgICAgICAgICAgIC8vIGBbMSwgdHJ1ZSwgZ2V0Q2xhc3MsIDFdYCBzZXJpYWxpemVzIGFzIFwiWzEsdHJ1ZSxdLFwiLiBGRiAzLjFiM1xuICAgICAgICAgICAgICAgIC8vIGVsaWRlcyBub24tSlNPTiB2YWx1ZXMgZnJvbSBvYmplY3RzIGFuZCBhcnJheXMsIHVubGVzcyB0aGV5XG4gICAgICAgICAgICAgICAgLy8gZGVmaW5lIGN1c3RvbSBgdG9KU09OYCBtZXRob2RzLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdW5kZWYsIGdldENsYXNzLCBudWxsXSkgPT0gXCJbbnVsbCxudWxsLG51bGxdXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBTaW1wbGUgc2VyaWFsaXphdGlvbiB0ZXN0LiBGRiAzLjFiMSB1c2VzIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlc1xuICAgICAgICAgICAgICAgIC8vIHdoZXJlIGNoYXJhY3RlciBlc2NhcGUgY29kZXMgYXJlIGV4cGVjdGVkIChlLmcuLCBgXFxiYCA9PiBgXFx1MDAwOGApLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSh7IFwiYVwiOiBbdmFsdWUsIHRydWUsIGZhbHNlLCBudWxsLCBcIlxceDAwXFxiXFxuXFxmXFxyXFx0XCJdIH0pID09IHNlcmlhbGl6ZWQgJiZcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSBhbmQgYjIgaWdub3JlIHRoZSBgZmlsdGVyYCBhbmQgYHdpZHRoYCBhcmd1bWVudHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG51bGwsIHZhbHVlKSA9PT0gXCIxXCIgJiZcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoWzEsIDJdLCBudWxsLCAxKSA9PSBcIltcXG4gMSxcXG4gMlxcbl1cIiAmJlxuICAgICAgICAgICAgICAgIC8vIEpTT04gMiwgUHJvdG90eXBlIDw9IDEuNywgYW5kIG9sZGVyIFdlYktpdCBidWlsZHMgaW5jb3JyZWN0bHlcbiAgICAgICAgICAgICAgICAvLyBzZXJpYWxpemUgZXh0ZW5kZWQgeWVhcnMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC04LjY0ZTE1KSkgPT0gJ1wiLTI3MTgyMS0wNC0yMFQwMDowMDowMC4wMDBaXCInICYmXG4gICAgICAgICAgICAgICAgLy8gVGhlIG1pbGxpc2Vjb25kcyBhcmUgb3B0aW9uYWwgaW4gRVMgNSwgYnV0IHJlcXVpcmVkIGluIDUuMS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoOC42NGUxNSkpID09ICdcIisyNzU3NjAtMDktMTNUMDA6MDA6MDAuMDAwWlwiJyAmJlxuICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggPD0gMTEuMCBpbmNvcnJlY3RseSBzZXJpYWxpemVzIHllYXJzIHByaW9yIHRvIDAgYXMgbmVnYXRpdmVcbiAgICAgICAgICAgICAgICAvLyBmb3VyLWRpZ2l0IHllYXJzIGluc3RlYWQgb2Ygc2l4LWRpZ2l0IHllYXJzLiBDcmVkaXRzOiBAWWFmZmxlLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtNjIxOTg3NTUyZTUpKSA9PSAnXCItMDAwMDAxLTAxLTAxVDAwOjAwOjAwLjAwMFpcIicgJiZcbiAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjUgYW5kIE9wZXJhID49IDEwLjUzIGluY29ycmVjdGx5IHNlcmlhbGl6ZSBtaWxsaXNlY29uZFxuICAgICAgICAgICAgICAgIC8vIHZhbHVlcyBsZXNzIHRoYW4gMTAwMC4gQ3JlZGl0czogQFlhZmZsZS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoLTEpKSA9PSAnXCIxOTY5LTEyLTMxVDIzOjU5OjU5Ljk5OVpcIic7XG4gICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgc3RyaW5naWZ5U3VwcG9ydGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlzU3VwcG9ydGVkID0gc3RyaW5naWZ5U3VwcG9ydGVkO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRlc3QgYEpTT04ucGFyc2VgLlxuICAgICAgICBpZiAobmFtZSA9PSBcImpzb24tcGFyc2VcIikge1xuICAgICAgICAgIHZhciBwYXJzZSA9IGV4cG9ydHMucGFyc2U7XG4gICAgICAgICAgaWYgKHR5cGVvZiBwYXJzZSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIC8vIEZGIDMuMWIxLCBiMiB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBhIGJhcmUgbGl0ZXJhbCBpcyBwcm92aWRlZC5cbiAgICAgICAgICAgICAgLy8gQ29uZm9ybWluZyBpbXBsZW1lbnRhdGlvbnMgc2hvdWxkIGFsc28gY29lcmNlIHRoZSBpbml0aWFsIGFyZ3VtZW50IHRvXG4gICAgICAgICAgICAgIC8vIGEgc3RyaW5nIHByaW9yIHRvIHBhcnNpbmcuXG4gICAgICAgICAgICAgIGlmIChwYXJzZShcIjBcIikgPT09IDAgJiYgIXBhcnNlKGZhbHNlKSkge1xuICAgICAgICAgICAgICAgIC8vIFNpbXBsZSBwYXJzaW5nIHRlc3QuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZShzZXJpYWxpemVkKTtcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VTdXBwb3J0ZWQgPSB2YWx1ZVtcImFcIl0ubGVuZ3RoID09IDUgJiYgdmFsdWVbXCJhXCJdWzBdID09PSAxO1xuICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS4yIGFuZCBGRiAzLjFiMSBhbGxvdyB1bmVzY2FwZWQgdGFicyBpbiBzdHJpbmdzLlxuICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9ICFwYXJzZSgnXCJcXHRcIicpO1xuICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gRkYgNC4wIGFuZCA0LjAuMSBhbGxvdyBsZWFkaW5nIGArYCBzaWducyBhbmQgbGVhZGluZ1xuICAgICAgICAgICAgICAgICAgICAgIC8vIGRlY2ltYWwgcG9pbnRzLiBGRiA0LjAsIDQuMC4xLCBhbmQgSUUgOS0xMCBhbHNvIGFsbG93XG4gICAgICAgICAgICAgICAgICAgICAgLy8gY2VydGFpbiBvY3RhbCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9IHBhcnNlKFwiMDFcIikgIT09IDE7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIEZGIDQuMCwgNC4wLjEsIGFuZCBSaGlubyAxLjdSMy1SNCBhbGxvdyB0cmFpbGluZyBkZWNpbWFsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gcG9pbnRzLiBUaGVzZSBlbnZpcm9ubWVudHMsIGFsb25nIHdpdGggRkYgMy4xYjEgYW5kIDIsXG4gICAgICAgICAgICAgICAgICAgICAgLy8gYWxzbyBhbGxvdyB0cmFpbGluZyBjb21tYXMgaW4gSlNPTiBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBwYXJzZShcIjEuXCIpICE9PSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaXNTdXBwb3J0ZWQgPSBwYXJzZVN1cHBvcnRlZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGhhc1tuYW1lXSA9ICEhaXNTdXBwb3J0ZWQ7XG4gICAgfVxuXG4gICAgaWYgKCFoYXMoXCJqc29uXCIpKSB7XG4gICAgICAvLyBDb21tb24gYFtbQ2xhc3NdXWAgbmFtZSBhbGlhc2VzLlxuICAgICAgdmFyIGZ1bmN0aW9uQ2xhc3MgPSBcIltvYmplY3QgRnVuY3Rpb25dXCIsXG4gICAgICAgICAgZGF0ZUNsYXNzID0gXCJbb2JqZWN0IERhdGVdXCIsXG4gICAgICAgICAgbnVtYmVyQ2xhc3MgPSBcIltvYmplY3QgTnVtYmVyXVwiLFxuICAgICAgICAgIHN0cmluZ0NsYXNzID0gXCJbb2JqZWN0IFN0cmluZ11cIixcbiAgICAgICAgICBhcnJheUNsYXNzID0gXCJbb2JqZWN0IEFycmF5XVwiLFxuICAgICAgICAgIGJvb2xlYW5DbGFzcyA9IFwiW29iamVjdCBCb29sZWFuXVwiO1xuXG4gICAgICAvLyBEZXRlY3QgaW5jb21wbGV0ZSBzdXBwb3J0IGZvciBhY2Nlc3Npbmcgc3RyaW5nIGNoYXJhY3RlcnMgYnkgaW5kZXguXG4gICAgICB2YXIgY2hhckluZGV4QnVnZ3kgPSBoYXMoXCJidWctc3RyaW5nLWNoYXItaW5kZXhcIik7XG5cbiAgICAgIC8vIERlZmluZSBhZGRpdGlvbmFsIHV0aWxpdHkgbWV0aG9kcyBpZiB0aGUgYERhdGVgIG1ldGhvZHMgYXJlIGJ1Z2d5LlxuICAgICAgaWYgKCFpc0V4dGVuZGVkKSB7XG4gICAgICAgIHZhciBmbG9vciA9IE1hdGguZmxvb3I7XG4gICAgICAgIC8vIEEgbWFwcGluZyBiZXR3ZWVuIHRoZSBtb250aHMgb2YgdGhlIHllYXIgYW5kIHRoZSBudW1iZXIgb2YgZGF5cyBiZXR3ZWVuXG4gICAgICAgIC8vIEphbnVhcnkgMXN0IGFuZCB0aGUgZmlyc3Qgb2YgdGhlIHJlc3BlY3RpdmUgbW9udGguXG4gICAgICAgIHZhciBNb250aHMgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdO1xuICAgICAgICAvLyBJbnRlcm5hbDogQ2FsY3VsYXRlcyB0aGUgbnVtYmVyIG9mIGRheXMgYmV0d2VlbiB0aGUgVW5peCBlcG9jaCBhbmQgdGhlXG4gICAgICAgIC8vIGZpcnN0IGRheSBvZiB0aGUgZ2l2ZW4gbW9udGguXG4gICAgICAgIHZhciBnZXREYXkgPSBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcbiAgICAgICAgICByZXR1cm4gTW9udGhzW21vbnRoXSArIDM2NSAqICh5ZWFyIC0gMTk3MCkgKyBmbG9vcigoeWVhciAtIDE5NjkgKyAobW9udGggPSArKG1vbnRoID4gMSkpKSAvIDQpIC0gZmxvb3IoKHllYXIgLSAxOTAxICsgbW9udGgpIC8gMTAwKSArIGZsb29yKCh5ZWFyIC0gMTYwMSArIG1vbnRoKSAvIDQwMCk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIEludGVybmFsOiBEZXRlcm1pbmVzIGlmIGEgcHJvcGVydHkgaXMgYSBkaXJlY3QgcHJvcGVydHkgb2YgdGhlIGdpdmVuXG4gICAgICAvLyBvYmplY3QuIERlbGVnYXRlcyB0byB0aGUgbmF0aXZlIGBPYmplY3QjaGFzT3duUHJvcGVydHlgIG1ldGhvZC5cbiAgICAgIGlmICghKGlzUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eSkpIHtcbiAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgIHZhciBtZW1iZXJzID0ge30sIGNvbnN0cnVjdG9yO1xuICAgICAgICAgIGlmICgobWVtYmVycy5fX3Byb3RvX18gPSBudWxsLCBtZW1iZXJzLl9fcHJvdG9fXyA9IHtcbiAgICAgICAgICAgIC8vIFRoZSAqcHJvdG8qIHByb3BlcnR5IGNhbm5vdCBiZSBzZXQgbXVsdGlwbGUgdGltZXMgaW4gcmVjZW50XG4gICAgICAgICAgICAvLyB2ZXJzaW9ucyBvZiBGaXJlZm94IGFuZCBTZWFNb25rZXkuXG4gICAgICAgICAgICBcInRvU3RyaW5nXCI6IDFcbiAgICAgICAgICB9LCBtZW1iZXJzKS50b1N0cmluZyAhPSBnZXRDbGFzcykge1xuICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDIuMC4zIGRvZXNuJ3QgaW1wbGVtZW50IGBPYmplY3QjaGFzT3duUHJvcGVydHlgLCBidXRcbiAgICAgICAgICAgIC8vIHN1cHBvcnRzIHRoZSBtdXRhYmxlICpwcm90byogcHJvcGVydHkuXG4gICAgICAgICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgIC8vIENhcHR1cmUgYW5kIGJyZWFrIHRoZSBvYmplY3RncyBwcm90b3R5cGUgY2hhaW4gKHNlZSBzZWN0aW9uIDguNi4yXG4gICAgICAgICAgICAgIC8vIG9mIHRoZSBFUyA1LjEgc3BlYykuIFRoZSBwYXJlbnRoZXNpemVkIGV4cHJlc3Npb24gcHJldmVudHMgYW5cbiAgICAgICAgICAgICAgLy8gdW5zYWZlIHRyYW5zZm9ybWF0aW9uIGJ5IHRoZSBDbG9zdXJlIENvbXBpbGVyLlxuICAgICAgICAgICAgICB2YXIgb3JpZ2luYWwgPSB0aGlzLl9fcHJvdG9fXywgcmVzdWx0ID0gcHJvcGVydHkgaW4gKHRoaXMuX19wcm90b19fID0gbnVsbCwgdGhpcyk7XG4gICAgICAgICAgICAgIC8vIFJlc3RvcmUgdGhlIG9yaWdpbmFsIHByb3RvdHlwZSBjaGFpbi5cbiAgICAgICAgICAgICAgdGhpcy5fX3Byb3RvX18gPSBvcmlnaW5hbDtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIENhcHR1cmUgYSByZWZlcmVuY2UgdG8gdGhlIHRvcC1sZXZlbCBgT2JqZWN0YCBjb25zdHJ1Y3Rvci5cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yID0gbWVtYmVycy5jb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgIC8vIFVzZSB0aGUgYGNvbnN0cnVjdG9yYCBwcm9wZXJ0eSB0byBzaW11bGF0ZSBgT2JqZWN0I2hhc093blByb3BlcnR5YCBpblxuICAgICAgICAgICAgLy8gb3RoZXIgZW52aXJvbm1lbnRzLlxuICAgICAgICAgICAgaXNQcm9wZXJ0eSA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gKHRoaXMuY29uc3RydWN0b3IgfHwgY29uc3RydWN0b3IpLnByb3RvdHlwZTtcbiAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5IGluIHRoaXMgJiYgIShwcm9wZXJ0eSBpbiBwYXJlbnQgJiYgdGhpc1twcm9wZXJ0eV0gPT09IHBhcmVudFtwcm9wZXJ0eV0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWVtYmVycyA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIGlzUHJvcGVydHkuY2FsbCh0aGlzLCBwcm9wZXJ0eSk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIEludGVybmFsOiBBIHNldCBvZiBwcmltaXRpdmUgdHlwZXMgdXNlZCBieSBgaXNIb3N0VHlwZWAuXG4gICAgICB2YXIgUHJpbWl0aXZlVHlwZXMgPSB7XG4gICAgICAgIFwiYm9vbGVhblwiOiAxLFxuICAgICAgICBcIm51bWJlclwiOiAxLFxuICAgICAgICBcInN0cmluZ1wiOiAxLFxuICAgICAgICBcInVuZGVmaW5lZFwiOiAxXG4gICAgICB9O1xuXG4gICAgICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gb2JqZWN0IGBwcm9wZXJ0eWAgdmFsdWUgaXMgYVxuICAgICAgLy8gbm9uLXByaW1pdGl2ZS5cbiAgICAgIHZhciBpc0hvc3RUeXBlID0gZnVuY3Rpb24gKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICAgICAgdmFyIHR5cGUgPSB0eXBlb2Ygb2JqZWN0W3Byb3BlcnR5XTtcbiAgICAgICAgcmV0dXJuIHR5cGUgPT0gXCJvYmplY3RcIiA/ICEhb2JqZWN0W3Byb3BlcnR5XSA6ICFQcmltaXRpdmVUeXBlc1t0eXBlXTtcbiAgICAgIH07XG5cbiAgICAgIC8vIEludGVybmFsOiBOb3JtYWxpemVzIHRoZSBgZm9yLi4uaW5gIGl0ZXJhdGlvbiBhbGdvcml0aG0gYWNyb3NzXG4gICAgICAvLyBlbnZpcm9ubWVudHMuIEVhY2ggZW51bWVyYXRlZCBrZXkgaXMgeWllbGRlZCB0byBhIGBjYWxsYmFja2AgZnVuY3Rpb24uXG4gICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHNpemUgPSAwLCBQcm9wZXJ0aWVzLCBtZW1iZXJzLCBwcm9wZXJ0eTtcblxuICAgICAgICAvLyBUZXN0cyBmb3IgYnVncyBpbiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCdzIGBmb3IuLi5pbmAgYWxnb3JpdGhtLiBUaGVcbiAgICAgICAgLy8gYHZhbHVlT2ZgIHByb3BlcnR5IGluaGVyaXRzIHRoZSBub24tZW51bWVyYWJsZSBmbGFnIGZyb21cbiAgICAgICAgLy8gYE9iamVjdC5wcm90b3R5cGVgIGluIG9sZGVyIHZlcnNpb25zIG9mIElFLCBOZXRzY2FwZSwgYW5kIE1vemlsbGEuXG4gICAgICAgIChQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRoaXMudmFsdWVPZiA9IDA7XG4gICAgICAgIH0pLnByb3RvdHlwZS52YWx1ZU9mID0gMDtcblxuICAgICAgICAvLyBJdGVyYXRlIG92ZXIgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGBQcm9wZXJ0aWVzYCBjbGFzcy5cbiAgICAgICAgbWVtYmVycyA9IG5ldyBQcm9wZXJ0aWVzKCk7XG4gICAgICAgIGZvciAocHJvcGVydHkgaW4gbWVtYmVycykge1xuICAgICAgICAgIC8vIElnbm9yZSBhbGwgcHJvcGVydGllcyBpbmhlcml0ZWQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuXG4gICAgICAgICAgaWYgKGlzUHJvcGVydHkuY2FsbChtZW1iZXJzLCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgUHJvcGVydGllcyA9IG1lbWJlcnMgPSBudWxsO1xuXG4gICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgaXRlcmF0aW9uIGFsZ29yaXRobS5cbiAgICAgICAgaWYgKCFzaXplKSB7XG4gICAgICAgICAgLy8gQSBsaXN0IG9mIG5vbi1lbnVtZXJhYmxlIHByb3BlcnRpZXMgaW5oZXJpdGVkIGZyb20gYE9iamVjdC5wcm90b3R5cGVgLlxuICAgICAgICAgIG1lbWJlcnMgPSBbXCJ2YWx1ZU9mXCIsIFwidG9TdHJpbmdcIiwgXCJ0b0xvY2FsZVN0cmluZ1wiLCBcInByb3BlcnR5SXNFbnVtZXJhYmxlXCIsIFwiaXNQcm90b3R5cGVPZlwiLCBcImhhc093blByb3BlcnR5XCIsIFwiY29uc3RydWN0b3JcIl07XG4gICAgICAgICAgLy8gSUUgPD0gOCwgTW96aWxsYSAxLjAsIGFuZCBOZXRzY2FwZSA2LjIgaWdub3JlIHNoYWRvd2VkIG5vbi1lbnVtZXJhYmxlXG4gICAgICAgICAgLy8gcHJvcGVydGllcy5cbiAgICAgICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBpc0Z1bmN0aW9uID0gZ2V0Q2xhc3MuY2FsbChvYmplY3QpID09IGZ1bmN0aW9uQ2xhc3MsIHByb3BlcnR5LCBsZW5ndGg7XG4gICAgICAgICAgICB2YXIgaGFzUHJvcGVydHkgPSAhaXNGdW5jdGlvbiAmJiB0eXBlb2Ygb2JqZWN0LmNvbnN0cnVjdG9yICE9IFwiZnVuY3Rpb25cIiAmJiBpc0hvc3RUeXBlKG9iamVjdCwgXCJoYXNPd25Qcm9wZXJ0eVwiKSA/IG9iamVjdC5oYXNPd25Qcm9wZXJ0eSA6IGlzUHJvcGVydHk7XG4gICAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgICAvLyBHZWNrbyA8PSAxLjAgZW51bWVyYXRlcyB0aGUgYHByb3RvdHlwZWAgcHJvcGVydHkgb2YgZnVuY3Rpb25zIHVuZGVyXG4gICAgICAgICAgICAgIC8vIGNlcnRhaW4gY29uZGl0aW9uczsgSUUgZG9lcyBub3QuXG4gICAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgaGFzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTWFudWFsbHkgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgZWFjaCBub24tZW51bWVyYWJsZSBwcm9wZXJ0eS5cbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0gbWVtYmVycy5sZW5ndGg7IHByb3BlcnR5ID0gbWVtYmVyc1stLWxlbmd0aF07IGhhc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkgJiYgY2FsbGJhY2socHJvcGVydHkpKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHNpemUgPT0gMikge1xuICAgICAgICAgIC8vIFNhZmFyaSA8PSAyLjAuNCBlbnVtZXJhdGVzIHNoYWRvd2VkIHByb3BlcnRpZXMgdHdpY2UuXG4gICAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBzZXQgb2YgaXRlcmF0ZWQgcHJvcGVydGllcy5cbiAgICAgICAgICAgIHZhciBtZW1iZXJzID0ge30sIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHk7XG4gICAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgICAvLyBTdG9yZSBlYWNoIHByb3BlcnR5IG5hbWUgdG8gcHJldmVudCBkb3VibGUgZW51bWVyYXRpb24uIFRoZVxuICAgICAgICAgICAgICAvLyBgcHJvdG90eXBlYCBwcm9wZXJ0eSBvZiBmdW5jdGlvbnMgaXMgbm90IGVudW1lcmF0ZWQgZHVlIHRvIGNyb3NzLVxuICAgICAgICAgICAgICAvLyBlbnZpcm9ubWVudCBpbmNvbnNpc3RlbmNpZXMuXG4gICAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgIWlzUHJvcGVydHkuY2FsbChtZW1iZXJzLCBwcm9wZXJ0eSkgJiYgKG1lbWJlcnNbcHJvcGVydHldID0gMSkgJiYgaXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBObyBidWdzIGRldGVjdGVkOyB1c2UgdGhlIHN0YW5kYXJkIGBmb3IuLi5pbmAgYWxnb3JpdGhtLlxuICAgICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHksIGlzQ29uc3RydWN0b3I7XG4gICAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xuICAgICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmIGlzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSAmJiAhKGlzQ29uc3RydWN0b3IgPSBwcm9wZXJ0eSA9PT0gXCJjb25zdHJ1Y3RvclwiKSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTWFudWFsbHkgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgdGhlIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgZHVlIHRvXG4gICAgICAgICAgICAvLyBjcm9zcy1lbnZpcm9ubWVudCBpbmNvbnNpc3RlbmNpZXMuXG4gICAgICAgICAgICBpZiAoaXNDb25zdHJ1Y3RvciB8fCBpc1Byb3BlcnR5LmNhbGwob2JqZWN0LCAocHJvcGVydHkgPSBcImNvbnN0cnVjdG9yXCIpKSkge1xuICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm9yRWFjaChvYmplY3QsIGNhbGxiYWNrKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIFB1YmxpYzogU2VyaWFsaXplcyBhIEphdmFTY3JpcHQgYHZhbHVlYCBhcyBhIEpTT04gc3RyaW5nLiBUaGUgb3B0aW9uYWxcbiAgICAgIC8vIGBmaWx0ZXJgIGFyZ3VtZW50IG1heSBzcGVjaWZ5IGVpdGhlciBhIGZ1bmN0aW9uIHRoYXQgYWx0ZXJzIGhvdyBvYmplY3QgYW5kXG4gICAgICAvLyBhcnJheSBtZW1iZXJzIGFyZSBzZXJpYWxpemVkLCBvciBhbiBhcnJheSBvZiBzdHJpbmdzIGFuZCBudW1iZXJzIHRoYXRcbiAgICAgIC8vIGluZGljYXRlcyB3aGljaCBwcm9wZXJ0aWVzIHNob3VsZCBiZSBzZXJpYWxpemVkLiBUaGUgb3B0aW9uYWwgYHdpZHRoYFxuICAgICAgLy8gYXJndW1lbnQgbWF5IGJlIGVpdGhlciBhIHN0cmluZyBvciBudW1iZXIgdGhhdCBzcGVjaWZpZXMgdGhlIGluZGVudGF0aW9uXG4gICAgICAvLyBsZXZlbCBvZiB0aGUgb3V0cHV0LlxuICAgICAgaWYgKCFoYXMoXCJqc29uLXN0cmluZ2lmeVwiKSkge1xuICAgICAgICAvLyBJbnRlcm5hbDogQSBtYXAgb2YgY29udHJvbCBjaGFyYWN0ZXJzIGFuZCB0aGVpciBlc2NhcGVkIGVxdWl2YWxlbnRzLlxuICAgICAgICB2YXIgRXNjYXBlcyA9IHtcbiAgICAgICAgICA5MjogXCJcXFxcXFxcXFwiLFxuICAgICAgICAgIDM0OiAnXFxcXFwiJyxcbiAgICAgICAgICA4OiBcIlxcXFxiXCIsXG4gICAgICAgICAgMTI6IFwiXFxcXGZcIixcbiAgICAgICAgICAxMDogXCJcXFxcblwiLFxuICAgICAgICAgIDEzOiBcIlxcXFxyXCIsXG4gICAgICAgICAgOTogXCJcXFxcdFwiXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IENvbnZlcnRzIGB2YWx1ZWAgaW50byBhIHplcm8tcGFkZGVkIHN0cmluZyBzdWNoIHRoYXQgaXRzXG4gICAgICAgIC8vIGxlbmd0aCBpcyBhdCBsZWFzdCBlcXVhbCB0byBgd2lkdGhgLiBUaGUgYHdpZHRoYCBtdXN0IGJlIDw9IDYuXG4gICAgICAgIHZhciBsZWFkaW5nWmVyb2VzID0gXCIwMDAwMDBcIjtcbiAgICAgICAgdmFyIHRvUGFkZGVkU3RyaW5nID0gZnVuY3Rpb24gKHdpZHRoLCB2YWx1ZSkge1xuICAgICAgICAgIC8vIFRoZSBgfHwgMGAgZXhwcmVzc2lvbiBpcyBuZWNlc3NhcnkgdG8gd29yayBhcm91bmQgYSBidWcgaW5cbiAgICAgICAgICAvLyBPcGVyYSA8PSA3LjU0dTIgd2hlcmUgYDAgPT0gLTBgLCBidXQgYFN0cmluZygtMCkgIT09IFwiMFwiYC5cbiAgICAgICAgICByZXR1cm4gKGxlYWRpbmdaZXJvZXMgKyAodmFsdWUgfHwgMCkpLnNsaWNlKC13aWR0aCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IERvdWJsZS1xdW90ZXMgYSBzdHJpbmcgYHZhbHVlYCwgcmVwbGFjaW5nIGFsbCBBU0NJSSBjb250cm9sXG4gICAgICAgIC8vIGNoYXJhY3RlcnMgKGNoYXJhY3RlcnMgd2l0aCBjb2RlIHVuaXQgdmFsdWVzIGJldHdlZW4gMCBhbmQgMzEpIHdpdGhcbiAgICAgICAgLy8gdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcbiAgICAgICAgLy8gYFF1b3RlKHZhbHVlKWAgb3BlcmF0aW9uIGRlZmluZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMy5cbiAgICAgICAgdmFyIHVuaWNvZGVQcmVmaXggPSBcIlxcXFx1MDBcIjtcbiAgICAgICAgdmFyIHF1b3RlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9ICdcIicsIGluZGV4ID0gMCwgbGVuZ3RoID0gdmFsdWUubGVuZ3RoLCB1c2VDaGFySW5kZXggPSAhY2hhckluZGV4QnVnZ3kgfHwgbGVuZ3RoID4gMTA7XG4gICAgICAgICAgdmFyIHN5bWJvbHMgPSB1c2VDaGFySW5kZXggJiYgKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuc3BsaXQoXCJcIikgOiB2YWx1ZSk7XG4gICAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICB2YXIgY2hhckNvZGUgPSB2YWx1ZS5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICAgICAgICAgIC8vIElmIHRoZSBjaGFyYWN0ZXIgaXMgYSBjb250cm9sIGNoYXJhY3RlciwgYXBwZW5kIGl0cyBVbmljb2RlIG9yXG4gICAgICAgICAgICAvLyBzaG9ydGhhbmQgZXNjYXBlIHNlcXVlbmNlOyBvdGhlcndpc2UsIGFwcGVuZCB0aGUgY2hhcmFjdGVyIGFzLWlzLlxuICAgICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xuICAgICAgICAgICAgICBjYXNlIDg6IGNhc2UgOTogY2FzZSAxMDogY2FzZSAxMjogY2FzZSAxMzogY2FzZSAzNDogY2FzZSA5MjpcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gRXNjYXBlc1tjaGFyQ29kZV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlIDwgMzIpIHtcbiAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSB1bmljb2RlUHJlZml4ICsgdG9QYWRkZWRTdHJpbmcoMiwgY2hhckNvZGUudG9TdHJpbmcoMTYpKTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gdXNlQ2hhckluZGV4ID8gc3ltYm9sc1tpbmRleF0gOiB2YWx1ZS5jaGFyQXQoaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0ICsgJ1wiJztcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogUmVjdXJzaXZlbHkgc2VyaWFsaXplcyBhbiBvYmplY3QuIEltcGxlbWVudHMgdGhlXG4gICAgICAgIC8vIGBTdHIoa2V5LCBob2xkZXIpYCwgYEpPKHZhbHVlKWAsIGFuZCBgSkEodmFsdWUpYCBvcGVyYXRpb25zLlxuICAgICAgICB2YXIgc2VyaWFsaXplID0gZnVuY3Rpb24gKHByb3BlcnR5LCBvYmplY3QsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBpbmRlbnRhdGlvbiwgc3RhY2spIHtcbiAgICAgICAgICB2YXIgdmFsdWUsIGNsYXNzTmFtZSwgeWVhciwgbW9udGgsIGRhdGUsIHRpbWUsIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBtaWxsaXNlY29uZHMsIHJlc3VsdHMsIGVsZW1lbnQsIGluZGV4LCBsZW5ndGgsIHByZWZpeCwgcmVzdWx0O1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBOZWNlc3NhcnkgZm9yIGhvc3Qgb2JqZWN0IHN1cHBvcnQuXG4gICAgICAgICAgICB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIiAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh2YWx1ZSk7XG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGRhdGVDbGFzcyAmJiAhaXNQcm9wZXJ0eS5jYWxsKHZhbHVlLCBcInRvSlNPTlwiKSkge1xuICAgICAgICAgICAgICBpZiAodmFsdWUgPiAtMSAvIDAgJiYgdmFsdWUgPCAxIC8gMCkge1xuICAgICAgICAgICAgICAgIC8vIERhdGVzIGFyZSBzZXJpYWxpemVkIGFjY29yZGluZyB0byB0aGUgYERhdGUjdG9KU09OYCBtZXRob2RcbiAgICAgICAgICAgICAgICAvLyBzcGVjaWZpZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuOS41LjQ0LiBTZWUgc2VjdGlvbiAxNS45LjEuMTVcbiAgICAgICAgICAgICAgICAvLyBmb3IgdGhlIElTTyA4NjAxIGRhdGUgdGltZSBzdHJpbmcgZm9ybWF0LlxuICAgICAgICAgICAgICAgIGlmIChnZXREYXkpIHtcbiAgICAgICAgICAgICAgICAgIC8vIE1hbnVhbGx5IGNvbXB1dGUgdGhlIHllYXIsIG1vbnRoLCBkYXRlLCBob3VycywgbWludXRlcyxcbiAgICAgICAgICAgICAgICAgIC8vIHNlY29uZHMsIGFuZCBtaWxsaXNlY29uZHMgaWYgdGhlIGBnZXRVVEMqYCBtZXRob2RzIGFyZVxuICAgICAgICAgICAgICAgICAgLy8gYnVnZ3kuIEFkYXB0ZWQgZnJvbSBAWWFmZmxlJ3MgYGRhdGUtc2hpbWAgcHJvamVjdC5cbiAgICAgICAgICAgICAgICAgIGRhdGUgPSBmbG9vcih2YWx1ZSAvIDg2NGU1KTtcbiAgICAgICAgICAgICAgICAgIGZvciAoeWVhciA9IGZsb29yKGRhdGUgLyAzNjUuMjQyNSkgKyAxOTcwIC0gMTsgZ2V0RGF5KHllYXIgKyAxLCAwKSA8PSBkYXRlOyB5ZWFyKyspO1xuICAgICAgICAgICAgICAgICAgZm9yIChtb250aCA9IGZsb29yKChkYXRlIC0gZ2V0RGF5KHllYXIsIDApKSAvIDMwLjQyKTsgZ2V0RGF5KHllYXIsIG1vbnRoICsgMSkgPD0gZGF0ZTsgbW9udGgrKyk7XG4gICAgICAgICAgICAgICAgICBkYXRlID0gMSArIGRhdGUgLSBnZXREYXkoeWVhciwgbW9udGgpO1xuICAgICAgICAgICAgICAgICAgLy8gVGhlIGB0aW1lYCB2YWx1ZSBzcGVjaWZpZXMgdGhlIHRpbWUgd2l0aGluIHRoZSBkYXkgKHNlZSBFU1xuICAgICAgICAgICAgICAgICAgLy8gNS4xIHNlY3Rpb24gMTUuOS4xLjIpLiBUaGUgZm9ybXVsYSBgKEEgJSBCICsgQikgJSBCYCBpcyB1c2VkXG4gICAgICAgICAgICAgICAgICAvLyB0byBjb21wdXRlIGBBIG1vZHVsbyBCYCwgYXMgdGhlIGAlYCBvcGVyYXRvciBkb2VzIG5vdFxuICAgICAgICAgICAgICAgICAgLy8gY29ycmVzcG9uZCB0byB0aGUgYG1vZHVsb2Agb3BlcmF0aW9uIGZvciBuZWdhdGl2ZSBudW1iZXJzLlxuICAgICAgICAgICAgICAgICAgdGltZSA9ICh2YWx1ZSAlIDg2NGU1ICsgODY0ZTUpICUgODY0ZTU7XG4gICAgICAgICAgICAgICAgICAvLyBUaGUgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIGFuZCBtaWxsaXNlY29uZHMgYXJlIG9idGFpbmVkIGJ5XG4gICAgICAgICAgICAgICAgICAvLyBkZWNvbXBvc2luZyB0aGUgdGltZSB3aXRoaW4gdGhlIGRheS4gU2VlIHNlY3Rpb24gMTUuOS4xLjEwLlxuICAgICAgICAgICAgICAgICAgaG91cnMgPSBmbG9vcih0aW1lIC8gMzZlNSkgJSAyNDtcbiAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSBmbG9vcih0aW1lIC8gNmU0KSAlIDYwO1xuICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IGZsb29yKHRpbWUgLyAxZTMpICUgNjA7XG4gICAgICAgICAgICAgICAgICBtaWxsaXNlY29uZHMgPSB0aW1lICUgMWUzO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB5ZWFyID0gdmFsdWUuZ2V0VVRDRnVsbFllYXIoKTtcbiAgICAgICAgICAgICAgICAgIG1vbnRoID0gdmFsdWUuZ2V0VVRDTW9udGgoKTtcbiAgICAgICAgICAgICAgICAgIGRhdGUgPSB2YWx1ZS5nZXRVVENEYXRlKCk7XG4gICAgICAgICAgICAgICAgICBob3VycyA9IHZhbHVlLmdldFVUQ0hvdXJzKCk7XG4gICAgICAgICAgICAgICAgICBtaW51dGVzID0gdmFsdWUuZ2V0VVRDTWludXRlcygpO1xuICAgICAgICAgICAgICAgICAgc2Vjb25kcyA9IHZhbHVlLmdldFVUQ1NlY29uZHMoKTtcbiAgICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IHZhbHVlLmdldFVUQ01pbGxpc2Vjb25kcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBTZXJpYWxpemUgZXh0ZW5kZWQgeWVhcnMgY29ycmVjdGx5LlxuICAgICAgICAgICAgICAgIHZhbHVlID0gKHllYXIgPD0gMCB8fCB5ZWFyID49IDFlNCA/ICh5ZWFyIDwgMCA/IFwiLVwiIDogXCIrXCIpICsgdG9QYWRkZWRTdHJpbmcoNiwgeWVhciA8IDAgPyAteWVhciA6IHllYXIpIDogdG9QYWRkZWRTdHJpbmcoNCwgeWVhcikpICtcbiAgICAgICAgICAgICAgICAgIFwiLVwiICsgdG9QYWRkZWRTdHJpbmcoMiwgbW9udGggKyAxKSArIFwiLVwiICsgdG9QYWRkZWRTdHJpbmcoMiwgZGF0ZSkgK1xuICAgICAgICAgICAgICAgICAgLy8gTW9udGhzLCBkYXRlcywgaG91cnMsIG1pbnV0ZXMsIGFuZCBzZWNvbmRzIHNob3VsZCBoYXZlIHR3b1xuICAgICAgICAgICAgICAgICAgLy8gZGlnaXRzOyBtaWxsaXNlY29uZHMgc2hvdWxkIGhhdmUgdGhyZWUuXG4gICAgICAgICAgICAgICAgICBcIlRcIiArIHRvUGFkZGVkU3RyaW5nKDIsIGhvdXJzKSArIFwiOlwiICsgdG9QYWRkZWRTdHJpbmcoMiwgbWludXRlcykgKyBcIjpcIiArIHRvUGFkZGVkU3RyaW5nKDIsIHNlY29uZHMpICtcbiAgICAgICAgICAgICAgICAgIC8vIE1pbGxpc2Vjb25kcyBhcmUgb3B0aW9uYWwgaW4gRVMgNS4wLCBidXQgcmVxdWlyZWQgaW4gNS4xLlxuICAgICAgICAgICAgICAgICAgXCIuXCIgKyB0b1BhZGRlZFN0cmluZygzLCBtaWxsaXNlY29uZHMpICsgXCJaXCI7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZS50b0pTT04gPT0gXCJmdW5jdGlvblwiICYmICgoY2xhc3NOYW1lICE9IG51bWJlckNsYXNzICYmIGNsYXNzTmFtZSAhPSBzdHJpbmdDbGFzcyAmJiBjbGFzc05hbWUgIT0gYXJyYXlDbGFzcykgfHwgaXNQcm9wZXJ0eS5jYWxsKHZhbHVlLCBcInRvSlNPTlwiKSkpIHtcbiAgICAgICAgICAgICAgLy8gUHJvdG90eXBlIDw9IDEuNi4xIGFkZHMgbm9uLXN0YW5kYXJkIGB0b0pTT05gIG1ldGhvZHMgdG8gdGhlXG4gICAgICAgICAgICAgIC8vIGBOdW1iZXJgLCBgU3RyaW5nYCwgYERhdGVgLCBhbmQgYEFycmF5YCBwcm90b3R5cGVzLiBKU09OIDNcbiAgICAgICAgICAgICAgLy8gaWdub3JlcyBhbGwgYHRvSlNPTmAgbWV0aG9kcyBvbiB0aGVzZSBvYmplY3RzIHVubGVzcyB0aGV5IGFyZVxuICAgICAgICAgICAgICAvLyBkZWZpbmVkIGRpcmVjdGx5IG9uIGFuIGluc3RhbmNlLlxuICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvSlNPTihwcm9wZXJ0eSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgLy8gSWYgYSByZXBsYWNlbWVudCBmdW5jdGlvbiB3YXMgcHJvdmlkZWQsIGNhbGwgaXQgdG8gb2J0YWluIHRoZSB2YWx1ZVxuICAgICAgICAgICAgLy8gZm9yIHNlcmlhbGl6YXRpb24uXG4gICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmNhbGwob2JqZWN0LCBwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIm51bGxcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBib29sZWFuQ2xhc3MpIHtcbiAgICAgICAgICAgIC8vIEJvb2xlYW5zIGFyZSByZXByZXNlbnRlZCBsaXRlcmFsbHkuXG4gICAgICAgICAgICByZXR1cm4gXCJcIiArIHZhbHVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IG51bWJlckNsYXNzKSB7XG4gICAgICAgICAgICAvLyBKU09OIG51bWJlcnMgbXVzdCBiZSBmaW5pdGUuIGBJbmZpbml0eWAgYW5kIGBOYU5gIGFyZSBzZXJpYWxpemVkIGFzXG4gICAgICAgICAgICAvLyBgXCJudWxsXCJgLlxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlID4gLTEgLyAwICYmIHZhbHVlIDwgMSAvIDAgPyBcIlwiICsgdmFsdWUgOiBcIm51bGxcIjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcykge1xuICAgICAgICAgICAgLy8gU3RyaW5ncyBhcmUgZG91YmxlLXF1b3RlZCBhbmQgZXNjYXBlZC5cbiAgICAgICAgICAgIHJldHVybiBxdW90ZShcIlwiICsgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBSZWN1cnNpdmVseSBzZXJpYWxpemUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGlzIGlzIGEgbGluZWFyIHNlYXJjaDsgcGVyZm9ybWFuY2VcbiAgICAgICAgICAgIC8vIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZiB1bmlxdWUgbmVzdGVkIG9iamVjdHMuXG4gICAgICAgICAgICBmb3IgKGxlbmd0aCA9IHN0YWNrLmxlbmd0aDsgbGVuZ3RoLS07KSB7XG4gICAgICAgICAgICAgIGlmIChzdGFja1tsZW5ndGhdID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIC8vIEN5Y2xpYyBzdHJ1Y3R1cmVzIGNhbm5vdCBiZSBzZXJpYWxpemVkIGJ5IGBKU09OLnN0cmluZ2lmeWAuXG4gICAgICAgICAgICAgICAgdGhyb3cgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEFkZCB0aGUgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICAgICAgICAgIHN0YWNrLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgLy8gU2F2ZSB0aGUgY3VycmVudCBpbmRlbnRhdGlvbiBsZXZlbCBhbmQgaW5kZW50IG9uZSBhZGRpdGlvbmFsIGxldmVsLlxuICAgICAgICAgICAgcHJlZml4ID0gaW5kZW50YXRpb247XG4gICAgICAgICAgICBpbmRlbnRhdGlvbiArPSB3aGl0ZXNwYWNlO1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzKSB7XG4gICAgICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZSBhcnJheSBlbGVtZW50cy5cbiAgICAgICAgICAgICAgZm9yIChpbmRleCA9IDAsIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gc2VyaWFsaXplKGluZGV4LCB2YWx1ZSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLCBzdGFjayk7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGVsZW1lbnQgPT09IHVuZGVmID8gXCJudWxsXCIgOiBlbGVtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHRzLmxlbmd0aCA/ICh3aGl0ZXNwYWNlID8gXCJbXFxuXCIgKyBpbmRlbnRhdGlvbiArIHJlc3VsdHMuam9pbihcIixcXG5cIiArIGluZGVudGF0aW9uKSArIFwiXFxuXCIgKyBwcmVmaXggKyBcIl1cIiA6IChcIltcIiArIHJlc3VsdHMuam9pbihcIixcIikgKyBcIl1cIikpIDogXCJbXVwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIG9iamVjdCBtZW1iZXJzLiBNZW1iZXJzIGFyZSBzZWxlY3RlZCBmcm9tXG4gICAgICAgICAgICAgIC8vIGVpdGhlciBhIHVzZXItc3BlY2lmaWVkIGxpc3Qgb2YgcHJvcGVydHkgbmFtZXMsIG9yIHRoZSBvYmplY3RcbiAgICAgICAgICAgICAgLy8gaXRzZWxmLlxuICAgICAgICAgICAgICBmb3JFYWNoKHByb3BlcnRpZXMgfHwgdmFsdWUsIGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIHZhciBlbGVtZW50ID0gc2VyaWFsaXplKHByb3BlcnR5LCB2YWx1ZSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLCBzdGFjayk7XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgIT09IHVuZGVmKSB7XG4gICAgICAgICAgICAgICAgICAvLyBBY2NvcmRpbmcgdG8gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMzogXCJJZiBgZ2FwYCB7d2hpdGVzcGFjZX1cbiAgICAgICAgICAgICAgICAgIC8vIGlzIG5vdCB0aGUgZW1wdHkgc3RyaW5nLCBsZXQgYG1lbWJlcmAge3F1b3RlKHByb3BlcnR5KSArIFwiOlwifVxuICAgICAgICAgICAgICAgICAgLy8gYmUgdGhlIGNvbmNhdGVuYXRpb24gb2YgYG1lbWJlcmAgYW5kIHRoZSBgc3BhY2VgIGNoYXJhY3Rlci5cIlxuICAgICAgICAgICAgICAgICAgLy8gVGhlIFwiYHNwYWNlYCBjaGFyYWN0ZXJcIiByZWZlcnMgdG8gdGhlIGxpdGVyYWwgc3BhY2VcbiAgICAgICAgICAgICAgICAgIC8vIGNoYXJhY3Rlciwgbm90IHRoZSBgc3BhY2VgIHt3aWR0aH0gYXJndW1lbnQgcHJvdmlkZWQgdG9cbiAgICAgICAgICAgICAgICAgIC8vIGBKU09OLnN0cmluZ2lmeWAuXG4gICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gocXVvdGUocHJvcGVydHkpICsgXCI6XCIgKyAod2hpdGVzcGFjZSA/IFwiIFwiIDogXCJcIikgKyBlbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHRzLmxlbmd0aCA/ICh3aGl0ZXNwYWNlID8gXCJ7XFxuXCIgKyBpbmRlbnRhdGlvbiArIHJlc3VsdHMuam9pbihcIixcXG5cIiArIGluZGVudGF0aW9uKSArIFwiXFxuXCIgKyBwcmVmaXggKyBcIn1cIiA6IChcIntcIiArIHJlc3VsdHMuam9pbihcIixcIikgKyBcIn1cIikpIDogXCJ7fVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBvYmplY3QgZnJvbSB0aGUgdHJhdmVyc2VkIG9iamVjdCBzdGFjay5cbiAgICAgICAgICAgIHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUHVibGljOiBgSlNPTi5zdHJpbmdpZnlgLiBTZWUgRVMgNS4xIHNlY3Rpb24gMTUuMTIuMy5cbiAgICAgICAgZXhwb3J0cy5zdHJpbmdpZnkgPSBmdW5jdGlvbiAoc291cmNlLCBmaWx0ZXIsIHdpZHRoKSB7XG4gICAgICAgICAgdmFyIHdoaXRlc3BhY2UsIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCBjbGFzc05hbWU7XG4gICAgICAgICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT0gXCJmdW5jdGlvblwiIHx8IHR5cGVvZiBmaWx0ZXIgPT0gXCJvYmplY3RcIiAmJiBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbChmaWx0ZXIpKSA9PSBmdW5jdGlvbkNsYXNzKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrID0gZmlsdGVyO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gYXJyYXlDbGFzcykge1xuICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBwcm9wZXJ0eSBuYW1lcyBhcnJheSBpbnRvIGEgbWFrZXNoaWZ0IHNldC5cbiAgICAgICAgICAgICAgcHJvcGVydGllcyA9IHt9O1xuICAgICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDAsIGxlbmd0aCA9IGZpbHRlci5sZW5ndGgsIHZhbHVlOyBpbmRleCA8IGxlbmd0aDsgdmFsdWUgPSBmaWx0ZXJbaW5kZXgrK10sICgoY2xhc3NOYW1lID0gZ2V0Q2xhc3MuY2FsbCh2YWx1ZSkpLCBjbGFzc05hbWUgPT0gc3RyaW5nQ2xhc3MgfHwgY2xhc3NOYW1lID09IG51bWJlckNsYXNzKSAmJiAocHJvcGVydGllc1t2YWx1ZV0gPSAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh3aWR0aCkge1xuICAgICAgICAgICAgaWYgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHdpZHRoKSkgPT0gbnVtYmVyQ2xhc3MpIHtcbiAgICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgYHdpZHRoYCB0byBhbiBpbnRlZ2VyIGFuZCBjcmVhdGUgYSBzdHJpbmcgY29udGFpbmluZ1xuICAgICAgICAgICAgICAvLyBgd2lkdGhgIG51bWJlciBvZiBzcGFjZSBjaGFyYWN0ZXJzLlxuICAgICAgICAgICAgICBpZiAoKHdpZHRoIC09IHdpZHRoICUgMSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgZm9yICh3aGl0ZXNwYWNlID0gXCJcIiwgd2lkdGggPiAxMCAmJiAod2lkdGggPSAxMCk7IHdoaXRlc3BhY2UubGVuZ3RoIDwgd2lkdGg7IHdoaXRlc3BhY2UgKz0gXCIgXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcykge1xuICAgICAgICAgICAgICB3aGl0ZXNwYWNlID0gd2lkdGgubGVuZ3RoIDw9IDEwID8gd2lkdGggOiB3aWR0aC5zbGljZSgwLCAxMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIE9wZXJhIDw9IDcuNTR1MiBkaXNjYXJkcyB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBlbXB0eSBzdHJpbmcga2V5c1xuICAgICAgICAgIC8vIChgXCJcImApIG9ubHkgaWYgdGhleSBhcmUgdXNlZCBkaXJlY3RseSB3aXRoaW4gYW4gb2JqZWN0IG1lbWJlciBsaXN0XG4gICAgICAgICAgLy8gKGUuZy4sIGAhKFwiXCIgaW4geyBcIlwiOiAxfSlgKS5cbiAgICAgICAgICByZXR1cm4gc2VyaWFsaXplKFwiXCIsICh2YWx1ZSA9IHt9LCB2YWx1ZVtcIlwiXSA9IHNvdXJjZSwgdmFsdWUpLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgXCJcIiwgW10pO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLyBQdWJsaWM6IFBhcnNlcyBhIEpTT04gc291cmNlIHN0cmluZy5cbiAgICAgIGlmICghaGFzKFwianNvbi1wYXJzZVwiKSkge1xuICAgICAgICB2YXIgZnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogQSBtYXAgb2YgZXNjYXBlZCBjb250cm9sIGNoYXJhY3RlcnMgYW5kIHRoZWlyIHVuZXNjYXBlZFxuICAgICAgICAvLyBlcXVpdmFsZW50cy5cbiAgICAgICAgdmFyIFVuZXNjYXBlcyA9IHtcbiAgICAgICAgICA5MjogXCJcXFxcXCIsXG4gICAgICAgICAgMzQ6ICdcIicsXG4gICAgICAgICAgNDc6IFwiL1wiLFxuICAgICAgICAgIDk4OiBcIlxcYlwiLFxuICAgICAgICAgIDExNjogXCJcXHRcIixcbiAgICAgICAgICAxMTA6IFwiXFxuXCIsXG4gICAgICAgICAgMTAyOiBcIlxcZlwiLFxuICAgICAgICAgIDExNDogXCJcXHJcIlxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBTdG9yZXMgdGhlIHBhcnNlciBzdGF0ZS5cbiAgICAgICAgdmFyIEluZGV4LCBTb3VyY2U7XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFJlc2V0cyB0aGUgcGFyc2VyIHN0YXRlIGFuZCB0aHJvd3MgYSBgU3ludGF4RXJyb3JgLlxuICAgICAgICB2YXIgYWJvcnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgSW5kZXggPSBTb3VyY2UgPSBudWxsO1xuICAgICAgICAgIHRocm93IFN5bnRheEVycm9yKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFJldHVybnMgdGhlIG5leHQgdG9rZW4sIG9yIGBcIiRcImAgaWYgdGhlIHBhcnNlciBoYXMgcmVhY2hlZFxuICAgICAgICAvLyB0aGUgZW5kIG9mIHRoZSBzb3VyY2Ugc3RyaW5nLiBBIHRva2VuIG1heSBiZSBhIHN0cmluZywgbnVtYmVyLCBgbnVsbGBcbiAgICAgICAgLy8gbGl0ZXJhbCwgb3IgQm9vbGVhbiBsaXRlcmFsLlxuICAgICAgICB2YXIgbGV4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBzb3VyY2UgPSBTb3VyY2UsIGxlbmd0aCA9IHNvdXJjZS5sZW5ndGgsIHZhbHVlLCBiZWdpbiwgcG9zaXRpb24sIGlzU2lnbmVkLCBjaGFyQ29kZTtcbiAgICAgICAgICB3aGlsZSAoSW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xuICAgICAgICAgICAgICBjYXNlIDk6IGNhc2UgMTA6IGNhc2UgMTM6IGNhc2UgMzI6XG4gICAgICAgICAgICAgICAgLy8gU2tpcCB3aGl0ZXNwYWNlIHRva2VucywgaW5jbHVkaW5nIHRhYnMsIGNhcnJpYWdlIHJldHVybnMsIGxpbmVcbiAgICAgICAgICAgICAgICAvLyBmZWVkcywgYW5kIHNwYWNlIGNoYXJhY3RlcnMuXG4gICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAxMjM6IGNhc2UgMTI1OiBjYXNlIDkxOiBjYXNlIDkzOiBjYXNlIDU4OiBjYXNlIDQ0OlxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIGEgcHVuY3R1YXRvciB0b2tlbiAoYHtgLCBgfWAsIGBbYCwgYF1gLCBgOmAsIG9yIGAsYCkgYXRcbiAgICAgICAgICAgICAgICAvLyB0aGUgY3VycmVudCBwb3NpdGlvbi5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGNoYXJJbmRleEJ1Z2d5ID8gc291cmNlLmNoYXJBdChJbmRleCkgOiBzb3VyY2VbSW5kZXhdO1xuICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICBjYXNlIDM0OlxuICAgICAgICAgICAgICAgIC8vIGBcImAgZGVsaW1pdHMgYSBKU09OIHN0cmluZzsgYWR2YW5jZSB0byB0aGUgbmV4dCBjaGFyYWN0ZXIgYW5kXG4gICAgICAgICAgICAgICAgLy8gYmVnaW4gcGFyc2luZyB0aGUgc3RyaW5nLiBTdHJpbmcgdG9rZW5zIGFyZSBwcmVmaXhlZCB3aXRoIHRoZVxuICAgICAgICAgICAgICAgIC8vIHNlbnRpbmVsIGBAYCBjaGFyYWN0ZXIgdG8gZGlzdGluZ3Vpc2ggdGhlbSBmcm9tIHB1bmN0dWF0b3JzIGFuZFxuICAgICAgICAgICAgICAgIC8vIGVuZC1vZi1zdHJpbmcgdG9rZW5zLlxuICAgICAgICAgICAgICAgIGZvciAodmFsdWUgPSBcIkBcIiwgSW5kZXgrKzsgSW5kZXggPCBsZW5ndGg7KSB7XG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA8IDMyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZXNjYXBlZCBBU0NJSSBjb250cm9sIGNoYXJhY3RlcnMgKHRob3NlIHdpdGggYSBjb2RlIHVuaXRcbiAgICAgICAgICAgICAgICAgICAgLy8gbGVzcyB0aGFuIHRoZSBzcGFjZSBjaGFyYWN0ZXIpIGFyZSBub3QgcGVybWl0dGVkLlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaGFyQ29kZSA9PSA5Mikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIHJldmVyc2Ugc29saWR1cyAoYFxcYCkgbWFya3MgdGhlIGJlZ2lubmluZyBvZiBhbiBlc2NhcGVkXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnRyb2wgY2hhcmFjdGVyIChpbmNsdWRpbmcgYFwiYCwgYFxcYCwgYW5kIGAvYCkgb3IgVW5pY29kZVxuICAgICAgICAgICAgICAgICAgICAvLyBlc2NhcGUgc2VxdWVuY2UuXG4gICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoY2hhckNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIDkyOiBjYXNlIDM0OiBjYXNlIDQ3OiBjYXNlIDk4OiBjYXNlIDExNjogY2FzZSAxMTA6IGNhc2UgMTAyOiBjYXNlIDExNDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldml2ZSBlc2NhcGVkIGNvbnRyb2wgY2hhcmFjdGVycy5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IFVuZXNjYXBlc1tjaGFyQ29kZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSAxMTc6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBgXFx1YCBtYXJrcyB0aGUgYmVnaW5uaW5nIG9mIGEgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHRvIHRoZSBmaXJzdCBjaGFyYWN0ZXIgYW5kIHZhbGlkYXRlIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm91ci1kaWdpdCBjb2RlIHBvaW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgYmVnaW4gPSArK0luZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChwb3NpdGlvbiA9IEluZGV4ICsgNDsgSW5kZXggPCBwb3NpdGlvbjsgSW5kZXgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQSB2YWxpZCBzZXF1ZW5jZSBjb21wcmlzZXMgZm91ciBoZXhkaWdpdHMgKGNhc2UtXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluc2Vuc2l0aXZlKSB0aGF0IGZvcm0gYSBzaW5nbGUgaGV4YWRlY2ltYWwgdmFsdWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3IHx8IGNoYXJDb2RlID49IDk3ICYmIGNoYXJDb2RlIDw9IDEwMiB8fCBjaGFyQ29kZSA+PSA2NSAmJiBjaGFyQ29kZSA8PSA3MCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnZhbGlkIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldml2ZSB0aGUgZXNjYXBlZCBjaGFyYWN0ZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSArPSBmcm9tQ2hhckNvZGUoXCIweFwiICsgc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludmFsaWQgZXNjYXBlIHNlcXVlbmNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDM0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gQW4gdW5lc2NhcGVkIGRvdWJsZS1xdW90ZSBjaGFyYWN0ZXIgbWFya3MgdGhlIGVuZCBvZiB0aGVcbiAgICAgICAgICAgICAgICAgICAgICAvLyBzdHJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luID0gSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIC8vIE9wdGltaXplIGZvciB0aGUgY29tbW9uIGNhc2Ugd2hlcmUgYSBzdHJpbmcgaXMgdmFsaWQuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChjaGFyQ29kZSA+PSAzMiAmJiBjaGFyQ29kZSAhPSA5MiAmJiBjaGFyQ29kZSAhPSAzNCkge1xuICAgICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gQXBwZW5kIHRoZSBzdHJpbmcgYXMtaXMuXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IHNvdXJjZS5zbGljZShiZWdpbiwgSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpID09IDM0KSB7XG4gICAgICAgICAgICAgICAgICAvLyBBZHZhbmNlIHRvIHRoZSBuZXh0IGNoYXJhY3RlciBhbmQgcmV0dXJuIHRoZSByZXZpdmVkIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFVudGVybWluYXRlZCBzdHJpbmcuXG4gICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBudW1iZXJzIGFuZCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBiZWdpbiA9IEluZGV4O1xuICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgcGFzdCB0aGUgbmVnYXRpdmUgc2lnbiwgaWYgb25lIGlzIHNwZWNpZmllZC5cbiAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDUpIHtcbiAgICAgICAgICAgICAgICAgIGlzU2lnbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoKytJbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIGFuIGludGVnZXIgb3IgZmxvYXRpbmctcG9pbnQgdmFsdWUuXG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KSB7XG4gICAgICAgICAgICAgICAgICAvLyBMZWFkaW5nIHplcm9lcyBhcmUgaW50ZXJwcmV0ZWQgYXMgb2N0YWwgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gNDggJiYgKChjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4ICsgMSkpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1NykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCBvY3RhbCBsaXRlcmFsLlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaXNTaWduZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBpbnRlZ2VyIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgICAgIGZvciAoOyBJbmRleCA8IGxlbmd0aCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpOyBJbmRleCsrKTtcbiAgICAgICAgICAgICAgICAgIC8vIEZsb2F0cyBjYW5ub3QgY29udGFpbiBhIGxlYWRpbmcgZGVjaW1hbCBwb2ludDsgaG93ZXZlciwgdGhpc1xuICAgICAgICAgICAgICAgICAgLy8gY2FzZSBpcyBhbHJlYWR5IGFjY291bnRlZCBmb3IgYnkgdGhlIHBhcnNlci5cbiAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChJbmRleCkgPT0gNDYpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24gPSArK0luZGV4O1xuICAgICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgZGVjaW1hbCBjb21wb25lbnQuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoOyBwb3NpdGlvbiA8IGxlbmd0aCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQocG9zaXRpb24pKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpOyBwb3NpdGlvbisrKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09IEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCB0cmFpbGluZyBkZWNpbWFsLlxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgSW5kZXggPSBwb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIGV4cG9uZW50cy4gVGhlIGBlYCBkZW5vdGluZyB0aGUgZXhwb25lbnQgaXNcbiAgICAgICAgICAgICAgICAgIC8vIGNhc2UtaW5zZW5zaXRpdmUuXG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSAxMDEgfHwgY2hhckNvZGUgPT0gNjkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2tpcCBwYXN0IHRoZSBzaWduIGZvbGxvd2luZyB0aGUgZXhwb25lbnQsIGlmIG9uZSBpc1xuICAgICAgICAgICAgICAgICAgICAvLyBzcGVjaWZpZWQuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0MyB8fCBjaGFyQ29kZSA9PSA0NSkge1xuICAgICAgICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGV4cG9uZW50aWFsIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChwb3NpdGlvbiA9IEluZGV4OyBwb3NpdGlvbiA8IGxlbmd0aCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQocG9zaXRpb24pKSwgY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpOyBwb3NpdGlvbisrKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09IEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWxsZWdhbCBlbXB0eSBleHBvbmVudC5cbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIEluZGV4ID0gcG9zaXRpb247XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvLyBDb2VyY2UgdGhlIHBhcnNlZCB2YWx1ZSB0byBhIEphdmFTY3JpcHQgbnVtYmVyLlxuICAgICAgICAgICAgICAgICAgcmV0dXJuICtzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQSBuZWdhdGl2ZSBzaWduIG1heSBvbmx5IHByZWNlZGUgbnVtYmVycy5cbiAgICAgICAgICAgICAgICBpZiAoaXNTaWduZWQpIHtcbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGB0cnVlYCwgYGZhbHNlYCwgYW5kIGBudWxsYCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlLnNsaWNlKEluZGV4LCBJbmRleCArIDQpID09IFwidHJ1ZVwiKSB7XG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA0O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNSkgPT0gXCJmYWxzZVwiKSB7XG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA1O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc291cmNlLnNsaWNlKEluZGV4LCBJbmRleCArIDQpID09IFwibnVsbFwiKSB7XG4gICAgICAgICAgICAgICAgICBJbmRleCArPSA0O1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFVucmVjb2duaXplZCB0b2tlbi5cbiAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBSZXR1cm4gdGhlIHNlbnRpbmVsIGAkYCBjaGFyYWN0ZXIgaWYgdGhlIHBhcnNlciBoYXMgcmVhY2hlZCB0aGUgZW5kXG4gICAgICAgICAgLy8gb2YgdGhlIHNvdXJjZSBzdHJpbmcuXG4gICAgICAgICAgcmV0dXJuIFwiJFwiO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBQYXJzZXMgYSBKU09OIGB2YWx1ZWAgdG9rZW4uXG4gICAgICAgIHZhciBnZXQgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICB2YXIgcmVzdWx0cywgaGFzTWVtYmVycztcbiAgICAgICAgICBpZiAodmFsdWUgPT0gXCIkXCIpIHtcbiAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgZW5kIG9mIGlucHV0LlxuICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBpZiAoKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuY2hhckF0KDApIDogdmFsdWVbMF0pID09IFwiQFwiKSB7XG4gICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgc2VudGluZWwgYEBgIGNoYXJhY3Rlci5cbiAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnNsaWNlKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUGFyc2Ugb2JqZWN0IGFuZCBhcnJheSBsaXRlcmFscy5cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIltcIikge1xuICAgICAgICAgICAgICAvLyBQYXJzZXMgYSBKU09OIGFycmF5LCByZXR1cm5pbmcgYSBuZXcgSmF2YVNjcmlwdCBhcnJheS5cbiAgICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgICBmb3IgKDs7IGhhc01lbWJlcnMgfHwgKGhhc01lbWJlcnMgPSB0cnVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gbGV4KCk7XG4gICAgICAgICAgICAgICAgLy8gQSBjbG9zaW5nIHNxdWFyZSBicmFja2V0IG1hcmtzIHRoZSBlbmQgb2YgdGhlIGFycmF5IGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiXVwiKSB7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGFycmF5IGxpdGVyYWwgY29udGFpbnMgZWxlbWVudHMsIHRoZSBjdXJyZW50IHRva2VuXG4gICAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIGEgY29tbWEgc2VwYXJhdGluZyB0aGUgcHJldmlvdXMgZWxlbWVudCBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIG5leHQuXG4gICAgICAgICAgICAgICAgaWYgKGhhc01lbWJlcnMpIHtcbiAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJdXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRyYWlsaW5nIGAsYCBpbiBhcnJheSBsaXRlcmFsLlxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEEgYCxgIG11c3Qgc2VwYXJhdGUgZWFjaCBhcnJheSBlbGVtZW50LlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBFbGlzaW9ucyBhbmQgbGVhZGluZyBjb21tYXMgYXJlIG5vdCBwZXJtaXR0ZWQuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZ2V0KHZhbHVlKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09IFwie1wiKSB7XG4gICAgICAgICAgICAgIC8vIFBhcnNlcyBhIEpTT04gb2JqZWN0LCByZXR1cm5pbmcgYSBuZXcgSmF2YVNjcmlwdCBvYmplY3QuXG4gICAgICAgICAgICAgIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgICAgICAgZm9yICg7OyBoYXNNZW1iZXJzIHx8IChoYXNNZW1iZXJzID0gdHJ1ZSkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xuICAgICAgICAgICAgICAgIC8vIEEgY2xvc2luZyBjdXJseSBicmFjZSBtYXJrcyB0aGUgZW5kIG9mIHRoZSBvYmplY3QgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJ9XCIpIHtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgb2JqZWN0IGxpdGVyYWwgY29udGFpbnMgbWVtYmVycywgdGhlIGN1cnJlbnQgdG9rZW5cbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgYSBjb21tYSBzZXBhcmF0b3IuXG4gICAgICAgICAgICAgICAgaWYgKGhhc01lbWJlcnMpIHtcbiAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJ9XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRyYWlsaW5nIGAsYCBpbiBvYmplY3QgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIGAsYCBtdXN0IHNlcGFyYXRlIGVhY2ggb2JqZWN0IG1lbWJlci5cbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gTGVhZGluZyBjb21tYXMgYXJlIG5vdCBwZXJtaXR0ZWQsIG9iamVjdCBwcm9wZXJ0eSBuYW1lcyBtdXN0IGJlXG4gICAgICAgICAgICAgICAgLy8gZG91YmxlLXF1b3RlZCBzdHJpbmdzLCBhbmQgYSBgOmAgbXVzdCBzZXBhcmF0ZSBlYWNoIHByb3BlcnR5XG4gICAgICAgICAgICAgICAgLy8gbmFtZSBhbmQgdmFsdWUuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiIHx8IHR5cGVvZiB2YWx1ZSAhPSBcInN0cmluZ1wiIHx8IChjaGFySW5kZXhCdWdneSA/IHZhbHVlLmNoYXJBdCgwKSA6IHZhbHVlWzBdKSAhPSBcIkBcIiB8fCBsZXgoKSAhPSBcIjpcIikge1xuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0c1t2YWx1ZS5zbGljZSgxKV0gPSBnZXQobGV4KCkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVW5leHBlY3RlZCB0b2tlbiBlbmNvdW50ZXJlZC5cbiAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogVXBkYXRlcyBhIHRyYXZlcnNlZCBvYmplY3QgbWVtYmVyLlxuICAgICAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24gKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIGVsZW1lbnQgPSB3YWxrKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcbiAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gdW5kZWYpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBzb3VyY2VbcHJvcGVydHldO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb3VyY2VbcHJvcGVydHldID0gZWxlbWVudDtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFJlY3Vyc2l2ZWx5IHRyYXZlcnNlcyBhIHBhcnNlZCBKU09OIG9iamVjdCwgaW52b2tpbmcgdGhlXG4gICAgICAgIC8vIGBjYWxsYmFja2AgZnVuY3Rpb24gZm9yIGVhY2ggdmFsdWUuIFRoaXMgaXMgYW4gaW1wbGVtZW50YXRpb24gb2YgdGhlXG4gICAgICAgIC8vIGBXYWxrKGhvbGRlciwgbmFtZSlgIG9wZXJhdGlvbiBkZWZpbmVkIGluIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjIuXG4gICAgICAgIHZhciB3YWxrID0gZnVuY3Rpb24gKHNvdXJjZSwgcHJvcGVydHksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIHZhbHVlID0gc291cmNlW3Byb3BlcnR5XSwgbGVuZ3RoO1xuICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIiAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgLy8gYGZvckVhY2hgIGNhbid0IGJlIHVzZWQgdG8gdHJhdmVyc2UgYW4gYXJyYXkgaW4gT3BlcmEgPD0gOC41NFxuICAgICAgICAgICAgLy8gYmVjYXVzZSBpdHMgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgaW1wbGVtZW50YXRpb24gcmV0dXJucyBgZmFsc2VgXG4gICAgICAgICAgICAvLyBmb3IgYXJyYXkgaW5kaWNlcyAoZS5nLiwgYCFbMSwgMiwgM10uaGFzT3duUHJvcGVydHkoXCIwXCIpYCkuXG4gICAgICAgICAgICBpZiAoZ2V0Q2xhc3MuY2FsbCh2YWx1ZSkgPT0gYXJyYXlDbGFzcykge1xuICAgICAgICAgICAgICBmb3IgKGxlbmd0aCA9IHZhbHVlLmxlbmd0aDsgbGVuZ3RoLS07KSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlKHZhbHVlLCBsZW5ndGgsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZm9yRWFjaCh2YWx1ZSwgZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlKHZhbHVlLCBwcm9wZXJ0eSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmNhbGwoc291cmNlLCBwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFB1YmxpYzogYEpTT04ucGFyc2VgLiBTZWUgRVMgNS4xIHNlY3Rpb24gMTUuMTIuMi5cbiAgICAgICAgZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIChzb3VyY2UsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCwgdmFsdWU7XG4gICAgICAgICAgSW5kZXggPSAwO1xuICAgICAgICAgIFNvdXJjZSA9IFwiXCIgKyBzb3VyY2U7XG4gICAgICAgICAgcmVzdWx0ID0gZ2V0KGxleCgpKTtcbiAgICAgICAgICAvLyBJZiBhIEpTT04gc3RyaW5nIGNvbnRhaW5zIG11bHRpcGxlIHRva2VucywgaXQgaXMgaW52YWxpZC5cbiAgICAgICAgICBpZiAobGV4KCkgIT0gXCIkXCIpIHtcbiAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJlc2V0IHRoZSBwYXJzZXIgc3RhdGUuXG4gICAgICAgICAgSW5kZXggPSBTb3VyY2UgPSBudWxsO1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayAmJiBnZXRDbGFzcy5jYWxsKGNhbGxiYWNrKSA9PSBmdW5jdGlvbkNsYXNzID8gd2FsaygodmFsdWUgPSB7fSwgdmFsdWVbXCJcIl0gPSByZXN1bHQsIHZhbHVlKSwgXCJcIiwgY2FsbGJhY2spIDogcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydHNbXCJydW5JbkNvbnRleHRcIl0gPSBydW5JbkNvbnRleHQ7XG4gICAgcmV0dXJuIGV4cG9ydHM7XG4gIH1cblxuICBpZiAodHlwZW9mIGV4cG9ydHMgPT0gXCJvYmplY3RcIiAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlICYmICFpc0xvYWRlcikge1xuICAgIC8vIEV4cG9ydCBmb3IgQ29tbW9uSlMgZW52aXJvbm1lbnRzLlxuICAgIHJ1bkluQ29udGV4dChyb290LCBleHBvcnRzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBFeHBvcnQgZm9yIHdlYiBicm93c2VycyBhbmQgSmF2YVNjcmlwdCBlbmdpbmVzLlxuICAgIHZhciBuYXRpdmVKU09OID0gcm9vdC5KU09OO1xuICAgIHZhciBKU09OMyA9IHJ1bkluQ29udGV4dChyb290LCAocm9vdFtcIkpTT04zXCJdID0ge1xuICAgICAgLy8gUHVibGljOiBSZXN0b3JlcyB0aGUgb3JpZ2luYWwgdmFsdWUgb2YgdGhlIGdsb2JhbCBgSlNPTmAgb2JqZWN0IGFuZFxuICAgICAgLy8gcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgYEpTT04zYCBvYmplY3QuXG4gICAgICBcIm5vQ29uZmxpY3RcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICByb290LkpTT04gPSBuYXRpdmVKU09OO1xuICAgICAgICByZXR1cm4gSlNPTjM7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgcm9vdC5KU09OID0ge1xuICAgICAgXCJwYXJzZVwiOiBKU09OMy5wYXJzZSxcbiAgICAgIFwic3RyaW5naWZ5XCI6IEpTT04zLnN0cmluZ2lmeVxuICAgIH07XG4gIH1cblxuICAvLyBFeHBvcnQgZm9yIGFzeW5jaHJvbm91cyBtb2R1bGUgbG9hZGVycy5cbiAgaWYgKGlzTG9hZGVyKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBKU09OMztcbiAgICB9KTtcbiAgfVxufSh0aGlzKSk7XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBUaGlzIGlzIGEgcmVwb3J0ZXIgdGhhdCBtaW1pY3MgTW9jaGEncyBgZG90YCByZXBvcnRlclxuXG52YXIgUiA9IHJlcXVpcmUoXCIuLi9saWIvcmVwb3J0ZXJcIilcblxuZnVuY3Rpb24gd2lkdGgoKSB7XG4gICAgcmV0dXJuIFIuQ29uc29sZS53aW5kb3dXaWR0aCAqIDQgLyAzIHwgMFxufVxuXG5mdW5jdGlvbiBwcmludERvdChfLCBjb2xvcikge1xuICAgIGZ1bmN0aW9uIGVtaXQoKSB7XG4gICAgICAgIHJldHVybiBfLndyaXRlKFIuY29sb3IoY29sb3IsIGNvbG9yID09PSBcImZhaWxcIlxuICAgICAgICAgICAgICAgID8gUi5Db25zb2xlLnN5bWJvbHMuRG90RmFpbFxuICAgICAgICAgICAgICAgIDogUi5Db25zb2xlLnN5bWJvbHMuRG90KSlcbiAgICB9XG5cbiAgICBpZiAoXy5zdGF0ZS5jb3VudGVyKysgJSB3aWR0aCgpID09PSAwKSB7XG4gICAgICAgIHJldHVybiBfLndyaXRlKFIuQ29uc29sZS5uZXdsaW5lICsgXCIgIFwiKS50aGVuKGVtaXQpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGVtaXQoKVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSLm9uKFwiZG90XCIsIHtcbiAgICBhY2NlcHRzOiBbXCJ3cml0ZVwiLCBcInJlc2V0XCIsIFwiY29sb3JzXCJdLFxuICAgIGNyZWF0ZTogUi5jb25zb2xlUmVwb3J0ZXIsXG4gICAgYmVmb3JlOiBSLnNldENvbG9yLFxuICAgIGFmdGVyOiBSLnVuc2V0Q29sb3IsXG4gICAgaW5pdDogZnVuY3Rpb24gKHN0YXRlKSB7IHN0YXRlLmNvdW50ZXIgPSAwIH0sXG5cbiAgICByZXBvcnQ6IGZ1bmN0aW9uIChfLCByZXBvcnQpIHtcbiAgICAgICAgaWYgKHJlcG9ydC5pc0VudGVyIHx8IHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludERvdChfLCBSLnNwZWVkKHJlcG9ydCkpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzSG9vayB8fCByZXBvcnQuaXNGYWlsKSB7XG4gICAgICAgICAgICBfLnB1c2hFcnJvcihyZXBvcnQpXG4gICAgICAgICAgICAvLyBQcmludCBhIGRvdCByZWdhcmRsZXNzIG9mIGhvb2sgc3VjY2Vzc1xuICAgICAgICAgICAgcmV0dXJuIHByaW50RG90KF8sIFwiZmFpbFwiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludERvdChfLCBcInNraXBcIilcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFbmQpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KCkudGhlbihfLnByaW50UmVzdWx0cy5iaW5kKF8pKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0Vycm9yKSB7XG4gICAgICAgICAgICBpZiAoXy5zdGF0ZS5jb3VudGVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoKS50aGVuKF8ucHJpbnRFcnJvci5iaW5kKF8sIHJlcG9ydCkpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50RXJyb3IocmVwb3J0KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9XG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG5leHBvcnRzLmRvdCA9IHJlcXVpcmUoXCIuL2RvdFwiKVxuZXhwb3J0cy5zcGVjID0gcmVxdWlyZShcIi4vc3BlY1wiKVxuZXhwb3J0cy50YXAgPSByZXF1aXJlKFwiLi90YXBcIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRoaXMgaXMgYSByZXBvcnRlciB0aGF0IG1pbWljcyBNb2NoYSdzIGBzcGVjYCByZXBvcnRlci5cblxudmFyIFIgPSByZXF1aXJlKFwiLi4vbGliL3JlcG9ydGVyXCIpXG5cbmZ1bmN0aW9uIGluZGVudChsZXZlbCkge1xuICAgIHZhciByZXQgPSBcIlwiXG5cbiAgICB3aGlsZSAobGV2ZWwtLSkgcmV0ICs9IFwiICBcIlxuICAgIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZShsZXZlbCwgcmVwb3J0KSB7XG4gICAgcmV0dXJuIHJlcG9ydC5wYXRoW2xldmVsIC0gMV0ubmFtZVxufVxuXG5mdW5jdGlvbiBwcmludFJlcG9ydChfLCByZXBvcnQsIGluaXQpIHtcbiAgICBpZiAoXy5zdGF0ZS5sZWF2aW5nKSB7XG4gICAgICAgIF8uc3RhdGUubGVhdmluZyA9IGZhbHNlXG4gICAgICAgIHJldHVybiBfLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gXy5wcmludChpbmRlbnQoXy5zdGF0ZS5sZXZlbCkgKyBpbml0KCkpXG4gICAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoaW5kZW50KF8uc3RhdGUubGV2ZWwpICsgaW5pdCgpKVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSLm9uKFwic3BlY1wiLCB7XG4gICAgYWNjZXB0czogW1wid3JpdGVcIiwgXCJyZXNldFwiLCBcImNvbG9yc1wiXSxcbiAgICBjcmVhdGU6IFIuY29uc29sZVJlcG9ydGVyLFxuICAgIGJlZm9yZTogUi5zZXRDb2xvcixcbiAgICBhZnRlcjogUi51bnNldENvbG9yLFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHN0YXRlLmxldmVsID0gMVxuICAgICAgICBzdGF0ZS5sZWF2aW5nID0gZmFsc2VcbiAgICB9LFxuXG4gICAgcmVwb3J0OiBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgICAgIGlmIChyZXBvcnQuaXNTdGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyKSB7XG4gICAgICAgICAgICB2YXIgbGV2ZWwgPSBfLnN0YXRlLmxldmVsKytcbiAgICAgICAgICAgIHZhciBsYXN0ID0gcmVwb3J0LnBhdGhbbGV2ZWwgLSAxXVxuXG4gICAgICAgICAgICBfLnN0YXRlLmxlYXZpbmcgPSBmYWxzZVxuICAgICAgICAgICAgaWYgKGxhc3QuaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5wcmludCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5wcmludChpbmRlbnQobGV2ZWwpICsgbGFzdC5uYW1lKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLnByaW50KGluZGVudChsZXZlbCkgKyBsYXN0Lm5hbWUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzTGVhdmUpIHtcbiAgICAgICAgICAgIF8uc3RhdGUubGV2ZWwtLVxuICAgICAgICAgICAgXy5zdGF0ZS5sZWF2aW5nID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludFJlcG9ydChfLCByZXBvcnQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RyID1cbiAgICAgICAgICAgICAgICAgICAgUi5jb2xvcihcImNoZWNrbWFya1wiLCBSLkNvbnNvbGUuc3ltYm9scy5QYXNzICsgXCIgXCIpICtcbiAgICAgICAgICAgICAgICAgICAgUi5jb2xvcihcInBhc3NcIiwgZ2V0TmFtZShfLnN0YXRlLmxldmVsLCByZXBvcnQpKVxuXG4gICAgICAgICAgICAgICAgdmFyIHNwZWVkID0gUi5zcGVlZChyZXBvcnQpXG5cbiAgICAgICAgICAgICAgICBpZiAoc3BlZWQgIT09IFwiZmFzdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ciArPSBSLmNvbG9yKHNwZWVkLCBcIiAoXCIgKyByZXBvcnQuZHVyYXRpb24gKyBcIm1zKVwiKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBzdHJcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzSG9vayB8fCByZXBvcnQuaXNGYWlsKSB7XG4gICAgICAgICAgICBfLnB1c2hFcnJvcihyZXBvcnQpXG5cbiAgICAgICAgICAgIC8vIERvbid0IHByaW50IHRoZSBkZXNjcmlwdGlvbiBsaW5lIG9uIGN1bXVsYXRpdmUgaG9va3NcbiAgICAgICAgICAgIGlmIChyZXBvcnQuaXNIb29rICYmIChyZXBvcnQuaXNCZWZvcmVBbGwgfHwgcmVwb3J0LmlzQWZ0ZXJBbGwpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcHJpbnRSZXBvcnQoXywgcmVwb3J0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFIuY29sb3IoXCJmYWlsXCIsXG4gICAgICAgICAgICAgICAgICAgIF8uZXJyb3JzLmxlbmd0aCArIFwiKSBcIiArIGdldE5hbWUoXy5zdGF0ZS5sZXZlbCwgcmVwb3J0KSArXG4gICAgICAgICAgICAgICAgICAgIFIuZm9ybWF0UmVzdChyZXBvcnQpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNTa2lwKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJpbnRSZXBvcnQoXywgcmVwb3J0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFIuY29sb3IoXCJza2lwXCIsIFwiLSBcIiArIGdldE5hbWUoXy5zdGF0ZS5sZXZlbCwgcmVwb3J0KSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVwb3J0LmlzRW5kKSByZXR1cm4gXy5wcmludFJlc3VsdHMoKVxuICAgICAgICBpZiAocmVwb3J0LmlzRXJyb3IpIHJldHVybiBfLnByaW50RXJyb3IocmVwb3J0KVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBUaGlzIGlzIGEgYmFzaWMgVEFQLWdlbmVyYXRpbmcgcmVwb3J0ZXIuXG5cbnZhciBwZWFjaCA9IHJlcXVpcmUoXCIuLi9saWIvdXRpbFwiKS5wZWFjaFxudmFyIFIgPSByZXF1aXJlKFwiLi4vbGliL3JlcG9ydGVyXCIpXG52YXIgaW5zcGVjdCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKS5pbnNwZWN0XG5cbmZ1bmN0aW9uIHNob3VsZEJyZWFrKG1pbkxlbmd0aCwgc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5sZW5ndGggPiBSLkNvbnNvbGUud2luZG93V2lkdGggLSBtaW5MZW5ndGggfHxcbiAgICAgICAgL1xccj9cXG58Wzo/LV0vLnRlc3Qoc3RyKVxufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZShfLCByZXBvcnQsIHRtcGwsIHNraXApIHtcbiAgICBpZiAoIXNraXApIF8uc3RhdGUuY291bnRlcisrXG4gICAgdmFyIHBhdGggPSBSLmpvaW5QYXRoKHJlcG9ydCkucmVwbGFjZSgvXFwkL2csIFwiJCQkJFwiKVxuXG4gICAgcmV0dXJuIF8ucHJpbnQoXG4gICAgICAgIHRtcGwucmVwbGFjZSgvJWMvZywgXy5zdGF0ZS5jb3VudGVyKVxuICAgICAgICAgICAgLnJlcGxhY2UoLyVwL2csIHBhdGggKyBSLmZvcm1hdFJlc3QocmVwb3J0KSkpXG59XG5cbmZ1bmN0aW9uIHByaW50TGluZXMoXywgdmFsdWUsIHNraXBGaXJzdCkge1xuICAgIHZhciBsaW5lcyA9IHZhbHVlLnNwbGl0KC9cXHI/XFxuL2cpXG5cbiAgICBpZiAoc2tpcEZpcnN0KSBsaW5lcy5zaGlmdCgpXG4gICAgcmV0dXJuIHBlYWNoKGxpbmVzLCBmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gXy5wcmludChcIiAgICBcIiArIGxpbmUpIH0pXG59XG5cbmZ1bmN0aW9uIHByaW50UmF3KF8sIGtleSwgc3RyKSB7XG4gICAgaWYgKHNob3VsZEJyZWFrKGtleS5sZW5ndGgsIHN0cikpIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCIgIFwiICsga2V5ICsgXCI6IHwtXCIpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50TGluZXMoXywgc3RyLCBmYWxzZSkgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXy5wcmludChcIiAgXCIgKyBrZXkgKyBcIjogXCIgKyBzdHIpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBwcmludFZhbHVlKF8sIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gcHJpbnRSYXcoXywga2V5LCBpbnNwZWN0KHZhbHVlKSlcbn1cblxuZnVuY3Rpb24gcHJpbnRMaW5lKHAsIF8sIGxpbmUpIHtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQobGluZSkgfSlcbn1cblxuZnVuY3Rpb24gcHJpbnRFcnJvcihfLCByZXBvcnQpIHtcbiAgICB2YXIgZXJyID0gcmVwb3J0LmVycm9yXG5cbiAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBFcnJvcikpIHtcbiAgICAgICAgcmV0dXJuIHByaW50VmFsdWUoXywgXCJ2YWx1ZVwiLCBlcnIpXG4gICAgfVxuXG4gICAgLy8gTGV0J3MgKm5vdCogZGVwZW5kIG9uIHRoZSBjb25zdHJ1Y3RvciBiZWluZyBUaGFsbGl1bSdzLi4uXG4gICAgaWYgKGVyci5uYW1lICE9PSBcIkFzc2VydGlvbkVycm9yXCIpIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCIgIHN0YWNrOiB8LVwiKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcmludExpbmVzKF8sIFIuZ2V0U3RhY2soZXJyKSwgZmFsc2UpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHByaW50VmFsdWUoXywgXCJleHBlY3RlZFwiLCBlcnIuZXhwZWN0ZWQpXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJpbnRWYWx1ZShfLCBcImFjdHVhbFwiLCBlcnIuYWN0dWFsKSB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50UmF3KF8sIFwibWVzc2FnZVwiLCBlcnIubWVzc2FnZSkgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICBzdGFjazogfC1cIikgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gZXJyLm1lc3NhZ2VcblxuICAgICAgICBlcnIubWVzc2FnZSA9IFwiXCJcbiAgICAgICAgcmV0dXJuIHByaW50TGluZXMoXywgUi5nZXRTdGFjayhlcnIpLCB0cnVlKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IGVyci5tZXNzYWdlID0gbWVzc2FnZSB9KVxuICAgIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUi5vbihcInRhcFwiLCB7XG4gICAgYWNjZXB0czogW1wid3JpdGVcIiwgXCJyZXNldFwiXSxcbiAgICBjcmVhdGU6IFIuY29uc29sZVJlcG9ydGVyLFxuICAgIGluaXQ6IGZ1bmN0aW9uIChzdGF0ZSkgeyBzdGF0ZS5jb3VudGVyID0gMCB9LFxuXG4gICAgcmVwb3J0OiBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgICAgIGlmIChyZXBvcnQuaXNTdGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCJUQVAgdmVyc2lvbiAxM1wiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyKSB7XG4gICAgICAgICAgICAvLyBQcmludCBhIGxlYWRpbmcgY29tbWVudCwgdG8gbWFrZSBzb21lIFRBUCBmb3JtYXR0ZXJzIHByZXR0aWVyLlxuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlKF8sIHJlcG9ydCwgXCIjICVwXCIsIHRydWUpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwib2sgJWNcIikgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNQYXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIm9rICVjICVwXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRmFpbCB8fCByZXBvcnQuaXNIb29rKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIm5vdCBvayAlYyAlcFwiKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgLS0tXCIpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBwcmludEVycm9yKF8sIHJlcG9ydCkgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIgIC4uLlwiKSB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc1NraXApIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwib2sgJWMgIyBza2lwICVwXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRW5kKSB7XG4gICAgICAgICAgICB2YXIgcCA9IF8ucHJpbnQoXCIxLi5cIiArIF8uc3RhdGUuY291bnRlcilcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIjIHRlc3RzIFwiICsgXy50ZXN0cykgfSlcblxuICAgICAgICAgICAgaWYgKF8ucGFzcykgcCA9IHByaW50TGluZShwLCBfLCBcIiMgcGFzcyBcIiArIF8ucGFzcylcbiAgICAgICAgICAgIGlmIChfLmZhaWwpIHAgPSBwcmludExpbmUocCwgXywgXCIjIGZhaWwgXCIgKyBfLmZhaWwpXG4gICAgICAgICAgICBpZiAoXy5za2lwKSBwID0gcHJpbnRMaW5lKHAsIF8sIFwiIyBza2lwIFwiICsgXy5za2lwKVxuICAgICAgICAgICAgcmV0dXJuIHByaW50TGluZShwLCBfLCBcIiMgZHVyYXRpb24gXCIgKyBSLmZvcm1hdFRpbWUoXy5kdXJhdGlvbikpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KFwiQmFpbCBvdXQhXCIpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICAtLS1cIikgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50RXJyb3IoXywgcmVwb3J0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgLi4uXCIpIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cbiAgICB9LFxufSlcbiJdfQ==
