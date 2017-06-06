(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict"

module.exports = require("clean-assert")

},{"clean-assert":31}],2:[function(require,module,exports){
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

exports.addHook = function (list, callback) {
    if (list != null) {
        list.push(callback)
        return list
    } else {
        return [callback]
    }
}

exports.removeHook = function (list, callback) {
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
    if (list == null) return false
    if (list.length > 1) return list.indexOf(callback) >= 0
    return list[0] === callback
}

},{}],6:[function(require,module,exports){
"use strict"

var methods = require("../methods")
var Tests = require("../core/tests")
var Common = require("./common")

/**
 * This contains the low level, more arcane things that are generally not
 * interesting to anyone other than plugin developers.
 */
module.exports = Reflect
function Reflect(test) {
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
            throw new TypeError("Expected `reporter` to be a function")
        }

        return this._.root.reporterIds.indexOf(reporter) >= 0
    },

    /**
     * Add a reporter.
     */
    reporter: function (reporter, arg) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root")
        }

        if (root.reporterIds.indexOf(reporter) < 0) {
            root.reporterIds.push(reporter)
            root.reporters.push(reporter(arg))
        }
    },

    /**
     * Remove a reporter.
     */
    removeReporter: function (reporter) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function")
        }

        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root")
        }

        var index = root.reporterIds.indexOf(reporter)

        if (index >= 0) {
            root.reporterIds.splice(index, 1)
            root.reporters.splice(index, 1)
        }
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

        Tests.addNormal(this._.root.current, name, callback)
    },

    /**
     * Add a skipped block or inline test.
     */
    testSkip: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        Tests.addSkipped(this._.root.current, name)
    },
})

},{"../core/tests":11,"../methods":17,"./common":5}],7:[function(require,module,exports){
"use strict"

var methods = require("../methods")
var Tests = require("../core/tests")
var Filter = require("../core/filter")
var Common = require("./common")
var Reflect = require("./reflect")

module.exports = Thallium
function Thallium() {
    this._ = Tests.createRoot()
}

methods(Thallium, {
    /**
     * Call a plugin and return the result. The plugin is called with a Reflect
     * instance for access to plenty of potentially useful internal details.
     */
    call: function (plugin, arg) {
        var reflect = new Reflect(this._.root.current)

        return plugin.call(reflect, reflect, arg)
    },

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     */
    only: function (/* ...selectors */) {
        this._.root.current.only = Filter.create.apply(undefined, arguments)
    },

    /**
     * Add a reporter.
     */
    reporter: function (reporter, arg) {
        if (typeof reporter !== "function") {
            throw new TypeError("Expected `reporter` to be a function.")
        }

        var root = this._.root

        if (root.current !== root) {
            throw new Error("Reporters may only be added to the root.")
        }

        var result = reporter(arg)

        // Don't assume it's a function. Verify it actually is, so we don't have
        // inexplicable type errors internally after it's invoked, and so users
        // won't get too confused.
        if (typeof result !== "function") {
            throw new TypeError(
                "Expected `reporter` to return a function. Check with the " +
                "reporter's author, and have them fix their reporter.")
        }

        root.reporter = result
    },

    /**
     * Check if this has a reporter.
     */
    get hasReporter() {
        return this._.root.reporter != null
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
        if (this._.root !== this._) {
            throw new Error(
                "Only the root test can be run - If you only want to run a " +
                "subtest, use `t.only([\"selector1\", ...])` instead.")
        }

        if (this._.locked) {
            throw new Error("Can't run while tests are already running.")
        }

        return Tests.runTest(this._, opts)
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

        Tests.addNormal(this._.root.current, name, callback)
    },

    /**
     * Add a skipped test.
     */
    testSkip: function (name, callback) {
        if (typeof name !== "string") {
            throw new TypeError("Expected `name` to be a string")
        }

        if (typeof callback !== "function") {
            throw new TypeError("Expected callback to be a function if passed")
        }

        Tests.addSkipped(this._.root.current, name)
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

},{"../core/filter":9,"../core/tests":11,"../methods":17,"./common":5,"./reflect":6}],8:[function(require,module,exports){
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

// In case the user needs to adjust this (e.g. Nashorn + console output).
var Settings = require("./settings")

t.settings = {
    windowWidth: {
        get: Settings.windowWidth,
        set: Settings.setWindowWidth,
    },

    newline: {
        get: Settings.newline,
        set: Settings.setNewline,
    },

    symbols: {
        get: Settings.symbols,
        set: Settings.setSymbols,
    },

    defaultOpts: {
        get: Settings.defaultOpts,
        set: Settings.setDefaultOpts,
    },

    colorSupport: {
        get: Settings.Colors.getSupport,
        set: Settings.Colors.setSupport,
    },
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../assert":1,"../dom":2,"../index":3,"../internal":4,"../r":66,"./settings":24}],9:[function(require,module,exports){
"use strict"

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

function matches(entry, item) {
    if (typeof entry === "string") {
        return entry === item
    } else {
        return entry.test(item)
    }
}

function Filter(value) {
    this.value = value
    this.children = undefined
}

function findEquivalent(node, entry) {
    if (node.children == null) return undefined

    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i]

        if (isEquivalent(child.value, entry)) return child
    }

    return undefined
}

function findMatches(node, entry) {
    if (node.children == null) return undefined

    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i]

        if (matches(child.value, entry)) return child
    }

    return undefined
}

/**
 * Create a filter from a number of selectors
 */
exports.create = function (/* ...selectors */) {
    var filter = new Filter()

    for (var i = 0; i < arguments.length; i++) {
        var selector = arguments[i]

        if (!Array.isArray(selector)) {
            throw new TypeError(
                "Expected selector " + i + " to be an array")
        }

        filterAddSingle(filter, selector, i)
    }

    return filter
}

function filterAddSingle(node, selector, index) {
    for (var i = 0; i < selector.length; i++) {
        var entry = selector[i]

        // Strings and regular expressions are the only things allowed.
        if (typeof entry !== "string" && !(entry instanceof RegExp)) {
            throw new TypeError(
                "Selector " + index + " must consist of only strings and/or " +
                "regular expressions")
        }

        var child = findEquivalent(node, entry)

        if (child == null) {
            child = new Filter(entry)
            if (node.children == null) {
                node.children = [child]
            } else {
                node.children.push(child)
            }
        }

        node = child
    }
}

exports.test = function (filter, path) {
    var length = path.length

    while (length !== 0) {
        filter = findMatches(filter, path[--length])
        if (filter == null) return false
    }

    return true
}

},{}],10:[function(require,module,exports){
"use strict"

var methods = require("../methods")

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

},{"../methods":17}],11:[function(require,module,exports){
(function (global){
"use strict"

var methods = require("../methods")
var peach = require("../util").peach
var Reports = require("./reports")
var Filter = require("./filter")
var HookStage = Reports.HookStage

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
 *
 * Many of these properties aren't present on initialization to save memory.
 */

function Normal(name, index, parent, callback) {
    this.locked = true
    this.root = parent.root
    this.name = name
    this.index = index|0
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

function Skipped(name, index, parent) {
    this.locked = true
    this.root = parent.root
    this.name = name
    this.index = index|0
    this.parent = parent

    // Only for reflection.
    this.isFailable = parent.isFailable
    this.attempts = parent.attempts
    this.reporter = undefined
    this.reflect = undefined
}

function Root() {
    this.locked = false
    this.reporterIds = []
    this.reporters = []
    this.current = this
    this.root = this
    this.timeout = 0
    this.slow = 0
    this.attempts = 1
    this.isFailable = false

    this.tests = undefined
    this.reporter = undefined
    this.reflect = undefined
    this.beforeAll = undefined
    this.beforeEach = undefined
    this.afterEach = undefined
    this.afterAll = undefined
}

function Context(root) {
    this.root = root
    this.tests = []
    this.isSuccess = true
}

/**
 * Base tests (i.e. default export, result of `internal.root()`).
 */

exports.createRoot = function (methods) {
    return new Root(methods)
}

/**
 * Set up each test type.
 */

/**
 * A normal test through `t.test()`.
 */

exports.addNormal = function (parent, name, callback) {
    var index = parent.tests != null ? parent.tests.length : 0
    var base = new Normal(name, index, parent, callback)

    if (index) {
        parent.tests.push(base)
    } else {
        parent.tests = [base]
    }
}

/**
 * A skipped test through `t.testSkip()`.
 */
exports.addSkipped = function (parent, name) {
    var index = parent.tests != null ? parent.tests.length : 0
    var base = new Skipped(name, index, parent)

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
    parent.tests = null
}

/**
 * Execute the tests
 */

exports.defaultTimeout = 2000 // ms
exports.defaultSlow = 75 // ms

function makeSlice(tests, length) {
    var ret = new Array(length)

    for (var i = 0; i < length; i++) {
        ret[i] = {name: tests[i].name, index: tests[i].index}
    }

    return ret
}

function reportWith(context, func) {
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
    return reportWith(context, function (reporter) {
        return reporter(new Reports.Start())
    })
}

function reportEnter(context, duration) {
    var test = context.root.current
    var slow = test.slow || exports.defaultSlow

    return reportWith(context, function (reporter) {
        var path = makeSlice(context.tests, context.tests.length)

        return reporter(new Reports.Enter(path, duration, slow))
    })
}

function reportLeave(context) {
    return reportWith(context, function (reporter) {
        return reporter(new Reports.Leave(
            makeSlice(context.tests, context.tests.length)))
    })
}

function reportPass(context, duration) {
    var test = context.root.current
    var slow = test.slow || exports.defaultSlow

    return reportWith(context, function (reporter) {
        var path = makeSlice(context.tests, context.tests.length)

        return reporter(new Reports.Pass(path, duration, slow))
    })
}

function reportFail(context, error, duration) {
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
    return reportWith(context, function (reporter) {
        return reporter(new Reports.Skip(
            makeSlice(context.tests, context.tests.length)))
    })
}

function reportEnd(context) {
    return reportWith(context, function (reporter) {
        return reporter(new Reports.End())
    })
}

function reportError(context, error) {
    return reportWith(context, function (reporter) {
        return reporter(new Reports.Error(error))
    })
}

function reportHook(context, test, error) {
    return reportWith(context, function (reporter) {
        return reporter(new Reports.Hook(
            makeSlice(context.tests, context.tests.length),
            makeSlice(context.tests, context.tests.indexOf(test) + 1),
            error))
    })
}

/**
 * Normal tests
 */

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
    this.context = context
    this.start = start
    this.resolve = resolve
    this.count = count
    this.timer = undefined
}

var p = Promise.resolve()

function asyncFinish(state, attempt) {
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
    this.test = test
    this.error = error
}
methods(ErrorWrap, Error, {name: "ErrorWrap"})

function invokeHook(test, list, stage) {
    if (list == null) return Promise.resolve()
    return peach(list, function (hook) {
        try {
            return hook()
        } catch (e) {
            throw new ErrorWrap(test, new Reports.HookError(stage, hook, e))
        }
    })
}

function invokeBeforeEach(test) {
    if (test.root === test) {
        return invokeHook(test, test.beforeEach, HookStage.BeforeEach)
    } else {
        return invokeBeforeEach(test.parent).then(function () {
            return invokeHook(test, test.beforeEach, HookStage.BeforeEach)
        })
    }
}

function invokeAfterEach(test) {
    if (test.root === test) {
        return invokeHook(test, test.afterEach, HookStage.AfterEach)
    } else {
        return invokeHook(test, test.afterEach, HookStage.AfterEach)
        .then(function () { return invokeAfterEach(test.parent) })
    }
}

/**
 * This checks if the test was whitelisted in a `t.only()` call, or for
 * convenience, returns `true` if `t.only()` was never called.
 */
function isOnly(test) {
    var path = []

    while (test.parent != null && test.only == null) {
        path.push(test.name)
        test = test.parent
    }

    // If there isn't any `only` active, then let's skip the check and return
    // `true` for convenience.
    if (test.only == null) return true
    return Filter.test(test.only, path)
}

function runChildTests(test, context) {
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
        // Only skipped tests have no callback
        if (child.callback == null) {
            test.root.current = child
            context.tests.push(child)

            return reportSkip(context)
            .then(leave, function (e) { leave(); throw e })
        } else if (!isOnly(child)) {
            return Promise.resolve()
        } else if (ran) {
            return runChild(child)
        } else {
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
    if (test.tests == null) return
    for (var i = 0; i < test.tests.length; i++) {
        test.tests[i].tests = undefined
    }
}

function runNormalChild(test, context) {
    test.locked = false

    return invokeInit(context, 1)
    .then(
        function (result) { test.locked = true; return result },
        function (error) { test.locked = true; throw error })
    .then(function (result) {
        if (result.caught) {
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

function try0(f) {
    try {
        return tryPass(f())
    } catch (e) {
        return tryFail(e)
    }
}

function try1(f, inst, arg0) {
    try {
        return tryPass(f.call(inst, arg0))
    } catch (e) {
        return tryFail(e)
    }
}

function try2(f, inst, arg0, arg1) {
    try {
        return tryPass(f.call(inst, arg0, arg1))
    } catch (e) {
        return tryFail(e)
    }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../methods":17,"../util":25,"./filter":9,"./reports":10}],12:[function(require,module,exports){
"use strict"

/**
 * The reporter and test initialization sequence, and script loading. This
 * doesn't understand anything view-wise.
 */

var defaultT = require("../../index")
var R = require("../reporter")
var D = require("./inject")
var runTests = require("./run-tests")
var injectStyles = require("./inject-styles")
var View = require("./view")
var methods = require("../methods")

function Tree(name) {
    this.name = name
    this.status = R.Status.Unknown
    this.node = null
    this.children = Object.create(null)
}

var reporter = R.on("dom", {
    accepts: [],
    create: function (opts, methods) {
        var reporter = new R.Reporter(Tree, undefined, methods)

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
    if (D.document.body != null) return Promise.resolve(init())
    return new Promise(function (resolve) {
        D.document.addEventListener("DOMContentLoaded", function () {
            resolve(init())
        }, false)
    })
}

function DOM(opts) {
    this._opts = opts
    this._destroyPromise = undefined
    this._data = onReady(function () {
        setDefaultsChecked(opts)
        if (!D.document.title) D.document.title = opts.title
        injectStyles()
        var data = View.init(opts)

        opts.thallium.reporter(reporter, data.state)
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

},{"../../index":3,"../methods":17,"../reporter":20,"./inject":14,"./inject-styles":13,"./run-tests":15,"./view":16}],13:[function(require,module,exports){
"use strict"

var Util = require("../util")
var D = require("./inject")

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

},{"../util":25,"./inject":14}],14:[function(require,module,exports){
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

/**
 * Test runner and script loader
 */

function uncached(file) {
    if (file.indexOf("?") < 0) {
        return file + "?loaded=" + now()
    } else {
        return file + "&loaded=" + now()
    }
}

function loadScript(file, timeout) {
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

},{"../util":25,"./inject":14}],16:[function(require,module,exports){
(function (global){
"use strict"

var diff = require("diff")
var R = require("../reporter")
var D = require("./inject")
var runTests = require("./run-tests")
var inspect = require("clean-assert-util").inspect

/**
 * View logic
 */

function t(text) {
    return D.document.createTextNode(text)
}

function h(type, attrs, children) {
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
    var end = report.path.length - 1
    var name = report.path[end].name
    var parent = _.get(report.path, end)

    parent.node.appendChild(h("li tl-test tl-skip", [
        h("h2", [t(name)]),
    ]))
}

exports.nextFrame = nextFrame
function nextFrame(func) {
    if (D.window.requestAnimationFrame) {
        D.window.requestAnimationFrame(func)
    } else {
        global.setTimeout(func, 0)
    }
}

exports.report = function (_, report) {
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
                _.get(undefined, 0).node = _.opts.report
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

},{"../reporter":20,"./inject":14,"./run-tests":15,"clean-assert-util":29,"diff":51}],17:[function(require,module,exports){
"use strict"

module.exports = function (Base, Super) {
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

/**
 * This contains the browser console stuff.
 */

exports.Symbols = Object.freeze({
    Pass: "✓",
    Fail: "✖",
    Dot: "․",
    DotFail: "!",
})

exports.windowWidth = 75
exports.newline = "\n"

// Color support is unforced and unsupported, since you can only specify
// line-by-line colors via CSS, and even that isn't very portable.
exports.colorSupport = 0

/**
 * Since browsers don't have unbuffered output, this kind of simulates it.
 */

var acc = ""

exports.defaultOpts = {
    write: function (str) {
        acc += str

        var index = str.indexOf("\n")

        if (index >= 0) {
            var lines = str.split("\n")

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

},{}],19:[function(require,module,exports){
"use strict"

var diff = require("diff")

var methods = require("../methods")
var inspect = require("clean-assert-util").inspect
var peach = require("../util").peach
var Reporter = require("./reporter")
var Util = require("./util")
var Settings = require("../settings")

function printTime(_, p, str) {
    if (!_.timePrinted) {
        _.timePrinted = true
        str += Util.color("light", " (" + Util.formatTime(_.duration) + ")")
    }

    return p.then(function () { return _.print(str) })
}

function unifiedDiff(err) {
    var actual = inspect(err.actual)
    var expected = inspect(err.expected)
    var msg = diff.createPatch("string", actual, expected)
    var header = Settings.newline() +
        Util.color("diff added", "+ expected") + " " +
        Util.color("diff removed", "- actual") +
        Settings.newline() + Settings.newline()

    return header + msg.split(/\r?\n|\r/g).slice(4)
    .filter(function (line) { return !/^\@\@|^\\ No newline/.test(line) })
    .map(function (line) {
        if (line[0] === "+") return Util.color("diff added", line.trimRight())
        if (line[0] === "-") return Util.color("diff removed", line.trimRight())
        return line.trimRight()
    })
    .join(Settings.newline())
}

function formatFail(str) {
    return str.trimRight()
    .split(/\r?\n|\r/g)
    .map(function (line) { return Util.color("fail", line.trimRight()) })
    .join(Settings.newline())
}

function getDiffStack(e) {
    var description = formatFail(e.name + ": " + e.message)

    if (e.name === "AssertionError" && e.showDiff !== false) {
        description += Settings.newline() + unifiedDiff(e)
    }

    var stripped = formatFail(Util.readStack(e))

    if (stripped === "") return description
    return description + Settings.newline() + stripped
}

function inspectTrimmed(object) {
    return inspect(object).trimRight()
    .split(/\r?\n|\r/g)
    .map(function (line) { return line.trimRight() })
    .join(Settings.newline())
}

function printFailList(_, err) {
    var str = err instanceof Error ? getDiffStack(err) : inspectTrimmed(err)
    var parts = str.split(/\r?\n/g)

    return _.print("    " + parts[0]).then(function () {
        return peach(parts.slice(1), function (part) {
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
    Reporter.call(this, Util.Tree, opts, methods, true)

    if (!Util.Colors.forced() && methods.accepts.indexOf("color") >= 0) {
        this.opts.color = opts.color
    }

    Util.defaultify(this, opts, "write")
    this.reset()
}

methods(ConsoleReporter, Reporter, {
    print: function (str) {
        if (str == null) str = ""
        return Promise.resolve(this.opts.write(str + "\n"))
    },

    write: function (str) {
        if (str != null) {
            return Promise.resolve(this.opts.write(str))
        } else {
            return Promise.resolve()
        }
    },

    printResults: function () {
        var self = this

        if (!this.tests && !this.skip) {
            return this.print(
                Util.color("plain", "  0 tests") +
                Util.color("light", " (0ms)"))
            .then(function () { return self.print() })
        }

        return this.print().then(function () {
            var p = Promise.resolve()

            if (self.pass) {
                p = printTime(self, p,
                    Util.color("bright pass", "  ") +
                    Util.color("green", self.pass + " passing"))
            }

            if (self.skip) {
                p = printTime(self, p,
                    Util.color("skip", "  " + self.skip + " skipped"))
            }

            if (self.fail) {
                p = printTime(self, p,
                    Util.color("bright fail", "  ") +
                    Util.color("fail", self.fail + " failing"))
            }

            return p
        })
        .then(function () { return self.print() })
        .then(function () {
            return peach(self.errors, function (report, i) {
                var name = i + 1 + ") " + Util.joinPath(report) +
                    Util.formatRest(report)

                return self.print("  " + Util.color("plain", name + ":"))
                .then(function () {
                    return printFailList(self, report.error)
                })
                .then(function () { return self.print() })
            })
        })
    },

    printError: function (report) {
        var self = this
        var lines = report.error instanceof Error
            ? Util.getStack(report.error)
            : inspectTrimmed(report.error)

        return this.print().then(function () {
            return peach(lines.split(/\r?\n/g), function (line) {
                return self.print(line)
            })
        })
    },
})

},{"../methods":17,"../settings":24,"../util":25,"./reporter":22,"./util":23,"clean-assert-util":29,"diff":51}],20:[function(require,module,exports){
"use strict"

var Util = require("./util")

exports.on = require("./on")
exports.consoleReporter = require("./console-reporter")
exports.Reporter = require("./reporter")
exports.color = Util.color
exports.Colors = Util.Colors
exports.formatRest = Util.formatRest
exports.formatTime = Util.formatTime
exports.getStack = Util.getStack
exports.joinPath = Util.joinPath
exports.newline = Util.newline
exports.readStack = Util.readStack
exports.setColor = Util.setColor
exports.speed = Util.speed
exports.Status = Util.Status
exports.symbols = Util.symbols
exports.unsetColor = Util.unsetColor
exports.windowWidth = Util.windowWidth

},{"./console-reporter":19,"./on":21,"./reporter":22,"./util":23}],21:[function(require,module,exports){
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
         * Instead of silently failing to work, let's error out when a report is
         * passed in, and inform the user it needs initialized. Chances are,
         * there's no legitimate reason to even pass a report, anyways.
         */
        if (typeof opts === "object" && opts !== null &&
                typeof opts._ === "number") {
            throw new TypeError(
                "Options cannot be a report. Did you forget to call the " +
                "factory first?")
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
var defaultify = require("./util").defaultify
var hasOwn = Object.prototype.hasOwnProperty

function State(reporter) {
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
    this.Tree = Tree
    this.opts = {}
    this.methods = methods
    defaultify(this, opts, "reset")
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
        this.errors.push(report)
    },

    get: function (path, end) {
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

},{"../methods":17,"./util":23}],23:[function(require,module,exports){
"use strict"

var Util = require("../util")
var Settings = require("../settings")

exports.symbols = Settings.symbols
exports.windowWidth = Settings.windowWidth
exports.newline = Settings.newline

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
    return str.replace(/^\s+|[^\r\n\S]+$/g, "")
        .replace(/\s*(\r?\n|\r)\s*/g, Settings.newline())
}

exports.getStack = function (e) {
    if (!(e instanceof Error)) return formatLineBreaks(Util.getStack(e))
    var description = (e.name + ": " + e.message)
        .replace(/\s+$/gm, "")
        .replace(/\r?\n|\r/g, Settings.newline())
    var stripped = readStack(e)

    if (stripped === "") return description
    return description + Settings.newline() + stripped
}

var Colors = exports.Colors = Settings.Colors

// Color palette pulled from Mocha
function colorToNumber(name) {
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

exports.color = color
function color(name, str) {
    if (Colors.supported()) {
        return "\u001b[" + colorToNumber(name) + "m" + str + "\u001b[0m"
    } else {
        return str + ""
    }
}

exports.setColor = function (_) {
    if (_.opts.color != null) Colors.maybeSet(_.opts.color)
}

exports.unsetColor = function (_) {
    if (_.opts.color != null) Colors.maybeRestore()
}

var Status = exports.Status = Object.freeze({
    Unknown: 0,
    Skipped: 1,
    Passing: 2,
    Failing: 3,
})

exports.Tree = function (value) {
    this.value = value
    this.status = Status.Unknown
    this.children = Object.create(null)
}

exports.defaultify = function (_, opts, prop) {
    if (_.methods.accepts.indexOf(prop) >= 0) {
        var used = opts != null && typeof opts[prop] === "function"
            ? opts
            : Settings.defaultOpts()

        _.opts[prop] = function () {
            return Promise.resolve(used[prop].apply(used, arguments))
        }
    }
}

function joinPath(reportPath) {
    var path = ""

    for (var i = 0; i < reportPath.length; i++) {
        path += " " + reportPath[i].name
    }

    return path.slice(1)
}

exports.joinPath = function (report) {
    return joinPath(report.path)
}

exports.speed = function (report) {
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
        if (ms >= d) return Math.round(ms / d) + "d"
        if (ms >= h) return Math.round(ms / h) + "h"
        if (ms >= m) return Math.round(ms / m) + "m"
        if (ms >= s) return Math.round(ms / s) + "s"
        return ms + "ms"
    }
})()

exports.formatRest = function (report) {
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

},{"../settings":24,"../util":25}],24:[function(require,module,exports){
"use strict"

// General CLI and reporter settings. If something needs to

var Console = require("./replaced/console")

var windowWidth = Console.windowWidth
var newline = Console.newline
var Symbols = Console.Symbols
var defaultOpts = Console.defaultOpts

exports.windowWidth = function () { return windowWidth }
exports.newline = function () { return newline }
exports.symbols = function () { return Symbols }
exports.defaultOpts = function () { return defaultOpts }

exports.setWindowWidth = function (value) { return windowWidth = value }
exports.setNewline = function (value) { return newline = value }
exports.setSymbols = function (value) { return Symbols = value }
exports.setDefaultOpts = function (value) { return defaultOpts = value }

// Console.colorSupport is a mask with the following bits:
// 0x1 - if set, colors supported by default
// 0x2 - if set, force color support
//
// This is purely an implementation detail, and is invisible to the outside
// world.
var colorSupport = Console.colorSupport
var mask = colorSupport

exports.Colors = {
    supported: function () {
        return (mask & 0x1) !== 0
    },

    forced: function () {
        return (mask & 0x2) !== 0
    },

    maybeSet: function (value) {
        if ((mask & 0x2) === 0) mask = value ? 0x1 : 0
    },

    maybeRestore: function () {
        if ((mask & 0x2) === 0) mask = colorSupport & 0x1
    },

    // Only for debugging
    forceSet: function (value) {
        mask = value ? 0x3 : 0x2
    },

    forceRestore: function () {
        mask = colorSupport
    },

    getSupport: function () {
        return {
            supported: (colorSupport & 0x1) !== 0,
            forced: (colorSupport & 0x2) !== 0,
        }
    },

    setSupport: function (opts) {
        mask = colorSupport =
            (opts.supported ? 0x1 : 0) | (opts.forced ? 0x2 : 0)
    },
}

},{"./replaced/console":18}],25:[function(require,module,exports){
"use strict"

var methods = require("./methods")

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
    return new Promise(function (resolve, reject) {
        return func(function (e, value) {
            return e != null ? reject(e) : resolve(value)
        })
    })
}

exports.peach = function (list, func) {
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
    var ref = new Lazy(create)

    return function () {
        return ref.get()
    }
}

},{"./methods":17}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
"use strict"

// See https://github.com/substack/node-browserify/issues/1674

module.exports = require("util-inspect")

},{"util-inspect":63}],29:[function(require,module,exports){
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

},{"./inspect":28}],30:[function(require,module,exports){
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

},{"./lib/equal":32,"./lib/has":34,"./lib/has-keys":33,"./lib/includes":35,"./lib/throws-async":36,"./lib/type":39}],31:[function(require,module,exports){
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

},{"./async":30,"./lib/equal":32,"./lib/has":34,"./lib/has-keys":33,"./lib/includes":35,"./lib/throws":38,"./lib/type":39,"clean-assert-util":29}],32:[function(require,module,exports){
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

},{"clean-assert-util":29,"clean-match":40}],33:[function(require,module,exports){
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

},{"clean-assert-util":29,"clean-match":40}],34:[function(require,module,exports){
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

},{"clean-assert-util":29}],35:[function(require,module,exports){
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

},{"clean-assert-util":29,"clean-match":40}],36:[function(require,module,exports){
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

},{"./throws-common":37,"clean-assert-util":29}],37:[function(require,module,exports){
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

},{"clean-assert-util":29}],38:[function(require,module,exports){
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

},{"./throws-common":37,"clean-assert-util":29}],39:[function(require,module,exports){
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

},{"clean-assert-util":29}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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


},{}],42:[function(require,module,exports){
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


},{}],43:[function(require,module,exports){
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


},{"./base":44}],44:[function(require,module,exports){
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


},{}],45:[function(require,module,exports){
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


},{"./base":44}],46:[function(require,module,exports){
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


},{"./base":44}],47:[function(require,module,exports){
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


},{"./base":44,"./line":48}],48:[function(require,module,exports){
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


},{"../util/params":56,"./base":44}],49:[function(require,module,exports){
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


},{"./base":44}],50:[function(require,module,exports){
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


},{"../util/params":56,"./base":44}],51:[function(require,module,exports){
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


},{"./convert/dmp":41,"./convert/xml":42,"./diff/array":43,"./diff/base":44,"./diff/character":45,"./diff/css":46,"./diff/json":47,"./diff/line":48,"./diff/sentence":49,"./diff/word":50,"./patch/apply":52,"./patch/create":53,"./patch/parse":54}],52:[function(require,module,exports){
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


},{"../util/distance-iterator":55,"./parse":54}],53:[function(require,module,exports){
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


},{"../diff/line":48}],54:[function(require,module,exports){
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


},{}],55:[function(require,module,exports){
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


},{}],56:[function(require,module,exports){
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


},{}],57:[function(require,module,exports){

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


},{}],58:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],59:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],60:[function(require,module,exports){
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


},{}],61:[function(require,module,exports){
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


},{"./foreach":60,"./isArguments":62}],62:[function(require,module,exports){
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


},{}],63:[function(require,module,exports){

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

},{"array-map":26,"array-reduce":27,"foreach":57,"indexof":58,"isarray":59,"json3":64,"object-keys":61}],64:[function(require,module,exports){
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

},{}],65:[function(require,module,exports){
"use strict"

// This is a reporter that mimics Mocha's `dot` reporter

var R = require("../lib/reporter")

function width() {
    return R.windowWidth() * 4 / 3 | 0
}

function printDot(_, color) {
    function emit() {
        return _.write(R.color(color,
            color === "fail" ? R.symbols().DotFail : R.symbols().Dot))
    }

    if (_.state.counter++ % width() === 0) {
        return _.write(R.newline() + "  ").then(emit)
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

},{"../lib/reporter":20}],66:[function(require,module,exports){
"use strict"

exports.dot = require("./dot")
exports.spec = require("./spec")
exports.tap = require("./tap")

},{"./dot":65,"./spec":67,"./tap":68}],67:[function(require,module,exports){
"use strict"

// This is a reporter that mimics Mocha's `spec` reporter.

var R = require("../lib/reporter")
var c = R.color

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
                    c("checkmark", R.symbols().Pass + " ") +
                    c("pass", getName(_.state.level, report))

                var speed = R.speed(report)

                if (speed !== "fast") {
                    str += c(speed, " (" + report.duration + "ms)")
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
                return c("fail",
                    _.errors.length + ") " + getName(_.state.level, report) +
                    R.formatRest(report))
            })
        } else if (report.isSkip) {
            return printReport(_, report, function () {
                return c("skip", "- " + getName(_.state.level, report))
            })
        }

        if (report.isEnd) return _.printResults()
        if (report.isError) return _.printError(report)
        return undefined
    },
})

},{"../lib/reporter":20}],68:[function(require,module,exports){
"use strict"

// This is a basic TAP-generating reporter.

var peach = require("../lib/util").peach
var R = require("../lib/reporter")
var inspect = require("clean-assert-util").inspect

function shouldBreak(minLength, str) {
    return str.length > R.windowWidth() - minLength || /\r?\n|[:?-]/.test(str)
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

},{"../lib/reporter":20,"../lib/util":25,"clean-assert-util":29}]},{},[8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3NlcnQuanMiLCJkb20uanMiLCJpbmRleC5qcyIsImludGVybmFsLmpzIiwibGliL2FwaS9jb21tb24uanMiLCJsaWIvYXBpL3JlZmxlY3QuanMiLCJsaWIvYXBpL3RoYWxsaXVtLmpzIiwibGliL2Jyb3dzZXItYnVuZGxlLmpzIiwibGliL2NvcmUvZmlsdGVyLmpzIiwibGliL2NvcmUvcmVwb3J0cy5qcyIsImxpYi9jb3JlL3Rlc3RzLmpzIiwibGliL2RvbS9pbmRleC5qcyIsImxpYi9kb20vaW5qZWN0LXN0eWxlcy5qcyIsImxpYi9kb20vaW5qZWN0LmpzIiwibGliL2RvbS9ydW4tdGVzdHMuanMiLCJsaWIvZG9tL3ZpZXcuanMiLCJsaWIvbWV0aG9kcy5qcyIsImxpYi9yZXBsYWNlZC9jb25zb2xlLWJyb3dzZXIuanMiLCJsaWIvcmVwb3J0ZXIvY29uc29sZS1yZXBvcnRlci5qcyIsImxpYi9yZXBvcnRlci9pbmRleC5qcyIsImxpYi9yZXBvcnRlci9vbi5qcyIsImxpYi9yZXBvcnRlci9yZXBvcnRlci5qcyIsImxpYi9yZXBvcnRlci91dGlsLmpzIiwibGliL3NldHRpbmdzLmpzIiwibGliL3V0aWwuanMiLCJub2RlX21vZHVsZXMvYXJyYXktbWFwL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2FycmF5LXJlZHVjZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQtdXRpbC9icm93c2VyLWluc3BlY3QuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0LXV0aWwvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0L2FzeW5jLmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL2VxdWFsLmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLWFzc2VydC9saWIvaGFzLWtleXMuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0L2xpYi9oYXMuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0L2xpYi9pbmNsdWRlcy5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL3Rocm93cy1hc3luYy5qcyIsIm5vZGVfbW9kdWxlcy9jbGVhbi1hc3NlcnQvbGliL3Rocm93cy1jb21tb24uanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0L2xpYi90aHJvd3MuanMiLCJub2RlX21vZHVsZXMvY2xlYW4tYXNzZXJ0L2xpYi90eXBlLmpzIiwibm9kZV9tb2R1bGVzL2NsZWFuLW1hdGNoL2NsZWFuLW1hdGNoLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2NvbnZlcnQvZG1wLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2NvbnZlcnQveG1sLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2RpZmYvYXJyYXkuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9iYXNlLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2RpZmYvY2hhcmFjdGVyLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2RpZmYvY3NzLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL2RpZmYvanNvbi5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9kaWZmL2xpbmUuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvZGlmZi9zZW50ZW5jZS5qcyIsIm5vZGVfbW9kdWxlcy9kaWZmL3NyYy9kaWZmL3dvcmQuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvcGF0Y2gvYXBwbHkuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvcGF0Y2gvY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL3BhdGNoL3BhcnNlLmpzIiwibm9kZV9tb2R1bGVzL2RpZmYvc3JjL3V0aWwvZGlzdGFuY2UtaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvZGlmZi9zcmMvdXRpbC9wYXJhbXMuanMiLCJub2RlX21vZHVsZXMvZm9yZWFjaC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pbmRleG9mL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2lzYXJyYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWtleXMvZm9yZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3Qta2V5cy9pc0FyZ3VtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy91dGlsLWluc3BlY3QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdXRpbC1pbnNwZWN0L25vZGVfbW9kdWxlcy9qc29uMy9saWIvanNvbjMuanMiLCJyL2RvdC5qcyIsInIvaW5kZXguanMiLCJyL3NwZWMuanMiLCJyL3RhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3psQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDajRCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCJcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0XCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2xpYi9kb21cIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogTWFpbiBlbnRyeSBwb2ludCwgZm9yIHRob3NlIHdhbnRpbmcgdG8gdXNlIHRoaXMgZnJhbWV3b3JrIHdpdGggdGhlIGNvcmVcbiAqIGFzc2VydGlvbnMuXG4gKi9cbnZhciBUaGFsbGl1bSA9IHJlcXVpcmUoXCIuL2xpYi9hcGkvdGhhbGxpdW1cIilcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVGhhbGxpdW0oKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFRoYWxsaXVtID0gcmVxdWlyZShcIi4vbGliL2FwaS90aGFsbGl1bVwiKVxudmFyIFJlcG9ydHMgPSByZXF1aXJlKFwiLi9saWIvY29yZS9yZXBvcnRzXCIpXG52YXIgSG9va1N0YWdlID0gUmVwb3J0cy5Ib29rU3RhZ2VcblxuZXhwb3J0cy5yb290ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBuZXcgVGhhbGxpdW0oKVxufVxuXG5mdW5jdGlvbiBkKGR1cmF0aW9uKSB7XG4gICAgaWYgKGR1cmF0aW9uID09IG51bGwpIHJldHVybiAxMFxuICAgIGlmICh0eXBlb2YgZHVyYXRpb24gPT09IFwibnVtYmVyXCIpIHJldHVybiBkdXJhdGlvbnwwXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBkdXJhdGlvbmAgdG8gYmUgYSBudW1iZXIgaWYgaXQgZXhpc3RzXCIpXG59XG5cbmZ1bmN0aW9uIHMoc2xvdykge1xuICAgIGlmIChzbG93ID09IG51bGwpIHJldHVybiA3NVxuICAgIGlmICh0eXBlb2Ygc2xvdyA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHNsb3d8MFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgc2xvd2AgdG8gYmUgYSBudW1iZXIgaWYgaXQgZXhpc3RzXCIpXG59XG5cbmZ1bmN0aW9uIHAocGF0aCkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHBhdGgpKSByZXR1cm4gcGF0aFxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcGF0aGAgdG8gYmUgYW4gYXJyYXkgb2YgbG9jYXRpb25zXCIpXG59XG5cbmZ1bmN0aW9uIGgodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUuXyA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHZhbHVlXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGB2YWx1ZWAgdG8gYmUgYSBob29rIGVycm9yXCIpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IHJlcG9ydCwgbWFpbmx5IGZvciB0ZXN0aW5nIHJlcG9ydGVycy5cbiAqL1xuZXhwb3J0cy5yZXBvcnRzID0ge1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5TdGFydCgpXG4gICAgfSxcblxuICAgIGVudGVyOiBmdW5jdGlvbiAocGF0aCwgZHVyYXRpb24sIHNsb3cpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkVudGVyKHAocGF0aCksIGQoZHVyYXRpb24pLCBzKHNsb3cpKVxuICAgIH0sXG5cbiAgICBsZWF2ZTogZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkxlYXZlKHAocGF0aCkpXG4gICAgfSxcblxuICAgIHBhc3M6IGZ1bmN0aW9uIChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuUGFzcyhwKHBhdGgpLCBkKGR1cmF0aW9uKSwgcyhzbG93KSlcbiAgICB9LFxuXG4gICAgZmFpbDogZnVuY3Rpb24gKHBhdGgsIHZhbHVlLCBkdXJhdGlvbiwgc2xvdywgaXNGYWlsYWJsZSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkZhaWwoXG4gICAgICAgICAgICBwKHBhdGgpLCB2YWx1ZSwgZChkdXJhdGlvbiksIHMoc2xvdyksXG4gICAgICAgICAgICAhIWlzRmFpbGFibGUpXG4gICAgfSxcblxuICAgIHNraXA6IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ta2lwKHAocGF0aCkpXG4gICAgfSxcblxuICAgIGVuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRW5kKClcbiAgICB9LFxuXG4gICAgZXJyb3I6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuRXJyb3IodmFsdWUpXG4gICAgfSxcblxuICAgIGhvb2s6IGZ1bmN0aW9uIChwYXRoLCByb290UGF0aCwgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkhvb2socChwYXRoKSwgcChyb290UGF0aCksIGgodmFsdWUpKVxuICAgIH0sXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGhvb2sgZXJyb3IsIG1haW5seSBmb3IgdGVzdGluZyByZXBvcnRlcnMuXG4gKi9cbmV4cG9ydHMuaG9va0Vycm9ycyA9IHtcbiAgICBiZWZvcmVBbGw6IGZ1bmN0aW9uIChmdW5jLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlcG9ydHMuSG9va0Vycm9yKEhvb2tTdGFnZS5CZWZvcmVBbGwsIGZ1bmMsIHZhbHVlKVxuICAgIH0sXG5cbiAgICBiZWZvcmVFYWNoOiBmdW5jdGlvbiAoZnVuYywgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkhvb2tFcnJvcihIb29rU3RhZ2UuQmVmb3JlRWFjaCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGFmdGVyRWFjaDogZnVuY3Rpb24gKGZ1bmMsIHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwb3J0cy5Ib29rRXJyb3IoSG9va1N0YWdlLkFmdGVyRWFjaCwgZnVuYywgdmFsdWUpXG4gICAgfSxcblxuICAgIGFmdGVyQWxsOiBmdW5jdGlvbiAoZnVuYywgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBvcnRzLkhvb2tFcnJvcihIb29rU3RhZ2UuQWZ0ZXJBbGwsIGZ1bmMsIHZhbHVlKVxuICAgIH0sXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBsb2NhdGlvbiwgbWFpbmx5IGZvciB0ZXN0aW5nIHJlcG9ydGVycy5cbiAqL1xuZXhwb3J0cy5sb2NhdGlvbiA9IGZ1bmN0aW9uIChuYW1lLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYG5hbWVgIHRvIGJlIGEgc3RyaW5nXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBpbmRleCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYGluZGV4YCB0byBiZSBhIG51bWJlclwiKVxuICAgIH1cblxuICAgIHJldHVybiB7bmFtZTogbmFtZSwgaW5kZXg6IGluZGV4fDB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG5leHBvcnRzLmFkZEhvb2sgPSBmdW5jdGlvbiAobGlzdCwgY2FsbGJhY2spIHtcbiAgICBpZiAobGlzdCAhPSBudWxsKSB7XG4gICAgICAgIGxpc3QucHVzaChjYWxsYmFjaylcbiAgICAgICAgcmV0dXJuIGxpc3RcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gW2NhbGxiYWNrXVxuICAgIH1cbn1cblxuZXhwb3J0cy5yZW1vdmVIb29rID0gZnVuY3Rpb24gKGxpc3QsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGxpc3QgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBpZiAobGlzdFswXSA9PT0gY2FsbGJhY2spIHJldHVybiB1bmRlZmluZWRcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaW5kZXggPSBsaXN0LmluZGV4T2YoY2FsbGJhY2spXG5cbiAgICAgICAgaWYgKGluZGV4ID49IDApIGxpc3Quc3BsaWNlKGluZGV4LCAxKVxuICAgIH1cbiAgICByZXR1cm4gbGlzdFxufVxuXG5leHBvcnRzLmhhc0hvb2sgPSBmdW5jdGlvbiAobGlzdCwgY2FsbGJhY2spIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4gZmFsc2VcbiAgICBpZiAobGlzdC5sZW5ndGggPiAxKSByZXR1cm4gbGlzdC5pbmRleE9mKGNhbGxiYWNrKSA+PSAwXG4gICAgcmV0dXJuIGxpc3RbMF0gPT09IGNhbGxiYWNrXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuLi9tZXRob2RzXCIpXG52YXIgVGVzdHMgPSByZXF1aXJlKFwiLi4vY29yZS90ZXN0c1wiKVxudmFyIENvbW1vbiA9IHJlcXVpcmUoXCIuL2NvbW1vblwiKVxuXG4vKipcbiAqIFRoaXMgY29udGFpbnMgdGhlIGxvdyBsZXZlbCwgbW9yZSBhcmNhbmUgdGhpbmdzIHRoYXQgYXJlIGdlbmVyYWxseSBub3RcbiAqIGludGVyZXN0aW5nIHRvIGFueW9uZSBvdGhlciB0aGFuIHBsdWdpbiBkZXZlbG9wZXJzLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IFJlZmxlY3RcbmZ1bmN0aW9uIFJlZmxlY3QodGVzdCkge1xuICAgIHZhciByZWZsZWN0ID0gdGVzdC5yZWZsZWN0XG5cbiAgICBpZiAocmVmbGVjdCAhPSBudWxsKSByZXR1cm4gcmVmbGVjdFxuICAgIHRlc3QucmVmbGVjdCA9IHRoaXNcbiAgICB0aGlzLl8gPSB0ZXN0XG59XG5cbm1ldGhvZHMoUmVmbGVjdCwge1xuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgYSByZXBvcnRlciB3YXMgcmVnaXN0ZXJlZC5cbiAgICAgKi9cbiAgICBoYXNSZXBvcnRlcjogZnVuY3Rpb24gKHJlcG9ydGVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwb3J0ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGByZXBvcnRlcmAgdG8gYmUgYSBmdW5jdGlvblwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290LnJlcG9ydGVySWRzLmluZGV4T2YocmVwb3J0ZXIpID49IDBcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgcmVwb3J0ZXIuXG4gICAgICovXG4gICAgcmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlciwgYXJnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwb3J0ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGByZXBvcnRlcmAgdG8gYmUgYSBmdW5jdGlvblwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJvb3QgPSB0aGlzLl8ucm9vdFxuXG4gICAgICAgIGlmIChyb290LmN1cnJlbnQgIT09IHJvb3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlcG9ydGVycyBtYXkgb25seSBiZSBhZGRlZCB0byB0aGUgcm9vdFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJvb3QucmVwb3J0ZXJJZHMuaW5kZXhPZihyZXBvcnRlcikgPCAwKSB7XG4gICAgICAgICAgICByb290LnJlcG9ydGVySWRzLnB1c2gocmVwb3J0ZXIpXG4gICAgICAgICAgICByb290LnJlcG9ydGVycy5wdXNoKHJlcG9ydGVyKGFyZykpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgcmVwb3J0ZXIuXG4gICAgICovXG4gICAgcmVtb3ZlUmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICBpZiAodHlwZW9mIHJlcG9ydGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgcmVwb3J0ZXJgIHRvIGJlIGEgZnVuY3Rpb25cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpbmRleCA9IHJvb3QucmVwb3J0ZXJJZHMuaW5kZXhPZihyZXBvcnRlcilcblxuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgcm9vdC5yZXBvcnRlcklkcy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICAgICAgICByb290LnJlcG9ydGVycy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50bHkgZXhlY3V0aW5nIHRlc3QuXG4gICAgICovXG4gICAgZ2V0IGN1cnJlbnQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVmbGVjdCh0aGlzLl8ucm9vdC5jdXJyZW50KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHJvb3QgdGVzdC5cbiAgICAgKi9cbiAgICBnZXQgcm9vdCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWZsZWN0KHRoaXMuXy5yb290KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgdG90YWwgdGVzdCBjb3VudC5cbiAgICAgKi9cbiAgICBnZXQgY291bnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8udGVzdHMgPT0gbnVsbCA/IDAgOiB0aGlzLl8udGVzdHMubGVuZ3RoXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCBhIGNvcHkgb2YgdGhlIGN1cnJlbnQgdGVzdCBsaXN0LCBhcyBhIFJlZmxlY3QgY29sbGVjdGlvbi4gVGhpcyBpc1xuICAgICAqIGludGVudGlvbmFsbHkgYSBzbGljZSwgc28geW91IGNhbid0IG11dGF0ZSB0aGUgcmVhbCBjaGlsZHJlbi5cbiAgICAgKi9cbiAgICBnZXQgY2hpbGRyZW4oKSB7XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IFtdXG5cbiAgICAgICAgaWYgKHRoaXMuXy50ZXN0cyAhPSBudWxsKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuXy50ZXN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuW2ldID0gbmV3IFJlZmxlY3QodGhpcy5fLnRlc3RzW2ldKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoaWxkcmVuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIElzIHRoaXMgdGVzdCB0aGUgcm9vdCwgaS5lLiB0b3AgbGV2ZWw/XG4gICAgICovXG4gICAgZ2V0IGlzUm9vdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5wYXJlbnQgPT0gbnVsbFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBJcyB0aGlzIGxvY2tlZCAoaS5lLiB1bnNhZmUgdG8gbW9kaWZ5KT9cbiAgICAgKi9cbiAgICBnZXQgaXNMb2NrZWQoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuXy5sb2NrZWRcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBhY3RpdmUgdGltZW91dCBpbiBtaWxsaXNlY29uZHMsIG5vdCBuZWNlc3NhcmlseSBvd24sIG9yIHRoZVxuICAgICAqIGZyYW1ld29yayBkZWZhdWx0IG9mIDIwMDAsIGlmIG5vbmUgd2FzIHNldC5cbiAgICAgKi9cbiAgICBnZXQgdGltZW91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy50aW1lb3V0IHx8IFRlc3RzLmRlZmF1bHRUaW1lb3V0XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYWN0aXZlIHNsb3cgdGhyZXNob2xkIGluIG1pbGxpc2Vjb25kcywgbm90IG5lY2Vzc2FyaWx5IG93biwgb3JcbiAgICAgKiB0aGUgZnJhbWV3b3JrIGRlZmF1bHQgb2YgNzUsIGlmIG5vbmUgd2FzIHNldC5cbiAgICAgKi9cbiAgICBnZXQgc2xvdygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5zbG93IHx8IFRlc3RzLmRlZmF1bHRTbG93XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdGVzdCdzIG93biBtYXggYXR0ZW1wdCBjb3VudC4gTm90ZSB0aGF0IHRoaXMgaXMgcGFyYXNpdGljYWxseVxuICAgICAqIGluaGVyaXRlZCBmcm9tIGl0cyBwYXJlbnQsIG5vdCBkZWxlZ2F0ZWQuXG4gICAgICovXG4gICAgZ2V0IGF0dGVtcHRzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fLmF0dGVtcHRzXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEdldCB3aGV0aGVyIHRoaXMgdGVzdCBpcyBmYWlsYWJsZS4gTm90ZSB0aGF0IHRoaXMgaXMgcGFyYXNpdGljYWxseVxuICAgICAqIGluaGVyaXRlZCBmcm9tIGl0cyBwYXJlbnQsIG5vdCBkZWxlZ2F0ZWQuXG4gICAgICovXG4gICAgZ2V0IGlzRmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8uaXNGYWlsYWJsZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHRlc3QgbmFtZSwgb3IgYHVuZGVmaW5lZGAgaWYgaXQncyB0aGUgcm9vdCB0ZXN0LlxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICBpZiAodGhpcy5fLnBhcmVudCA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIHJldHVybiB0aGlzLl8ubmFtZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHRlc3QgaW5kZXgsIG9yIGB1bmRlZmluZWRgIGlmIGl0J3MgdGhlIHJvb3QgdGVzdC5cbiAgICAgKi9cbiAgICBnZXQgaW5kZXgoKSB7XG4gICAgICAgIGlmICh0aGlzLl8ucGFyZW50ID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5pbmRleFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHRlc3QncyBwYXJlbnQgYXMgYSBSZWZsZWN0LCBvciBgdW5kZWZpbmVkYCBpZiBpdCdzIHRoZSByb290IHRlc3QuXG4gICAgICovXG4gICAgZ2V0IHBhcmVudCgpIHtcbiAgICAgICAgaWYgKHRoaXMuXy5wYXJlbnQgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gbmV3IFJlZmxlY3QodGhpcy5fLnBhcmVudClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgaG9vayB0byBiZSBydW4gYmVmb3JlIGVhY2ggc3VidGVzdCwgaW5jbHVkaW5nIHRoZWlyIHN1YnRlc3RzIGFuZCBzb1xuICAgICAqIG9uLlxuICAgICAqL1xuICAgIGJlZm9yZTogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYmVmb3JlRWFjaCA9IENvbW1vbi5hZGRIb29rKHRoaXMuXy5iZWZvcmVFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgaG9vayB0byBiZSBydW4gb25jZSBiZWZvcmUgYWxsIHN1YnRlc3RzIGFyZSBydW4uXG4gICAgICovXG4gICAgYmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuXy5iZWZvcmVBbGwgPSBDb21tb24uYWRkSG9vayh0aGlzLl8uYmVmb3JlQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAvKipcbiAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIGFmdGVyIGVhY2ggc3VidGVzdCwgaW5jbHVkaW5nIHRoZWlyIHN1YnRlc3RzIGFuZCBzb1xuICAgICogb24uXG4gICAgKi9cbiAgICBhZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYWZ0ZXJFYWNoID0gQ29tbW9uLmFkZEhvb2sodGhpcy5fLmFmdGVyRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZCBhIGhvb2sgdG8gYmUgcnVuIG9uY2UgYWZ0ZXIgYWxsIHN1YnRlc3RzIGFyZSBydW4uXG4gICAgICovXG4gICAgYWZ0ZXJBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fLmFmdGVyQWxsID0gQ29tbW9uLmFkZEhvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYmVmb3JlYCBvciBgcmVmbGVjdC5iZWZvcmVgLlxuICAgICAqL1xuICAgIGhhc0JlZm9yZTogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQ29tbW9uLmhhc0hvb2sodGhpcy5fLmJlZm9yZUVhY2gsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYSBob29rIHByZXZpb3VzbHkgYWRkZWQgd2l0aCBgdC5iZWZvcmVBbGxgIG9yIGByZWZsZWN0LmJlZm9yZUFsbGAuXG4gICAgICovXG4gICAgaGFzQmVmb3JlQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBDb21tb24uaGFzSG9vayh0aGlzLl8uYmVmb3JlQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYWZ0ZXJgIG9yYHJlZmxlY3QuYWZ0ZXJgLlxuICAgICAqL1xuICAgIGhhc0FmdGVyOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBDb21tb24uaGFzSG9vayh0aGlzLl8uYWZ0ZXJFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYWZ0ZXJBbGxgIG9yIGByZWZsZWN0LmFmdGVyQWxsYC5cbiAgICAgKi9cbiAgICBoYXNBZnRlckFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQ29tbW9uLmhhc0hvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYmVmb3JlYCBvciBgcmVmbGVjdC5iZWZvcmVgLlxuICAgICAqL1xuICAgIHJlbW92ZUJlZm9yZTogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYmVmb3JlRWFjaCA9IENvbW1vbi5yZW1vdmVIb29rKHRoaXMuXy5iZWZvcmVFYWNoLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGEgaG9vayBwcmV2aW91c2x5IGFkZGVkIHdpdGggYHQuYmVmb3JlQWxsYCBvciBgcmVmbGVjdC5iZWZvcmVBbGxgLlxuICAgICAqL1xuICAgIHJlbW92ZUJlZm9yZUFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYmVmb3JlQWxsID0gQ29tbW9uLnJlbW92ZUhvb2sodGhpcy5fLmJlZm9yZUFsbCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyYCBvcmByZWZsZWN0LmFmdGVyYC5cbiAgICAgKi9cbiAgICByZW1vdmVBZnRlcjogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl8uYWZ0ZXJFYWNoID0gQ29tbW9uLnJlbW92ZUhvb2sodGhpcy5fLmFmdGVyRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGhvb2sgcHJldmlvdXNseSBhZGRlZCB3aXRoIGB0LmFmdGVyQWxsYCBvciBgcmVmbGVjdC5hZnRlckFsbGAuXG4gICAgICovXG4gICAgcmVtb3ZlQWZ0ZXJBbGw6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fLmFmdGVyQWxsID0gQ29tbW9uLnJlbW92ZUhvb2sodGhpcy5fLmFmdGVyQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgYmxvY2sgb3IgaW5saW5lIHRlc3QuXG4gICAgICovXG4gICAgdGVzdDogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBuYW1lYCB0byBiZSBhIHN0cmluZ1wiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIFRlc3RzLmFkZE5vcm1hbCh0aGlzLl8ucm9vdC5jdXJyZW50LCBuYW1lLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgc2tpcHBlZCBibG9jayBvciBpbmxpbmUgdGVzdC5cbiAgICAgKi9cbiAgICB0ZXN0U2tpcDogZnVuY3Rpb24gKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGBuYW1lYCB0byBiZSBhIHN0cmluZ1wiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIFRlc3RzLmFkZFNraXBwZWQodGhpcy5fLnJvb3QuY3VycmVudCwgbmFtZSlcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBUZXN0cyA9IHJlcXVpcmUoXCIuLi9jb3JlL3Rlc3RzXCIpXG52YXIgRmlsdGVyID0gcmVxdWlyZShcIi4uL2NvcmUvZmlsdGVyXCIpXG52YXIgQ29tbW9uID0gcmVxdWlyZShcIi4vY29tbW9uXCIpXG52YXIgUmVmbGVjdCA9IHJlcXVpcmUoXCIuL3JlZmxlY3RcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUaGFsbGl1bVxuZnVuY3Rpb24gVGhhbGxpdW0oKSB7XG4gICAgdGhpcy5fID0gVGVzdHMuY3JlYXRlUm9vdCgpXG59XG5cbm1ldGhvZHMoVGhhbGxpdW0sIHtcbiAgICAvKipcbiAgICAgKiBDYWxsIGEgcGx1Z2luIGFuZCByZXR1cm4gdGhlIHJlc3VsdC4gVGhlIHBsdWdpbiBpcyBjYWxsZWQgd2l0aCBhIFJlZmxlY3RcbiAgICAgKiBpbnN0YW5jZSBmb3IgYWNjZXNzIHRvIHBsZW50eSBvZiBwb3RlbnRpYWxseSB1c2VmdWwgaW50ZXJuYWwgZGV0YWlscy5cbiAgICAgKi9cbiAgICBjYWxsOiBmdW5jdGlvbiAocGx1Z2luLCBhcmcpIHtcbiAgICAgICAgdmFyIHJlZmxlY3QgPSBuZXcgUmVmbGVjdCh0aGlzLl8ucm9vdC5jdXJyZW50KVxuXG4gICAgICAgIHJldHVybiBwbHVnaW4uY2FsbChyZWZsZWN0LCByZWZsZWN0LCBhcmcpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdoaXRlbGlzdCBzcGVjaWZpYyB0ZXN0cywgdXNpbmcgYXJyYXktYmFzZWQgc2VsZWN0b3JzIHdoZXJlIGVhY2ggZW50cnlcbiAgICAgKiBpcyBlaXRoZXIgYSBzdHJpbmcgb3IgcmVndWxhciBleHByZXNzaW9uLlxuICAgICAqL1xuICAgIG9ubHk6IGZ1bmN0aW9uICgvKiAuLi5zZWxlY3RvcnMgKi8pIHtcbiAgICAgICAgdGhpcy5fLnJvb3QuY3VycmVudC5vbmx5ID0gRmlsdGVyLmNyZWF0ZS5hcHBseSh1bmRlZmluZWQsIGFyZ3VtZW50cylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgcmVwb3J0ZXIuXG4gICAgICovXG4gICAgcmVwb3J0ZXI6IGZ1bmN0aW9uIChyZXBvcnRlciwgYXJnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVwb3J0ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGByZXBvcnRlcmAgdG8gYmUgYSBmdW5jdGlvbi5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByb290ID0gdGhpcy5fLnJvb3RcblxuICAgICAgICBpZiAocm9vdC5jdXJyZW50ICE9PSByb290KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXBvcnRlcnMgbWF5IG9ubHkgYmUgYWRkZWQgdG8gdGhlIHJvb3QuXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdWx0ID0gcmVwb3J0ZXIoYXJnKVxuXG4gICAgICAgIC8vIERvbid0IGFzc3VtZSBpdCdzIGEgZnVuY3Rpb24uIFZlcmlmeSBpdCBhY3R1YWxseSBpcywgc28gd2UgZG9uJ3QgaGF2ZVxuICAgICAgICAvLyBpbmV4cGxpY2FibGUgdHlwZSBlcnJvcnMgaW50ZXJuYWxseSBhZnRlciBpdCdzIGludm9rZWQsIGFuZCBzbyB1c2Vyc1xuICAgICAgICAvLyB3b24ndCBnZXQgdG9vIGNvbmZ1c2VkLlxuICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgYHJlcG9ydGVyYCB0byByZXR1cm4gYSBmdW5jdGlvbi4gQ2hlY2sgd2l0aCB0aGUgXCIgK1xuICAgICAgICAgICAgICAgIFwicmVwb3J0ZXIncyBhdXRob3IsIGFuZCBoYXZlIHRoZW0gZml4IHRoZWlyIHJlcG9ydGVyLlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgcm9vdC5yZXBvcnRlciA9IHJlc3VsdFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGlzIGhhcyBhIHJlcG9ydGVyLlxuICAgICAqL1xuICAgIGdldCBoYXNSZXBvcnRlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290LnJlcG9ydGVyICE9IG51bGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IHRpbWVvdXQuIDAgbWVhbnMgaW5oZXJpdCB0aGUgcGFyZW50J3MsIGFuZCBgSW5maW5pdHlgXG4gICAgICogbWVhbnMgaXQncyBkaXNhYmxlZC5cbiAgICAgKi9cbiAgICBnZXQgdGltZW91dCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290LmN1cnJlbnQudGltZW91dCB8fCBUZXN0cy5kZWZhdWx0VGltZW91dFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLCByb3VuZGluZyBuZWdhdGl2ZXMgdG8gMC4gU2V0dGluZyB0aGVcbiAgICAgKiB0aW1lb3V0IHRvIDAgbWVhbnMgdG8gaW5oZXJpdCB0aGUgcGFyZW50IHRpbWVvdXQsIGFuZCBzZXR0aW5nIGl0IHRvXG4gICAgICogYEluZmluaXR5YCBkaXNhYmxlcyBpdC5cbiAgICAgKi9cbiAgICBzZXQgdGltZW91dCh0aW1lb3V0KSB7XG4gICAgICAgIHRoaXMuXy5yb290LmN1cnJlbnQudGltZW91dCA9IE1hdGguZmxvb3IoTWF0aC5tYXgoK3RpbWVvdXQsIDApKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgc2xvdyB0aHJlc2hvbGQuIDAgbWVhbnMgaW5oZXJpdCB0aGUgcGFyZW50J3MsIGFuZFxuICAgICAqIGBJbmZpbml0eWAgbWVhbnMgaXQncyBkaXNhYmxlZC5cbiAgICAgKi9cbiAgICBnZXQgc2xvdygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290LmN1cnJlbnQuc2xvdyB8fCBUZXN0cy5kZWZhdWx0U2xvd1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHNsb3cgdGhyZXNob2xkIGluIG1pbGxpc2Vjb25kcywgcm91bmRpbmcgbmVnYXRpdmVzIHRvIDAuIFNldHRpbmdcbiAgICAgKiB0aGUgdGltZW91dCB0byAwIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudCB0aHJlc2hvbGQsIGFuZCBzZXR0aW5nIGl0IHRvXG4gICAgICogYEluZmluaXR5YCBkaXNhYmxlcyBpdC5cbiAgICAgKi9cbiAgICBzZXQgc2xvdyhzbG93KSB7XG4gICAgICAgIHRoaXMuXy5yb290LmN1cnJlbnQuc2xvdyA9IE1hdGguZmxvb3IoTWF0aC5tYXgoK3Nsb3csIDApKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgYXR0ZW1wdCBjb3VudC4gYDBgIG1lYW5zIGluaGVyaXQgdGhlIHBhcmVudCdzLlxuICAgICAqL1xuICAgIGdldCBhdHRlbXB0cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuXy5yb290LmN1cnJlbnQuYXR0ZW1wdHNcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBudW1iZXIgb2YgYXR0ZW1wdHMgYWxsb3dlZCwgcm91bmRpbmcgbmVnYXRpdmVzIHRvIDAuIFNldHRpbmcgdGhlXG4gICAgICogY291bnQgdG8gYDBgIG1lYW5zIHRvIGluaGVyaXQgdGhlIHBhcmVudCByZXRyeSBjb3VudC5cbiAgICAgKi9cbiAgICBzZXQgYXR0ZW1wdHMoYXR0ZW1wdHMpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBkb25lIGRpZmZlcmVudGx5IHRvIGF2b2lkIGEgbWFzc2l2ZSBwZXJmb3JtYW5jZSBwZW5hbHR5LlxuICAgICAgICB2YXIgY2FsY3VsYXRlZCA9IE1hdGguZmxvb3IoTWF0aC5tYXgoYXR0ZW1wdHMsIDApKVxuICAgICAgICB2YXIgdGVzdCA9IHRoaXMuXy5yb290LmN1cnJlbnRcblxuICAgICAgICB0ZXN0LmF0dGVtcHRzID0gY2FsY3VsYXRlZCB8fCB0ZXN0LnBhcmVudC5hdHRlbXB0c1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZXQgd2hldGhlciB0aGlzIHRlc3QgaXMgZmFpbGFibGUuXG4gICAgICovXG4gICAgZ2V0IGlzRmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl8ucm9vdC5jdXJyZW50LmlzRmFpbGFibGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IHdoZXRoZXIgdGhpcyB0ZXN0IGlzIGZhaWxhYmxlLlxuICAgICAqL1xuICAgIHNldCBpc0ZhaWxhYmxlKGlzRmFpbGFibGUpIHtcbiAgICAgICAgdGhpcy5fLnJvb3QuY3VycmVudC5pc0ZhaWxhYmxlID0gISFpc0ZhaWxhYmxlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJ1biB0aGUgdGVzdHMgKG9yIHRoZSB0ZXN0J3MgdGVzdHMgaWYgaXQncyBub3QgYSBiYXNlIGluc3RhbmNlKS5cbiAgICAgKi9cbiAgICBydW46IGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgICAgIGlmICh0aGlzLl8ucm9vdCAhPT0gdGhpcy5fKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJPbmx5IHRoZSByb290IHRlc3QgY2FuIGJlIHJ1biAtIElmIHlvdSBvbmx5IHdhbnQgdG8gcnVuIGEgXCIgK1xuICAgICAgICAgICAgICAgIFwic3VidGVzdCwgdXNlIGB0Lm9ubHkoW1xcXCJzZWxlY3RvcjFcXFwiLCAuLi5dKWAgaW5zdGVhZC5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl8ubG9ja2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBydW4gd2hpbGUgdGVzdHMgYXJlIGFscmVhZHkgcnVubmluZy5cIilcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBUZXN0cy5ydW5UZXN0KHRoaXMuXywgb3B0cylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQWRkIGEgdGVzdC5cbiAgICAgKi9cbiAgICB0ZXN0OiBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgYG5hbWVgIHRvIGJlIGEgc3RyaW5nXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgVGVzdHMuYWRkTm9ybWFsKHRoaXMuXy5yb290LmN1cnJlbnQsIG5hbWUsIGNhbGxiYWNrKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBza2lwcGVkIHRlc3QuXG4gICAgICovXG4gICAgdGVzdFNraXA6IGZ1bmN0aW9uIChuYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBgbmFtZWAgdG8gYmUgYSBzdHJpbmdcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5hZGRTa2lwcGVkKHRoaXMuXy5yb290LmN1cnJlbnQsIG5hbWUpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENsZWFyIGFsbCBleGlzdGluZyB0ZXN0cy5cbiAgICAgKi9cbiAgICBjbGVhclRlc3RzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl8ucm9vdCAhPT0gdGhpcy5fKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUZXN0cyBtYXkgb25seSBiZSBjbGVhcmVkIGF0IHRoZSByb290LlwiKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuXy5sb2NrZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGNsZWFyIHRlc3RzIHdoaWxlIHRoZXkgYXJlIHJ1bm5pbmcuXCIpXG4gICAgICAgIH1cblxuICAgICAgICBUZXN0cy5jbGVhclRlc3RzKHRoaXMuXylcbiAgICB9LFxuXG4gICAgYmVmb3JlOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0ZXN0ID0gdGhpcy5fLnJvb3QuY3VycmVudFxuXG4gICAgICAgIHRlc3QuYmVmb3JlRWFjaCA9IENvbW1vbi5hZGRIb29rKHRlc3QuYmVmb3JlRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIGJlZm9yZUFsbDogZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGVzdCA9IHRoaXMuXy5yb290LmN1cnJlbnRcblxuICAgICAgICB0ZXN0LmJlZm9yZUFsbCA9IENvbW1vbi5hZGRIb29rKHRlc3QuYmVmb3JlQWxsLCBjYWxsYmFjaylcbiAgICB9LFxuXG4gICAgYWZ0ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRlc3QgPSB0aGlzLl8ucm9vdC5jdXJyZW50XG5cbiAgICAgICAgdGVzdC5hZnRlckVhY2ggPSBDb21tb24uYWRkSG9vayh0ZXN0LmFmdGVyRWFjaCwgY2FsbGJhY2spXG4gICAgfSxcblxuICAgIGFmdGVyQWxsOiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0ZXN0ID0gdGhpcy5fLnJvb3QuY3VycmVudFxuXG4gICAgICAgIHRlc3QuYWZ0ZXJBbGwgPSBDb21tb24uYWRkSG9vayh0ZXN0LmFmdGVyQWxsLCBjYWxsYmFjaylcbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogVGhpcyBpcyB0aGUgZW50cnkgcG9pbnQgZm9yIHRoZSBCcm93c2VyaWZ5IGJ1bmRsZS4gTm90ZSB0aGF0IGl0ICphbHNvKiB3aWxsXG4gKiBydW4gYXMgcGFydCBvZiB0aGUgdGVzdHMgaW4gTm9kZSAodW5idW5kbGVkKSwgYW5kIGl0IHRoZW9yZXRpY2FsbHkgY291bGQgYmVcbiAqIHJ1biBpbiBOb2RlIG9yIGEgcnVudGltZSBsaW1pdGVkIHRvIG9ubHkgRVM1IHN1cHBvcnQgKGUuZy4gUmhpbm8sIE5hc2hvcm4sIG9yXG4gKiBlbWJlZGRlZCBWOCksIHNvIGRvICpub3QqIGFzc3VtZSBicm93c2VyIGdsb2JhbHMgYXJlIHByZXNlbnQuXG4gKi9cblxudmFyIHQgPSByZXF1aXJlKFwiLi4vaW5kZXhcIilcbnZhciBkb20gPSByZXF1aXJlKFwiLi4vZG9tXCIpXG5cbmdsb2JhbC50ID0gdFxuZ2xvYmFsLmFzc2VydCA9IHJlcXVpcmUoXCIuLi9hc3NlcnRcIilcbnQuciA9IHJlcXVpcmUoXCIuLi9yXCIpXG50LmRvbSA9IGRvbVxudC5pbnRlcm5hbCA9IHJlcXVpcmUoXCIuLi9pbnRlcm5hbFwiKVxuXG5mdW5jdGlvbiBhdXRvbG9hZChzY3JpcHQpIHtcbiAgICBpZiAoIXNjcmlwdC5oYXNBdHRyaWJ1dGUoXCJkYXRhLWZpbGVzXCIpKSByZXR1cm5cblxuICAgIGZ1bmN0aW9uIHNldChvcHRzLCBhdHRyLCB0cmFuc2Zvcm0pIHtcbiAgICAgICAgdmFyIHZhbHVlID0gc2NyaXB0LmdldEF0dHJpYnV0ZShcImRhdGEtXCIgKyBhdHRyKVxuXG4gICAgICAgIGlmICh2YWx1ZSkgb3B0c1thdHRyXSA9IHRyYW5zZm9ybSh2YWx1ZSlcbiAgICB9XG5cbiAgICB2YXIgZmlsZXMgPSBzY3JpcHQuZ2V0QXR0cmlidXRlKFwiZGF0YS1maWxlc1wiKS50cmltKClcbiAgICB2YXIgb3B0cyA9IHtmaWxlczogZmlsZXMgPyBmaWxlcy5zcGxpdCgvXFxzKy9nKSA6IFtdfVxuXG4gICAgc2V0KG9wdHMsIFwib25yZWFkeVwiLCBGdW5jdGlvbilcbiAgICBzZXQob3B0cywgXCJ0aW1lb3V0XCIsIE51bWJlcilcbiAgICBzZXQob3B0cywgXCJwcmVsb2FkXCIsIEZ1bmN0aW9uKVxuICAgIHNldChvcHRzLCBcInByZXJ1blwiLCBGdW5jdGlvbilcbiAgICBzZXQob3B0cywgXCJwb3N0cnVuXCIsIEZ1bmN0aW9uKVxuICAgIHNldChvcHRzLCBcIm9uZXJyb3JcIiwgZnVuY3Rpb24gKGF0dHIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcImVyclwiLCBhdHRyKSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgfSlcblxuICAgIGlmIChnbG9iYWwuZG9jdW1lbnQucmVhZHlTdGF0ZSAhPT0gXCJsb2FkaW5nXCIpIHtcbiAgICAgICAgZG9tKG9wdHMpLnJ1bigpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2xvYmFsLmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRvbShvcHRzKS5ydW4oKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuaWYgKGdsb2JhbC5kb2N1bWVudCAhPSBudWxsICYmIGdsb2JhbC5kb2N1bWVudC5jdXJyZW50U2NyaXB0ICE9IG51bGwpIHtcbiAgICBhdXRvbG9hZChnbG9iYWwuZG9jdW1lbnQuY3VycmVudFNjcmlwdClcbn1cblxuLy8gSW4gY2FzZSB0aGUgdXNlciBuZWVkcyB0byBhZGp1c3QgdGhpcyAoZS5nLiBOYXNob3JuICsgY29uc29sZSBvdXRwdXQpLlxudmFyIFNldHRpbmdzID0gcmVxdWlyZShcIi4vc2V0dGluZ3NcIilcblxudC5zZXR0aW5ncyA9IHtcbiAgICB3aW5kb3dXaWR0aDoge1xuICAgICAgICBnZXQ6IFNldHRpbmdzLndpbmRvd1dpZHRoLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldFdpbmRvd1dpZHRoLFxuICAgIH0sXG5cbiAgICBuZXdsaW5lOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3MubmV3bGluZSxcbiAgICAgICAgc2V0OiBTZXR0aW5ncy5zZXROZXdsaW5lLFxuICAgIH0sXG5cbiAgICBzeW1ib2xzOiB7XG4gICAgICAgIGdldDogU2V0dGluZ3Muc3ltYm9scyxcbiAgICAgICAgc2V0OiBTZXR0aW5ncy5zZXRTeW1ib2xzLFxuICAgIH0sXG5cbiAgICBkZWZhdWx0T3B0czoge1xuICAgICAgICBnZXQ6IFNldHRpbmdzLmRlZmF1bHRPcHRzLFxuICAgICAgICBzZXQ6IFNldHRpbmdzLnNldERlZmF1bHRPcHRzLFxuICAgIH0sXG5cbiAgICBjb2xvclN1cHBvcnQ6IHtcbiAgICAgICAgZ2V0OiBTZXR0aW5ncy5Db2xvcnMuZ2V0U3VwcG9ydCxcbiAgICAgICAgc2V0OiBTZXR0aW5ncy5Db2xvcnMuc2V0U3VwcG9ydCxcbiAgICB9LFxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyoqXG4gKiBUaGUgZmlsdGVyIGlzIGFjdHVhbGx5IHN0b3JlZCBhcyBhIHRyZWUgZm9yIGZhc3RlciBsb29rdXAgdGltZXMgd2hlbiB0aGVyZVxuICogYXJlIG11bHRpcGxlIHNlbGVjdG9ycy4gT2JqZWN0cyBjYW4ndCBiZSB1c2VkIGZvciB0aGUgbm9kZXMsIHdoZXJlIGtleXNcbiAqIHJlcHJlc2VudCB2YWx1ZXMgYW5kIHZhbHVlcyByZXByZXNlbnQgY2hpbGRyZW4sIGJlY2F1c2UgcmVndWxhciBleHByZXNzaW9uc1xuICogYXJlbid0IHBvc3NpYmxlIHRvIHVzZS5cbiAqL1xuXG5mdW5jdGlvbiBpc0VxdWl2YWxlbnQoZW50cnksIGl0ZW0pIHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiBpdGVtID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiBlbnRyeSA9PT0gaXRlbVxuICAgIH0gZWxzZSBpZiAoZW50cnkgaW5zdGFuY2VvZiBSZWdFeHAgJiYgaXRlbSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICByZXR1cm4gZW50cnkudG9TdHJpbmcoKSA9PT0gaXRlbS50b1N0cmluZygpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaGVzKGVudHJ5LCBpdGVtKSB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4gZW50cnkgPT09IGl0ZW1cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZW50cnkudGVzdChpdGVtKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gRmlsdGVyKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5jaGlsZHJlbiA9IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBmaW5kRXF1aXZhbGVudChub2RlLCBlbnRyeSkge1xuICAgIGlmIChub2RlLmNoaWxkcmVuID09IG51bGwpIHJldHVybiB1bmRlZmluZWRcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldXG5cbiAgICAgICAgaWYgKGlzRXF1aXZhbGVudChjaGlsZC52YWx1ZSwgZW50cnkpKSByZXR1cm4gY2hpbGRcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIGZpbmRNYXRjaGVzKG5vZGUsIGVudHJ5KSB7XG4gICAgaWYgKG5vZGUuY2hpbGRyZW4gPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV1cblxuICAgICAgICBpZiAobWF0Y2hlcyhjaGlsZC52YWx1ZSwgZW50cnkpKSByZXR1cm4gY2hpbGRcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZmlsdGVyIGZyb20gYSBudW1iZXIgb2Ygc2VsZWN0b3JzXG4gKi9cbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24gKC8qIC4uLnNlbGVjdG9ycyAqLykge1xuICAgIHZhciBmaWx0ZXIgPSBuZXcgRmlsdGVyKClcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShzZWxlY3RvcikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBzZWxlY3RvciBcIiArIGkgKyBcIiB0byBiZSBhbiBhcnJheVwiKVxuICAgICAgICB9XG5cbiAgICAgICAgZmlsdGVyQWRkU2luZ2xlKGZpbHRlciwgc2VsZWN0b3IsIGkpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbHRlclxufVxuXG5mdW5jdGlvbiBmaWx0ZXJBZGRTaW5nbGUobm9kZSwgc2VsZWN0b3IsIGluZGV4KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZW50cnkgPSBzZWxlY3RvcltpXVxuXG4gICAgICAgIC8vIFN0cmluZ3MgYW5kIHJlZ3VsYXIgZXhwcmVzc2lvbnMgYXJlIHRoZSBvbmx5IHRoaW5ncyBhbGxvd2VkLlxuICAgICAgICBpZiAodHlwZW9mIGVudHJ5ICE9PSBcInN0cmluZ1wiICYmICEoZW50cnkgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiU2VsZWN0b3IgXCIgKyBpbmRleCArIFwiIG11c3QgY29uc2lzdCBvZiBvbmx5IHN0cmluZ3MgYW5kL29yIFwiICtcbiAgICAgICAgICAgICAgICBcInJlZ3VsYXIgZXhwcmVzc2lvbnNcIilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaGlsZCA9IGZpbmRFcXVpdmFsZW50KG5vZGUsIGVudHJ5KVxuXG4gICAgICAgIGlmIChjaGlsZCA9PSBudWxsKSB7XG4gICAgICAgICAgICBjaGlsZCA9IG5ldyBGaWx0ZXIoZW50cnkpXG4gICAgICAgICAgICBpZiAobm9kZS5jaGlsZHJlbiA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbiA9IFtjaGlsZF1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5wdXNoKGNoaWxkKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbm9kZSA9IGNoaWxkXG4gICAgfVxufVxuXG5leHBvcnRzLnRlc3QgPSBmdW5jdGlvbiAoZmlsdGVyLCBwYXRoKSB7XG4gICAgdmFyIGxlbmd0aCA9IHBhdGgubGVuZ3RoXG5cbiAgICB3aGlsZSAobGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIGZpbHRlciA9IGZpbmRNYXRjaGVzKGZpbHRlciwgcGF0aFstLWxlbmd0aF0pXG4gICAgICAgIGlmIChmaWx0ZXIgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcblxuLyoqXG4gKiBBbGwgdGhlIHJlcG9ydCB0eXBlcy4gVGhlIG9ubHkgcmVhc29uIHRoZXJlIGFyZSBtb3JlIHRoYW4gdHdvIHR5cGVzIChub3JtYWxcbiAqIGFuZCBob29rKSBpcyBmb3IgdGhlIHVzZXIncyBiZW5lZml0IChkZXYgdG9vbHMsIGB1dGlsLmluc3BlY3RgLCBldGMuKVxuICovXG5cbnZhciBUeXBlcyA9IGV4cG9ydHMuVHlwZXMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBTdGFydDogMCxcbiAgICBFbnRlcjogMSxcbiAgICBMZWF2ZTogMixcbiAgICBQYXNzOiAzLFxuICAgIEZhaWw6IDQsXG4gICAgU2tpcDogNSxcbiAgICBFbmQ6IDYsXG4gICAgRXJyb3I6IDcsXG5cbiAgICAvLyBOb3RlIHRoYXQgYEhvb2tgIGlzIGFjdHVhbGx5IGEgYml0IGZsYWcsIHRvIHNhdmUgc29tZSBzcGFjZSAoYW5kIHRvXG4gICAgLy8gc2ltcGxpZnkgdGhlIHR5cGUgcmVwcmVzZW50YXRpb24pLlxuICAgIEhvb2s6IDgsXG59KVxuXG52YXIgSG9va1N0YWdlID0gZXhwb3J0cy5Ib29rU3RhZ2UgPSBPYmplY3QuZnJlZXplKHtcbiAgICBCZWZvcmVBbGw6IFR5cGVzLkhvb2sgfCAwLFxuICAgIEJlZm9yZUVhY2g6IFR5cGVzLkhvb2sgfCAxLFxuICAgIEFmdGVyRWFjaDogVHlwZXMuSG9vayB8IDIsXG4gICAgQWZ0ZXJBbGw6IFR5cGVzLkhvb2sgfCAzLFxufSlcblxuZXhwb3J0cy5SZXBvcnQgPSBSZXBvcnRcbmZ1bmN0aW9uIFJlcG9ydCh0eXBlKSB7XG4gICAgdGhpcy5fID0gdHlwZVxufVxuXG4vLyBBdm9pZCBhIHJlY3Vyc2l2ZSBjYWxsIHdoZW4gYGluc3BlY3RgaW5nIGEgcmVzdWx0IHdoaWxlIHN0aWxsIGtlZXBpbmcgaXRcbi8vIHN0eWxlZCBsaWtlIGl0IHdvdWxkIGJlIG5vcm1hbGx5LiBFYWNoIHR5cGUgdXNlcyBhIG5hbWVkIHNpbmdsZXRvbiBmYWN0b3J5IHRvXG4vLyBlbnN1cmUgZW5naW5lcyBzaG93IHRoZSBjb3JyZWN0IGBuYW1lYC9gZGlzcGxheU5hbWVgIGZvciB0aGUgdHlwZS5cbmZ1bmN0aW9uIGluaXRJbnNwZWN0KGluc3BlY3QsIHJlcG9ydCkge1xuICAgIHZhciB0eXBlID0gcmVwb3J0Ll9cblxuICAgIGlmICh0eXBlICYgVHlwZXMuSG9vaykge1xuICAgICAgICBpbnNwZWN0LnN0YWdlID0gcmVwb3J0LnN0YWdlXG4gICAgfVxuXG4gICAgaWYgKHR5cGUgIT09IFR5cGVzLlN0YXJ0ICYmXG4gICAgICAgICAgICB0eXBlICE9PSBUeXBlcy5FbmQgJiZcbiAgICAgICAgICAgIHR5cGUgIT09IFR5cGVzLkVycm9yKSB7XG4gICAgICAgIGluc3BlY3QucGF0aCA9IHJlcG9ydC5wYXRoXG4gICAgfVxuXG4gICAgaWYgKHR5cGUgJiBUeXBlcy5Ib29rKSB7XG4gICAgICAgIGluc3BlY3Qucm9vdFBhdGggPSByZXBvcnQucm9vdFBhdGhcbiAgICB9XG5cbiAgICAvLyBPbmx5IGFkZCB0aGUgcmVsZXZhbnQgcHJvcGVydGllc1xuICAgIGlmICh0eXBlID09PSBUeXBlcy5GYWlsIHx8XG4gICAgICAgICAgICB0eXBlID09PSBUeXBlcy5FcnJvciB8fFxuICAgICAgICAgICAgdHlwZSAmIFR5cGVzLkhvb2spIHtcbiAgICAgICAgaW5zcGVjdC52YWx1ZSA9IHJlcG9ydC52YWx1ZVxuICAgIH1cblxuICAgIGlmICh0eXBlID09PSBUeXBlcy5FbnRlciB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gVHlwZXMuUGFzcyB8fFxuICAgICAgICAgICAgdHlwZSA9PT0gVHlwZXMuRmFpbCkge1xuICAgICAgICBpbnNwZWN0LmR1cmF0aW9uID0gcmVwb3J0LmR1cmF0aW9uXG4gICAgICAgIGluc3BlY3Quc2xvdyA9IHJlcG9ydC5zbG93XG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09IFR5cGVzLkZhaWwpIHtcbiAgICAgICAgaW5zcGVjdC5pc0ZhaWxhYmxlID0gcmVwb3J0LmlzRmFpbGFibGVcbiAgICB9XG59XG5cbm1ldGhvZHMoUmVwb3J0LCB7XG4gICAgLy8gVGhlIHJlcG9ydCB0eXBlc1xuICAgIGdldCBpc1N0YXJ0KCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5TdGFydCB9LFxuICAgIGdldCBpc0VudGVyKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5FbnRlciB9LFxuICAgIGdldCBpc0xlYXZlKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5MZWF2ZSB9LFxuICAgIGdldCBpc1Bhc3MoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLlBhc3MgfSxcbiAgICBnZXQgaXNGYWlsKCkgeyByZXR1cm4gdGhpcy5fID09PSBUeXBlcy5GYWlsIH0sXG4gICAgZ2V0IGlzU2tpcCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuU2tpcCB9LFxuICAgIGdldCBpc0VuZCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gVHlwZXMuRW5kIH0sXG4gICAgZ2V0IGlzRXJyb3IoKSB7IHJldHVybiB0aGlzLl8gPT09IFR5cGVzLkVycm9yIH0sXG4gICAgZ2V0IGlzSG9vaygpIHsgcmV0dXJuICh0aGlzLl8gJiBUeXBlcy5Ib29rKSAhPT0gMCB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgc3RyaW5naWZpZWQgZGVzY3JpcHRpb24gb2YgdGhlIHR5cGUuXG4gICAgICovXG4gICAgZ2V0IHR5cGUoKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5fKSB7XG4gICAgICAgIGNhc2UgVHlwZXMuU3RhcnQ6IHJldHVybiBcInN0YXJ0XCJcbiAgICAgICAgY2FzZSBUeXBlcy5FbnRlcjogcmV0dXJuIFwiZW50ZXJcIlxuICAgICAgICBjYXNlIFR5cGVzLkxlYXZlOiByZXR1cm4gXCJsZWF2ZVwiXG4gICAgICAgIGNhc2UgVHlwZXMuUGFzczogcmV0dXJuIFwicGFzc1wiXG4gICAgICAgIGNhc2UgVHlwZXMuRmFpbDogcmV0dXJuIFwiZmFpbFwiXG4gICAgICAgIGNhc2UgVHlwZXMuU2tpcDogcmV0dXJuIFwic2tpcFwiXG4gICAgICAgIGNhc2UgVHlwZXMuRW5kOiByZXR1cm4gXCJlbmRcIlxuICAgICAgICBjYXNlIFR5cGVzLkVycm9yOiByZXR1cm4gXCJlcnJvclwiXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBpZiAodGhpcy5fICYgVHlwZXMuSG9vaykgcmV0dXJuIFwiaG9va1wiXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bnJlYWNoYWJsZVwiKVxuICAgICAgICB9XG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuU3RhcnQgPSBTdGFydFJlcG9ydFxuZnVuY3Rpb24gU3RhcnRSZXBvcnQoKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuU3RhcnQpXG59XG5tZXRob2RzKFN0YXJ0UmVwb3J0LCBSZXBvcnQsIHtcbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuRW50ZXIgPSBFbnRlclJlcG9ydFxuZnVuY3Rpb24gRW50ZXJSZXBvcnQocGF0aCwgZHVyYXRpb24sIHNsb3cpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5FbnRlcilcbiAgICB0aGlzLnBhdGggPSBwYXRoXG4gICAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uXG4gICAgdGhpcy5zbG93ID0gc2xvd1xufVxubWV0aG9kcyhFbnRlclJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gRW50ZXJSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5MZWF2ZSA9IExlYXZlUmVwb3J0XG5mdW5jdGlvbiBMZWF2ZVJlcG9ydChwYXRoKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuTGVhdmUpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxufVxubWV0aG9kcyhMZWF2ZVJlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gTGVhdmVSZXBvcnQocmVwb3J0KSB7XG4gICAgICAgICAgICBpbml0SW5zcGVjdCh0aGlzLCByZXBvcnQpXG4gICAgICAgIH0odGhpcylcbiAgICB9LFxufSlcblxuZXhwb3J0cy5QYXNzID0gUGFzc1JlcG9ydFxuZnVuY3Rpb24gUGFzc1JlcG9ydChwYXRoLCBkdXJhdGlvbiwgc2xvdykge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLlBhc3MpXG4gICAgdGhpcy5wYXRoID0gcGF0aFxuICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvblxuICAgIHRoaXMuc2xvdyA9IHNsb3dcbn1cbm1ldGhvZHMoUGFzc1JlcG9ydCwgUmVwb3J0LCB7XG4gICAgLyoqXG4gICAgICogU28gdXRpbC5pbnNwZWN0IHByb3ZpZGVzIG1vcmUgc2Vuc2libGUgb3V0cHV0IGZvciB0ZXN0aW5nL2V0Yy5cbiAgICAgKi9cbiAgICBpbnNwZWN0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgZnVuY3Rpb24gUGFzc1JlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLkZhaWwgPSBGYWlsUmVwb3J0XG5mdW5jdGlvbiBGYWlsUmVwb3J0KHBhdGgsIGVycm9yLCBkdXJhdGlvbiwgc2xvdywgaXNGYWlsYWJsZSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBUeXBlcy5GYWlsKVxuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLmVycm9yID0gZXJyb3JcbiAgICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb25cbiAgICB0aGlzLnNsb3cgPSBzbG93XG4gICAgdGhpcy5pc0ZhaWxhYmxlID0gaXNGYWlsYWJsZVxufVxubWV0aG9kcyhGYWlsUmVwb3J0LCBSZXBvcnQsIHtcbiAgICAvKipcbiAgICAgKiBTbyB1dGlsLmluc3BlY3QgcHJvdmlkZXMgbW9yZSBzZW5zaWJsZSBvdXRwdXQgZm9yIHRlc3RpbmcvZXRjLlxuICAgICAqL1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBGYWlsUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuU2tpcCA9IFNraXBSZXBvcnRcbmZ1bmN0aW9uIFNraXBSZXBvcnQocGF0aCkge1xuICAgIFJlcG9ydC5jYWxsKHRoaXMsIFR5cGVzLlNraXApXG4gICAgdGhpcy5wYXRoID0gcGF0aFxufVxubWV0aG9kcyhTa2lwUmVwb3J0LCBSZXBvcnQsIHtcbiAgICAvKipcbiAgICAgKiBTbyB1dGlsLmluc3BlY3QgcHJvdmlkZXMgbW9yZSBzZW5zaWJsZSBvdXRwdXQgZm9yIHRlc3RpbmcvZXRjLlxuICAgICAqL1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBTa2lwUmVwb3J0KHJlcG9ydCkge1xuICAgICAgICAgICAgaW5pdEluc3BlY3QodGhpcywgcmVwb3J0KVxuICAgICAgICB9KHRoaXMpXG4gICAgfSxcbn0pXG5cbmV4cG9ydHMuRW5kID0gRW5kUmVwb3J0XG5mdW5jdGlvbiBFbmRSZXBvcnQoKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuRW5kKVxufVxubWV0aG9kcyhFbmRSZXBvcnQsIFJlcG9ydCwge1xuICAgIC8qKlxuICAgICAqIFNvIHV0aWwuaW5zcGVjdCBwcm92aWRlcyBtb3JlIHNlbnNpYmxlIG91dHB1dCBmb3IgdGVzdGluZy9ldGMuXG4gICAgICovXG4gICAgaW5zcGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IGZ1bmN0aW9uIEVuZFJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG5leHBvcnRzLkVycm9yID0gRXJyb3JSZXBvcnRcbmZ1bmN0aW9uIEVycm9yUmVwb3J0KGVycm9yKSB7XG4gICAgUmVwb3J0LmNhbGwodGhpcywgVHlwZXMuRXJyb3IpXG4gICAgdGhpcy5lcnJvciA9IGVycm9yXG59XG5tZXRob2RzKEVycm9yUmVwb3J0LCBSZXBvcnQsIHtcbiAgICAvKipcbiAgICAgKiBTbyB1dGlsLmluc3BlY3QgcHJvdmlkZXMgbW9yZSBzZW5zaWJsZSBvdXRwdXQgZm9yIHRlc3RpbmcvZXRjLlxuICAgICAqL1xuICAgIGluc3BlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBmdW5jdGlvbiBFcnJvclJlcG9ydChyZXBvcnQpIHtcbiAgICAgICAgICAgIGluaXRJbnNwZWN0KHRoaXMsIHJlcG9ydClcbiAgICAgICAgfSh0aGlzKVxuICAgIH0sXG59KVxuXG52YXIgSG9va01ldGhvZHMgPSB7XG4gICAgZ2V0IHN0YWdlKCkge1xuICAgICAgICBzd2l0Y2ggKHRoaXMuXykge1xuICAgICAgICBjYXNlIEhvb2tTdGFnZS5CZWZvcmVBbGw6IHJldHVybiBcImJlZm9yZSBhbGxcIlxuICAgICAgICBjYXNlIEhvb2tTdGFnZS5CZWZvcmVFYWNoOiByZXR1cm4gXCJiZWZvcmUgZWFjaFwiXG4gICAgICAgIGNhc2UgSG9va1N0YWdlLkFmdGVyRWFjaDogcmV0dXJuIFwiYWZ0ZXIgZWFjaFwiXG4gICAgICAgIGNhc2UgSG9va1N0YWdlLkFmdGVyQWxsOiByZXR1cm4gXCJhZnRlciBhbGxcIlxuICAgICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoXCJ1bnJlYWNoYWJsZVwiKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldCBpc0JlZm9yZUFsbCgpIHsgcmV0dXJuIHRoaXMuXyA9PT0gSG9va1N0YWdlLkJlZm9yZUFsbCB9LFxuICAgIGdldCBpc0JlZm9yZUVhY2goKSB7IHJldHVybiB0aGlzLl8gPT09IEhvb2tTdGFnZS5CZWZvcmVFYWNoIH0sXG4gICAgZ2V0IGlzQWZ0ZXJFYWNoKCkgeyByZXR1cm4gdGhpcy5fID09PSBIb29rU3RhZ2UuQWZ0ZXJFYWNoIH0sXG4gICAgZ2V0IGlzQWZ0ZXJBbGwoKSB7IHJldHVybiB0aGlzLl8gPT09IEhvb2tTdGFnZS5BZnRlckFsbCB9LFxufVxuXG5leHBvcnRzLkhvb2tFcnJvciA9IEhvb2tFcnJvclxuZnVuY3Rpb24gSG9va0Vycm9yKHN0YWdlLCBmdW5jLCBlcnJvcikge1xuICAgIHRoaXMuXyA9IHN0YWdlXG4gICAgdGhpcy5uYW1lID0gZnVuYy5uYW1lIHx8IGZ1bmMuZGlzcGxheU5hbWUgfHwgXCJcIlxuICAgIHRoaXMuZXJyb3IgPSBlcnJvclxufVxubWV0aG9kcyhIb29rRXJyb3IsIEhvb2tNZXRob2RzKVxuXG5leHBvcnRzLkhvb2sgPSBIb29rUmVwb3J0XG5mdW5jdGlvbiBIb29rUmVwb3J0KHBhdGgsIHJvb3RQYXRoLCBob29rRXJyb3IpIHtcbiAgICBSZXBvcnQuY2FsbCh0aGlzLCBob29rRXJyb3IuXylcbiAgICB0aGlzLnBhdGggPSBwYXRoXG4gICAgdGhpcy5yb290UGF0aCA9IHJvb3RQYXRoXG4gICAgdGhpcy5uYW1lID0gaG9va0Vycm9yLm5hbWVcbiAgICB0aGlzLmVycm9yID0gaG9va0Vycm9yLmVycm9yXG59XG5tZXRob2RzKEhvb2tSZXBvcnQsIFJlcG9ydCwgSG9va01ldGhvZHMsIHtcbiAgICBnZXQgaG9va0Vycm9yKCkgeyByZXR1cm4gbmV3IEhvb2tFcnJvcih0aGlzLl8sIHRoaXMsIHRoaXMuZXJyb3IpIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxudmFyIHBlYWNoID0gcmVxdWlyZShcIi4uL3V0aWxcIikucGVhY2hcbnZhciBSZXBvcnRzID0gcmVxdWlyZShcIi4vcmVwb3J0c1wiKVxudmFyIEZpbHRlciA9IHJlcXVpcmUoXCIuL2ZpbHRlclwiKVxudmFyIEhvb2tTdGFnZSA9IFJlcG9ydHMuSG9va1N0YWdlXG5cbi8qKlxuICogVGhlIHRlc3RzIGFyZSBsYWlkIG91dCBpbiBhIHZlcnkgZGF0YS1kcml2ZW4gZGVzaWduLiBXaXRoIGV4Y2VwdGlvbiBvZiB0aGVcbiAqIHJlcG9ydHMsIHRoZXJlIGlzIG1pbmltYWwgb2JqZWN0IG9yaWVudGF0aW9uIGFuZCB6ZXJvIHZpcnR1YWwgZGlzcGF0Y2guXG4gKiBIZXJlJ3MgYSBxdWljayBvdmVydmlldzpcbiAqXG4gKiAtIFRoZSB0ZXN0IGhhbmRsaW5nIGRpc3BhdGNoZXMgYmFzZWQgb24gdmFyaW91cyBhdHRyaWJ1dGVzIHRoZSB0ZXN0IGhhcy4gRm9yXG4gKiAgIGV4YW1wbGUsIHJvb3RzIGFyZSBrbm93biBieSBhIGNpcmN1bGFyIHJvb3QgcmVmZXJlbmNlLCBhbmQgc2tpcHBlZCB0ZXN0c1xuICogICBhcmUga25vd24gYnkgbm90IGhhdmluZyBhIGNhbGxiYWNrLlxuICpcbiAqIC0gVGhlIHRlc3QgZXZhbHVhdGlvbiBpcyB2ZXJ5IHByb2NlZHVyYWwuIEFsdGhvdWdoIGl0J3MgdmVyeSBoaWdobHlcbiAqICAgYXN5bmNocm9ub3VzLCB0aGUgdXNlIG9mIHByb21pc2VzIGxpbmVhcml6ZSB0aGUgbG9naWMsIHNvIGl0IHJlYWRzIHZlcnlcbiAqICAgbXVjaCBsaWtlIGEgcmVjdXJzaXZlIHNldCBvZiBzdGVwcy5cbiAqXG4gKiAtIFRoZSBkYXRhIHR5cGVzIGFyZSBtb3N0bHkgZWl0aGVyIHBsYWluIG9iamVjdHMgb3IgY2xhc3NlcyB3aXRoIG5vIG1ldGhvZHMsXG4gKiAgIHRoZSBsYXR0ZXIgbW9zdGx5IGZvciBkZWJ1Z2dpbmcgaGVscC4gVGhpcyBhbHNvIGF2b2lkcyBtb3N0IG9mIHRoZVxuICogICBpbmRpcmVjdGlvbiByZXF1aXJlZCB0byBhY2NvbW1vZGF0ZSBicmVha2luZyBhYnN0cmFjdGlvbnMsIHdoaWNoIHRoZSBBUElcbiAqICAgbWV0aG9kcyBmcmVxdWVudGx5IG5lZWQgdG8gZG8uXG4gKi9cblxuLy8gUHJldmVudCBTaW5vbiBpbnRlcmZlcmVuY2Ugd2hlbiB0aGV5IGluc3RhbGwgdGhlaXIgbW9ja3NcbnZhciBzZXRUaW1lb3V0ID0gZ2xvYmFsLnNldFRpbWVvdXRcbnZhciBjbGVhclRpbWVvdXQgPSBnbG9iYWwuY2xlYXJUaW1lb3V0XG52YXIgbm93ID0gZ2xvYmFsLkRhdGUubm93XG5cbi8qKlxuICogQmFzaWMgZGF0YSB0eXBlc1xuICovXG5mdW5jdGlvbiBSZXN1bHQodGltZSwgYXR0ZW1wdCkge1xuICAgIHRoaXMudGltZSA9IHRpbWVcbiAgICB0aGlzLmNhdWdodCA9IGF0dGVtcHQuY2F1Z2h0XG4gICAgdGhpcy52YWx1ZSA9IGF0dGVtcHQuY2F1Z2h0ID8gYXR0ZW1wdC52YWx1ZSA6IHVuZGVmaW5lZFxufVxuXG4vKipcbiAqIE92ZXJ2aWV3IG9mIHRoZSB0ZXN0IHByb3BlcnRpZXM6XG4gKlxuICogLSBgcm9vdGAgLSBUaGUgcm9vdCB0ZXN0XG4gKiAtIGByZXBvcnRlcnNgIC0gVGhlIGxpc3Qgb2YgcmVwb3J0ZXJzXG4gKiAtIGBjdXJyZW50YCAtIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50bHkgYWN0aXZlIHRlc3RcbiAqIC0gYHRpbWVvdXRgIC0gVGhlIHRlc3RzJ3MgdGltZW91dCwgb3IgMCBpZiBpbmhlcml0ZWRcbiAqIC0gYHNsb3dgIC0gVGhlIHRlc3RzJ3Mgc2xvdyB0aHJlc2hvbGRcbiAqIC0gYG5hbWVgIC0gVGhlIHRlc3QncyBuYW1lXG4gKiAtIGBpbmRleGAgLSBUaGUgdGVzdCdzIGluZGV4XG4gKiAtIGBwYXJlbnRgIC0gVGhlIHRlc3QncyBwYXJlbnRcbiAqIC0gYGNhbGxiYWNrYCAtIFRoZSB0ZXN0J3MgY2FsbGJhY2tcbiAqIC0gYHRlc3RzYCAtIFRoZSB0ZXN0J3MgY2hpbGQgdGVzdHNcbiAqIC0gYGJlZm9yZUFsbGAsIGBiZWZvcmVFYWNoYCwgYGFmdGVyRWFjaGAsIGBhZnRlckFsbGAgLSBUaGUgdGVzdCdzIHZhcmlvdXNcbiAqICAgc2NoZWR1bGVkIGhvb2tzXG4gKlxuICogTWFueSBvZiB0aGVzZSBwcm9wZXJ0aWVzIGFyZW4ndCBwcmVzZW50IG9uIGluaXRpYWxpemF0aW9uIHRvIHNhdmUgbWVtb3J5LlxuICovXG5cbmZ1bmN0aW9uIE5vcm1hbChuYW1lLCBpbmRleCwgcGFyZW50LCBjYWxsYmFjaykge1xuICAgIHRoaXMubG9ja2VkID0gdHJ1ZVxuICAgIHRoaXMucm9vdCA9IHBhcmVudC5yb290XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMuaW5kZXggPSBpbmRleHwwXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnRcbiAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2tcbiAgICB0aGlzLmlzRmFpbGFibGUgPSBwYXJlbnQuaXNGYWlsYWJsZVxuICAgIHRoaXMuYXR0ZW1wdHMgPSBwYXJlbnQuYXR0ZW1wdHNcblxuICAgIHRoaXMudGltZW91dCA9IHBhcmVudC50aW1lb3V0XG4gICAgdGhpcy5zbG93ID0gcGFyZW50LnNsb3dcbiAgICB0aGlzLnRlc3RzID0gdW5kZWZpbmVkXG4gICAgdGhpcy5iZWZvcmVBbGwgPSB1bmRlZmluZWRcbiAgICB0aGlzLmJlZm9yZUVhY2ggPSB1bmRlZmluZWRcbiAgICB0aGlzLmFmdGVyRWFjaCA9IHVuZGVmaW5lZFxuICAgIHRoaXMuYWZ0ZXJBbGwgPSB1bmRlZmluZWRcbiAgICB0aGlzLnJlcG9ydGVyID0gdW5kZWZpbmVkXG4gICAgdGhpcy5yZWZsZWN0ID0gdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIFNraXBwZWQobmFtZSwgaW5kZXgsIHBhcmVudCkge1xuICAgIHRoaXMubG9ja2VkID0gdHJ1ZVxuICAgIHRoaXMucm9vdCA9IHBhcmVudC5yb290XG4gICAgdGhpcy5uYW1lID0gbmFtZVxuICAgIHRoaXMuaW5kZXggPSBpbmRleHwwXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnRcblxuICAgIC8vIE9ubHkgZm9yIHJlZmxlY3Rpb24uXG4gICAgdGhpcy5pc0ZhaWxhYmxlID0gcGFyZW50LmlzRmFpbGFibGVcbiAgICB0aGlzLmF0dGVtcHRzID0gcGFyZW50LmF0dGVtcHRzXG4gICAgdGhpcy5yZXBvcnRlciA9IHVuZGVmaW5lZFxuICAgIHRoaXMucmVmbGVjdCA9IHVuZGVmaW5lZFxufVxuXG5mdW5jdGlvbiBSb290KCkge1xuICAgIHRoaXMubG9ja2VkID0gZmFsc2VcbiAgICB0aGlzLnJlcG9ydGVySWRzID0gW11cbiAgICB0aGlzLnJlcG9ydGVycyA9IFtdXG4gICAgdGhpcy5jdXJyZW50ID0gdGhpc1xuICAgIHRoaXMucm9vdCA9IHRoaXNcbiAgICB0aGlzLnRpbWVvdXQgPSAwXG4gICAgdGhpcy5zbG93ID0gMFxuICAgIHRoaXMuYXR0ZW1wdHMgPSAxXG4gICAgdGhpcy5pc0ZhaWxhYmxlID0gZmFsc2VcblxuICAgIHRoaXMudGVzdHMgPSB1bmRlZmluZWRcbiAgICB0aGlzLnJlcG9ydGVyID0gdW5kZWZpbmVkXG4gICAgdGhpcy5yZWZsZWN0ID0gdW5kZWZpbmVkXG4gICAgdGhpcy5iZWZvcmVBbGwgPSB1bmRlZmluZWRcbiAgICB0aGlzLmJlZm9yZUVhY2ggPSB1bmRlZmluZWRcbiAgICB0aGlzLmFmdGVyRWFjaCA9IHVuZGVmaW5lZFxuICAgIHRoaXMuYWZ0ZXJBbGwgPSB1bmRlZmluZWRcbn1cblxuZnVuY3Rpb24gQ29udGV4dChyb290KSB7XG4gICAgdGhpcy5yb290ID0gcm9vdFxuICAgIHRoaXMudGVzdHMgPSBbXVxuICAgIHRoaXMuaXNTdWNjZXNzID0gdHJ1ZVxufVxuXG4vKipcbiAqIEJhc2UgdGVzdHMgKGkuZS4gZGVmYXVsdCBleHBvcnQsIHJlc3VsdCBvZiBgaW50ZXJuYWwucm9vdCgpYCkuXG4gKi9cblxuZXhwb3J0cy5jcmVhdGVSb290ID0gZnVuY3Rpb24gKG1ldGhvZHMpIHtcbiAgICByZXR1cm4gbmV3IFJvb3QobWV0aG9kcylcbn1cblxuLyoqXG4gKiBTZXQgdXAgZWFjaCB0ZXN0IHR5cGUuXG4gKi9cblxuLyoqXG4gKiBBIG5vcm1hbCB0ZXN0IHRocm91Z2ggYHQudGVzdCgpYC5cbiAqL1xuXG5leHBvcnRzLmFkZE5vcm1hbCA9IGZ1bmN0aW9uIChwYXJlbnQsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGluZGV4ID0gcGFyZW50LnRlc3RzICE9IG51bGwgPyBwYXJlbnQudGVzdHMubGVuZ3RoIDogMFxuICAgIHZhciBiYXNlID0gbmV3IE5vcm1hbChuYW1lLCBpbmRleCwgcGFyZW50LCBjYWxsYmFjaylcblxuICAgIGlmIChpbmRleCkge1xuICAgICAgICBwYXJlbnQudGVzdHMucHVzaChiYXNlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudC50ZXN0cyA9IFtiYXNlXVxuICAgIH1cbn1cblxuLyoqXG4gKiBBIHNraXBwZWQgdGVzdCB0aHJvdWdoIGB0LnRlc3RTa2lwKClgLlxuICovXG5leHBvcnRzLmFkZFNraXBwZWQgPSBmdW5jdGlvbiAocGFyZW50LCBuYW1lKSB7XG4gICAgdmFyIGluZGV4ID0gcGFyZW50LnRlc3RzICE9IG51bGwgPyBwYXJlbnQudGVzdHMubGVuZ3RoIDogMFxuICAgIHZhciBiYXNlID0gbmV3IFNraXBwZWQobmFtZSwgaW5kZXgsIHBhcmVudClcblxuICAgIGlmIChpbmRleCkge1xuICAgICAgICBwYXJlbnQudGVzdHMucHVzaChiYXNlKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmVudC50ZXN0cyA9IFtiYXNlXVxuICAgIH1cbn1cblxuLyoqXG4gKiBDbGVhciB0aGUgdGVzdHMgaW4gcGxhY2UuXG4gKi9cbmV4cG9ydHMuY2xlYXJUZXN0cyA9IGZ1bmN0aW9uIChwYXJlbnQpIHtcbiAgICBwYXJlbnQudGVzdHMgPSBudWxsXG59XG5cbi8qKlxuICogRXhlY3V0ZSB0aGUgdGVzdHNcbiAqL1xuXG5leHBvcnRzLmRlZmF1bHRUaW1lb3V0ID0gMjAwMCAvLyBtc1xuZXhwb3J0cy5kZWZhdWx0U2xvdyA9IDc1IC8vIG1zXG5cbmZ1bmN0aW9uIG1ha2VTbGljZSh0ZXN0cywgbGVuZ3RoKSB7XG4gICAgdmFyIHJldCA9IG5ldyBBcnJheShsZW5ndGgpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJldFtpXSA9IHtuYW1lOiB0ZXN0c1tpXS5uYW1lLCBpbmRleDogdGVzdHNbaV0uaW5kZXh9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiByZXBvcnRXaXRoKGNvbnRleHQsIGZ1bmMpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChjb250ZXh0LnJvb3QucmVwb3J0ZXIgPT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gZnVuYyhjb250ZXh0LnJvb3QucmVwb3J0ZXIpXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXBvcnRlcnMgPSBjb250ZXh0LnJvb3QucmVwb3J0ZXJzXG5cbiAgICAgICAgLy8gVHdvIGVhc3kgY2FzZXMuXG4gICAgICAgIGlmIChyZXBvcnRlcnMubGVuZ3RoID09PSAwKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIGlmIChyZXBvcnRlcnMubGVuZ3RoID09PSAxKSByZXR1cm4gZnVuYyhyZXBvcnRlcnNbMF0pXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChyZXBvcnRlcnMubWFwKGZ1bmMpKVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHJlcG9ydFN0YXJ0KGNvbnRleHQpIHtcbiAgICByZXR1cm4gcmVwb3J0V2l0aChjb250ZXh0LCBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLlN0YXJ0KCkpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gcmVwb3J0RW50ZXIoY29udGV4dCwgZHVyYXRpb24pIHtcbiAgICB2YXIgdGVzdCA9IGNvbnRleHQucm9vdC5jdXJyZW50XG4gICAgdmFyIHNsb3cgPSB0ZXN0LnNsb3cgfHwgZXhwb3J0cy5kZWZhdWx0U2xvd1xuXG4gICAgcmV0dXJuIHJlcG9ydFdpdGgoY29udGV4dCwgZnVuY3Rpb24gKHJlcG9ydGVyKSB7XG4gICAgICAgIHZhciBwYXRoID0gbWFrZVNsaWNlKGNvbnRleHQudGVzdHMsIGNvbnRleHQudGVzdHMubGVuZ3RoKVxuXG4gICAgICAgIHJldHVybiByZXBvcnRlcihuZXcgUmVwb3J0cy5FbnRlcihwYXRoLCBkdXJhdGlvbiwgc2xvdykpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gcmVwb3J0TGVhdmUoY29udGV4dCkge1xuICAgIHJldHVybiByZXBvcnRXaXRoKGNvbnRleHQsIGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuTGVhdmUoXG4gICAgICAgICAgICBtYWtlU2xpY2UoY29udGV4dC50ZXN0cywgY29udGV4dC50ZXN0cy5sZW5ndGgpKSlcbiAgICB9KVxufVxuXG5mdW5jdGlvbiByZXBvcnRQYXNzKGNvbnRleHQsIGR1cmF0aW9uKSB7XG4gICAgdmFyIHRlc3QgPSBjb250ZXh0LnJvb3QuY3VycmVudFxuICAgIHZhciBzbG93ID0gdGVzdC5zbG93IHx8IGV4cG9ydHMuZGVmYXVsdFNsb3dcblxuICAgIHJldHVybiByZXBvcnRXaXRoKGNvbnRleHQsIGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICB2YXIgcGF0aCA9IG1ha2VTbGljZShjb250ZXh0LnRlc3RzLCBjb250ZXh0LnRlc3RzLmxlbmd0aClcblxuICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuUGFzcyhwYXRoLCBkdXJhdGlvbiwgc2xvdykpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gcmVwb3J0RmFpbChjb250ZXh0LCBlcnJvciwgZHVyYXRpb24pIHtcbiAgICB2YXIgdGVzdCA9IGNvbnRleHQucm9vdC5jdXJyZW50XG4gICAgdmFyIHNsb3cgPSB0ZXN0LnNsb3cgfHwgZXhwb3J0cy5kZWZhdWx0U2xvd1xuICAgIHZhciBpc0ZhaWxhYmxlID0gdGVzdC5pc0ZhaWxhYmxlXG5cbiAgICByZXR1cm4gcmVwb3J0V2l0aChjb250ZXh0LCBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgdmFyIHBhdGggPSBtYWtlU2xpY2UoY29udGV4dC50ZXN0cywgY29udGV4dC50ZXN0cy5sZW5ndGgpXG5cbiAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLkZhaWwoXG4gICAgICAgICAgICBwYXRoLCBlcnJvciwgZHVyYXRpb24sIHNsb3csIGlzRmFpbGFibGUpKVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHJlcG9ydFNraXAoY29udGV4dCkge1xuICAgIHJldHVybiByZXBvcnRXaXRoKGNvbnRleHQsIGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuU2tpcChcbiAgICAgICAgICAgIG1ha2VTbGljZShjb250ZXh0LnRlc3RzLCBjb250ZXh0LnRlc3RzLmxlbmd0aCkpKVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHJlcG9ydEVuZChjb250ZXh0KSB7XG4gICAgcmV0dXJuIHJlcG9ydFdpdGgoY29udGV4dCwgZnVuY3Rpb24gKHJlcG9ydGVyKSB7XG4gICAgICAgIHJldHVybiByZXBvcnRlcihuZXcgUmVwb3J0cy5FbmQoKSlcbiAgICB9KVxufVxuXG5mdW5jdGlvbiByZXBvcnRFcnJvcihjb250ZXh0LCBlcnJvcikge1xuICAgIHJldHVybiByZXBvcnRXaXRoKGNvbnRleHQsIGZ1bmN0aW9uIChyZXBvcnRlcikge1xuICAgICAgICByZXR1cm4gcmVwb3J0ZXIobmV3IFJlcG9ydHMuRXJyb3IoZXJyb3IpKVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHJlcG9ydEhvb2soY29udGV4dCwgdGVzdCwgZXJyb3IpIHtcbiAgICByZXR1cm4gcmVwb3J0V2l0aChjb250ZXh0LCBmdW5jdGlvbiAocmVwb3J0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHJlcG9ydGVyKG5ldyBSZXBvcnRzLkhvb2soXG4gICAgICAgICAgICBtYWtlU2xpY2UoY29udGV4dC50ZXN0cywgY29udGV4dC50ZXN0cy5sZW5ndGgpLFxuICAgICAgICAgICAgbWFrZVNsaWNlKGNvbnRleHQudGVzdHMsIGNvbnRleHQudGVzdHMuaW5kZXhPZih0ZXN0KSArIDEpLFxuICAgICAgICAgICAgZXJyb3IpKVxuICAgIH0pXG59XG5cbi8qKlxuICogTm9ybWFsIHRlc3RzXG4gKi9cblxuLy8gUGhhbnRvbUpTIGFuZCBJRSBkb24ndCBhZGQgdGhlIHN0YWNrIHVudGlsIGl0J3MgdGhyb3duLiBJbiBmYWlsaW5nIGFzeW5jXG4vLyB0ZXN0cywgaXQncyBhbHJlYWR5IHRocm93biBpbiBhIHNlbnNlLCBzbyB0aGlzIHNob3VsZCBiZSBub3JtYWxpemVkIHdpdGhcbi8vIG90aGVyIHRlc3QgdHlwZXMuXG52YXIgYWRkU3RhY2sgPSB0eXBlb2YgbmV3IEVycm9yKCkuc3RhY2sgIT09IFwic3RyaW5nXCJcbiAgICA/IGZ1bmN0aW9uIGFkZFN0YWNrKGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyb3IgJiYgZS5zdGFjayA9PSBudWxsKSB0aHJvdyBlXG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICByZXR1cm4gZVxuICAgICAgICB9XG4gICAgfVxuICAgIDogZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUgfVxuXG5mdW5jdGlvbiBnZXRUaGVuKHJlcykge1xuICAgIGlmICh0eXBlb2YgcmVzID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiByZXMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gcmVzLnRoZW5cbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxufVxuXG5mdW5jdGlvbiBBc3luY1N0YXRlKGNvbnRleHQsIHN0YXJ0LCByZXNvbHZlLCBjb3VudCkge1xuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHRcbiAgICB0aGlzLnN0YXJ0ID0gc3RhcnRcbiAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlXG4gICAgdGhpcy5jb3VudCA9IGNvdW50XG4gICAgdGhpcy50aW1lciA9IHVuZGVmaW5lZFxufVxuXG52YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpXG5cbmZ1bmN0aW9uIGFzeW5jRmluaXNoKHN0YXRlLCBhdHRlbXB0KSB7XG4gICAgLy8gQ2FwdHVyZSBpbW1lZGlhdGVseS4gV29yc3QgY2FzZSBzY2VuYXJpbywgaXQgZ2V0cyB0aHJvd24gYXdheS5cbiAgICB2YXIgZW5kID0gbm93KClcblxuICAgIGlmIChzdGF0ZS50aW1lcikge1xuICAgICAgICBjbGVhclRpbWVvdXQuY2FsbChnbG9iYWwsIHN0YXRlLnRpbWVyKVxuICAgICAgICBzdGF0ZS50aW1lciA9IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIGlmIChhdHRlbXB0LmNhdWdodCAmJiBzdGF0ZS5jb3VudCA8IHN0YXRlLmNvbnRleHQucm9vdC5jdXJyZW50LmF0dGVtcHRzKSB7XG4gICAgICAgIC8vIERvbid0IHJlY3Vyc2Ugc3luY2hyb25vdXNseSwgc2luY2UgaXQgbWF5IGJlIHJlc29sdmVkIHN5bmNocm9ub3VzbHlcbiAgICAgICAgc3RhdGUucmVzb2x2ZShwLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGludm9rZUluaXQoc3RhdGUuY29udGV4dCwgc3RhdGUuY291bnQgKyAxKVxuICAgICAgICB9KSlcbiAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5yZXNvbHZlKG5ldyBSZXN1bHQoZW5kIC0gc3RhdGUuc3RhcnQsIGF0dGVtcHQpKVxuICAgIH1cbn1cblxuLy8gQXZvaWQgY3JlYXRpbmcgYSBjbG9zdXJlIGlmIHBvc3NpYmxlLCBpbiBjYXNlIGl0IGRvZXNuJ3QgcmV0dXJuIGEgdGhlbmFibGUuXG5mdW5jdGlvbiBpbnZva2VJbml0KGNvbnRleHQsIGNvdW50KSB7XG4gICAgdmFyIHRlc3QgPSBjb250ZXh0LnJvb3QuY3VycmVudFxuICAgIHZhciBzdGFydCA9IG5vdygpXG4gICAgdmFyIHRyeUJvZHkgPSB0cnkwKHRlc3QuY2FsbGJhY2spXG4gICAgdmFyIHN5bmNFbmQgPSBub3coKVxuXG4gICAgLy8gTm90ZTogc3luY2hyb25vdXMgZmFpbHVyZXMgYXJlIHRlc3QgZmFpbHVyZXMsIG5vdCBmYXRhbCBlcnJvcnMuXG4gICAgaWYgKHRyeUJvZHkuY2F1Z2h0KSB7XG4gICAgICAgIGlmIChjb3VudCA8IHRlc3QuYXR0ZW1wdHMpIHJldHVybiBpbnZva2VJbml0KGNvbnRleHQsIGNvdW50ICsgMSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgUmVzdWx0KHN5bmNFbmQgLSBzdGFydCwgdHJ5Qm9keSkpXG4gICAgfVxuXG4gICAgdmFyIHRyeVRoZW4gPSB0cnkxKGdldFRoZW4sIHVuZGVmaW5lZCwgdHJ5Qm9keS52YWx1ZSlcblxuICAgIGlmICh0cnlUaGVuLmNhdWdodCkge1xuICAgICAgICBpZiAoY291bnQgPCB0ZXN0LmF0dGVtcHRzKSByZXR1cm4gaW52b2tlSW5pdChjb250ZXh0LCBjb3VudCArIDEpXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IFJlc3VsdChzeW5jRW5kIC0gc3RhcnQsIHRyeVRoZW4pKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdHJ5VGhlbi52YWx1ZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IFJlc3VsdChzeW5jRW5kIC0gc3RhcnQsIHRyeVRoZW4pKVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICB2YXIgc3RhdGUgPSBuZXcgQXN5bmNTdGF0ZShjb250ZXh0LCBzdGFydCwgcmVzb2x2ZSwgY291bnQpXG4gICAgICAgIHZhciByZXN1bHQgPSB0cnkyKHRyeVRoZW4udmFsdWUsIHRyeUJvZHkudmFsdWUsXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09IG51bGwpIHJldHVyblxuICAgICAgICAgICAgICAgIGFzeW5jRmluaXNoKHN0YXRlLCB0cnlQYXNzKCkpXG4gICAgICAgICAgICAgICAgc3RhdGUgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PSBudWxsKSByZXR1cm5cbiAgICAgICAgICAgICAgICBhc3luY0ZpbmlzaChzdGF0ZSwgdHJ5RmFpbChhZGRTdGFjayhlKSkpXG4gICAgICAgICAgICAgICAgc3RhdGUgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgaWYgKHN0YXRlID09IG51bGwpIHJldHVyblxuICAgICAgICBpZiAocmVzdWx0LmNhdWdodCkge1xuICAgICAgICAgICAgYXN5bmNGaW5pc2goc3RhdGUsIHJlc3VsdClcbiAgICAgICAgICAgIHN0YXRlID0gdW5kZWZpbmVkXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNldCB0aGUgdGltZW91dCAqYWZ0ZXIqIGluaXRpYWxpemF0aW9uLiBUaGUgdGltZW91dCB3aWxsIGxpa2VseSBiZVxuICAgICAgICAvLyBzcGVjaWZpZWQgZHVyaW5nIGluaXRpYWxpemF0aW9uLlxuICAgICAgICB2YXIgbWF4VGltZW91dCA9IHRlc3QudGltZW91dCB8fCBleHBvcnRzLmRlZmF1bHRUaW1lb3V0XG5cbiAgICAgICAgLy8gU2V0dGluZyBhIHRpbWVvdXQgaXMgcG9pbnRsZXNzIGlmIGl0J3MgaW5maW5pdGUuXG4gICAgICAgIGlmIChtYXhUaW1lb3V0ICE9PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgc3RhdGUudGltZXIgPSBzZXRUaW1lb3V0LmNhbGwoZ2xvYmFsLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09IG51bGwpIHJldHVyblxuICAgICAgICAgICAgICAgIGFzeW5jRmluaXNoKHN0YXRlLCB0cnlGYWlsKGFkZFN0YWNrKFxuICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoXCJUaW1lb3V0IG9mIFwiICsgbWF4VGltZW91dCArIFwiIHJlYWNoZWRcIikpKSlcbiAgICAgICAgICAgICAgICBzdGF0ZSA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSwgbWF4VGltZW91dClcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIEVycm9yV3JhcCh0ZXN0LCBlcnJvcikge1xuICAgIHRoaXMudGVzdCA9IHRlc3RcbiAgICB0aGlzLmVycm9yID0gZXJyb3Jcbn1cbm1ldGhvZHMoRXJyb3JXcmFwLCBFcnJvciwge25hbWU6IFwiRXJyb3JXcmFwXCJ9KVxuXG5mdW5jdGlvbiBpbnZva2VIb29rKHRlc3QsIGxpc3QsIHN0YWdlKSB7XG4gICAgaWYgKGxpc3QgPT0gbnVsbCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgcmV0dXJuIHBlYWNoKGxpc3QsIGZ1bmN0aW9uIChob29rKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gaG9vaygpXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcldyYXAodGVzdCwgbmV3IFJlcG9ydHMuSG9va0Vycm9yKHN0YWdlLCBob29rLCBlKSlcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIGludm9rZUJlZm9yZUVhY2godGVzdCkge1xuICAgIGlmICh0ZXN0LnJvb3QgPT09IHRlc3QpIHtcbiAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5iZWZvcmVFYWNoLCBIb29rU3RhZ2UuQmVmb3JlRWFjaClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW52b2tlQmVmb3JlRWFjaCh0ZXN0LnBhcmVudCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmJlZm9yZUVhY2gsIEhvb2tTdGFnZS5CZWZvcmVFYWNoKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlQWZ0ZXJFYWNoKHRlc3QpIHtcbiAgICBpZiAodGVzdC5yb290ID09PSB0ZXN0KSB7XG4gICAgICAgIHJldHVybiBpbnZva2VIb29rKHRlc3QsIHRlc3QuYWZ0ZXJFYWNoLCBIb29rU3RhZ2UuQWZ0ZXJFYWNoKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbnZva2VIb29rKHRlc3QsIHRlc3QuYWZ0ZXJFYWNoLCBIb29rU3RhZ2UuQWZ0ZXJFYWNoKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBpbnZva2VBZnRlckVhY2godGVzdC5wYXJlbnQpIH0pXG4gICAgfVxufVxuXG4vKipcbiAqIFRoaXMgY2hlY2tzIGlmIHRoZSB0ZXN0IHdhcyB3aGl0ZWxpc3RlZCBpbiBhIGB0Lm9ubHkoKWAgY2FsbCwgb3IgZm9yXG4gKiBjb252ZW5pZW5jZSwgcmV0dXJucyBgdHJ1ZWAgaWYgYHQub25seSgpYCB3YXMgbmV2ZXIgY2FsbGVkLlxuICovXG5mdW5jdGlvbiBpc09ubHkodGVzdCkge1xuICAgIHZhciBwYXRoID0gW11cblxuICAgIHdoaWxlICh0ZXN0LnBhcmVudCAhPSBudWxsICYmIHRlc3Qub25seSA9PSBudWxsKSB7XG4gICAgICAgIHBhdGgucHVzaCh0ZXN0Lm5hbWUpXG4gICAgICAgIHRlc3QgPSB0ZXN0LnBhcmVudFxuICAgIH1cblxuICAgIC8vIElmIHRoZXJlIGlzbid0IGFueSBgb25seWAgYWN0aXZlLCB0aGVuIGxldCdzIHNraXAgdGhlIGNoZWNrIGFuZCByZXR1cm5cbiAgICAvLyBgdHJ1ZWAgZm9yIGNvbnZlbmllbmNlLlxuICAgIGlmICh0ZXN0Lm9ubHkgPT0gbnVsbCkgcmV0dXJuIHRydWVcbiAgICByZXR1cm4gRmlsdGVyLnRlc3QodGVzdC5vbmx5LCBwYXRoKVxufVxuXG5mdW5jdGlvbiBydW5DaGlsZFRlc3RzKHRlc3QsIGNvbnRleHQpIHtcbiAgICBpZiAodGVzdC50ZXN0cyA9PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICBmdW5jdGlvbiBsZWF2ZSgpIHtcbiAgICAgICAgdGVzdC5yb290LmN1cnJlbnQgPSB0ZXN0XG4gICAgICAgIGNvbnRleHQudGVzdHMucG9wKClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBydW5DaGlsZChjaGlsZCkge1xuICAgICAgICB0ZXN0LnJvb3QuY3VycmVudCA9IGNoaWxkXG4gICAgICAgIGNvbnRleHQudGVzdHMucHVzaChjaGlsZClcblxuICAgICAgICByZXR1cm4gaW52b2tlQmVmb3JlRWFjaCh0ZXN0KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBydW5Ob3JtYWxDaGlsZChjaGlsZCwgY29udGV4dCkgfSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gaW52b2tlQWZ0ZXJFYWNoKHRlc3QpIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yV3JhcCkpIHRocm93IGVcbiAgICAgICAgICAgIHJldHVybiByZXBvcnRIb29rKGNvbnRleHQsIGUudGVzdCwgZS5lcnJvcilcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4obGVhdmUsIGZ1bmN0aW9uIChlKSB7IGxlYXZlKCk7IHRocm93IGUgfSlcbiAgICB9XG5cbiAgICB2YXIgcmFuID0gZmFsc2VcblxuICAgIHJldHVybiBwZWFjaCh0ZXN0LnRlc3RzLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgLy8gT25seSBza2lwcGVkIHRlc3RzIGhhdmUgbm8gY2FsbGJhY2tcbiAgICAgICAgaWYgKGNoaWxkLmNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgICAgICAgIHRlc3Qucm9vdC5jdXJyZW50ID0gY2hpbGRcbiAgICAgICAgICAgIGNvbnRleHQudGVzdHMucHVzaChjaGlsZClcblxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydFNraXAoY29udGV4dClcbiAgICAgICAgICAgIC50aGVuKGxlYXZlLCBmdW5jdGlvbiAoZSkgeyBsZWF2ZSgpOyB0aHJvdyBlIH0pXG4gICAgICAgIH0gZWxzZSBpZiAoIWlzT25seShjaGlsZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICB9IGVsc2UgaWYgKHJhbikge1xuICAgICAgICAgICAgcmV0dXJuIHJ1bkNoaWxkKGNoaWxkKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmFuID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIGludm9rZUhvb2sodGVzdCwgdGVzdC5iZWZvcmVBbGwsIEhvb2tTdGFnZS5CZWZvcmVBbGwpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBydW5DaGlsZChjaGlsZCkgfSlcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXJhbikgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gaW52b2tlSG9vayh0ZXN0LCB0ZXN0LmFmdGVyQWxsLCBIb29rU3RhZ2UuQWZ0ZXJBbGwpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gY2xlYXJDaGlsZHJlbih0ZXN0KSB7XG4gICAgaWYgKHRlc3QudGVzdHMgPT0gbnVsbCkgcmV0dXJuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZXN0LnRlc3RzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRlc3QudGVzdHNbaV0udGVzdHMgPSB1bmRlZmluZWRcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJ1bk5vcm1hbENoaWxkKHRlc3QsIGNvbnRleHQpIHtcbiAgICB0ZXN0LmxvY2tlZCA9IGZhbHNlXG5cbiAgICByZXR1cm4gaW52b2tlSW5pdChjb250ZXh0LCAxKVxuICAgIC50aGVuKFxuICAgICAgICBmdW5jdGlvbiAocmVzdWx0KSB7IHRlc3QubG9ja2VkID0gdHJ1ZTsgcmV0dXJuIHJlc3VsdCB9LFxuICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHsgdGVzdC5sb2NrZWQgPSB0cnVlOyB0aHJvdyBlcnJvciB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgaWYgKHJlc3VsdC5jYXVnaHQpIHtcbiAgICAgICAgICAgIGlmICghdGVzdC5pc0ZhaWxhYmxlKSBjb250ZXh0LmlzU3VjY2VzcyA9IGZhbHNlXG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0RmFpbChjb250ZXh0LCByZXN1bHQudmFsdWUsIHJlc3VsdC50aW1lKVxuICAgICAgICB9IGVsc2UgaWYgKHRlc3QudGVzdHMgIT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gUmVwb3J0IHRoaXMgYXMgaWYgaXQgd2FzIGEgcGFyZW50IHRlc3QgaWYgaXQncyBwYXNzaW5nIGFuZCBoYXNcbiAgICAgICAgICAgIC8vIGNoaWxkcmVuLlxuICAgICAgICAgICAgcmV0dXJuIHJlcG9ydEVudGVyKGNvbnRleHQsIHJlc3VsdC50aW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcnVuQ2hpbGRUZXN0cyh0ZXN0LCBjb250ZXh0KSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVwb3J0TGVhdmUoY29udGV4dCkgfSlcbiAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcldyYXApKSB0aHJvdyBlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcG9ydExlYXZlKGNvbnRleHQpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVwb3J0SG9vayhjb250ZXh0LCBlLnRlc3QsIGUuZXJyb3IpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwb3J0UGFzcyhjb250ZXh0LCByZXN1bHQudGltZSlcbiAgICAgICAgfVxuICAgIH0pXG4gICAgLnRoZW4oXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgY2xlYXJDaGlsZHJlbih0ZXN0KSB9LFxuICAgICAgICBmdW5jdGlvbiAoZSkgeyBjbGVhckNoaWxkcmVuKHRlc3QpOyB0aHJvdyBlIH0pXG59XG5cbi8qKlxuICogVGhpcyBydW5zIHRoZSByb290IHRlc3QgYW5kIHJldHVybnMgYSBwcm9taXNlIHJlc29sdmVkIHdoZW4gaXQncyBkb25lLlxuICovXG5leHBvcnRzLnJ1blRlc3QgPSBmdW5jdGlvbiAocm9vdCwgb3B0cykge1xuICAgIHZhciBjb250ZXh0ID0gbmV3IENvbnRleHQocm9vdCwgb3B0cylcblxuICAgIHJvb3QubG9ja2VkID0gdHJ1ZVxuICAgIHJldHVybiByZXBvcnRTdGFydChjb250ZXh0KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJ1bkNoaWxkVGVzdHMocm9vdCwgY29udGV4dCkgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yV3JhcCkpIHRocm93IGVcbiAgICAgICAgcmV0dXJuIHJlcG9ydEhvb2soY29udGV4dCwgZS50ZXN0LCBlLmVycm9yKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVwb3J0RW5kKGNvbnRleHQpIH0pXG4gICAgLy8gVGVsbCB0aGUgcmVwb3J0ZXIgc29tZXRoaW5nIGhhcHBlbmVkLiBPdGhlcndpc2UsIGl0J2xsIGhhdmUgdG8gd3JhcCB0aGlzXG4gICAgLy8gbWV0aG9kIGluIGEgcGx1Z2luLCB3aGljaCBzaG91bGRuJ3QgYmUgbmVjZXNzYXJ5LlxuICAgIC5jYXRjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gcmVwb3J0RXJyb3IoY29udGV4dCwgZSkudGhlbihmdW5jdGlvbiAoKSB7IHRocm93IGUgfSlcbiAgICB9KVxuICAgIC50aGVuKFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjbGVhckNoaWxkcmVuKHJvb3QpXG4gICAgICAgICAgICByb290LmxvY2tlZCA9IGZhbHNlXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlzU3VjY2VzczogY29udGV4dC5pc1N1Y2Nlc3MsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBjbGVhckNoaWxkcmVuKHJvb3QpXG4gICAgICAgICAgICByb290LmxvY2tlZCA9IGZhbHNlXG4gICAgICAgICAgICB0aHJvdyBlXG4gICAgICAgIH0pXG59XG5cbi8vIEhlbHAgb3B0aW1pemUgZm9yIGluZWZmaWNpZW50IGV4Y2VwdGlvbiBoYW5kbGluZyBpbiBWOFxuXG5mdW5jdGlvbiB0cnlQYXNzKHZhbHVlKSB7XG4gICAgcmV0dXJuIHtjYXVnaHQ6IGZhbHNlLCB2YWx1ZTogdmFsdWV9XG59XG5cbmZ1bmN0aW9uIHRyeUZhaWwoZSkge1xuICAgIHJldHVybiB7Y2F1Z2h0OiB0cnVlLCB2YWx1ZTogZX1cbn1cblxuZnVuY3Rpb24gdHJ5MChmKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRyeVBhc3MoZigpKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHRyeUZhaWwoZSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyeTEoZiwgaW5zdCwgYXJnMCkge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0cnlQYXNzKGYuY2FsbChpbnN0LCBhcmcwKSlcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiB0cnlGYWlsKGUpXG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cnkyKGYsIGluc3QsIGFyZzAsIGFyZzEpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gdHJ5UGFzcyhmLmNhbGwoaW5zdCwgYXJnMCwgYXJnMSkpXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gdHJ5RmFpbChlKVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogVGhlIHJlcG9ydGVyIGFuZCB0ZXN0IGluaXRpYWxpemF0aW9uIHNlcXVlbmNlLCBhbmQgc2NyaXB0IGxvYWRpbmcuIFRoaXNcbiAqIGRvZXNuJ3QgdW5kZXJzdGFuZCBhbnl0aGluZyB2aWV3LXdpc2UuXG4gKi9cblxudmFyIGRlZmF1bHRUID0gcmVxdWlyZShcIi4uLy4uL2luZGV4XCIpXG52YXIgUiA9IHJlcXVpcmUoXCIuLi9yZXBvcnRlclwiKVxudmFyIEQgPSByZXF1aXJlKFwiLi9pbmplY3RcIilcbnZhciBydW5UZXN0cyA9IHJlcXVpcmUoXCIuL3J1bi10ZXN0c1wiKVxudmFyIGluamVjdFN0eWxlcyA9IHJlcXVpcmUoXCIuL2luamVjdC1zdHlsZXNcIilcbnZhciBWaWV3ID0gcmVxdWlyZShcIi4vdmlld1wiKVxudmFyIG1ldGhvZHMgPSByZXF1aXJlKFwiLi4vbWV0aG9kc1wiKVxuXG5mdW5jdGlvbiBUcmVlKG5hbWUpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lXG4gICAgdGhpcy5zdGF0dXMgPSBSLlN0YXR1cy5Vbmtub3duXG4gICAgdGhpcy5ub2RlID0gbnVsbFxuICAgIHRoaXMuY2hpbGRyZW4gPSBPYmplY3QuY3JlYXRlKG51bGwpXG59XG5cbnZhciByZXBvcnRlciA9IFIub24oXCJkb21cIiwge1xuICAgIGFjY2VwdHM6IFtdLFxuICAgIGNyZWF0ZTogZnVuY3Rpb24gKG9wdHMsIG1ldGhvZHMpIHtcbiAgICAgICAgdmFyIHJlcG9ydGVyID0gbmV3IFIuUmVwb3J0ZXIoVHJlZSwgdW5kZWZpbmVkLCBtZXRob2RzKVxuXG4gICAgICAgIHJlcG9ydGVyLm9wdHMgPSBvcHRzXG4gICAgICAgIHJldHVybiByZXBvcnRlclxuICAgIH0sXG5cbiAgICAvLyBHaXZlIHRoZSBicm93c2VyIGEgY2hhbmNlIHRvIHJlcGFpbnQgYmVmb3JlIGNvbnRpbnVpbmcgKG1pY3JvdGFza3NcbiAgICAvLyBub3JtYWxseSBibG9jayByZW5kZXJpbmcpLlxuICAgIGFmdGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShWaWV3Lm5leHRGcmFtZSlcbiAgICB9LFxuXG4gICAgcmVwb3J0OiBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgICAgIHJldHVybiBWaWV3LnJlcG9ydChfLCByZXBvcnQpXG4gICAgfSxcbn0pXG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5mdW5jdGlvbiBzZXREZWZhdWx0c0NoZWNrZWQob3B0cykge1xuICAgIGlmIChvcHRzLnRpdGxlID09IG51bGwpIG9wdHMudGl0bGUgPSBcIlRoYWxsaXVtIHRlc3RzXCJcbiAgICBpZiAob3B0cy50aW1lb3V0ID09IG51bGwpIG9wdHMudGltZW91dCA9IDUwMDBcbiAgICBpZiAob3B0cy5maWxlcyA9PSBudWxsKSBvcHRzLmZpbGVzID0gW11cbiAgICBpZiAob3B0cy5wcmVsb2FkID09IG51bGwpIG9wdHMucHJlbG9hZCA9IG5vb3BcbiAgICBpZiAob3B0cy5wcmVydW4gPT0gbnVsbCkgb3B0cy5wcmVydW4gPSBub29wXG4gICAgaWYgKG9wdHMucG9zdHJ1biA9PSBudWxsKSBvcHRzLnBvc3RydW4gPSBub29wXG4gICAgaWYgKG9wdHMuZXJyb3IgPT0gbnVsbCkgb3B0cy5lcnJvciA9IG5vb3BcbiAgICBpZiAob3B0cy50aGFsbGl1bSA9PSBudWxsKSBvcHRzLnRoYWxsaXVtID0gZGVmYXVsdFRcblxuICAgIGlmICh0eXBlb2Ygb3B0cy50aXRsZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9wdHMudGl0bGVgIG11c3QgYmUgYSBzdHJpbmcgaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLnRpbWVvdXQgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvcHRzLnRpbWVvdXRgIG11c3QgYmUgYSBudW1iZXIgaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KG9wdHMuZmlsZXMpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb3B0cy5maWxlc2AgbXVzdCBiZSBhbiBhcnJheSBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHMucHJlbG9hZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb3B0cy5wcmVsb2FkYCBtdXN0IGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLnByZXJ1biAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb3B0cy5wcmVydW5gIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHMucG9zdHJ1biAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgb3B0cy5wb3N0cnVuYCBtdXN0IGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLmVycm9yICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBvcHRzLmVycm9yYCBtdXN0IGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLnRoYWxsaXVtICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBcImBvcHRzLnRoYWxsaXVtYCBtdXN0IGJlIGEgVGhhbGxpdW0gaW5zdGFuY2UgaWYgcGFzc2VkXCIpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBvblJlYWR5KGluaXQpIHtcbiAgICBpZiAoRC5kb2N1bWVudC5ib2R5ICE9IG51bGwpIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5pdCgpKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICBELmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlc29sdmUoaW5pdCgpKVxuICAgICAgICB9LCBmYWxzZSlcbiAgICB9KVxufVxuXG5mdW5jdGlvbiBET00ob3B0cykge1xuICAgIHRoaXMuX29wdHMgPSBvcHRzXG4gICAgdGhpcy5fZGVzdHJveVByb21pc2UgPSB1bmRlZmluZWRcbiAgICB0aGlzLl9kYXRhID0gb25SZWFkeShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNldERlZmF1bHRzQ2hlY2tlZChvcHRzKVxuICAgICAgICBpZiAoIUQuZG9jdW1lbnQudGl0bGUpIEQuZG9jdW1lbnQudGl0bGUgPSBvcHRzLnRpdGxlXG4gICAgICAgIGluamVjdFN0eWxlcygpXG4gICAgICAgIHZhciBkYXRhID0gVmlldy5pbml0KG9wdHMpXG5cbiAgICAgICAgb3B0cy50aGFsbGl1bS5yZXBvcnRlcihyZXBvcnRlciwgZGF0YS5zdGF0ZSlcbiAgICAgICAgcmV0dXJuIGRhdGFcbiAgICB9KVxufVxuXG5tZXRob2RzKERPTSwge1xuICAgIHJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fZGVzdHJveVByb21pc2UgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlRoZSB0ZXN0IHN1aXRlIG11c3Qgbm90IGJlIHJ1biBhZnRlciB0aGUgdmlldyBoYXMgYmVlbiBcIiArXG4gICAgICAgICAgICAgICAgXCJkZXRhY2hlZC5cIlxuICAgICAgICAgICAgKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBvcHRzID0gdGhpcy5fb3B0c1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBydW5UZXN0cyhvcHRzLCBkYXRhLnN0YXRlKVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBkZXRhY2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Rlc3Ryb3lQcm9taXNlICE9IG51bGwpIHJldHVybiB0aGlzLl9kZXN0cm95UHJvbWlzZVxuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgICAgICByZXR1cm4gdGhpcy5fZGVzdHJveVByb21pc2UgPSBzZWxmLl9kYXRhLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGRhdGEuc3RhdGUubG9ja2VkID0gdHJ1ZVxuICAgICAgICAgICAgaWYgKGRhdGEuc3RhdGUuY3VycmVudFByb21pc2UgPT0gbnVsbCkgcmV0dXJuIGRhdGFcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnN0YXRlLmN1cnJlbnRQcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gZGF0YSB9KVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgc2VsZi5fb3B0cyA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgc2VsZi5fZGF0YSA9IHNlbGYuX2Rlc3Ryb3lQcm9taXNlXG5cbiAgICAgICAgICAgIHdoaWxlIChkYXRhLnJvb3QuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIGRhdGEucm9vdC5yZW1vdmVDaGlsZChkYXRhLnJvb3QuZmlyc3RDaGlsZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9LFxufSlcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cykge1xuICAgIGlmIChvcHRzID09IG51bGwpIHJldHVybiBuZXcgRE9NKHt9KVxuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdHMpKSByZXR1cm4gbmV3IERPTSh7ZmlsZXM6IG9wdHN9KVxuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gXCJvYmplY3RcIikgcmV0dXJuIG5ldyBET00ob3B0cylcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9wdHNgIG11c3QgYmUgYW4gb2JqZWN0IG9yIGFycmF5IG9mIGZpbGVzIGlmIHBhc3NlZFwiKVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi4vdXRpbFwiKVxudmFyIEQgPSByZXF1aXJlKFwiLi9pbmplY3RcIilcblxuLyoqXG4gKiBUaGUgcmVwb3J0ZXIgc3R5bGVzaGVldC4gSGVyZSdzIHRoZSBmb3JtYXQ6XG4gKlxuICogLy8gU2luZ2xlIGl0ZW1cbiAqIFwiLnNlbGVjdG9yXCI6IHtcbiAqICAgICAvLyBwcm9wcy4uLlxuICogfVxuICpcbiAqIC8vIER1cGxpY2F0ZSBlbnRyaWVzXG4gKiBcIi5zZWxlY3RvclwiOiB7XG4gKiAgICAgXCJwcm9wXCI6IFtcbiAqICAgICAgICAgLy8gdmFsdWVzLi4uXG4gKiAgICAgXSxcbiAqIH1cbiAqXG4gKiAvLyBEdXBsaWNhdGUgc2VsZWN0b3JzXG4gKiBcIi5zZWxlY3RvclwiOiBbXG4gKiAgICAgLy8gdmFsdWVzLi4uXG4gKiBdXG4gKlxuICogLy8gTWVkaWEgcXVlcnlcbiAqIFwiQG1lZGlhIHNjcmVlblwiOiB7XG4gKiAgICAgLy8gc2VsZWN0b3JzLi4uXG4gKiB9XG4gKlxuICogTm90ZSB0aGF0IENTUyBzdHJpbmdzICptdXN0KiBiZSBxdW90ZWQgaW5zaWRlIHRoZSB2YWx1ZS5cbiAqL1xuXG52YXIgc3R5bGVzID0gVXRpbC5sYXp5KGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG4gICAgLyoqXG4gICAgICogUGFydGlhbGx5IHRha2VuIGFuZCBhZGFwdGVkIGZyb20gbm9ybWFsaXplLmNzcyAobGljZW5zZWQgdW5kZXIgdGhlIE1JVFxuICAgICAqIExpY2Vuc2UpLlxuICAgICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9uZWNvbGFzL25vcm1hbGl6ZS5jc3NcbiAgICAgKi9cbiAgICB2YXIgc3R5bGVPYmplY3QgPSB7XG4gICAgICAgIFwiI3RsXCI6IHtcbiAgICAgICAgICAgIFwiZm9udC1mYW1pbHlcIjogXCJzYW5zLXNlcmlmXCIsXG4gICAgICAgICAgICBcImxpbmUtaGVpZ2h0XCI6IFwiMS4xNVwiLFxuICAgICAgICAgICAgXCItbXMtdGV4dC1zaXplLWFkanVzdFwiOiBcIjEwMCVcIixcbiAgICAgICAgICAgIFwiLXdlYmtpdC10ZXh0LXNpemUtYWRqdXN0XCI6IFwiMTAwJVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIGJ1dHRvblwiOiB7XG4gICAgICAgICAgICBcImZvbnQtZmFtaWx5XCI6IFwic2Fucy1zZXJpZlwiLFxuICAgICAgICAgICAgXCJsaW5lLWhlaWdodFwiOiBcIjEuMTVcIixcbiAgICAgICAgICAgIFwib3ZlcmZsb3dcIjogXCJ2aXNpYmxlXCIsXG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjEwMCVcIixcbiAgICAgICAgICAgIFwibWFyZ2luXCI6IFwiMFwiLFxuICAgICAgICAgICAgXCJ0ZXh0LXRyYW5zZm9ybVwiOiBcIm5vbmVcIixcbiAgICAgICAgICAgIFwiLXdlYmtpdC1hcHBlYXJhbmNlXCI6IFwiYnV0dG9uXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgaDFcIjoge1xuICAgICAgICAgICAgXCJmb250LXNpemVcIjogXCIyZW1cIixcbiAgICAgICAgICAgIFwibWFyZ2luXCI6IFwiMC42N2VtIDBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBhXCI6IHtcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgICAgICBcIi13ZWJraXQtdGV4dC1kZWNvcmF0aW9uLXNraXBcIjogXCJvYmplY3RzXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgYTphY3RpdmUsICN0bCBhOmhvdmVyXCI6IHtcbiAgICAgICAgICAgIFwib3V0bGluZS13aWR0aFwiOiBcIjBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCBidXR0b246Oi1tb3otZm9jdXMtaW5uZXJcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItc3R5bGVcIjogXCJub25lXCIsXG4gICAgICAgICAgICBcInBhZGRpbmdcIjogXCIwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgYnV0dG9uOi1tb3otZm9jdXNyaW5nXCI6IHtcbiAgICAgICAgICAgIG91dGxpbmU6IFwiMXB4IGRvdHRlZCBCdXR0b25UZXh0XCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJhc2Ugc3R5bGVzLiBOb3RlIHRoYXQgdGhpcyBDU1MgaXMgZGVzaWduZWQgdG8gaW50ZW50aW9uYWxseSBvdmVycmlkZVxuICAgICAgICAgKiBtb3N0IHRoaW5ncyB0aGF0IGNvdWxkIHByb3BhZ2F0ZS5cbiAgICAgICAgICovXG4gICAgICAgIFwiI3RsICpcIjogW1xuICAgICAgICAgICAge1widGV4dC1hbGlnblwiOiBcImxlZnRcIn0sXG4gICAgICAgICAgICB7XCJ0ZXh0LWFsaWduXCI6IFwic3RhcnRcIn0sXG4gICAgICAgIF0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJlcG9ydCwgI3RsIC50bC1yZXBvcnQgdWxcIjoge1xuICAgICAgICAgICAgXCJsaXN0LXN0eWxlLXR5cGVcIjogXCJub25lXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgbGkgfiAudGwtc3VpdGVcIjoge1xuICAgICAgICAgICAgXCJwYWRkaW5nLXRvcFwiOiBcIjFlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1zdWl0ZSA+IGgyXCI6IHtcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCJibGFja1wiLFxuICAgICAgICAgICAgXCJmb250LXNpemVcIjogXCIxLjVlbVwiLFxuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcImJvbGRcIixcbiAgICAgICAgICAgIFwibWFyZ2luLWJvdHRvbVwiOiBcIjAuNWVtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXN1aXRlIC50bC1zdWl0ZSA+IGgyXCI6IHtcbiAgICAgICAgICAgIFwiZm9udC1zaXplXCI6IFwiMS4yZW1cIixcbiAgICAgICAgICAgIFwibWFyZ2luLWJvdHRvbVwiOiBcIjAuM2VtXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXN1aXRlIC50bC1zdWl0ZSAudGwtc3VpdGUgPiBoMlwiOiB7XG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjEuMmVtXCIsXG4gICAgICAgICAgICBcIm1hcmdpbi1ib3R0b21cIjogXCIwLjJlbVwiLFxuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcIm5vcm1hbFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0ID4gaDJcIjoge1xuICAgICAgICAgICAgXCJjb2xvclwiOiBcImJsYWNrXCIsXG4gICAgICAgICAgICBcImZvbnQtc2l6ZVwiOiBcIjFlbVwiLFxuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcIm5vcm1hbFwiLFxuICAgICAgICAgICAgXCJtYXJnaW5cIjogXCIwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QgPiA6Zmlyc3QtY2hpbGQ6OmJlZm9yZVwiOiB7XG4gICAgICAgICAgICBcImRpc3BsYXlcIjogXCJpbmxpbmUtYmxvY2tcIixcbiAgICAgICAgICAgIFwiZm9udC13ZWlnaHRcIjogXCJib2xkXCIsXG4gICAgICAgICAgICBcIndpZHRoXCI6IFwiMS4yZW1cIixcbiAgICAgICAgICAgIFwidGV4dC1hbGlnblwiOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgXCJmb250LWZhbWlseVwiOiBcInNhbnMtc2VyaWZcIixcbiAgICAgICAgICAgIFwidGV4dC1zaGFkb3dcIjogXCIwIDNweCAycHggIzk2OTY5NlwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0LnRsLWZhaWwgPiBoMiwgI3RsIC50bC10ZXN0LnRsLWVycm9yID4gaDJcIjoge1xuICAgICAgICAgICAgY29sb3I6IFwiI2MwMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0LnRsLXNraXAgPiBoMlwiOiB7XG4gICAgICAgICAgICBjb2xvcjogXCIjMDhjXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRlc3QudGwtcGFzcyA+IDpmaXJzdC1jaGlsZDo6YmVmb3JlXCI6IHtcbiAgICAgICAgICAgIGNvbnRlbnQ6IFwiJ+KckydcIixcbiAgICAgICAgICAgIGNvbG9yOiBcIiMwYzBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdGVzdC50bC1mYWlsID4gOmZpcnN0LWNoaWxkOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCIn4pyWJ1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10ZXN0LnRsLWVycm9yID4gOmZpcnN0LWNoaWxkOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCInISdcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdGVzdC50bC1za2lwID4gOmZpcnN0LWNoaWxkOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCIn4oiSJ1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1wcmUsICN0bCAudGwtZGlmZi1oZWFkZXJcIjoge1xuICAgICAgICAgICAgLy8gbm9ybWFsaXplLmNzczogQ29ycmVjdCB0aGUgaW5oZXJpdGFuY2UgYW5kIHNjYWxpbmcgb2YgZm9udCBzaXplXG4gICAgICAgICAgICAvLyBpbiBhbGwgYnJvd3NlcnNcbiAgICAgICAgICAgIFwiZm9udC1mYW1pbHlcIjogXCJtb25vc3BhY2UsIG1vbm9zcGFjZVwiLFxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kXCI6IFwiI2YwZjBmMFwiLFxuICAgICAgICAgICAgXCJ3aGl0ZS1zcGFjZVwiOiBcInByZVwiLFxuICAgICAgICAgICAgXCJmb250LXNpemVcIjogXCIwLjg1ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtcHJlXCI6IHtcbiAgICAgICAgICAgIFwibWluLXdpZHRoXCI6IFwiMTAwJVwiLFxuICAgICAgICAgICAgXCJmbG9hdFwiOiBcImxlZnRcIixcbiAgICAgICAgICAgIFwiY2xlYXJcIjogXCJsZWZ0XCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWxpbmVcIjoge1xuICAgICAgICAgICAgZGlzcGxheTogXCJibG9ja1wiLFxuICAgICAgICAgICAgbWFyZ2luOiBcIjAgMC4yNWVtXCIsXG4gICAgICAgICAgICB3aWR0aDogXCI5OSVcIiwgLy8gQmVjYXVzZSBGaXJlZm94IHN1Y2tzXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWRpZmYtaGVhZGVyID4gKlwiOiB7XG4gICAgICAgICAgICBwYWRkaW5nOiBcIjAuMjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaWZmLWhlYWRlclwiOiB7XG4gICAgICAgICAgICBcInBhZGRpbmdcIjogXCIwLjI1ZW1cIixcbiAgICAgICAgICAgIFwibWFyZ2luLWJvdHRvbVwiOiBcIjAuNWVtXCIsXG4gICAgICAgICAgICBcImRpc3BsYXlcIjogXCJpbmxpbmUtYmxvY2tcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtbGluZTpmaXJzdC1jaGlsZCwgI3RsIC50bC1kaWZmLWhlYWRlciB+IC50bC1saW5lXCI6IHtcbiAgICAgICAgICAgIFwicGFkZGluZy10b3BcIjogXCIwLjI1ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtbGluZTpsYXN0LWNoaWxkXCI6IHtcbiAgICAgICAgICAgIFwicGFkZGluZy1ib3R0b21cIjogXCIwLjI1ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZmFpbCAudGwtZGlzcGxheVwiOiB7XG4gICAgICAgICAgICBtYXJnaW46IFwiMC41ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZGlzcGxheSA+ICpcIjoge1xuICAgICAgICAgICAgb3ZlcmZsb3c6IFwiYXV0b1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaXNwbGF5ID4gOm5vdCg6bGFzdC1jaGlsZClcIjoge1xuICAgICAgICAgICAgXCJtYXJnaW4tYm90dG9tXCI6IFwiMC41ZW1cIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZGlmZi1hZGRlZFwiOiB7XG4gICAgICAgICAgICBcImNvbG9yXCI6IFwiIzBjMFwiLFxuICAgICAgICAgICAgXCJmb250LXdlaWdodFwiOiBcImJvbGRcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtZGlmZi1yZW1vdmVkXCI6IHtcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCIjYzAwXCIsXG4gICAgICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IFwiYm9sZFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1zdGFjayAudGwtbGluZVwiOiB7XG4gICAgICAgICAgICBjb2xvcjogXCIjODAwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLWRpZmY6OmJlZm9yZSwgI3RsIC50bC1zdGFjazo6YmVmb3JlXCI6IHtcbiAgICAgICAgICAgIFwiZm9udC13ZWlnaHRcIjogXCJub3JtYWxcIixcbiAgICAgICAgICAgIFwibWFyZ2luXCI6IFwiMC4yNWVtIDAuMjVlbSAwLjI1ZW0gMFwiLFxuICAgICAgICAgICAgXCJkaXNwbGF5XCI6IFwiYmxvY2tcIixcbiAgICAgICAgICAgIFwiZm9udC1zdHlsZVwiOiBcIml0YWxpY1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1kaWZmOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCInRGlmZjonXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXN0YWNrOjpiZWZvcmVcIjoge1xuICAgICAgICAgICAgY29udGVudDogXCInU3RhY2s6J1wiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1oZWFkZXJcIjoge1xuICAgICAgICAgICAgXCJ0ZXh0LWFsaWduXCI6IFwicmlnaHRcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtaGVhZGVyID4gKlwiOiB7XG4gICAgICAgICAgICBcImRpc3BsYXlcIjogXCJpbmxpbmUtYmxvY2tcIixcbiAgICAgICAgICAgIFwidGV4dC1hbGlnblwiOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgXCJwYWRkaW5nXCI6IFwiMC41ZW0gMC43NWVtXCIsXG4gICAgICAgICAgICBcImJvcmRlclwiOiBcIjJweCBzb2xpZCAjMDBjXCIsXG4gICAgICAgICAgICBcImJvcmRlci1yYWRpdXNcIjogXCIxZW1cIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICAgICAgICBcIm1hcmdpblwiOiBcIjAuMjVlbSAwLjVlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1oZWFkZXIgPiA6Zm9jdXNcIjoge1xuICAgICAgICAgICAgb3V0bGluZTogXCJub25lXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJ1blwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiMwODBcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiMwYzBcIixcbiAgICAgICAgICAgIFwiY29sb3JcIjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgXCJ3aWR0aFwiOiBcIjZlbVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC1ydW46aG92ZXJcIjoge1xuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwiIzhjOFwiLFxuICAgICAgICAgICAgXCJjb2xvclwiOiBcIndoaXRlXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1wYXNzXCI6IHtcbiAgICAgICAgICAgIFwiYm9yZGVyLWNvbG9yXCI6IFwiIzBjMFwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10b2dnbGUudGwtZmFpbFwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiNjMDBcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXNraXBcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMDhjXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1wYXNzLnRsLWFjdGl2ZSwgI3RsIC50bC10b2dnbGUudGwtcGFzczphY3RpdmVcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMDgwXCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjMGMwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1mYWlsLnRsLWFjdGl2ZSwgI3RsIC50bC10b2dnbGUudGwtZmFpbDphY3RpdmVcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjODAwXCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjYzAwXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1za2lwLnRsLWFjdGl2ZSwgI3RsIC50bC10b2dnbGUudGwtc2tpcDphY3RpdmVcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMDU4XCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjMDhjXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXRvZ2dsZS50bC1wYXNzOmhvdmVyXCI6IHtcbiAgICAgICAgICAgIFwiYm9yZGVyLWNvbG9yXCI6IFwiIzBjMFwiLFxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwiI2FmYVwiLFxuICAgICAgICB9LFxuXG4gICAgICAgIFwiI3RsIC50bC10b2dnbGUudGwtZmFpbDpob3ZlclwiOiB7XG4gICAgICAgICAgICBcImJvcmRlci1jb2xvclwiOiBcIiNjMDBcIixcbiAgICAgICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBcIiNmYWFcIixcbiAgICAgICAgfSxcblxuICAgICAgICBcIiN0bCAudGwtdG9nZ2xlLnRsLXNraXA6aG92ZXJcIjoge1xuICAgICAgICAgICAgXCJib3JkZXItY29sb3JcIjogXCIjMDhjXCIsXG4gICAgICAgICAgICBcImJhY2tncm91bmQtY29sb3JcIjogXCIjYmRmXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJlcG9ydC50bC1wYXNzIC50bC10ZXN0Om5vdCgudGwtcGFzcylcIjoge1xuICAgICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJlcG9ydC50bC1mYWlsIC50bC10ZXN0Om5vdCgudGwtZmFpbClcIjoge1xuICAgICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIjdGwgLnRsLXJlcG9ydC50bC1za2lwIC50bC10ZXN0Om5vdCgudGwtc2tpcClcIjoge1xuICAgICAgICAgICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgICAgIH0sXG4gICAgfVxuXG4gICAgdmFyIGNzcyA9IFwiXCJcblxuICAgIGZ1bmN0aW9uIGFwcGVuZEJhc2Uoc2VsZWN0b3IsIHByb3BzKSB7XG4gICAgICAgIGNzcyArPSBzZWxlY3RvciArIFwie1wiXG5cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJvcHMpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYXBwZW5kUHJvcHMocHJvcHNbaV0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcHBlbmRQcm9wcyhwcm9wcylcbiAgICAgICAgfVxuXG4gICAgICAgIGNzcyArPSBcIn1cIlxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGVuZFByb3BzKHByb3BzKSB7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBwcm9wcykge1xuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKHByb3BzLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9wc1trZXldID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZEJhc2Uoa2V5LCBwcm9wc1trZXldKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNzcyArPSBrZXkgKyBcIjpcIiArIHByb3BzW2tleV0gKyBcIjtcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIHNlbGVjdG9yIGluIHN0eWxlT2JqZWN0KSB7XG4gICAgICAgIGlmIChoYXNPd24uY2FsbChzdHlsZU9iamVjdCwgc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICBhcHBlbmRCYXNlKHNlbGVjdG9yLCBzdHlsZU9iamVjdFtzZWxlY3Rvcl0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY3NzLmNvbmNhdCgpIC8vIEhpbnQgdG8gZmxhdHRlbi5cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChELmRvY3VtZW50LmhlYWQucXVlcnlTZWxlY3RvcihcInN0eWxlW2RhdGEtdGwtc3R5bGVdXCIpID09IG51bGwpIHtcbiAgICAgICAgdmFyIHN0eWxlID0gRC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIilcblxuICAgICAgICBzdHlsZS50eXBlID0gXCJ0ZXh0L2Nzc1wiXG4gICAgICAgIHN0eWxlLnNldEF0dHJpYnV0ZShcImRhdGEtdGwtc3R5bGVcIiwgXCJcIilcbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgICAgIHN0eWxlLnN0eWxlU2hlZXQuY3NzVGV4dCA9IHN0eWxlcygpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdHlsZS5hcHBlbmRDaGlsZChELmRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHN0eWxlcygpKSlcbiAgICAgICAgfVxuXG4gICAgICAgIEQuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSlcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vKipcbiAqIFRoZSBnbG9iYWwgaW5qZWN0aW9ucyBmb3IgdGhlIERPTS4gTWFpbmx5IGZvciBkZWJ1Z2dpbmcuXG4gKi9cblxuZXhwb3J0cy5kb2N1bWVudCA9IGdsb2JhbC5kb2N1bWVudFxuZXhwb3J0cy53aW5kb3cgPSBnbG9iYWwud2luZG93XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsXCIpXG52YXIgRCA9IHJlcXVpcmUoXCIuL2luamVjdFwiKVxudmFyIG5vdyA9IERhdGUubm93IC8vIEF2b2lkIFNpbm9uJ3MgbW9ja1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuLyoqXG4gKiBUZXN0IHJ1bm5lciBhbmQgc2NyaXB0IGxvYWRlclxuICovXG5cbmZ1bmN0aW9uIHVuY2FjaGVkKGZpbGUpIHtcbiAgICBpZiAoZmlsZS5pbmRleE9mKFwiP1wiKSA8IDApIHtcbiAgICAgICAgcmV0dXJuIGZpbGUgKyBcIj9sb2FkZWQ9XCIgKyBub3coKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmaWxlICsgXCImbG9hZGVkPVwiICsgbm93KClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRTY3JpcHQoZmlsZSwgdGltZW91dCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIHZhciBzY3JpcHQgPSBELmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIilcbiAgICAgICAgdmFyIHRpbWVyID0gZ2xvYmFsLnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2xlYXIoKVxuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcIlRpbWVvdXQgZXhjZWVkZWQgbG9hZGluZyAnXCIgKyBmaWxlICsgXCInXCIpKVxuICAgICAgICB9LCB0aW1lb3V0KVxuXG4gICAgICAgIGZ1bmN0aW9uIGNsZWFyKGV2KSB7XG4gICAgICAgICAgICBpZiAoZXYgIT0gbnVsbCkgZXYucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgaWYgKGV2ICE9IG51bGwpIGV2LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgICAgICBnbG9iYWwuY2xlYXJUaW1lb3V0KHRpbWVyKVxuICAgICAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgc2NyaXB0Lm9uZXJyb3IgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIEQuZG9jdW1lbnQuaGVhZC5yZW1vdmVDaGlsZChzY3JpcHQpXG4gICAgICAgIH1cblxuICAgICAgICBzY3JpcHQuc3JjID0gdW5jYWNoZWQoZmlsZSlcbiAgICAgICAgc2NyaXB0LmFzeW5jID0gdHJ1ZVxuICAgICAgICBzY3JpcHQuZGVmZXIgPSB0cnVlXG4gICAgICAgIHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIGNsZWFyKGV2KVxuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgIH1cblxuICAgICAgICBzY3JpcHQub25lcnJvciA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgY2xlYXIoZXYpXG4gICAgICAgICAgICByZWplY3QoZXYpXG4gICAgICAgIH1cblxuICAgICAgICBELmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KVxuICAgIH0pXG59XG5cbmZ1bmN0aW9uIHRyeURlbGV0ZShrZXkpIHtcbiAgICB0cnkge1xuICAgICAgICBkZWxldGUgZ2xvYmFsW2tleV1cbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIC8vIGlnbm9yZVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVzY3JpcHRvckNoYW5nZWQoYSwgYikge1xuICAgIC8vIE5vdGU6IGlmIHRoZSBkZXNjcmlwdG9yIHdhcyByZW1vdmVkLCBpdCB3b3VsZCd2ZSBiZWVuIGRlbGV0ZWQsIGFueXdheXMuXG4gICAgaWYgKGEgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKGEuY29uZmlndXJhYmxlICE9PSBiLmNvbmZpZ3VyYWJsZSkgcmV0dXJuIHRydWVcbiAgICBpZiAoYS5lbnVtZXJhYmxlICE9PSBiLmVudW1lcmFibGUpIHJldHVybiB0cnVlXG4gICAgaWYgKGEud3JpdGFibGUgIT09IGIud3JpdGFibGUpIHJldHVybiB0cnVlXG4gICAgaWYgKGEuZ2V0ICE9PSBiLmdldCkgcmV0dXJuIHRydWVcbiAgICBpZiAoYS5zZXQgIT09IGIuc2V0KSByZXR1cm4gdHJ1ZVxuICAgIGlmIChhLnZhbHVlICE9PSBiLnZhbHVlKSByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBmYWxzZVxufVxuXG4vLyBUaGVzZSBmaXJlIGRlcHJlY2F0aW9uIHdhcm5pbmdzLCBhbmQgdGh1cyBzaG91bGQgYmUgYXZvaWRlZC5cbnZhciBibGFja2xpc3QgPSBPYmplY3QuZnJlZXplKHtcbiAgICB3ZWJraXRTdG9yYWdlSW5mbzogdHJ1ZSxcbiAgICB3ZWJraXRJbmRleGVkREI6IHRydWUsXG59KVxuXG5mdW5jdGlvbiBmaW5kR2xvYmFscygpIHtcbiAgICB2YXIgZm91bmQgPSBPYmplY3Qua2V5cyhnbG9iYWwpXG4gICAgdmFyIGdsb2JhbHMgPSBPYmplY3QuY3JlYXRlKG51bGwpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZvdW5kLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBmb3VuZFtpXVxuXG4gICAgICAgIGlmICghaGFzT3duLmNhbGwoYmxhY2tsaXN0LCBrZXkpKSB7XG4gICAgICAgICAgICBnbG9iYWxzW2tleV0gPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGdsb2JhbCwga2V5KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGdsb2JhbHNcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cywgc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUubG9ja2VkKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXG4gICAgICAgICAgICBcIlRoZSB0ZXN0IHN1aXRlIG11c3Qgbm90IGJlIHJ1biBhZnRlciB0aGUgdmlldyBoYXMgYmVlbiBkZXRhY2hlZC5cIlxuICAgICAgICApKVxuICAgIH1cblxuICAgIGlmIChzdGF0ZS5jdXJyZW50UHJvbWlzZSAhPSBudWxsKSByZXR1cm4gc3RhdGUuY3VycmVudFByb21pc2VcblxuICAgIG9wdHMudGhhbGxpdW0uY2xlYXJUZXN0cygpXG5cbiAgICAvLyBEZXRlY3QgYW5kIHJlbW92ZSBnbG9iYWxzIGNyZWF0ZWQgYnkgbG9hZGVkIHNjcmlwdHMuXG4gICAgdmFyIGdsb2JhbHMgPSBmaW5kR2xvYmFscygpXG5cbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICB2YXIgZm91bmQgPSBPYmplY3Qua2V5cyhnbG9iYWwpXG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmb3VuZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGtleSA9IGZvdW5kW2ldXG5cbiAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwoZ2xvYmFscywga2V5KSkge1xuICAgICAgICAgICAgICAgIHRyeURlbGV0ZShrZXkpXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRlc2NyaXB0b3JDaGFuZ2VkKFxuICAgICAgICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZ2xvYmFsLCBrZXkpLFxuICAgICAgICAgICAgICAgIGdsb2JhbHNba2V5XVxuICAgICAgICAgICAgKSkge1xuICAgICAgICAgICAgICAgIHRyeURlbGV0ZShrZXkpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0ZS5jdXJyZW50UHJvbWlzZSA9IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIHJldHVybiBzdGF0ZS5jdXJyZW50UHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBzdGF0ZS5wYXNzLnRleHRDb250ZW50ID0gXCIwXCJcbiAgICAgICAgc3RhdGUuZmFpbC50ZXh0Q29udGVudCA9IFwiMFwiXG4gICAgICAgIHN0YXRlLnNraXAudGV4dENvbnRlbnQgPSBcIjBcIlxuICAgICAgICByZXR1cm4gb3B0cy5wcmVsb2FkKClcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFV0aWwucGVhY2gob3B0cy5maWxlcywgZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2FkU2NyaXB0KGZpbGUsIG9wdHMudGltZW91dClcbiAgICAgICAgfSlcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG9wdHMucHJlcnVuKCkgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBvcHRzLnRoYWxsaXVtLnJ1bigpIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gb3B0cy5wb3N0cnVuKCkgfSlcbiAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShvcHRzLmVycm9yKGUpKS50aGVuKGZ1bmN0aW9uICgpIHsgdGhyb3cgZSB9KVxuICAgIH0pXG4gICAgLnRoZW4oXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgY2xlYW51cCgpIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlKSB7IGNsZWFudXAoKTsgdGhyb3cgZSB9KVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxudmFyIGRpZmYgPSByZXF1aXJlKFwiZGlmZlwiKVxudmFyIFIgPSByZXF1aXJlKFwiLi4vcmVwb3J0ZXJcIilcbnZhciBEID0gcmVxdWlyZShcIi4vaW5qZWN0XCIpXG52YXIgcnVuVGVzdHMgPSByZXF1aXJlKFwiLi9ydW4tdGVzdHNcIilcbnZhciBpbnNwZWN0ID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpLmluc3BlY3RcblxuLyoqXG4gKiBWaWV3IGxvZ2ljXG4gKi9cblxuZnVuY3Rpb24gdCh0ZXh0KSB7XG4gICAgcmV0dXJuIEQuZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dClcbn1cblxuZnVuY3Rpb24gaCh0eXBlLCBhdHRycywgY2hpbGRyZW4pIHtcbiAgICB2YXIgcGFydHMgPSB0eXBlLnNwbGl0KC9cXHMrL2cpXG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShhdHRycykpIHtcbiAgICAgICAgY2hpbGRyZW4gPSBhdHRyc1xuICAgICAgICBhdHRycyA9IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIGlmIChhdHRycyA9PSBudWxsKSBhdHRycyA9IHt9XG4gICAgaWYgKGNoaWxkcmVuID09IG51bGwpIGNoaWxkcmVuID0gW11cblxuICAgIHR5cGUgPSBwYXJ0c1swXVxuICAgIGF0dHJzLmNsYXNzTmFtZSA9IHBhcnRzLnNsaWNlKDEpLmpvaW4oXCIgXCIpXG5cbiAgICB2YXIgZWxlbSA9IEQuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKVxuXG4gICAgT2JqZWN0LmtleXMoYXR0cnMpLmZvckVhY2goZnVuY3Rpb24gKGF0dHIpIHtcbiAgICAgICAgZWxlbVthdHRyXSA9IGF0dHJzW2F0dHJdXG4gICAgfSlcblxuICAgIGNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgIGlmIChjaGlsZCAhPSBudWxsKSBlbGVtLmFwcGVuZENoaWxkKGNoaWxkKVxuICAgIH0pXG5cbiAgICByZXR1cm4gZWxlbVxufVxuXG5mdW5jdGlvbiB1bmlmaWVkRGlmZihlcnIpIHtcbiAgICB2YXIgYWN0dWFsID0gaW5zcGVjdChlcnIuYWN0dWFsKVxuICAgIHZhciBleHBlY3RlZCA9IGluc3BlY3QoZXJyLmV4cGVjdGVkKVxuICAgIHZhciBtc2cgPSBkaWZmLmNyZWF0ZVBhdGNoKFwic3RyaW5nXCIsIGFjdHVhbCwgZXhwZWN0ZWQpXG4gICAgICAgIC5zcGxpdCgvXFxyP1xcbnxcXHIvZykuc2xpY2UoNClcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gIS9eXFxAXFxAfF5cXFxcIE5vIG5ld2xpbmUvLnRlc3QobGluZSkgfSlcbiAgICB2YXIgZW5kID0gbXNnLmxlbmd0aFxuXG4gICAgd2hpbGUgKGVuZCAhPT0gMCAmJiAvXlxccyokL2cudGVzdChtc2dbZW5kIC0gMV0pKSBlbmQtLVxuICAgIHJldHVybiBoKFwiZGl2IHRsLWRpZmZcIiwgW1xuICAgICAgICBoKFwiZGl2IHRsLWRpZmYtaGVhZGVyXCIsIFtcbiAgICAgICAgICAgIGgoXCJzcGFuIHRsLWRpZmYtYWRkZWRcIiwgW3QoXCIrIGV4cGVjdGVkXCIpXSksXG4gICAgICAgICAgICBoKFwic3BhbiB0bC1kaWZmLXJlbW92ZWRcIiwgW3QoXCItIGFjdHVhbFwiKV0pLFxuICAgICAgICBdKSxcbiAgICAgICAgaChcImRpdiB0bC1wcmVcIiwgIWVuZFxuICAgICAgICAgICAgPyBbaChcInNwYW4gdGwtbGluZSB0bC1kaWZmLWFkZGVkXCIsIFt0KFwiIChub25lKVwiKV0pXVxuICAgICAgICAgICAgOiBtc2cuc2xpY2UoMCwgZW5kKVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gbGluZS50cmltUmlnaHQoKSB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIGlmIChsaW5lWzBdID09PSBcIitcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaChcInNwYW4gdGwtbGluZSB0bC1kaWZmLWFkZGVkXCIsIFt0KGxpbmUpXSlcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGxpbmVbMF0gPT09IFwiLVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoKFwic3BhbiB0bC1saW5lIHRsLWRpZmYtcmVtb3ZlZFwiLCBbdChsaW5lKV0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGgoXCJzcGFuIHRsLWxpbmUgdGwtZGlmZi1ub25lXCIsIFt0KGxpbmUpXSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICApLFxuICAgIF0pXG59XG5cbmZ1bmN0aW9uIHRvTGluZXMoc3RyKSB7XG4gICAgcmV0dXJuIGgoXCJkaXYgdGwtcHJlXCIsIHN0ci5zcGxpdCgvXFxyP1xcbnxcXHIvZykubWFwKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgIHJldHVybiBoKFwic3BhbiB0bC1saW5lXCIsIFt0KGxpbmUudHJpbVJpZ2h0KCkpXSlcbiAgICB9KSlcbn1cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IoZSwgc2hvd0RpZmYpIHtcbiAgICB2YXIgc3RhY2sgPSBSLnJlYWRTdGFjayhlKVxuXG4gICAgcmV0dXJuIGgoXCJkaXYgdGwtZGlzcGxheVwiLCBbXG4gICAgICAgIGgoXCJkaXYgdGwtbWVzc2FnZVwiLCBbdG9MaW5lcyhlLm5hbWUgKyBcIjogXCIgKyBlLm1lc3NhZ2UpXSksXG4gICAgICAgIHNob3dEaWZmID8gdW5pZmllZERpZmYoZSkgOiB1bmRlZmluZWQsXG4gICAgICAgIHN0YWNrID8gaChcImRpdiB0bC1zdGFja1wiLCBbdG9MaW5lcyhzdGFjayldKSA6IHVuZGVmaW5lZCxcbiAgICBdKVxufVxuXG5mdW5jdGlvbiBzaG93VGVzdChfLCByZXBvcnQsIGNsYXNzTmFtZSwgY2hpbGQpIHtcbiAgICB2YXIgZW5kID0gcmVwb3J0LnBhdGgubGVuZ3RoIC0gMVxuICAgIHZhciBuYW1lID0gcmVwb3J0LnBhdGhbZW5kXS5uYW1lXG4gICAgdmFyIHBhcmVudCA9IF8uZ2V0KHJlcG9ydC5wYXRoLCBlbmQpXG4gICAgdmFyIHNwZWVkID0gUi5zcGVlZChyZXBvcnQpXG5cbiAgICBpZiAoc3BlZWQgPT09IFwiZmFzdFwiKSB7XG4gICAgICAgIHBhcmVudC5ub2RlLmFwcGVuZENoaWxkKGgoXCJsaSBcIiArIGNsYXNzTmFtZSArIFwiIHRsLWZhc3RcIiwgW1xuICAgICAgICAgICAgaChcImgyXCIsIFt0KG5hbWUpXSksXG4gICAgICAgICAgICBjaGlsZCxcbiAgICAgICAgXSkpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGFyZW50Lm5vZGUuYXBwZW5kQ2hpbGQoaChcImxpIFwiICsgY2xhc3NOYW1lICsgXCIgdGwtXCIgKyBzcGVlZCwgW1xuICAgICAgICAgICAgaChcImgyXCIsIFtcbiAgICAgICAgICAgICAgICB0KG5hbWUgKyBcIiAoXCIpLFxuICAgICAgICAgICAgICAgIGgoXCJzcGFuIHRsLWR1cmF0aW9uXCIsIFt0KFIuZm9ybWF0VGltZShyZXBvcnQuZHVyYXRpb24pKV0pLFxuICAgICAgICAgICAgICAgIHQoXCIpXCIpLFxuICAgICAgICAgICAgXSksXG4gICAgICAgICAgICBjaGlsZCxcbiAgICAgICAgXSkpXG4gICAgfVxuXG4gICAgXy5vcHRzLmR1cmF0aW9uLnRleHRDb250ZW50ID0gUi5mb3JtYXRUaW1lKF8uZHVyYXRpb24pXG59XG5cbmZ1bmN0aW9uIHNob3dTa2lwKF8sIHJlcG9ydCkge1xuICAgIHZhciBlbmQgPSByZXBvcnQucGF0aC5sZW5ndGggLSAxXG4gICAgdmFyIG5hbWUgPSByZXBvcnQucGF0aFtlbmRdLm5hbWVcbiAgICB2YXIgcGFyZW50ID0gXy5nZXQocmVwb3J0LnBhdGgsIGVuZClcblxuICAgIHBhcmVudC5ub2RlLmFwcGVuZENoaWxkKGgoXCJsaSB0bC10ZXN0IHRsLXNraXBcIiwgW1xuICAgICAgICBoKFwiaDJcIiwgW3QobmFtZSldKSxcbiAgICBdKSlcbn1cblxuZXhwb3J0cy5uZXh0RnJhbWUgPSBuZXh0RnJhbWVcbmZ1bmN0aW9uIG5leHRGcmFtZShmdW5jKSB7XG4gICAgaWYgKEQud2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgICAgICBELndpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuYylcbiAgICB9IGVsc2Uge1xuICAgICAgICBnbG9iYWwuc2V0VGltZW91dChmdW5jLCAwKVxuICAgIH1cbn1cblxuZXhwb3J0cy5yZXBvcnQgPSBmdW5jdGlvbiAoXywgcmVwb3J0KSB7XG4gICAgaWYgKHJlcG9ydC5pc1N0YXJ0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgLy8gQ2xlYXIgdGhlIGVsZW1lbnQgZmlyc3QsIGp1c3QgaW4gY2FzZS5cbiAgICAgICAgICAgIHdoaWxlIChfLm9wdHMucmVwb3J0LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICBfLm9wdHMucmVwb3J0LnJlbW92ZUNoaWxkKF8ub3B0cy5yZXBvcnQuZmlyc3RDaGlsZClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRGVmZXIgdGhlIG5leHQgZnJhbWUsIHNvIHRoZSBjdXJyZW50IGNoYW5nZXMgY2FuIGJlIHNlbnQsIGluIGNhc2VcbiAgICAgICAgICAgIC8vIGl0J3MgY2xlYXJpbmcgb2xkIHRlc3QgcmVzdWx0cyBmcm9tIGEgbGFyZ2Ugc3VpdGUuIChDaHJvbWUgZG9lc1xuICAgICAgICAgICAgLy8gYmV0dGVyIGJhdGNoaW5nIHRoaXMgd2F5LCBhdCBsZWFzdC4pXG4gICAgICAgICAgICBuZXh0RnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF8uZ2V0KHVuZGVmaW5lZCwgMCkubm9kZSA9IF8ub3B0cy5yZXBvcnRcbiAgICAgICAgICAgICAgICBfLm9wdHMuZHVyYXRpb24udGV4dENvbnRlbnQgPSBSLmZvcm1hdFRpbWUoMClcbiAgICAgICAgICAgICAgICBfLm9wdHMucGFzcy50ZXh0Q29udGVudCA9IFwiMFwiXG4gICAgICAgICAgICAgICAgXy5vcHRzLmZhaWwudGV4dENvbnRlbnQgPSBcIjBcIlxuICAgICAgICAgICAgICAgIF8ub3B0cy5za2lwLnRleHRDb250ZW50ID0gXCIwXCJcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFbnRlcikge1xuICAgICAgICB2YXIgY2hpbGQgPSBoKFwidWxcIilcblxuICAgICAgICBfLmdldChyZXBvcnQucGF0aCkubm9kZSA9IGNoaWxkXG4gICAgICAgIHNob3dUZXN0KF8sIHJlcG9ydCwgXCJ0bC1zdWl0ZSB0bC1wYXNzXCIsIGNoaWxkKVxuICAgICAgICBfLm9wdHMucGFzcy50ZXh0Q29udGVudCA9IF8ucGFzc1xuICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzUGFzcykge1xuICAgICAgICBzaG93VGVzdChfLCByZXBvcnQsIFwidGwtdGVzdCB0bC1wYXNzXCIpXG4gICAgICAgIF8ub3B0cy5wYXNzLnRleHRDb250ZW50ID0gXy5wYXNzXG4gICAgfSBlbHNlIGlmIChyZXBvcnQuaXNGYWlsKSB7XG4gICAgICAgIHNob3dUZXN0KF8sIHJlcG9ydCwgXCJ0bC10ZXN0IHRsLWZhaWxcIiwgZm9ybWF0RXJyb3IocmVwb3J0LmVycm9yLFxuICAgICAgICAgICAgcmVwb3J0LmVycm9yLm5hbWUgPT09IFwiQXNzZXJ0aW9uRXJyb3JcIiAmJlxuICAgICAgICAgICAgICAgIHJlcG9ydC5lcnJvci5zaG93RGlmZiAhPT0gZmFsc2UpKVxuICAgICAgICBfLm9wdHMuZmFpbC50ZXh0Q29udGVudCA9IF8uZmFpbFxuICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICBzaG93U2tpcChfLCByZXBvcnQsIFwidGwtdGVzdCB0bC1za2lwXCIpXG4gICAgICAgIF8ub3B0cy5za2lwLnRleHRDb250ZW50ID0gXy5za2lwXG4gICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFcnJvcikge1xuICAgICAgICBfLm9wdHMucmVwb3J0LmFwcGVuZENoaWxkKGgoXCJsaSB0bC1lcnJvclwiLCBbXG4gICAgICAgICAgICBoKFwiaDJcIiwgW3QoXCJJbnRlcm5hbCBlcnJvclwiKV0pLFxuICAgICAgICAgICAgZm9ybWF0RXJyb3IocmVwb3J0LmVycm9yLCBmYWxzZSksXG4gICAgICAgIF0pKVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWRcbn1cblxuZnVuY3Rpb24gbWFrZUNvdW50ZXIoc3RhdGUsIGNoaWxkLCBsYWJlbCwgbmFtZSkge1xuICAgIHJldHVybiBoKFwiYnV0dG9uIHRsLXRvZ2dsZSBcIiArIG5hbWUsIHtcbiAgICAgICAgb25jbGljazogZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKVxuXG4gICAgICAgICAgICBpZiAoL1xcYnRsLWFjdGl2ZVxcYi8udGVzdCh0aGlzLmNsYXNzTmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXGJ0bC1hY3RpdmVcXGIvZywgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICBzdGF0ZS5yZXBvcnQuY2xhc3NOYW1lID0gc3RhdGUucmVwb3J0LmNsYXNzTmFtZVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKFwiXFxcXGJcIiArIG5hbWUgKyBcIlxcXFxiXCIsIFwiZ1wiKSwgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICBzdGF0ZS5hY3RpdmUgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLmFjdGl2ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmFjdGl2ZS5jbGFzc05hbWUgPSBzdGF0ZS5hY3RpdmUuY2xhc3NOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxidGwtYWN0aXZlXFxiL2csIFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzdGF0ZS5hY3RpdmUgPSB0aGlzXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc05hbWUgKz0gXCIgdGwtYWN0aXZlXCJcbiAgICAgICAgICAgICAgICBzdGF0ZS5yZXBvcnQuY2xhc3NOYW1lID0gc3RhdGUucmVwb3J0LmNsYXNzTmFtZVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxidGwtKHBhc3N8ZmFpbHxza2lwKVxcYi9nLCBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgICAgICAgLnRyaW0oKSArIFwiIFwiICsgbmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sIFt0KGxhYmVsKSwgY2hpbGRdKVxufVxuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAob3B0cykge1xuICAgIHZhciBzdGF0ZSA9IHtcbiAgICAgICAgY3VycmVudFByb21pc2U6IHVuZGVmaW5lZCxcbiAgICAgICAgbG9ja2VkOiBmYWxzZSxcbiAgICAgICAgZHVyYXRpb246IGgoXCJlbVwiLCBbdChSLmZvcm1hdFRpbWUoMCkpXSksXG4gICAgICAgIHBhc3M6IGgoXCJlbVwiLCBbdChcIjBcIildKSxcbiAgICAgICAgZmFpbDogaChcImVtXCIsIFt0KFwiMFwiKV0pLFxuICAgICAgICBza2lwOiBoKFwiZW1cIiwgW3QoXCIwXCIpXSksXG4gICAgICAgIHJlcG9ydDogaChcInVsIHRsLXJlcG9ydFwiKSxcbiAgICAgICAgYWN0aXZlOiB1bmRlZmluZWQsXG4gICAgfVxuXG4gICAgdmFyIGhlYWRlciA9IGgoXCJkaXYgdGwtaGVhZGVyXCIsIFtcbiAgICAgICAgaChcImRpdiB0bC1kdXJhdGlvblwiLCBbdChcIkR1cmF0aW9uOiBcIiksIHN0YXRlLmR1cmF0aW9uXSksXG4gICAgICAgIG1ha2VDb3VudGVyKHN0YXRlLCBzdGF0ZS5wYXNzLCBcIlBhc3NlczogXCIsIFwidGwtcGFzc1wiKSxcbiAgICAgICAgbWFrZUNvdW50ZXIoc3RhdGUsIHN0YXRlLmZhaWwsIFwiRmFpbHVyZXM6IFwiLCBcInRsLWZhaWxcIiksXG4gICAgICAgIG1ha2VDb3VudGVyKHN0YXRlLCBzdGF0ZS5za2lwLCBcIlNraXBwZWQ6IFwiLCBcInRsLXNraXBcIiksXG4gICAgICAgIGgoXCJidXR0b24gdGwtcnVuXCIsIHtcbiAgICAgICAgICAgIG9uY2xpY2s6IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICAgICAgICAgIHJ1blRlc3RzKG9wdHMsIHN0YXRlKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgW3QoXCJSdW5cIildKSxcbiAgICBdKVxuXG4gICAgdmFyIHJvb3QgPSBELmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGxcIilcblxuICAgIGlmIChyb290ID09IG51bGwpIHtcbiAgICAgICAgRC5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHJvb3QgPSBoKFwiZGl2XCIsIHtpZDogXCJ0bFwifSwgW1xuICAgICAgICAgICAgaGVhZGVyLFxuICAgICAgICAgICAgc3RhdGUucmVwb3J0LFxuICAgICAgICBdKSlcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDbGVhciB0aGUgZWxlbWVudCBmaXJzdCwganVzdCBpbiBjYXNlLlxuICAgICAgICB3aGlsZSAocm9vdC5maXJzdENoaWxkKSByb290LnJlbW92ZUNoaWxkKHJvb3QuZmlyc3RDaGlsZClcbiAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChoZWFkZXIpXG4gICAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoc3RhdGUucmVwb3J0KVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHJvb3Q6IHJvb3QsXG4gICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChCYXNlLCBTdXBlcikge1xuICAgIHZhciBzdGFydCA9IDJcblxuICAgIGlmICh0eXBlb2YgU3VwZXIgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBCYXNlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3VwZXIucHJvdG90eXBlKVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQmFzZS5wcm90b3R5cGUsIFwiY29uc3RydWN0b3JcIiwge1xuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIHZhbHVlOiBCYXNlLFxuICAgICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0ID0gMVxuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbWV0aG9kcyA9IGFyZ3VtZW50c1tpXVxuXG4gICAgICAgIGlmIChtZXRob2RzICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobWV0aG9kcylcblxuICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBrZXlzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IGtleXNba11cbiAgICAgICAgICAgICAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IobWV0aG9kcywga2V5KVxuXG4gICAgICAgICAgICAgICAgZGVzYy5lbnVtZXJhYmxlID0gZmFsc2VcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQmFzZS5wcm90b3R5cGUsIGtleSwgZGVzYylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogVGhpcyBjb250YWlucyB0aGUgYnJvd3NlciBjb25zb2xlIHN0dWZmLlxuICovXG5cbmV4cG9ydHMuU3ltYm9scyA9IE9iamVjdC5mcmVlemUoe1xuICAgIFBhc3M6IFwi4pyTXCIsXG4gICAgRmFpbDogXCLinJZcIixcbiAgICBEb3Q6IFwi4oCkXCIsXG4gICAgRG90RmFpbDogXCIhXCIsXG59KVxuXG5leHBvcnRzLndpbmRvd1dpZHRoID0gNzVcbmV4cG9ydHMubmV3bGluZSA9IFwiXFxuXCJcblxuLy8gQ29sb3Igc3VwcG9ydCBpcyB1bmZvcmNlZCBhbmQgdW5zdXBwb3J0ZWQsIHNpbmNlIHlvdSBjYW4gb25seSBzcGVjaWZ5XG4vLyBsaW5lLWJ5LWxpbmUgY29sb3JzIHZpYSBDU1MsIGFuZCBldmVuIHRoYXQgaXNuJ3QgdmVyeSBwb3J0YWJsZS5cbmV4cG9ydHMuY29sb3JTdXBwb3J0ID0gMFxuXG4vKipcbiAqIFNpbmNlIGJyb3dzZXJzIGRvbid0IGhhdmUgdW5idWZmZXJlZCBvdXRwdXQsIHRoaXMga2luZCBvZiBzaW11bGF0ZXMgaXQuXG4gKi9cblxudmFyIGFjYyA9IFwiXCJcblxuZXhwb3J0cy5kZWZhdWx0T3B0cyA9IHtcbiAgICB3cml0ZTogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBhY2MgKz0gc3RyXG5cbiAgICAgICAgdmFyIGluZGV4ID0gc3RyLmluZGV4T2YoXCJcXG5cIilcblxuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgdmFyIGxpbmVzID0gc3RyLnNwbGl0KFwiXFxuXCIpXG5cbiAgICAgICAgICAgIGFjYyA9IGxpbmVzLnBvcCgpXG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBnbG9iYWwuY29uc29sZS5sb2cobGluZXNbaV0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGFjYyAhPT0gXCJcIikge1xuICAgICAgICAgICAgZ2xvYmFsLmNvbnNvbGUubG9nKGFjYylcbiAgICAgICAgICAgIGFjYyA9IFwiXCJcbiAgICAgICAgfVxuICAgIH0sXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgZGlmZiA9IHJlcXVpcmUoXCJkaWZmXCIpXG5cbnZhciBtZXRob2RzID0gcmVxdWlyZShcIi4uL21ldGhvZHNcIilcbnZhciBpbnNwZWN0ID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpLmluc3BlY3RcbnZhciBwZWFjaCA9IHJlcXVpcmUoXCIuLi91dGlsXCIpLnBlYWNoXG52YXIgUmVwb3J0ZXIgPSByZXF1aXJlKFwiLi9yZXBvcnRlclwiKVxudmFyIFV0aWwgPSByZXF1aXJlKFwiLi91dGlsXCIpXG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi4vc2V0dGluZ3NcIilcblxuZnVuY3Rpb24gcHJpbnRUaW1lKF8sIHAsIHN0cikge1xuICAgIGlmICghXy50aW1lUHJpbnRlZCkge1xuICAgICAgICBfLnRpbWVQcmludGVkID0gdHJ1ZVxuICAgICAgICBzdHIgKz0gVXRpbC5jb2xvcihcImxpZ2h0XCIsIFwiIChcIiArIFV0aWwuZm9ybWF0VGltZShfLmR1cmF0aW9uKSArIFwiKVwiKVxuICAgIH1cblxuICAgIHJldHVybiBwLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChzdHIpIH0pXG59XG5cbmZ1bmN0aW9uIHVuaWZpZWREaWZmKGVycikge1xuICAgIHZhciBhY3R1YWwgPSBpbnNwZWN0KGVyci5hY3R1YWwpXG4gICAgdmFyIGV4cGVjdGVkID0gaW5zcGVjdChlcnIuZXhwZWN0ZWQpXG4gICAgdmFyIG1zZyA9IGRpZmYuY3JlYXRlUGF0Y2goXCJzdHJpbmdcIiwgYWN0dWFsLCBleHBlY3RlZClcbiAgICB2YXIgaGVhZGVyID0gU2V0dGluZ3MubmV3bGluZSgpICtcbiAgICAgICAgVXRpbC5jb2xvcihcImRpZmYgYWRkZWRcIiwgXCIrIGV4cGVjdGVkXCIpICsgXCIgXCIgK1xuICAgICAgICBVdGlsLmNvbG9yKFwiZGlmZiByZW1vdmVkXCIsIFwiLSBhY3R1YWxcIikgK1xuICAgICAgICBTZXR0aW5ncy5uZXdsaW5lKCkgKyBTZXR0aW5ncy5uZXdsaW5lKClcblxuICAgIHJldHVybiBoZWFkZXIgKyBtc2cuc3BsaXQoL1xccj9cXG58XFxyL2cpLnNsaWNlKDQpXG4gICAgLmZpbHRlcihmdW5jdGlvbiAobGluZSkgeyByZXR1cm4gIS9eXFxAXFxAfF5cXFxcIE5vIG5ld2xpbmUvLnRlc3QobGluZSkgfSlcbiAgICAubWFwKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgIGlmIChsaW5lWzBdID09PSBcIitcIikgcmV0dXJuIFV0aWwuY29sb3IoXCJkaWZmIGFkZGVkXCIsIGxpbmUudHJpbVJpZ2h0KCkpXG4gICAgICAgIGlmIChsaW5lWzBdID09PSBcIi1cIikgcmV0dXJuIFV0aWwuY29sb3IoXCJkaWZmIHJlbW92ZWRcIiwgbGluZS50cmltUmlnaHQoKSlcbiAgICAgICAgcmV0dXJuIGxpbmUudHJpbVJpZ2h0KClcbiAgICB9KVxuICAgIC5qb2luKFNldHRpbmdzLm5ld2xpbmUoKSlcbn1cblxuZnVuY3Rpb24gZm9ybWF0RmFpbChzdHIpIHtcbiAgICByZXR1cm4gc3RyLnRyaW1SaWdodCgpXG4gICAgLnNwbGl0KC9cXHI/XFxufFxcci9nKVxuICAgIC5tYXAoZnVuY3Rpb24gKGxpbmUpIHsgcmV0dXJuIFV0aWwuY29sb3IoXCJmYWlsXCIsIGxpbmUudHJpbVJpZ2h0KCkpIH0pXG4gICAgLmpvaW4oU2V0dGluZ3MubmV3bGluZSgpKVxufVxuXG5mdW5jdGlvbiBnZXREaWZmU3RhY2soZSkge1xuICAgIHZhciBkZXNjcmlwdGlvbiA9IGZvcm1hdEZhaWwoZS5uYW1lICsgXCI6IFwiICsgZS5tZXNzYWdlKVxuXG4gICAgaWYgKGUubmFtZSA9PT0gXCJBc3NlcnRpb25FcnJvclwiICYmIGUuc2hvd0RpZmYgIT09IGZhbHNlKSB7XG4gICAgICAgIGRlc2NyaXB0aW9uICs9IFNldHRpbmdzLm5ld2xpbmUoKSArIHVuaWZpZWREaWZmKGUpXG4gICAgfVxuXG4gICAgdmFyIHN0cmlwcGVkID0gZm9ybWF0RmFpbChVdGlsLnJlYWRTdGFjayhlKSlcblxuICAgIGlmIChzdHJpcHBlZCA9PT0gXCJcIikgcmV0dXJuIGRlc2NyaXB0aW9uXG4gICAgcmV0dXJuIGRlc2NyaXB0aW9uICsgU2V0dGluZ3MubmV3bGluZSgpICsgc3RyaXBwZWRcbn1cblxuZnVuY3Rpb24gaW5zcGVjdFRyaW1tZWQob2JqZWN0KSB7XG4gICAgcmV0dXJuIGluc3BlY3Qob2JqZWN0KS50cmltUmlnaHQoKVxuICAgIC5zcGxpdCgvXFxyP1xcbnxcXHIvZylcbiAgICAubWFwKGZ1bmN0aW9uIChsaW5lKSB7IHJldHVybiBsaW5lLnRyaW1SaWdodCgpIH0pXG4gICAgLmpvaW4oU2V0dGluZ3MubmV3bGluZSgpKVxufVxuXG5mdW5jdGlvbiBwcmludEZhaWxMaXN0KF8sIGVycikge1xuICAgIHZhciBzdHIgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGdldERpZmZTdGFjayhlcnIpIDogaW5zcGVjdFRyaW1tZWQoZXJyKVxuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgvXFxyP1xcbi9nKVxuXG4gICAgcmV0dXJuIF8ucHJpbnQoXCIgICAgXCIgKyBwYXJ0c1swXSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBwZWFjaChwYXJ0cy5zbGljZSgxKSwgZnVuY3Rpb24gKHBhcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KHBhcnQgPyBcIiAgICAgIFwiICsgcGFydCA6IFwiXCIpXG4gICAgICAgIH0pXG4gICAgfSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cywgbWV0aG9kcykge1xuICAgIHJldHVybiBuZXcgQ29uc29sZVJlcG9ydGVyKG9wdHMsIG1ldGhvZHMpXG59XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgbW9zdCBjb25zb2xlIHJlcG9ydGVycy5cbiAqXG4gKiBOb3RlOiBwcmludGluZyBpcyBhc3luY2hyb25vdXMsIGJlY2F1c2Ugb3RoZXJ3aXNlLCBpZiBlbm91Z2ggZXJyb3JzIGV4aXN0LFxuICogTm9kZSB3aWxsIGV2ZW50dWFsbHkgc3RhcnQgZHJvcHBpbmcgbGluZXMgc2VudCB0byBpdHMgYnVmZmVyLCBlc3BlY2lhbGx5IHdoZW5cbiAqIHN0YWNrIHRyYWNlcyBnZXQgaW52b2x2ZWQuIElmIFRoYWxsaXVtJ3Mgb3V0cHV0IGlzIHJlZGlyZWN0ZWQsIHRoYXQgY2FuIGJlIGFcbiAqIGJpZyBwcm9ibGVtIGZvciBjb25zdW1lcnMsIGFzIHRoZXkgb25seSBoYXZlIHBhcnQgb2YgdGhlIG91dHB1dCwgYW5kIHdvbid0IGJlXG4gKiBhYmxlIHRvIHNlZSBhbGwgdGhlIGVycm9ycyBsYXRlci4gQWxzbywgaWYgY29uc29sZSB3YXJuaW5ncyBjb21lIHVwIGVuLW1hc3NlLFxuICogdGhhdCB3b3VsZCBhbHNvIGNvbnRyaWJ1dGUuIFNvLCB3ZSBoYXZlIHRvIHdhaXQgZm9yIGVhY2ggbGluZSB0byBmbHVzaCBiZWZvcmVcbiAqIHdlIGNhbiBjb250aW51ZSwgc28gdGhlIGZ1bGwgb3V0cHV0IG1ha2VzIGl0cyB3YXkgdG8gdGhlIGNvbnNvbGUuXG4gKlxuICogU29tZSB0ZXN0IGZyYW1ld29ya3MgbGlrZSBUYXBlIG1pc3MgdGhpcywgdGhvdWdoLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIFRoZSBvcHRpb25zIGZvciB0aGUgcmVwb3J0ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcHRzLndyaXRlIFRoZSB1bmJ1ZmZlcnJlZCB3cml0ZXIgZm9yIHRoZSByZXBvcnRlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdHMucmVzZXQgQSByZXNldCBmdW5jdGlvbiBmb3IgdGhlIHByaW50ZXIgKyB3cml0ZXIuXG4gKiBAcGFyYW0ge1N0cmluZ1tdfSBhY2NlcHRzIFRoZSBvcHRpb25zIGFjY2VwdGVkLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaW5pdCBUaGUgaW5pdCBmdW5jdGlvbiBmb3IgdGhlIHN1YmNsYXNzIHJlcG9ydGVyJ3NcbiAqICAgICAgICAgICAgICAgICAgICAgICAgaXNvbGF0ZWQgc3RhdGUgKGNyZWF0ZWQgYnkgZmFjdG9yeSkuXG4gKi9cbmZ1bmN0aW9uIENvbnNvbGVSZXBvcnRlcihvcHRzLCBtZXRob2RzKSB7XG4gICAgUmVwb3J0ZXIuY2FsbCh0aGlzLCBVdGlsLlRyZWUsIG9wdHMsIG1ldGhvZHMsIHRydWUpXG5cbiAgICBpZiAoIVV0aWwuQ29sb3JzLmZvcmNlZCgpICYmIG1ldGhvZHMuYWNjZXB0cy5pbmRleE9mKFwiY29sb3JcIikgPj0gMCkge1xuICAgICAgICB0aGlzLm9wdHMuY29sb3IgPSBvcHRzLmNvbG9yXG4gICAgfVxuXG4gICAgVXRpbC5kZWZhdWx0aWZ5KHRoaXMsIG9wdHMsIFwid3JpdGVcIilcbiAgICB0aGlzLnJlc2V0KClcbn1cblxubWV0aG9kcyhDb25zb2xlUmVwb3J0ZXIsIFJlcG9ydGVyLCB7XG4gICAgcHJpbnQ6IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgICAgaWYgKHN0ciA9PSBudWxsKSBzdHIgPSBcIlwiXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5vcHRzLndyaXRlKHN0ciArIFwiXFxuXCIpKVxuICAgIH0sXG5cbiAgICB3cml0ZTogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBpZiAoc3RyICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5vcHRzLndyaXRlKHN0cikpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBwcmludFJlc3VsdHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG5cbiAgICAgICAgaWYgKCF0aGlzLnRlc3RzICYmICF0aGlzLnNraXApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByaW50KFxuICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJwbGFpblwiLCBcIiAgMCB0ZXN0c1wiKSArXG4gICAgICAgICAgICAgICAgVXRpbC5jb2xvcihcImxpZ2h0XCIsIFwiICgwbXMpXCIpKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gc2VsZi5wcmludCgpIH0pXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5wcmludCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHAgPSBQcm9taXNlLnJlc29sdmUoKVxuXG4gICAgICAgICAgICBpZiAoc2VsZi5wYXNzKSB7XG4gICAgICAgICAgICAgICAgcCA9IHByaW50VGltZShzZWxmLCBwLFxuICAgICAgICAgICAgICAgICAgICBVdGlsLmNvbG9yKFwiYnJpZ2h0IHBhc3NcIiwgXCIgIFwiKSArXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJncmVlblwiLCBzZWxmLnBhc3MgKyBcIiBwYXNzaW5nXCIpKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2VsZi5za2lwKSB7XG4gICAgICAgICAgICAgICAgcCA9IHByaW50VGltZShzZWxmLCBwLFxuICAgICAgICAgICAgICAgICAgICBVdGlsLmNvbG9yKFwic2tpcFwiLCBcIiAgXCIgKyBzZWxmLnNraXAgKyBcIiBza2lwcGVkXCIpKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2VsZi5mYWlsKSB7XG4gICAgICAgICAgICAgICAgcCA9IHByaW50VGltZShzZWxmLCBwLFxuICAgICAgICAgICAgICAgICAgICBVdGlsLmNvbG9yKFwiYnJpZ2h0IGZhaWxcIiwgXCIgIFwiKSArXG4gICAgICAgICAgICAgICAgICAgIFV0aWwuY29sb3IoXCJmYWlsXCIsIHNlbGYuZmFpbCArIFwiIGZhaWxpbmdcIikpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNlbGYucHJpbnQoKSB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGVhY2goc2VsZi5lcnJvcnMsIGZ1bmN0aW9uIChyZXBvcnQsIGkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IGkgKyAxICsgXCIpIFwiICsgVXRpbC5qb2luUGF0aChyZXBvcnQpICtcbiAgICAgICAgICAgICAgICAgICAgVXRpbC5mb3JtYXRSZXN0KHJlcG9ydClcblxuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnByaW50KFwiICBcIiArIFV0aWwuY29sb3IoXCJwbGFpblwiLCBuYW1lICsgXCI6XCIpKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByaW50RmFpbExpc3Qoc2VsZiwgcmVwb3J0LmVycm9yKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gc2VsZi5wcmludCgpIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICBwcmludEVycm9yOiBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgbGluZXMgPSByZXBvcnQuZXJyb3IgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgICAgPyBVdGlsLmdldFN0YWNrKHJlcG9ydC5lcnJvcilcbiAgICAgICAgICAgIDogaW5zcGVjdFRyaW1tZWQocmVwb3J0LmVycm9yKVxuXG4gICAgICAgIHJldHVybiB0aGlzLnByaW50KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcGVhY2gobGluZXMuc3BsaXQoL1xccj9cXG4vZyksIGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucHJpbnQobGluZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuL3V0aWxcIilcblxuZXhwb3J0cy5vbiA9IHJlcXVpcmUoXCIuL29uXCIpXG5leHBvcnRzLmNvbnNvbGVSZXBvcnRlciA9IHJlcXVpcmUoXCIuL2NvbnNvbGUtcmVwb3J0ZXJcIilcbmV4cG9ydHMuUmVwb3J0ZXIgPSByZXF1aXJlKFwiLi9yZXBvcnRlclwiKVxuZXhwb3J0cy5jb2xvciA9IFV0aWwuY29sb3JcbmV4cG9ydHMuQ29sb3JzID0gVXRpbC5Db2xvcnNcbmV4cG9ydHMuZm9ybWF0UmVzdCA9IFV0aWwuZm9ybWF0UmVzdFxuZXhwb3J0cy5mb3JtYXRUaW1lID0gVXRpbC5mb3JtYXRUaW1lXG5leHBvcnRzLmdldFN0YWNrID0gVXRpbC5nZXRTdGFja1xuZXhwb3J0cy5qb2luUGF0aCA9IFV0aWwuam9pblBhdGhcbmV4cG9ydHMubmV3bGluZSA9IFV0aWwubmV3bGluZVxuZXhwb3J0cy5yZWFkU3RhY2sgPSBVdGlsLnJlYWRTdGFja1xuZXhwb3J0cy5zZXRDb2xvciA9IFV0aWwuc2V0Q29sb3JcbmV4cG9ydHMuc3BlZWQgPSBVdGlsLnNwZWVkXG5leHBvcnRzLlN0YXR1cyA9IFV0aWwuU3RhdHVzXG5leHBvcnRzLnN5bWJvbHMgPSBVdGlsLnN5bWJvbHNcbmV4cG9ydHMudW5zZXRDb2xvciA9IFV0aWwudW5zZXRDb2xvclxuZXhwb3J0cy53aW5kb3dXaWR0aCA9IFV0aWwud2luZG93V2lkdGhcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBTdGF0dXMgPSByZXF1aXJlKFwiLi91dGlsXCIpLlN0YXR1c1xuXG4vLyBCZWNhdXNlIEVTNSBzdWNrcy4gKEFuZCwgaXQncyBicmVha2luZyBteSBQaGFudG9tSlMgYnVpbGRzKVxuZnVuY3Rpb24gc2V0TmFtZShyZXBvcnRlciwgbmFtZSkge1xuICAgIHRyeSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXBvcnRlciwgXCJuYW1lXCIsIHt2YWx1ZTogbmFtZX0pXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBpZ25vcmVcbiAgICB9XG59XG5cbi8qKlxuICogQSBtYWNybyBvZiBzb3J0cywgdG8gc2ltcGxpZnkgY3JlYXRpbmcgcmVwb3J0ZXJzLiBJdCBhY2NlcHRzIGFuIG9iamVjdCB3aXRoXG4gKiB0aGUgZm9sbG93aW5nIHBhcmFtZXRlcnM6XG4gKlxuICogYGFjY2VwdHM6IHN0cmluZ1tdYCAtIFRoZSBwcm9wZXJ0aWVzIGFjY2VwdGVkLiBFdmVyeXRoaW5nIGVsc2UgaXMgaWdub3JlZCxcbiAqIGFuZCBpdCdzIHBhcnRpYWxseSB0aGVyZSBmb3IgZG9jdW1lbnRhdGlvbi4gVGhpcyBwYXJhbWV0ZXIgaXMgcmVxdWlyZWQuXG4gKlxuICogYGNyZWF0ZShvcHRzLCBtZXRob2RzKWAgLSBDcmVhdGUgYSBuZXcgcmVwb3J0ZXIgaW5zdGFuY2UuICBUaGlzIHBhcmFtZXRlciBpc1xuICogcmVxdWlyZWQuIE5vdGUgdGhhdCBgbWV0aG9kc2AgcmVmZXJzIHRvIHRoZSBwYXJhbWV0ZXIgb2JqZWN0IGl0c2VsZi5cbiAqXG4gKiBgaW5pdChzdGF0ZSwgb3B0cylgIC0gSW5pdGlhbGl6ZSBleHRyYSByZXBvcnRlciBzdGF0ZSwgaWYgYXBwbGljYWJsZS5cbiAqXG4gKiBgYmVmb3JlKHJlcG9ydGVyKWAgLSBEbyB0aGluZ3MgYmVmb3JlIGVhY2ggZXZlbnQsIHJldHVybmluZyBhIHBvc3NpYmxlXG4gKiB0aGVuYWJsZSB3aGVuIGRvbmUuIFRoaXMgZGVmYXVsdHMgdG8gYSBuby1vcC5cbiAqXG4gKiBgYWZ0ZXIocmVwb3J0ZXIpYCAtIERvIHRoaW5ncyBhZnRlciBlYWNoIGV2ZW50LCByZXR1cm5pbmcgYSBwb3NzaWJsZVxuICogdGhlbmFibGUgd2hlbiBkb25lLiBUaGlzIGRlZmF1bHRzIHRvIGEgbm8tb3AuXG4gKlxuICogYHJlcG9ydChyZXBvcnRlciwgcmVwb3J0KWAgLSBIYW5kbGUgYSB0ZXN0IHJlcG9ydC4gVGhpcyBtYXkgcmV0dXJuIGEgcG9zc2libGVcbiAqIHRoZW5hYmxlIHdoZW4gZG9uZSwgYW5kIGl0IGlzIHJlcXVpcmVkLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChuYW1lLCBtZXRob2RzKSB7XG4gICAgc2V0TmFtZShyZXBvcnRlciwgbmFtZSlcbiAgICByZXBvcnRlcltuYW1lXSA9IHJlcG9ydGVyXG4gICAgcmV0dXJuIHJlcG9ydGVyXG4gICAgZnVuY3Rpb24gcmVwb3J0ZXIob3B0cykge1xuICAgICAgICAvKipcbiAgICAgICAgICogSW5zdGVhZCBvZiBzaWxlbnRseSBmYWlsaW5nIHRvIHdvcmssIGxldCdzIGVycm9yIG91dCB3aGVuIGEgcmVwb3J0IGlzXG4gICAgICAgICAqIHBhc3NlZCBpbiwgYW5kIGluZm9ybSB0aGUgdXNlciBpdCBuZWVkcyBpbml0aWFsaXplZC4gQ2hhbmNlcyBhcmUsXG4gICAgICAgICAqIHRoZXJlJ3Mgbm8gbGVnaXRpbWF0ZSByZWFzb24gdG8gZXZlbiBwYXNzIGEgcmVwb3J0LCBhbnl3YXlzLlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKHR5cGVvZiBvcHRzID09PSBcIm9iamVjdFwiICYmIG9wdHMgIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgICB0eXBlb2Ygb3B0cy5fID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgICAgIFwiT3B0aW9ucyBjYW5ub3QgYmUgYSByZXBvcnQuIERpZCB5b3UgZm9yZ2V0IHRvIGNhbGwgdGhlIFwiICtcbiAgICAgICAgICAgICAgICBcImZhY3RvcnkgZmlyc3Q/XCIpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgXyA9IG1ldGhvZHMuY3JlYXRlKG9wdHMsIG1ldGhvZHMpXG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChyZXBvcnQpIHtcbiAgICAgICAgICAgIC8vIE9ubHkgc29tZSBldmVudHMgaGF2ZSBjb21tb24gc3RlcHMuXG4gICAgICAgICAgICBpZiAocmVwb3J0LmlzU3RhcnQpIHtcbiAgICAgICAgICAgICAgICBfLnJ1bm5pbmcgPSB0cnVlXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VudGVyIHx8IHJlcG9ydC5pc1Bhc3MpIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLlBhc3NpbmdcbiAgICAgICAgICAgICAgICBfLmR1cmF0aW9uICs9IHJlcG9ydC5kdXJhdGlvblxuICAgICAgICAgICAgICAgIF8udGVzdHMrK1xuICAgICAgICAgICAgICAgIF8ucGFzcysrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLkZhaWxpbmdcbiAgICAgICAgICAgICAgICBfLmR1cmF0aW9uICs9IHJlcG9ydC5kdXJhdGlvblxuICAgICAgICAgICAgICAgIF8udGVzdHMrK1xuICAgICAgICAgICAgICAgIF8uZmFpbCsrXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0hvb2spIHtcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucGF0aCkuc3RhdHVzID0gU3RhdHVzLkZhaWxpbmdcbiAgICAgICAgICAgICAgICBfLmdldChyZXBvcnQucm9vdFBhdGgpLnN0YXR1cyA9IFN0YXR1cy5GYWlsaW5nXG4gICAgICAgICAgICAgICAgXy5mYWlsKytcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICAgICAgICAgIF8uZ2V0KHJlcG9ydC5wYXRoKS5zdGF0dXMgPSBTdGF0dXMuU2tpcHBlZFxuICAgICAgICAgICAgICAgIC8vIFNraXBwZWQgdGVzdHMgYXJlbid0IGNvdW50ZWQgaW4gdGhlIHRvdGFsIHRlc3QgY291bnRcbiAgICAgICAgICAgICAgICBfLnNraXArK1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICAgICAgICAgIHR5cGVvZiBtZXRob2RzLmJlZm9yZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgID8gbWV0aG9kcy5iZWZvcmUoXylcbiAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBtZXRob2RzLnJlcG9ydChfLCByZXBvcnQpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBtZXRob2RzLmFmdGVyID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgPyBtZXRob2RzLmFmdGVyKF8pXG4gICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChyZXBvcnQuaXNFbmQgfHwgcmVwb3J0LmlzRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgXy5yZXNldCgpXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgXy5vcHRzLnJlc2V0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfLm9wdHMucmVzZXQoKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuLi9tZXRob2RzXCIpXG52YXIgZGVmYXVsdGlmeSA9IHJlcXVpcmUoXCIuL3V0aWxcIikuZGVmYXVsdGlmeVxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcblxuZnVuY3Rpb24gU3RhdGUocmVwb3J0ZXIpIHtcbiAgICBpZiAodHlwZW9mIHJlcG9ydGVyLm1ldGhvZHMuaW5pdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICgwLCByZXBvcnRlci5tZXRob2RzLmluaXQpKHRoaXMsIHJlcG9ydGVyLm9wdHMpXG4gICAgfVxufVxuXG4vKipcbiAqIFRoaXMgaGVscHMgc3BlZWQgdXAgZ2V0dGluZyBwcmV2aW91cyB0cmVlcywgc28gYSBwb3RlbnRpYWxseSBleHBlbnNpdmVcbiAqIHRyZWUgc2VhcmNoIGRvZXNuJ3QgaGF2ZSB0byBiZSBwZXJmb3JtZWQuXG4gKlxuICogKFRoaXMgZG9lcyBhY3R1YWxseSBtYWtlIGEgc2xpZ2h0IHBlcmYgZGlmZmVyZW5jZSBpbiB0aGUgdGVzdHMuKVxuICovXG5mdW5jdGlvbiBpc1JlcGVhdChjYWNoZSwgcGF0aCkge1xuICAgIC8vIENhbid0IGJlIGEgcmVwZWF0IHRoZSBmaXJzdCB0aW1lLlxuICAgIGlmIChjYWNoZS5wYXRoID09IG51bGwpIHJldHVybiBmYWxzZVxuICAgIGlmIChwYXRoLmxlbmd0aCAhPT0gY2FjaGUucGF0aC5sZW5ndGgpIHJldHVybiBmYWxzZVxuICAgIGlmIChwYXRoID09PSBjYWNoZS5wYXRoKSByZXR1cm4gdHJ1ZVxuXG4gICAgLy8gSXQncyB1bmxpa2VseSB0aGUgbmVzdGluZyB3aWxsIGJlIGNvbnNpc3RlbnRseSBtb3JlIHRoYW4gYSBmZXcgbGV2ZWxzXG4gICAgLy8gZGVlcCAoPj0gNSksIHNvIHRoaXMgc2hvdWxkbid0IGJvZyBhbnl0aGluZyBkb3duLlxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGF0aFtpXSAhPT0gY2FjaGUucGF0aFtpXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYWNoZS5wYXRoID0gcGF0aFxuICAgIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogU3VwZXJjbGFzcyBmb3IgYWxsIHJlcG9ydGVycy4gVGhpcyBjb3ZlcnMgdGhlIHN0YXRlIGZvciBwcmV0dHkgbXVjaCBldmVyeVxuICogcmVwb3J0ZXIuXG4gKlxuICogTm90ZSB0aGF0IGlmIHlvdSBkZWxheSB0aGUgaW5pdGlhbCByZXNldCwgeW91IHN0aWxsIG11c3QgY2FsbCBpdCBiZWZvcmUgdGhlXG4gKiBjb25zdHJ1Y3RvciBmaW5pc2hlcy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRlclxuZnVuY3Rpb24gUmVwb3J0ZXIoVHJlZSwgb3B0cywgbWV0aG9kcywgZGVsYXkpIHtcbiAgICB0aGlzLlRyZWUgPSBUcmVlXG4gICAgdGhpcy5vcHRzID0ge31cbiAgICB0aGlzLm1ldGhvZHMgPSBtZXRob2RzXG4gICAgZGVmYXVsdGlmeSh0aGlzLCBvcHRzLCBcInJlc2V0XCIpXG4gICAgaWYgKCFkZWxheSkgdGhpcy5yZXNldCgpXG59XG5cbm1ldGhvZHMoUmVwb3J0ZXIsIHtcbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLnRpbWVQcmludGVkID0gZmFsc2VcbiAgICAgICAgdGhpcy50ZXN0cyA9IDBcbiAgICAgICAgdGhpcy5wYXNzID0gMFxuICAgICAgICB0aGlzLmZhaWwgPSAwXG4gICAgICAgIHRoaXMuc2tpcCA9IDBcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IDBcbiAgICAgICAgdGhpcy5lcnJvcnMgPSBbXVxuICAgICAgICB0aGlzLnN0YXRlID0gbmV3IFN0YXRlKHRoaXMpXG4gICAgICAgIHRoaXMuYmFzZSA9IG5ldyB0aGlzLlRyZWUodW5kZWZpbmVkKVxuICAgICAgICB0aGlzLmNhY2hlID0ge3BhdGg6IHVuZGVmaW5lZCwgcmVzdWx0OiB1bmRlZmluZWQsIGVuZDogMH1cbiAgICB9LFxuXG4gICAgcHVzaEVycm9yOiBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgICAgIHRoaXMuZXJyb3JzLnB1c2gocmVwb3J0KVxuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uIChwYXRoLCBlbmQpIHtcbiAgICAgICAgaWYgKGVuZCA9PSBudWxsKSBlbmQgPSBwYXRoLmxlbmd0aFxuICAgICAgICBpZiAoZW5kID09PSAwKSByZXR1cm4gdGhpcy5iYXNlXG4gICAgICAgIGlmIChpc1JlcGVhdCh0aGlzLmNhY2hlLCBwYXRoLCBlbmQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWNoZS5yZXN1bHRcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaGlsZCA9IHRoaXMuYmFzZVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IHBhdGhbaV1cblxuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKGNoaWxkLmNoaWxkcmVuLCBlbnRyeS5pbmRleCkpIHtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLmNoaWxkcmVuW2VudHJ5LmluZGV4XVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IGNoaWxkLmNoaWxkcmVuW2VudHJ5LmluZGV4XSA9IG5ldyB0aGlzLlRyZWUoZW50cnkubmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FjaGUuZW5kID0gZW5kXG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlLnJlc3VsdCA9IGNoaWxkXG4gICAgfSxcbn0pXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlsXCIpXG52YXIgU2V0dGluZ3MgPSByZXF1aXJlKFwiLi4vc2V0dGluZ3NcIilcblxuZXhwb3J0cy5zeW1ib2xzID0gU2V0dGluZ3Muc3ltYm9sc1xuZXhwb3J0cy53aW5kb3dXaWR0aCA9IFNldHRpbmdzLndpbmRvd1dpZHRoXG5leHBvcnRzLm5ld2xpbmUgPSBTZXR0aW5ncy5uZXdsaW5lXG5cbi8qXG4gKiBTdGFjayBub3JtYWxpemF0aW9uXG4gKi9cblxuLy8gRXhwb3J0ZWQgZm9yIGRlYnVnZ2luZ1xuZXhwb3J0cy5yZWFkU3RhY2sgPSByZWFkU3RhY2tcbmZ1bmN0aW9uIHJlYWRTdGFjayhlKSB7XG4gICAgdmFyIHN0YWNrID0gVXRpbC5nZXRTdGFjayhlKVxuXG4gICAgLy8gSWYgaXQgZG9lc24ndCBzdGFydCB3aXRoIHRoZSBtZXNzYWdlLCBqdXN0IHJldHVybiB0aGUgc3RhY2suXG4gICAgLy8gIEZpcmVmb3gsIFNhZmFyaSAgICAgICAgICAgICAgICBDaHJvbWUsIElFXG4gICAgaWYgKC9eKEApP1xcUytcXDpcXGQrLy50ZXN0KHN0YWNrKSB8fCAvXlxccyphdC8udGVzdChzdGFjaykpIHtcbiAgICAgICAgcmV0dXJuIGZvcm1hdExpbmVCcmVha3Moc3RhY2spXG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gc3RhY2suaW5kZXhPZihlLm1lc3NhZ2UpXG5cbiAgICBpZiAoaW5kZXggPCAwKSByZXR1cm4gZm9ybWF0TGluZUJyZWFrcyhVdGlsLmdldFN0YWNrKGUpKVxuICAgIHZhciByZSA9IC9cXHI/XFxuL2dcblxuICAgIHJlLmxhc3RJbmRleCA9IGluZGV4ICsgZS5tZXNzYWdlLmxlbmd0aFxuICAgIGlmICghcmUudGVzdChzdGFjaykpIHJldHVybiBcIlwiXG4gICAgcmV0dXJuIGZvcm1hdExpbmVCcmVha3Moc3RhY2suc2xpY2UocmUubGFzdEluZGV4KSlcbn1cblxuZnVuY3Rpb24gZm9ybWF0TGluZUJyZWFrcyhzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFteXFxyXFxuXFxTXSskL2csIFwiXCIpXG4gICAgICAgIC5yZXBsYWNlKC9cXHMqKFxccj9cXG58XFxyKVxccyovZywgU2V0dGluZ3MubmV3bGluZSgpKVxufVxuXG5leHBvcnRzLmdldFN0YWNrID0gZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpKSByZXR1cm4gZm9ybWF0TGluZUJyZWFrcyhVdGlsLmdldFN0YWNrKGUpKVxuICAgIHZhciBkZXNjcmlwdGlvbiA9IChlLm5hbWUgKyBcIjogXCIgKyBlLm1lc3NhZ2UpXG4gICAgICAgIC5yZXBsYWNlKC9cXHMrJC9nbSwgXCJcIilcbiAgICAgICAgLnJlcGxhY2UoL1xccj9cXG58XFxyL2csIFNldHRpbmdzLm5ld2xpbmUoKSlcbiAgICB2YXIgc3RyaXBwZWQgPSByZWFkU3RhY2soZSlcblxuICAgIGlmIChzdHJpcHBlZCA9PT0gXCJcIikgcmV0dXJuIGRlc2NyaXB0aW9uXG4gICAgcmV0dXJuIGRlc2NyaXB0aW9uICsgU2V0dGluZ3MubmV3bGluZSgpICsgc3RyaXBwZWRcbn1cblxudmFyIENvbG9ycyA9IGV4cG9ydHMuQ29sb3JzID0gU2V0dGluZ3MuQ29sb3JzXG5cbi8vIENvbG9yIHBhbGV0dGUgcHVsbGVkIGZyb20gTW9jaGFcbmZ1bmN0aW9uIGNvbG9yVG9OdW1iZXIobmFtZSkge1xuICAgIHN3aXRjaCAobmFtZSkge1xuICAgIGNhc2UgXCJwYXNzXCI6IHJldHVybiA5MFxuICAgIGNhc2UgXCJmYWlsXCI6IHJldHVybiAzMVxuXG4gICAgY2FzZSBcImJyaWdodCBwYXNzXCI6IHJldHVybiA5MlxuICAgIGNhc2UgXCJicmlnaHQgZmFpbFwiOiByZXR1cm4gOTFcbiAgICBjYXNlIFwiYnJpZ2h0IHllbGxvd1wiOiByZXR1cm4gOTNcblxuICAgIGNhc2UgXCJza2lwXCI6IHJldHVybiAzNlxuICAgIGNhc2UgXCJzdWl0ZVwiOiByZXR1cm4gMFxuICAgIGNhc2UgXCJwbGFpblwiOiByZXR1cm4gMFxuXG4gICAgY2FzZSBcImVycm9yIHRpdGxlXCI6IHJldHVybiAwXG4gICAgY2FzZSBcImVycm9yIG1lc3NhZ2VcIjogcmV0dXJuIDMxXG4gICAgY2FzZSBcImVycm9yIHN0YWNrXCI6IHJldHVybiA5MFxuXG4gICAgY2FzZSBcImNoZWNrbWFya1wiOiByZXR1cm4gMzJcbiAgICBjYXNlIFwiZmFzdFwiOiByZXR1cm4gOTBcbiAgICBjYXNlIFwibWVkaXVtXCI6IHJldHVybiAzM1xuICAgIGNhc2UgXCJzbG93XCI6IHJldHVybiAzMVxuICAgIGNhc2UgXCJncmVlblwiOiByZXR1cm4gMzJcbiAgICBjYXNlIFwibGlnaHRcIjogcmV0dXJuIDkwXG5cbiAgICBjYXNlIFwiZGlmZiBndXR0ZXJcIjogcmV0dXJuIDkwXG4gICAgY2FzZSBcImRpZmYgYWRkZWRcIjogcmV0dXJuIDMyXG4gICAgY2FzZSBcImRpZmYgcmVtb3ZlZFwiOiByZXR1cm4gMzFcbiAgICBkZWZhdWx0OiB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBuYW1lOiBcXFwiXCIgKyBuYW1lICsgXCJcXFwiXCIpXG4gICAgfVxufVxuXG5leHBvcnRzLmNvbG9yID0gY29sb3JcbmZ1bmN0aW9uIGNvbG9yKG5hbWUsIHN0cikge1xuICAgIGlmIChDb2xvcnMuc3VwcG9ydGVkKCkpIHtcbiAgICAgICAgcmV0dXJuIFwiXFx1MDAxYltcIiArIGNvbG9yVG9OdW1iZXIobmFtZSkgKyBcIm1cIiArIHN0ciArIFwiXFx1MDAxYlswbVwiXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHN0ciArIFwiXCJcbiAgICB9XG59XG5cbmV4cG9ydHMuc2V0Q29sb3IgPSBmdW5jdGlvbiAoXykge1xuICAgIGlmIChfLm9wdHMuY29sb3IgIT0gbnVsbCkgQ29sb3JzLm1heWJlU2V0KF8ub3B0cy5jb2xvcilcbn1cblxuZXhwb3J0cy51bnNldENvbG9yID0gZnVuY3Rpb24gKF8pIHtcbiAgICBpZiAoXy5vcHRzLmNvbG9yICE9IG51bGwpIENvbG9ycy5tYXliZVJlc3RvcmUoKVxufVxuXG52YXIgU3RhdHVzID0gZXhwb3J0cy5TdGF0dXMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBVbmtub3duOiAwLFxuICAgIFNraXBwZWQ6IDEsXG4gICAgUGFzc2luZzogMixcbiAgICBGYWlsaW5nOiAzLFxufSlcblxuZXhwb3J0cy5UcmVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlXG4gICAgdGhpcy5zdGF0dXMgPSBTdGF0dXMuVW5rbm93blxuICAgIHRoaXMuY2hpbGRyZW4gPSBPYmplY3QuY3JlYXRlKG51bGwpXG59XG5cbmV4cG9ydHMuZGVmYXVsdGlmeSA9IGZ1bmN0aW9uIChfLCBvcHRzLCBwcm9wKSB7XG4gICAgaWYgKF8ubWV0aG9kcy5hY2NlcHRzLmluZGV4T2YocHJvcCkgPj0gMCkge1xuICAgICAgICB2YXIgdXNlZCA9IG9wdHMgIT0gbnVsbCAmJiB0eXBlb2Ygb3B0c1twcm9wXSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICA/IG9wdHNcbiAgICAgICAgICAgIDogU2V0dGluZ3MuZGVmYXVsdE9wdHMoKVxuXG4gICAgICAgIF8ub3B0c1twcm9wXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodXNlZFtwcm9wXS5hcHBseSh1c2VkLCBhcmd1bWVudHMpKVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBqb2luUGF0aChyZXBvcnRQYXRoKSB7XG4gICAgdmFyIHBhdGggPSBcIlwiXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlcG9ydFBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcGF0aCArPSBcIiBcIiArIHJlcG9ydFBhdGhbaV0ubmFtZVxuICAgIH1cblxuICAgIHJldHVybiBwYXRoLnNsaWNlKDEpXG59XG5cbmV4cG9ydHMuam9pblBhdGggPSBmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgcmV0dXJuIGpvaW5QYXRoKHJlcG9ydC5wYXRoKVxufVxuXG5leHBvcnRzLnNwZWVkID0gZnVuY3Rpb24gKHJlcG9ydCkge1xuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gcmVwb3J0LnNsb3cpIHJldHVybiBcInNsb3dcIlxuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gcmVwb3J0LnNsb3cgLyAyKSByZXR1cm4gXCJtZWRpdW1cIlxuICAgIGlmIChyZXBvcnQuZHVyYXRpb24gPj0gMCkgcmV0dXJuIFwiZmFzdFwiXG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJEdXJhdGlvbiBtdXN0IG5vdCBiZSBuZWdhdGl2ZVwiKVxufVxuXG5leHBvcnRzLmZvcm1hdFRpbWUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBzID0gMTAwMCAvKiBtcyAqL1xuICAgIHZhciBtID0gNjAgKiBzXG4gICAgdmFyIGggPSA2MCAqIG1cbiAgICB2YXIgZCA9IDI0ICogaFxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChtcykge1xuICAgICAgICBpZiAobXMgPj0gZCkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArIFwiZFwiXG4gICAgICAgIGlmIChtcyA+PSBoKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgXCJoXCJcbiAgICAgICAgaWYgKG1zID49IG0pIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbSkgKyBcIm1cIlxuICAgICAgICBpZiAobXMgPj0gcykgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArIFwic1wiXG4gICAgICAgIHJldHVybiBtcyArIFwibXNcIlxuICAgIH1cbn0pKClcblxuZXhwb3J0cy5mb3JtYXRSZXN0ID0gZnVuY3Rpb24gKHJlcG9ydCkge1xuICAgIGlmICghcmVwb3J0LmlzSG9vaykgcmV0dXJuIFwiXCJcbiAgICB2YXIgcGF0aCA9IFwiIChcIlxuXG4gICAgaWYgKHJlcG9ydC5yb290UGF0aC5sZW5ndGgpIHtcbiAgICAgICAgcGF0aCArPSByZXBvcnQuc3RhZ2VcbiAgICAgICAgaWYgKHJlcG9ydC5uYW1lKSBwYXRoICs9IFwiIOKAkiBcIiArIHJlcG9ydC5uYW1lXG4gICAgICAgIGlmIChyZXBvcnQucGF0aC5sZW5ndGggPiByZXBvcnQucm9vdFBhdGgubGVuZ3RoICsgMSkge1xuICAgICAgICAgICAgcGF0aCArPSBcIiwgaW4gXCIgKyBqb2luUGF0aChyZXBvcnQucm9vdFBhdGgpXG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBwYXRoICs9IFwiZ2xvYmFsIFwiICsgcmVwb3J0LnN0YWdlXG4gICAgICAgIGlmIChyZXBvcnQubmFtZSkgcGF0aCArPSBcIiDigJIgXCIgKyByZXBvcnQubmFtZVxuICAgIH1cblxuICAgIHJldHVybiBwYXRoICsgXCIpXCJcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIEdlbmVyYWwgQ0xJIGFuZCByZXBvcnRlciBzZXR0aW5ncy4gSWYgc29tZXRoaW5nIG5lZWRzIHRvXG5cbnZhciBDb25zb2xlID0gcmVxdWlyZShcIi4vcmVwbGFjZWQvY29uc29sZVwiKVxuXG52YXIgd2luZG93V2lkdGggPSBDb25zb2xlLndpbmRvd1dpZHRoXG52YXIgbmV3bGluZSA9IENvbnNvbGUubmV3bGluZVxudmFyIFN5bWJvbHMgPSBDb25zb2xlLlN5bWJvbHNcbnZhciBkZWZhdWx0T3B0cyA9IENvbnNvbGUuZGVmYXVsdE9wdHNcblxuZXhwb3J0cy53aW5kb3dXaWR0aCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHdpbmRvd1dpZHRoIH1cbmV4cG9ydHMubmV3bGluZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ld2xpbmUgfVxuZXhwb3J0cy5zeW1ib2xzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gU3ltYm9scyB9XG5leHBvcnRzLmRlZmF1bHRPcHRzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZGVmYXVsdE9wdHMgfVxuXG5leHBvcnRzLnNldFdpbmRvd1dpZHRoID0gZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiB3aW5kb3dXaWR0aCA9IHZhbHVlIH1cbmV4cG9ydHMuc2V0TmV3bGluZSA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gbmV3bGluZSA9IHZhbHVlIH1cbmV4cG9ydHMuc2V0U3ltYm9scyA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gU3ltYm9scyA9IHZhbHVlIH1cbmV4cG9ydHMuc2V0RGVmYXVsdE9wdHMgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIGRlZmF1bHRPcHRzID0gdmFsdWUgfVxuXG4vLyBDb25zb2xlLmNvbG9yU3VwcG9ydCBpcyBhIG1hc2sgd2l0aCB0aGUgZm9sbG93aW5nIGJpdHM6XG4vLyAweDEgLSBpZiBzZXQsIGNvbG9ycyBzdXBwb3J0ZWQgYnkgZGVmYXVsdFxuLy8gMHgyIC0gaWYgc2V0LCBmb3JjZSBjb2xvciBzdXBwb3J0XG4vL1xuLy8gVGhpcyBpcyBwdXJlbHkgYW4gaW1wbGVtZW50YXRpb24gZGV0YWlsLCBhbmQgaXMgaW52aXNpYmxlIHRvIHRoZSBvdXRzaWRlXG4vLyB3b3JsZC5cbnZhciBjb2xvclN1cHBvcnQgPSBDb25zb2xlLmNvbG9yU3VwcG9ydFxudmFyIG1hc2sgPSBjb2xvclN1cHBvcnRcblxuZXhwb3J0cy5Db2xvcnMgPSB7XG4gICAgc3VwcG9ydGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAobWFzayAmIDB4MSkgIT09IDBcbiAgICB9LFxuXG4gICAgZm9yY2VkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAobWFzayAmIDB4MikgIT09IDBcbiAgICB9LFxuXG4gICAgbWF5YmVTZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAoKG1hc2sgJiAweDIpID09PSAwKSBtYXNrID0gdmFsdWUgPyAweDEgOiAwXG4gICAgfSxcblxuICAgIG1heWJlUmVzdG9yZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoKG1hc2sgJiAweDIpID09PSAwKSBtYXNrID0gY29sb3JTdXBwb3J0ICYgMHgxXG4gICAgfSxcblxuICAgIC8vIE9ubHkgZm9yIGRlYnVnZ2luZ1xuICAgIGZvcmNlU2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgbWFzayA9IHZhbHVlID8gMHgzIDogMHgyXG4gICAgfSxcblxuICAgIGZvcmNlUmVzdG9yZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBtYXNrID0gY29sb3JTdXBwb3J0XG4gICAgfSxcblxuICAgIGdldFN1cHBvcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1cHBvcnRlZDogKGNvbG9yU3VwcG9ydCAmIDB4MSkgIT09IDAsXG4gICAgICAgICAgICBmb3JjZWQ6IChjb2xvclN1cHBvcnQgJiAweDIpICE9PSAwLFxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldFN1cHBvcnQ6IGZ1bmN0aW9uIChvcHRzKSB7XG4gICAgICAgIG1hc2sgPSBjb2xvclN1cHBvcnQgPVxuICAgICAgICAgICAgKG9wdHMuc3VwcG9ydGVkID8gMHgxIDogMCkgfCAob3B0cy5mb3JjZWQgPyAweDIgOiAwKVxuICAgIH0sXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWV0aG9kcyA9IHJlcXVpcmUoXCIuL21ldGhvZHNcIilcblxuZXhwb3J0cy5nZXRUeXBlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBcIm51bGxcIlxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkgcmV0dXJuIFwiYXJyYXlcIlxuICAgIHJldHVybiB0eXBlb2YgdmFsdWVcbn1cblxuLy8gUGhhbnRvbUpTLCBJRSwgYW5kIHBvc3NpYmx5IEVkZ2UgZG9uJ3Qgc2V0IHRoZSBzdGFjayB0cmFjZSB1bnRpbCB0aGUgZXJyb3IgaXNcbi8vIHRocm93bi4gTm90ZSB0aGF0IHRoaXMgcHJlZmVycyBhbiBleGlzdGluZyBzdGFjayBmaXJzdCwgc2luY2Ugbm9uLW5hdGl2ZVxuLy8gZXJyb3JzIGxpa2VseSBhbHJlYWR5IGNvbnRhaW4gdGhpcy4gTm90ZSB0aGF0IHRoaXMgaXNuJ3QgbmVjZXNzYXJ5IGluIHRoZVxuLy8gQ0xJIC0gdGhhdCBvbmx5IHRhcmdldHMgTm9kZS5cbmV4cG9ydHMuZ2V0U3RhY2sgPSBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBzdGFjayA9IGUuc3RhY2tcblxuICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcikgfHwgc3RhY2sgIT0gbnVsbCkgcmV0dXJuIHN0YWNrXG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBlXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZS5zdGFja1xuICAgIH1cbn1cblxuZXhwb3J0cy5wY2FsbCA9IGZ1bmN0aW9uIChmdW5jKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMoZnVuY3Rpb24gKGUsIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZSAhPSBudWxsID8gcmVqZWN0KGUpIDogcmVzb2x2ZSh2YWx1ZSlcbiAgICAgICAgfSlcbiAgICB9KVxufVxuXG5leHBvcnRzLnBlYWNoID0gZnVuY3Rpb24gKGxpc3QsIGZ1bmMpIHtcbiAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGhcbiAgICB2YXIgcCA9IFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHAgPSBwLnRoZW4oZnVuYy5iaW5kKHVuZGVmaW5lZCwgbGlzdFtpXSwgaSkpXG4gICAgfVxuXG4gICAgcmV0dXJuIHBcbn1cblxuLyoqXG4gKiBBIGxhenkgYWNjZXNzb3IsIGNvbXBsZXRlIHdpdGggdGhyb3duIGVycm9yIG1lbW9pemF0aW9uIGFuZCBhIGRlY2VudCBhbW91bnRcbiAqIG9mIG9wdGltaXphdGlvbiwgc2luY2UgaXQncyB1c2VkIGluIGEgbG90IG9mIGNvZGUuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgdXNlcyByZWZlcmVuY2UgaW5kaXJlY3Rpb24gYW5kIGRpcmVjdCBtdXRhdGlvbiB0byBrZWVwIG9ubHlcbiAqIGp1c3QgdGhlIGNvbXB1dGF0aW9uIG5vbi1jb25zdGFudCwgc28gZW5naW5lcyBjYW4gYXZvaWQgY2xvc3VyZSBhbGxvY2F0aW9uLlxuICogQWxzbywgYGNyZWF0ZWAgaXMgaW50ZW50aW9uYWxseSBrZXB0ICpvdXQqIG9mIGFueSBjbG9zdXJlLCBzbyBpdCBjYW4gYmUgbW9yZVxuICogZWFzaWx5IGNvbGxlY3RlZC5cbiAqL1xuZnVuY3Rpb24gTGF6eShjcmVhdGUpIHtcbiAgICB0aGlzLnZhbHVlID0gY3JlYXRlXG4gICAgdGhpcy5nZXQgPSB0aGlzLmluaXRcbn1cblxubWV0aG9kcyhMYXp5LCB7XG4gICAgcmVjdXJzaXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJMYXp5IGZ1bmN0aW9ucyBtdXN0IG5vdCBiZSBjYWxsZWQgcmVjdXJzaXZlbHkhXCIpXG4gICAgfSxcblxuICAgIHJldHVybjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZVxuICAgIH0sXG5cbiAgICB0aHJvdzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyB0aGlzLnZhbHVlXG4gICAgfSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5nZXQgPSB0aGlzLnJlY3Vyc2l2ZVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gKDAsIHRoaXMudmFsdWUpKClcbiAgICAgICAgICAgIHRoaXMuZ2V0ID0gdGhpcy5yZXR1cm5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBlXG4gICAgICAgICAgICB0aGlzLmdldCA9IHRoaXMudGhyb3dcbiAgICAgICAgICAgIHRocm93IHRoaXMudmFsdWVcbiAgICAgICAgfVxuICAgIH0sXG59KVxuXG5leHBvcnRzLmxhenkgPSBmdW5jdGlvbiAoY3JlYXRlKSB7XG4gICAgdmFyIHJlZiA9IG5ldyBMYXp5KGNyZWF0ZSlcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiByZWYuZ2V0KClcbiAgICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh4cywgZikge1xuICAgIGlmICh4cy5tYXApIHJldHVybiB4cy5tYXAoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHggPSB4c1tpXTtcbiAgICAgICAgaWYgKGhhc093bi5jYWxsKHhzLCBpKSkgcmVzLnB1c2goZih4LCBpLCB4cykpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufTtcblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4iLCJ2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoeHMsIGYsIGFjYykge1xuICAgIHZhciBoYXNBY2MgPSBhcmd1bWVudHMubGVuZ3RoID49IDM7XG4gICAgaWYgKGhhc0FjYyAmJiB4cy5yZWR1Y2UpIHJldHVybiB4cy5yZWR1Y2UoZiwgYWNjKTtcbiAgICBpZiAoeHMucmVkdWNlKSByZXR1cm4geHMucmVkdWNlKGYpO1xuICAgIFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKCFoYXNPd24uY2FsbCh4cywgaSkpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIWhhc0FjYykge1xuICAgICAgICAgICAgYWNjID0geHNbaV07XG4gICAgICAgICAgICBoYXNBY2MgPSB0cnVlO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYWNjID0gZihhY2MsIHhzW2ldLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjYztcbn07XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3N1YnN0YWNrL25vZGUtYnJvd3NlcmlmeS9pc3N1ZXMvMTY3NFxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJ1dGlsLWluc3BlY3RcIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciBpbnNwZWN0ID0gZXhwb3J0cy5pbnNwZWN0ID0gcmVxdWlyZShcIi4vaW5zcGVjdFwiKVxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbnZhciBBc3NlcnRpb25FcnJvclxuXG4vLyBQaGFudG9tSlMsIElFLCBhbmQgcG9zc2libHkgRWRnZSBkb24ndCBzZXQgdGhlIHN0YWNrIHRyYWNlIHVudGlsIHRoZSBlcnJvciBpc1xuLy8gdGhyb3duLiBOb3RlIHRoYXQgdGhpcyBwcmVmZXJzIGFuIGV4aXN0aW5nIHN0YWNrIGZpcnN0LCBzaW5jZSBub24tbmF0aXZlXG4vLyBlcnJvcnMgbGlrZWx5IGFscmVhZHkgY29udGFpbiB0aGlzLlxuZnVuY3Rpb24gZ2V0U3RhY2soZSkge1xuICAgIHZhciBzdGFjayA9IGUuc3RhY2tcblxuICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcikgfHwgc3RhY2sgIT0gbnVsbCkgcmV0dXJuIHN0YWNrXG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBlXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZS5zdGFja1xuICAgIH1cbn1cblxudHJ5IHtcbiAgICBBc3NlcnRpb25FcnJvciA9IG5ldyBGdW5jdGlvbihbIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3LWZ1bmNcbiAgICAgICAgXCIndXNlIHN0cmljdCc7XCIsXG4gICAgICAgIFwiY2xhc3MgQXNzZXJ0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XCIsXG4gICAgICAgIFwiICAgIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIGV4cGVjdGVkLCBhY3R1YWwpIHtcIixcbiAgICAgICAgXCIgICAgICAgIHN1cGVyKG1lc3NhZ2UpXCIsXG4gICAgICAgIFwiICAgICAgICB0aGlzLmV4cGVjdGVkID0gZXhwZWN0ZWRcIixcbiAgICAgICAgXCIgICAgICAgIHRoaXMuYWN0dWFsID0gYWN0dWFsXCIsXG4gICAgICAgIFwiICAgIH1cIixcbiAgICAgICAgXCJcIixcbiAgICAgICAgXCIgICAgZ2V0IG5hbWUoKSB7XCIsXG4gICAgICAgIFwiICAgICAgICByZXR1cm4gJ0Fzc2VydGlvbkVycm9yJ1wiLFxuICAgICAgICBcIiAgICB9XCIsXG4gICAgICAgIFwifVwiLFxuICAgICAgICAvLyBjaGVjayBuYXRpdmUgc3ViY2xhc3Npbmcgc3VwcG9ydFxuICAgICAgICBcIm5ldyBBc3NlcnRpb25FcnJvcignbWVzc2FnZScsIDEsIDIpXCIsXG4gICAgICAgIFwicmV0dXJuIEFzc2VydGlvbkVycm9yXCIsXG4gICAgXS5qb2luKFwiXFxuXCIpKSgpXG59IGNhdGNoIChlKSB7XG4gICAgQXNzZXJ0aW9uRXJyb3IgPSB0eXBlb2YgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG1lc3NhZ2UsIGV4cGVjdGVkLCBhY3R1YWwpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgfHwgXCJcIlxuICAgICAgICAgICAgdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkXG4gICAgICAgICAgICB0aGlzLmFjdHVhbCA9IGFjdHVhbFxuICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3RvcilcbiAgICAgICAgfVxuICAgICAgICA6IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG1lc3NhZ2UsIGV4cGVjdGVkLCBhY3R1YWwpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgfHwgXCJcIlxuICAgICAgICAgICAgdGhpcy5leHBlY3RlZCA9IGV4cGVjdGVkXG4gICAgICAgICAgICB0aGlzLmFjdHVhbCA9IGFjdHVhbFxuICAgICAgICAgICAgdmFyIGUgPSBuZXcgRXJyb3IobWVzc2FnZSlcblxuICAgICAgICAgICAgZS5uYW1lID0gXCJBc3NlcnRpb25FcnJvclwiXG4gICAgICAgICAgICB0aGlzLnN0YWNrID0gZ2V0U3RhY2soZSlcbiAgICAgICAgfVxuXG4gICAgQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShFcnJvci5wcm90b3R5cGUpXG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQXNzZXJ0aW9uRXJyb3IucHJvdG90eXBlLCBcImNvbnN0cnVjdG9yXCIsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBBc3NlcnRpb25FcnJvcixcbiAgICB9KVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFzc2VydGlvbkVycm9yLnByb3RvdHlwZSwgXCJuYW1lXCIsIHtcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBcIkFzc2VydGlvbkVycm9yXCIsXG4gICAgfSlcbn1cblxuZXhwb3J0cy5Bc3NlcnRpb25FcnJvciA9IEFzc2VydGlvbkVycm9yXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLXNlbGYtY29tcGFyZSAqL1xuLy8gRm9yIGJldHRlciBOYU4gaGFuZGxpbmdcbmV4cG9ydHMuc3RyaWN0SXMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhID09PSBiIHx8IGEgIT09IGEgJiYgYiAhPT0gYlxufVxuXG5leHBvcnRzLmxvb3NlSXMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhID09IGIgfHwgYSAhPT0gYSAmJiBiICE9PSBiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG59XG5cbi8qIGVzbGludC1lbmFibGUgbm8tc2VsZi1jb21wYXJlICovXG5cbnZhciB0ZW1wbGF0ZVJlZ2V4cCA9IC8oLj8pXFx7KC4rPylcXH0vZ1xuXG5leHBvcnRzLmVzY2FwZSA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcbiAgICBpZiAodHlwZW9mIHN0cmluZyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYHN0cmluZ2AgbXVzdCBiZSBhIHN0cmluZ1wiKVxuICAgIH1cblxuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSh0ZW1wbGF0ZVJlZ2V4cCwgZnVuY3Rpb24gKG0sIHByZSkge1xuICAgICAgICByZXR1cm4gcHJlICsgXCJcXFxcXCIgKyBtLnNsaWNlKDEpXG4gICAgfSlcbn1cblxuLy8gVGhpcyBmb3JtYXRzIHRoZSBhc3NlcnRpb24gZXJyb3IgbWVzc2FnZXMuXG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uIChtZXNzYWdlLCBhcmdzLCBwcmV0dGlmeSkge1xuICAgIGlmIChwcmV0dGlmeSA9PSBudWxsKSBwcmV0dGlmeSA9IGluc3BlY3RcblxuICAgIGlmICh0eXBlb2YgbWVzc2FnZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG1lc3NhZ2VgIG11c3QgYmUgYSBzdHJpbmdcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFyZ3MgIT09IFwib2JqZWN0XCIgfHwgYXJncyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFyZ3NgIG11c3QgYmUgYW4gb2JqZWN0XCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBwcmV0dGlmeSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgcHJldHRpZnlgIG11c3QgYmUgYSBmdW5jdGlvbiBpZiBwYXNzZWRcIilcbiAgICB9XG5cbiAgICByZXR1cm4gbWVzc2FnZS5yZXBsYWNlKHRlbXBsYXRlUmVnZXhwLCBmdW5jdGlvbiAobSwgcHJlLCBwcm9wKSB7XG4gICAgICAgIGlmIChwcmUgPT09IFwiXFxcXFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbS5zbGljZSgxKVxuICAgICAgICB9IGVsc2UgaWYgKGhhc093bi5jYWxsKGFyZ3MsIHByb3ApKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlICsgcHJldHRpZnkoYXJnc1twcm9wXSwge2RlcHRoOiA1fSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwcmUgKyBtXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5leHBvcnRzLmZhaWwgPSBmdW5jdGlvbiAobWVzc2FnZSwgYXJncywgcHJldHRpZnkpIHtcbiAgICBpZiAoYXJncyA9PSBudWxsKSB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSlcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgICAgIGV4cG9ydHMuZm9ybWF0KG1lc3NhZ2UsIGFyZ3MsIHByZXR0aWZ5KSxcbiAgICAgICAgYXJncy5leHBlY3RlZCxcbiAgICAgICAgYXJncy5hY3R1YWwpXG59XG5cbi8vIFRoZSBiYXNpYyBhc3NlcnQsIGxpa2UgYGFzc2VydC5va2AsIGJ1dCBnaXZlcyB5b3UgYW4gb3B0aW9uYWwgbWVzc2FnZS5cbmV4cG9ydHMuYXNzZXJ0ID0gZnVuY3Rpb24gKHRlc3QsIG1lc3NhZ2UpIHtcbiAgICBpZiAoIXRlc3QpIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtZXNzYWdlKVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyogZ2xvYmFsIFByb21pc2UgKi9cblxudmFyIHR5cGUgPSByZXF1aXJlKFwiLi9saWIvdHlwZVwiKVxudmFyIGVxdWFsID0gcmVxdWlyZShcIi4vbGliL2VxdWFsXCIpXG52YXIgdGhyb3dzQXN5bmMgPSByZXF1aXJlKFwiLi9saWIvdGhyb3dzLWFzeW5jXCIpXG52YXIgaGFzID0gcmVxdWlyZShcIi4vbGliL2hhc1wiKVxudmFyIGluY2x1ZGVzID0gcmVxdWlyZShcIi4vbGliL2luY2x1ZGVzXCIpXG52YXIgaGFzS2V5cyA9IHJlcXVpcmUoXCIuL2xpYi9oYXMta2V5c1wiKVxuXG5mdW5jdGlvbiB1bmFyeShtZXRob2QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodmFsdWUpLnRoZW4obWV0aG9kKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gYmluYXJ5KG1ldGhvZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIGV4cGVjdGVkKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodmFsdWUpLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBtZXRob2QodmFsdWUsIGV4cGVjdGVkKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZnVuY3Rpb24gdGVybmFyeShtZXRob2QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBhLCBiKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodmFsdWUpLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBtZXRob2QodmFsdWUsIGEsIGIpXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBvcHRUZXJuYXJ5KG1ldGhvZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBhLCBiKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUob2JqZWN0KS50aGVuKGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgICAgICAgICBtZXRob2Qob2JqZWN0LCBhLCBiKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUob2JqZWN0KS50aGVuKGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgICAgICAgICBtZXRob2Qob2JqZWN0LCBhKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0cy5vayA9IHVuYXJ5KHR5cGUub2spXG5leHBvcnRzLm5vdE9rID0gdW5hcnkodHlwZS5ub3RPaylcbmV4cG9ydHMuaXNCb29sZWFuID0gdW5hcnkodHlwZS5pc0Jvb2xlYW4pXG5leHBvcnRzLm5vdEJvb2xlYW4gPSB1bmFyeSh0eXBlLm5vdEJvb2xlYW4pXG5leHBvcnRzLmlzRnVuY3Rpb24gPSB1bmFyeSh0eXBlLmlzRnVuY3Rpb24pXG5leHBvcnRzLm5vdEZ1bmN0aW9uID0gdW5hcnkodHlwZS5ub3RGdW5jdGlvbilcbmV4cG9ydHMuaXNOdW1iZXIgPSB1bmFyeSh0eXBlLmlzTnVtYmVyKVxuZXhwb3J0cy5ub3ROdW1iZXIgPSB1bmFyeSh0eXBlLm5vdE51bWJlcilcbmV4cG9ydHMuaXNPYmplY3QgPSB1bmFyeSh0eXBlLmlzT2JqZWN0KVxuZXhwb3J0cy5ub3RPYmplY3QgPSB1bmFyeSh0eXBlLm5vdE9iamVjdClcbmV4cG9ydHMuaXNTdHJpbmcgPSB1bmFyeSh0eXBlLmlzU3RyaW5nKVxuZXhwb3J0cy5ub3RTdHJpbmcgPSB1bmFyeSh0eXBlLm5vdFN0cmluZylcbmV4cG9ydHMuaXNTeW1ib2wgPSB1bmFyeSh0eXBlLmlzU3ltYm9sKVxuZXhwb3J0cy5ub3RTeW1ib2wgPSB1bmFyeSh0eXBlLm5vdFN5bWJvbClcbmV4cG9ydHMuZXhpc3RzID0gdW5hcnkodHlwZS5leGlzdHMpXG5leHBvcnRzLm5vdEV4aXN0cyA9IHVuYXJ5KHR5cGUubm90RXhpc3RzKVxuZXhwb3J0cy5pc0FycmF5ID0gdW5hcnkodHlwZS5pc0FycmF5KVxuZXhwb3J0cy5ub3RBcnJheSA9IHVuYXJ5KHR5cGUubm90QXJyYXkpXG5cbmV4cG9ydHMuaXMgPSBmdW5jdGlvbiAoVHlwZSwgb2JqZWN0KSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShvYmplY3QpLnRoZW4oZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICB0eXBlLmlzKFR5cGUsIG9iamVjdClcbiAgICB9KVxufVxuXG5leHBvcnRzLm5vdCA9IGZ1bmN0aW9uIChUeXBlLCBvYmplY3QpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG9iamVjdCkudGhlbihmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgIHR5cGUubm90KFR5cGUsIG9iamVjdClcbiAgICB9KVxufVxuXG5leHBvcnRzLmVxdWFsID0gYmluYXJ5KGVxdWFsLmVxdWFsKVxuZXhwb3J0cy5ub3RFcXVhbCA9IGJpbmFyeShlcXVhbC5ub3RFcXVhbClcbmV4cG9ydHMuZXF1YWxMb29zZSA9IGJpbmFyeShlcXVhbC5lcXVhbExvb3NlKVxuZXhwb3J0cy5ub3RFcXVhbExvb3NlID0gYmluYXJ5KGVxdWFsLm5vdEVxdWFsTG9vc2UpXG5leHBvcnRzLmRlZXBFcXVhbCA9IGJpbmFyeShlcXVhbC5kZWVwRXF1YWwpXG5leHBvcnRzLm5vdERlZXBFcXVhbCA9IGJpbmFyeShlcXVhbC5ub3REZWVwRXF1YWwpXG5leHBvcnRzLm1hdGNoID0gYmluYXJ5KGVxdWFsLm1hdGNoKVxuZXhwb3J0cy5ub3RNYXRjaCA9IGJpbmFyeShlcXVhbC5ub3RNYXRjaClcbmV4cG9ydHMuYXRMZWFzdCA9IGJpbmFyeShlcXVhbC5hdExlYXN0KVxuZXhwb3J0cy5hdE1vc3QgPSBiaW5hcnkoZXF1YWwuYXRNb3N0KVxuZXhwb3J0cy5hYm92ZSA9IGJpbmFyeShlcXVhbC5hYm92ZSlcbmV4cG9ydHMuYmVsb3cgPSBiaW5hcnkoZXF1YWwuYmVsb3cpXG5leHBvcnRzLmJldHdlZW4gPSB0ZXJuYXJ5KGVxdWFsLmJldHdlZW4pXG5leHBvcnRzLmNsb3NlVG8gPSB0ZXJuYXJ5KGVxdWFsLmNsb3NlVG8pXG5leHBvcnRzLm5vdENsb3NlVG8gPSB0ZXJuYXJ5KGVxdWFsLm5vdENsb3NlVG8pXG5cbmV4cG9ydHMudGhyb3dzID0gdGhyb3dzQXN5bmMudGhyb3dzXG5leHBvcnRzLnRocm93c01hdGNoID0gdGhyb3dzQXN5bmMudGhyb3dzTWF0Y2hcblxuZXhwb3J0cy5oYXNPd24gPSBvcHRUZXJuYXJ5KGhhcy5oYXNPd24pXG5leHBvcnRzLm5vdEhhc093biA9IG9wdFRlcm5hcnkoaGFzLm5vdEhhc093bilcbmV4cG9ydHMuaGFzT3duTG9vc2UgPSBvcHRUZXJuYXJ5KGhhcy5oYXNPd25Mb29zZSlcbmV4cG9ydHMubm90SGFzT3duTG9vc2UgPSBvcHRUZXJuYXJ5KGhhcy5ub3RIYXNPd25Mb29zZSlcbmV4cG9ydHMuaGFzS2V5ID0gb3B0VGVybmFyeShoYXMuaGFzS2V5KVxuZXhwb3J0cy5ub3RIYXNLZXkgPSBvcHRUZXJuYXJ5KGhhcy5ub3RIYXNLZXkpXG5leHBvcnRzLmhhc0tleUxvb3NlID0gb3B0VGVybmFyeShoYXMuaGFzS2V5TG9vc2UpXG5leHBvcnRzLm5vdEhhc0tleUxvb3NlID0gb3B0VGVybmFyeShoYXMubm90SGFzS2V5TG9vc2UpXG5leHBvcnRzLmhhcyA9IG9wdFRlcm5hcnkoaGFzLmhhcylcbmV4cG9ydHMubm90SGFzID0gb3B0VGVybmFyeShoYXMubm90SGFzKVxuZXhwb3J0cy5oYXNMb29zZSA9IG9wdFRlcm5hcnkoaGFzLmhhc0xvb3NlKVxuZXhwb3J0cy5ub3RIYXNMb29zZSA9IG9wdFRlcm5hcnkoaGFzLm5vdEhhc0xvb3NlKVxuXG5leHBvcnRzLmluY2x1ZGVzID0gYmluYXJ5KGluY2x1ZGVzLmluY2x1ZGVzKVxuZXhwb3J0cy5pbmNsdWRlc0RlZXAgPSBiaW5hcnkoaW5jbHVkZXMuaW5jbHVkZXNEZWVwKVxuZXhwb3J0cy5pbmNsdWRlc01hdGNoID0gYmluYXJ5KGluY2x1ZGVzLmluY2x1ZGVzTWF0Y2gpXG5leHBvcnRzLmluY2x1ZGVzQW55ID0gYmluYXJ5KGluY2x1ZGVzLmluY2x1ZGVzQW55KVxuZXhwb3J0cy5pbmNsdWRlc0FueURlZXAgPSBiaW5hcnkoaW5jbHVkZXMuaW5jbHVkZXNBbnlEZWVwKVxuZXhwb3J0cy5pbmNsdWRlc0FueU1hdGNoID0gYmluYXJ5KGluY2x1ZGVzLmluY2x1ZGVzQW55TWF0Y2gpXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsID0gYmluYXJ5KGluY2x1ZGVzLm5vdEluY2x1ZGVzQWxsKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbERlZXAgPSBiaW5hcnkoaW5jbHVkZXMubm90SW5jbHVkZXNBbGxEZWVwKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbE1hdGNoID0gYmluYXJ5KGluY2x1ZGVzLm5vdEluY2x1ZGVzQWxsTWF0Y2gpXG5leHBvcnRzLm5vdEluY2x1ZGVzID0gYmluYXJ5KGluY2x1ZGVzLm5vdEluY2x1ZGVzKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0RlZXAgPSBiaW5hcnkoaW5jbHVkZXMubm90SW5jbHVkZXNEZWVwKVxuZXhwb3J0cy5ub3RJbmNsdWRlc01hdGNoID0gYmluYXJ5KGluY2x1ZGVzLm5vdEluY2x1ZGVzTWF0Y2gpXG5cbmV4cG9ydHMuaGFzS2V5cyA9IGJpbmFyeShoYXNLZXlzLmhhc0tleXMpXG5leHBvcnRzLmhhc0tleXNEZWVwID0gYmluYXJ5KGhhc0tleXMuaGFzS2V5c0RlZXApXG5leHBvcnRzLmhhc0tleXNNYXRjaCA9IGJpbmFyeShoYXNLZXlzLmhhc0tleXNNYXRjaClcbmV4cG9ydHMuaGFzS2V5c0FueSA9IGJpbmFyeShoYXNLZXlzLmhhc0tleXNBbnkpXG5leHBvcnRzLmhhc0tleXNBbnlEZWVwID0gYmluYXJ5KGhhc0tleXMuaGFzS2V5c0FueURlZXApXG5leHBvcnRzLmhhc0tleXNBbnlNYXRjaCA9IGJpbmFyeShoYXNLZXlzLmhhc0tleXNBbnlNYXRjaClcbmV4cG9ydHMubm90SGFzS2V5c0FsbCA9IGJpbmFyeShoYXNLZXlzLm5vdEhhc0tleXNBbGwpXG5leHBvcnRzLm5vdEhhc0tleXNBbGxEZWVwID0gYmluYXJ5KGhhc0tleXMubm90SGFzS2V5c0FsbERlZXApXG5leHBvcnRzLm5vdEhhc0tleXNBbGxNYXRjaCA9IGJpbmFyeShoYXNLZXlzLm5vdEhhc0tleXNBbGxNYXRjaClcbmV4cG9ydHMubm90SGFzS2V5cyA9IGJpbmFyeShoYXNLZXlzLm5vdEhhc0tleXMpXG5leHBvcnRzLm5vdEhhc0tleXNEZWVwID0gYmluYXJ5KGhhc0tleXMubm90SGFzS2V5c0RlZXApXG5leHBvcnRzLm5vdEhhc0tleXNNYXRjaCA9IGJpbmFyeShoYXNLZXlzLm5vdEhhc0tleXNNYXRjaClcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8qKlxuICogQ29yZSBUREQtc3R5bGUgYXNzZXJ0aW9ucy4gVGhlc2UgYXJlIGRvbmUgYnkgYSBjb21wb3NpdGlvbiBvZiBEU0xzLCBzaW5jZVxuICogdGhlcmUgaXMgKnNvKiBtdWNoIHJlcGV0aXRpb24uIEFsc28sIHRoaXMgaXMgc3BsaXQgaW50byBzZXZlcmFsIG5hbWVzcGFjZXMgdG9cbiAqIGtlZXAgdGhlIGZpbGUgc2l6ZSBtYW5hZ2VhYmxlLlxuICovXG5cbnZhciB1dGlsID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpXG52YXIgdHlwZSA9IHJlcXVpcmUoXCIuL2xpYi90eXBlXCIpXG52YXIgZXF1YWwgPSByZXF1aXJlKFwiLi9saWIvZXF1YWxcIilcbnZhciB0aHJvd3MgPSByZXF1aXJlKFwiLi9saWIvdGhyb3dzXCIpXG52YXIgaGFzID0gcmVxdWlyZShcIi4vbGliL2hhc1wiKVxudmFyIGluY2x1ZGVzID0gcmVxdWlyZShcIi4vbGliL2luY2x1ZGVzXCIpXG52YXIgaGFzS2V5cyA9IHJlcXVpcmUoXCIuL2xpYi9oYXMta2V5c1wiKVxuXG5leHBvcnRzLkFzc2VydGlvbkVycm9yID0gdXRpbC5Bc3NlcnRpb25FcnJvclxuZXhwb3J0cy5hc3NlcnQgPSB1dGlsLmFzc2VydFxuZXhwb3J0cy5mYWlsID0gdXRpbC5mYWlsXG5cbmV4cG9ydHMub2sgPSB0eXBlLm9rXG5leHBvcnRzLm5vdE9rID0gdHlwZS5ub3RPa1xuZXhwb3J0cy5pc0Jvb2xlYW4gPSB0eXBlLmlzQm9vbGVhblxuZXhwb3J0cy5ub3RCb29sZWFuID0gdHlwZS5ub3RCb29sZWFuXG5leHBvcnRzLmlzRnVuY3Rpb24gPSB0eXBlLmlzRnVuY3Rpb25cbmV4cG9ydHMubm90RnVuY3Rpb24gPSB0eXBlLm5vdEZ1bmN0aW9uXG5leHBvcnRzLmlzTnVtYmVyID0gdHlwZS5pc051bWJlclxuZXhwb3J0cy5ub3ROdW1iZXIgPSB0eXBlLm5vdE51bWJlclxuZXhwb3J0cy5pc09iamVjdCA9IHR5cGUuaXNPYmplY3RcbmV4cG9ydHMubm90T2JqZWN0ID0gdHlwZS5ub3RPYmplY3RcbmV4cG9ydHMuaXNTdHJpbmcgPSB0eXBlLmlzU3RyaW5nXG5leHBvcnRzLm5vdFN0cmluZyA9IHR5cGUubm90U3RyaW5nXG5leHBvcnRzLmlzU3ltYm9sID0gdHlwZS5pc1N5bWJvbFxuZXhwb3J0cy5ub3RTeW1ib2wgPSB0eXBlLm5vdFN5bWJvbFxuZXhwb3J0cy5leGlzdHMgPSB0eXBlLmV4aXN0c1xuZXhwb3J0cy5ub3RFeGlzdHMgPSB0eXBlLm5vdEV4aXN0c1xuZXhwb3J0cy5pc0FycmF5ID0gdHlwZS5pc0FycmF5XG5leHBvcnRzLm5vdEFycmF5ID0gdHlwZS5ub3RBcnJheVxuZXhwb3J0cy5pcyA9IHR5cGUuaXNcbmV4cG9ydHMubm90ID0gdHlwZS5ub3RcblxuZXhwb3J0cy5lcXVhbCA9IGVxdWFsLmVxdWFsXG5leHBvcnRzLm5vdEVxdWFsID0gZXF1YWwubm90RXF1YWxcbmV4cG9ydHMuZXF1YWxMb29zZSA9IGVxdWFsLmVxdWFsTG9vc2VcbmV4cG9ydHMubm90RXF1YWxMb29zZSA9IGVxdWFsLm5vdEVxdWFsTG9vc2VcbmV4cG9ydHMuZGVlcEVxdWFsID0gZXF1YWwuZGVlcEVxdWFsXG5leHBvcnRzLm5vdERlZXBFcXVhbCA9IGVxdWFsLm5vdERlZXBFcXVhbFxuZXhwb3J0cy5tYXRjaCA9IGVxdWFsLm1hdGNoXG5leHBvcnRzLm5vdE1hdGNoID0gZXF1YWwubm90TWF0Y2hcbmV4cG9ydHMuYXRMZWFzdCA9IGVxdWFsLmF0TGVhc3RcbmV4cG9ydHMuYXRNb3N0ID0gZXF1YWwuYXRNb3N0XG5leHBvcnRzLmFib3ZlID0gZXF1YWwuYWJvdmVcbmV4cG9ydHMuYmVsb3cgPSBlcXVhbC5iZWxvd1xuZXhwb3J0cy5iZXR3ZWVuID0gZXF1YWwuYmV0d2VlblxuZXhwb3J0cy5jbG9zZVRvID0gZXF1YWwuY2xvc2VUb1xuZXhwb3J0cy5ub3RDbG9zZVRvID0gZXF1YWwubm90Q2xvc2VUb1xuXG5leHBvcnRzLnRocm93cyA9IHRocm93cy50aHJvd3NcbmV4cG9ydHMudGhyb3dzTWF0Y2ggPSB0aHJvd3MudGhyb3dzTWF0Y2hcblxuZXhwb3J0cy5oYXNPd24gPSBoYXMuaGFzT3duXG5leHBvcnRzLm5vdEhhc093biA9IGhhcy5ub3RIYXNPd25cbmV4cG9ydHMuaGFzT3duTG9vc2UgPSBoYXMuaGFzT3duTG9vc2VcbmV4cG9ydHMubm90SGFzT3duTG9vc2UgPSBoYXMubm90SGFzT3duTG9vc2VcbmV4cG9ydHMuaGFzS2V5ID0gaGFzLmhhc0tleVxuZXhwb3J0cy5ub3RIYXNLZXkgPSBoYXMubm90SGFzS2V5XG5leHBvcnRzLmhhc0tleUxvb3NlID0gaGFzLmhhc0tleUxvb3NlXG5leHBvcnRzLm5vdEhhc0tleUxvb3NlID0gaGFzLm5vdEhhc0tleUxvb3NlXG5leHBvcnRzLmhhcyA9IGhhcy5oYXNcbmV4cG9ydHMubm90SGFzID0gaGFzLm5vdEhhc1xuZXhwb3J0cy5oYXNMb29zZSA9IGhhcy5oYXNMb29zZVxuZXhwb3J0cy5ub3RIYXNMb29zZSA9IGhhcy5ub3RIYXNMb29zZVxuXG4vKipcbiAqIFRoZXJlJ3MgMiBzZXRzIG9mIDEyIHBlcm11dGF0aW9ucyBoZXJlIGZvciBgaW5jbHVkZXNgIGFuZCBgaGFzS2V5c2AsIGluc3RlYWRcbiAqIG9mIE4gc2V0cyBvZiAyICh3aGljaCB3b3VsZCBmaXQgdGhlIGBmb29gL2Bub3RGb29gIGlkaW9tIGJldHRlciksIHNvIGl0J3NcbiAqIGVhc2llciB0byBqdXN0IG1ha2UgYSBjb3VwbGUgc2VwYXJhdGUgRFNMcyBhbmQgdXNlIHRoYXQgdG8gZGVmaW5lIGV2ZXJ5dGhpbmcuXG4gKlxuICogSGVyZSdzIHRoZSB0b3AgbGV2ZWw6XG4gKlxuICogLSBzaGFsbG93XG4gKiAtIHN0cmljdCBkZWVwXG4gKiAtIHN0cnVjdHVyYWwgZGVlcFxuICpcbiAqIEFuZCB0aGUgc2Vjb25kIGxldmVsOlxuICpcbiAqIC0gaW5jbHVkZXMgYWxsL25vdCBtaXNzaW5nIHNvbWVcbiAqIC0gaW5jbHVkZXMgc29tZS9ub3QgbWlzc2luZyBhbGxcbiAqIC0gbm90IGluY2x1ZGluZyBhbGwvbWlzc2luZyBzb21lXG4gKiAtIG5vdCBpbmNsdWRpbmcgc29tZS9taXNzaW5nIGFsbFxuICpcbiAqIEhlcmUncyBhbiBleGFtcGxlIHVzaW5nIHRoZSBuYW1pbmcgc2NoZW1lIGZvciBgaGFzS2V5cypgXG4gKlxuICogICAgICAgICAgICAgICB8ICAgICBzaGFsbG93ICAgICB8ICAgIHN0cmljdCBkZWVwICAgICAgfCAgIHN0cnVjdHVyYWwgZGVlcFxuICogLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIGluY2x1ZGVzIGFsbCAgfCBgaGFzS2V5c2AgICAgICAgfCBgaGFzS2V5c0RlZXBgICAgICAgIHwgYGhhc0tleXNNYXRjaGBcbiAqIGluY2x1ZGVzIHNvbWUgfCBgaGFzS2V5c0FueWAgICAgfCBgaGFzS2V5c0FueURlZXBgICAgIHwgYGhhc0tleXNBbnlNYXRjaGBcbiAqIG1pc3Npbmcgc29tZSAgfCBgbm90SGFzS2V5c0FsbGAgfCBgbm90SGFzS2V5c0FsbERlZXBgIHwgYG5vdEhhc0tleXNBbGxNYXRjaGBcbiAqIG1pc3NpbmcgYWxsICAgfCBgbm90SGFzS2V5c2AgICAgfCBgbm90SGFzS2V5c0RlZXBgICAgIHwgYG5vdEhhc0tleXNNYXRjaGBcbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGBoYXNLZXlzYCBzaGFsbG93IGNvbXBhcmlzb24gdmFyaWFudHMgYXJlIGFsc28gb3ZlcmxvYWRlZCB0b1xuICogY29uc3VtZSBlaXRoZXIgYW4gYXJyYXkgKGluIHdoaWNoIGl0IHNpbXBseSBjaGVja3MgYWdhaW5zdCBhIGxpc3Qgb2Yga2V5cykgb3JcbiAqIGFuIG9iamVjdCAod2hlcmUgaXQgZG9lcyBhIGZ1bGwgZGVlcCBjb21wYXJpc29uKS5cbiAqL1xuXG5leHBvcnRzLmluY2x1ZGVzID0gaW5jbHVkZXMuaW5jbHVkZXNcbmV4cG9ydHMuaW5jbHVkZXNEZWVwID0gaW5jbHVkZXMuaW5jbHVkZXNEZWVwXG5leHBvcnRzLmluY2x1ZGVzTWF0Y2ggPSBpbmNsdWRlcy5pbmNsdWRlc01hdGNoXG5leHBvcnRzLmluY2x1ZGVzQW55ID0gaW5jbHVkZXMuaW5jbHVkZXNBbnlcbmV4cG9ydHMuaW5jbHVkZXNBbnlEZWVwID0gaW5jbHVkZXMuaW5jbHVkZXNBbnlEZWVwXG5leHBvcnRzLmluY2x1ZGVzQW55TWF0Y2ggPSBpbmNsdWRlcy5pbmNsdWRlc0FueU1hdGNoXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsID0gaW5jbHVkZXMubm90SW5jbHVkZXNBbGxcbmV4cG9ydHMubm90SW5jbHVkZXNBbGxEZWVwID0gaW5jbHVkZXMubm90SW5jbHVkZXNBbGxEZWVwXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsTWF0Y2ggPSBpbmNsdWRlcy5ub3RJbmNsdWRlc0FsbE1hdGNoXG5leHBvcnRzLm5vdEluY2x1ZGVzID0gaW5jbHVkZXMubm90SW5jbHVkZXNcbmV4cG9ydHMubm90SW5jbHVkZXNEZWVwID0gaW5jbHVkZXMubm90SW5jbHVkZXNEZWVwXG5leHBvcnRzLm5vdEluY2x1ZGVzTWF0Y2ggPSBpbmNsdWRlcy5ub3RJbmNsdWRlc01hdGNoXG5cbmV4cG9ydHMuaGFzS2V5cyA9IGhhc0tleXMuaGFzS2V5c1xuZXhwb3J0cy5oYXNLZXlzRGVlcCA9IGhhc0tleXMuaGFzS2V5c0RlZXBcbmV4cG9ydHMuaGFzS2V5c01hdGNoID0gaGFzS2V5cy5oYXNLZXlzTWF0Y2hcbmV4cG9ydHMuaGFzS2V5c0FueSA9IGhhc0tleXMuaGFzS2V5c0FueVxuZXhwb3J0cy5oYXNLZXlzQW55RGVlcCA9IGhhc0tleXMuaGFzS2V5c0FueURlZXBcbmV4cG9ydHMuaGFzS2V5c0FueU1hdGNoID0gaGFzS2V5cy5oYXNLZXlzQW55TWF0Y2hcbmV4cG9ydHMubm90SGFzS2V5c0FsbCA9IGhhc0tleXMubm90SGFzS2V5c0FsbFxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsRGVlcCA9IGhhc0tleXMubm90SGFzS2V5c0FsbERlZXBcbmV4cG9ydHMubm90SGFzS2V5c0FsbE1hdGNoID0gaGFzS2V5cy5ub3RIYXNLZXlzQWxsTWF0Y2hcbmV4cG9ydHMubm90SGFzS2V5cyA9IGhhc0tleXMubm90SGFzS2V5c1xuZXhwb3J0cy5ub3RIYXNLZXlzRGVlcCA9IGhhc0tleXMubm90SGFzS2V5c0RlZXBcbmV4cG9ydHMubm90SGFzS2V5c01hdGNoID0gaGFzS2V5cy5ub3RIYXNLZXlzTWF0Y2hcblxuZXhwb3J0cy5hc3luYyA9IHJlcXVpcmUoXCIuL2FzeW5jXCIpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWF0Y2ggPSByZXF1aXJlKFwiY2xlYW4tbWF0Y2hcIilcbnZhciB1dGlsID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpXG5cbmZ1bmN0aW9uIGJpbmFyeShudW1lcmljLCBjb21wYXJhdG9yLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gICAgICAgIGlmIChudW1lcmljKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYWN0dWFsYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXhwZWN0ZWQgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGV4cGVjdGVkYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNvbXBhcmF0b3IoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICAgICAgICAgIHV0aWwuZmFpbChtZXNzYWdlLCB7YWN0dWFsOiBhY3R1YWwsIGV4cGVjdGVkOiBleHBlY3RlZH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydHMuZXF1YWwgPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIHV0aWwuc3RyaWN0SXMoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGVxdWFsIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5ub3RFcXVhbCA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gIXV0aWwuc3RyaWN0SXMoYSwgYikgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuZXF1YWxMb29zZSA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gdXRpbC5sb29zZUlzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBsb29zZWx5IGVxdWFsIHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5ub3RFcXVhbExvb3NlID0gYmluYXJ5KGZhbHNlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiAhdXRpbC5sb29zZUlzKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbG9vc2VseSBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYXRMZWFzdCA9IGJpbmFyeSh0cnVlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID49IGIgfSxcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGF0IGxlYXN0IHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5hdE1vc3QgPSBiaW5hcnkodHJ1ZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYSA8PSBiIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhdCBtb3N0IHtleHBlY3RlZH1cIilcblxuZXhwb3J0cy5hYm92ZSA9IGJpbmFyeSh0cnVlLFxuICAgIGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhID4gYiB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYWJvdmUge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLmJlbG93ID0gYmluYXJ5KHRydWUsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEgPCBiIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBiZWxvdyB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMuYmV0d2VlbiA9IGZ1bmN0aW9uIChhY3R1YWwsIGxvd2VyLCB1cHBlcikge1xuICAgIGlmICh0eXBlb2YgYWN0dWFsICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYWN0dWFsYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBsb3dlciAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGxvd2VyYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB1cHBlciAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYHVwcGVyYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgLy8gVGhlIG5lZ2F0aW9uIGlzIHRvIGFkZHJlc3MgTmFOcyBhcyB3ZWxsLCB3aXRob3V0IHdyaXRpbmcgYSB0b24gb2Ygc3BlY2lhbFxuICAgIC8vIGNhc2UgYm9pbGVycGxhdGVcbiAgICBpZiAoIShhY3R1YWwgPj0gbG93ZXIgJiYgYWN0dWFsIDw9IHVwcGVyKSkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBiZXR3ZWVuIHtsb3dlcn0gYW5kIHt1cHBlcn1cIiwge1xuICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgICAgICAgICBsb3dlcjogbG93ZXIsXG4gICAgICAgICAgICB1cHBlcjogdXBwZXIsXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmRlZXBFcXVhbCA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gbWF0Y2guc3RyaWN0KGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBkZWVwbHkgZXF1YWwge2V4cGVjdGVkfVwiKVxuXG5leHBvcnRzLm5vdERlZXBFcXVhbCA9IGJpbmFyeShmYWxzZSxcbiAgICBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gIW1hdGNoLnN0cmljdChhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGRlZXBseSBlcXVhbCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubWF0Y2ggPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIG1hdGNoLmxvb3NlKGEsIGIpIH0sXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCB7ZXhwZWN0ZWR9XCIpXG5cbmV4cG9ydHMubm90TWF0Y2ggPSBiaW5hcnkoZmFsc2UsXG4gICAgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuICFtYXRjaC5sb29zZShhLCBiKSB9LFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIHtleHBlY3RlZH1cIilcblxuLy8gVXNlcyBkaXZpc2lvbiB0byBhbGxvdyBmb3IgYSBtb3JlIHJvYnVzdCBjb21wYXJpc29uIG9mIGZsb2F0cy4gQWxzbywgdGhpc1xuLy8gaGFuZGxlcyBuZWFyLXplcm8gY29tcGFyaXNvbnMgY29ycmVjdGx5LCBhcyB3ZWxsIGFzIGEgemVybyB0b2xlcmFuY2UgKGkuZS5cbi8vIGV4YWN0IGNvbXBhcmlzb24pLlxuZnVuY3Rpb24gY2xvc2VUbyhleHBlY3RlZCwgYWN0dWFsLCB0b2xlcmFuY2UpIHtcbiAgICBpZiAodG9sZXJhbmNlID09PSBJbmZpbml0eSB8fCBhY3R1YWwgPT09IGV4cGVjdGVkKSByZXR1cm4gdHJ1ZVxuICAgIGlmICh0b2xlcmFuY2UgPT09IDApIHJldHVybiBmYWxzZVxuICAgIGlmIChhY3R1YWwgPT09IDApIHJldHVybiBNYXRoLmFicyhleHBlY3RlZCkgPCB0b2xlcmFuY2VcbiAgICBpZiAoZXhwZWN0ZWQgPT09IDApIHJldHVybiBNYXRoLmFicyhhY3R1YWwpIDwgdG9sZXJhbmNlXG4gICAgcmV0dXJuIE1hdGguYWJzKGV4cGVjdGVkIC8gYWN0dWFsIC0gMSkgPCB0b2xlcmFuY2Vcbn1cblxuLy8gTm90ZTogdGhlc2UgdHdvIGFsd2F5cyBmYWlsIHdoZW4gZGVhbGluZyB3aXRoIE5hTnMuXG5leHBvcnRzLmNsb3NlVG8gPSBmdW5jdGlvbiAoZXhwZWN0ZWQsIGFjdHVhbCwgdG9sZXJhbmNlKSB7XG4gICAgaWYgKHR5cGVvZiBhY3R1YWwgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBhY3R1YWxgIG11c3QgYmUgYSBudW1iZXJcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGV4cGVjdGVkICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgZXhwZWN0ZWRgIG11c3QgYmUgYSBudW1iZXJcIilcbiAgICB9XG5cbiAgICBpZiAodG9sZXJhbmNlID09IG51bGwpIHRvbGVyYW5jZSA9IDFlLTEwXG5cbiAgICBpZiAodHlwZW9mIHRvbGVyYW5jZSAhPT0gXCJudW1iZXJcIiB8fCB0b2xlcmFuY2UgPCAwKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICBcImB0b2xlcmFuY2VgIG11c3QgYmUgYSBub24tbmVnYXRpdmUgbnVtYmVyIGlmIGdpdmVuXCIpXG4gICAgfVxuXG4gICAgaWYgKGFjdHVhbCAhPT0gYWN0dWFsIHx8IGV4cGVjdGVkICE9PSBleHBlY3RlZCB8fCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZSwgbWF4LWxlblxuICAgICAgICAgICAgIWNsb3NlVG8oZXhwZWN0ZWQsIGFjdHVhbCwgdG9sZXJhbmNlKSkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBjbG9zZSB0byB7ZXhwZWN0ZWR9XCIsIHtcbiAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RDbG9zZVRvID0gZnVuY3Rpb24gKGV4cGVjdGVkLCBhY3R1YWwsIHRvbGVyYW5jZSkge1xuICAgIGlmICh0eXBlb2YgYWN0dWFsICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgYWN0dWFsYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBleHBlY3RlZCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGV4cGVjdGVkYCBtdXN0IGJlIGEgbnVtYmVyXCIpXG4gICAgfVxuXG4gICAgaWYgKHRvbGVyYW5jZSA9PSBudWxsKSB0b2xlcmFuY2UgPSAxZS0xMFxuXG4gICAgaWYgKHR5cGVvZiB0b2xlcmFuY2UgIT09IFwibnVtYmVyXCIgfHwgdG9sZXJhbmNlIDwgMCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJgdG9sZXJhbmNlYCBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIG51bWJlciBpZiBnaXZlblwiKVxuICAgIH1cblxuICAgIGlmIChleHBlY3RlZCAhPT0gZXhwZWN0ZWQgfHwgYWN0dWFsICE9PSBhY3R1YWwgfHwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmUsIG1heC1sZW5cbiAgICAgICAgICAgIGNsb3NlVG8oZXhwZWN0ZWQsIGFjdHVhbCwgdG9sZXJhbmNlKSkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgY2xvc2UgdG8ge2V4cGVjdGVkfVwiLCB7XG4gICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWF0Y2ggPSByZXF1aXJlKFwiY2xlYW4tbWF0Y2hcIilcbnZhciB1dGlsID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG5mdW5jdGlvbiBoYXNLZXlzKGFsbCwgb2JqZWN0LCBrZXlzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB0ZXN0ID0gaGFzT3duLmNhbGwob2JqZWN0LCBrZXlzW2ldKVxuXG4gICAgICAgIGlmICh0ZXN0ICE9PSBhbGwpIHJldHVybiAhYWxsXG4gICAgfVxuXG4gICAgcmV0dXJuIGFsbFxufVxuXG5mdW5jdGlvbiBoYXNWYWx1ZXMoZnVuYywgYWxsLCBvYmplY3QsIGtleXMpIHtcbiAgICBpZiAob2JqZWN0ID09PSBrZXlzKSByZXR1cm4gdHJ1ZVxuICAgIHZhciBsaXN0ID0gT2JqZWN0LmtleXMoa2V5cylcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0gbGlzdFtpXVxuICAgICAgICB2YXIgdGVzdCA9IGhhc093bi5jYWxsKG9iamVjdCwga2V5KSAmJiBmdW5jKGtleXNba2V5XSwgb2JqZWN0W2tleV0pXG5cbiAgICAgICAgaWYgKHRlc3QgIT09IGFsbCkgcmV0dXJuIHRlc3RcbiAgICB9XG5cbiAgICByZXR1cm4gYWxsXG59XG5cbmZ1bmN0aW9uIG1ha2VIYXNPdmVybG9hZChhbGwsIGludmVydCwgbWVzc2FnZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXlzKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiIHx8IG9iamVjdCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9iamVjdGAgbXVzdCBiZSBhbiBvYmplY3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Yga2V5cyAhPT0gXCJvYmplY3RcIiB8fCBrZXlzID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJga2V5c2AgbXVzdCBiZSBhbiBvYmplY3Qgb3IgYXJyYXlcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleXMpKSB7XG4gICAgICAgICAgICBpZiAoa2V5cy5sZW5ndGggJiYgaGFzS2V5cyhhbGwsIG9iamVjdCwga2V5cykgPT09IGludmVydCkge1xuICAgICAgICAgICAgICAgIHV0aWwuZmFpbChtZXNzYWdlLCB7YWN0dWFsOiBvYmplY3QsIGtleXM6IGtleXN9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKE9iamVjdC5rZXlzKGtleXMpLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGhhc1ZhbHVlcyh1dGlsLnN0cmljdElzLCBhbGwsIG9iamVjdCwga2V5cykgPT09IGludmVydCkge1xuICAgICAgICAgICAgICAgIHV0aWwuZmFpbChtZXNzYWdlLCB7YWN0dWFsOiBvYmplY3QsIGtleXM6IGtleXN9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBtYWtlSGFzS2V5cyhmdW5jLCBhbGwsIGludmVydCwgbWVzc2FnZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXlzKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiIHx8IG9iamVjdCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYG9iamVjdGAgbXVzdCBiZSBhbiBvYmplY3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Yga2V5cyAhPT0gXCJvYmplY3RcIiB8fCBrZXlzID09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJga2V5c2AgbXVzdCBiZSBhbiBvYmplY3RcIilcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGV4Y2x1c2l2ZSBvciB0byBpbnZlcnQgdGhlIHJlc3VsdCBpZiBgaW52ZXJ0YCBpcyB0cnVlXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhrZXlzKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChoYXNWYWx1ZXMoZnVuYywgYWxsLCBvYmplY3QsIGtleXMpID09PSBpbnZlcnQpIHtcbiAgICAgICAgICAgICAgICB1dGlsLmZhaWwobWVzc2FnZSwge2FjdHVhbDogb2JqZWN0LCBrZXlzOiBrZXlzfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xuXG5leHBvcnRzLmhhc0tleXMgPSBtYWtlSGFzT3ZlcmxvYWQodHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMuaGFzS2V5c0RlZXAgPSBtYWtlSGFzS2V5cyhtYXRjaC5zdHJpY3QsIHRydWUsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLmhhc0tleXNNYXRjaCA9IG1ha2VIYXNLZXlzKG1hdGNoLmxvb3NlLCB0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbGwga2V5cyBpbiB7a2V5c31cIilcbmV4cG9ydHMuaGFzS2V5c0FueSA9IG1ha2VIYXNPdmVybG9hZChmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gaGF2ZSBhbnkga2V5IGluIHtrZXlzfVwiKVxuZXhwb3J0cy5oYXNLZXlzQW55RGVlcCA9IG1ha2VIYXNLZXlzKG1hdGNoLnN0cmljdCwgZmFsc2UsIGZhbHNlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcbmV4cG9ydHMuaGFzS2V5c0FueU1hdGNoID0gbWFrZUhhc0tleXMobWF0Y2gubG9vc2UsIGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbnkga2V5IGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsID0gbWFrZUhhc092ZXJsb2FkKHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXNBbGxEZWVwID0gbWFrZUhhc0tleXMobWF0Y2guc3RyaWN0LCB0cnVlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFsbCBrZXlzIGluIHtrZXlzfVwiKVxuZXhwb3J0cy5ub3RIYXNLZXlzQWxsTWF0Y2ggPSBtYWtlSGFzS2V5cyhtYXRjaC5sb29zZSwgdHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYWxsIGtleXMgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXMgPSBtYWtlSGFzT3ZlcmxvYWQoZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgYW55IGtleSBpbiB7a2V5c31cIilcbmV4cG9ydHMubm90SGFzS2V5c0RlZXAgPSBtYWtlSGFzS2V5cyhtYXRjaC5zdHJpY3QsIGZhbHNlLCB0cnVlLCBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGFueSBrZXkgaW4ge2tleXN9XCIpXG5leHBvcnRzLm5vdEhhc0tleXNNYXRjaCA9IG1ha2VIYXNLZXlzKG1hdGNoLmxvb3NlLCBmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYW55IGtleSBpbiB7a2V5c31cIilcbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciB1dGlsID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpXG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuXG5mdW5jdGlvbiBoYXMoXykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW4sIG1heC1wYXJhbXNcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICBpZiAoIV8uaGFzKG9iamVjdCwga2V5KSB8fFxuICAgICAgICAgICAgICAgICAgICAhdXRpbC5zdHJpY3RJcyhfLmdldChvYmplY3QsIGtleSksIHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHV0aWwuZmFpbChfLm1lc3NhZ2VzWzBdLCB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIV8uaGFzKG9iamVjdCwga2V5KSkge1xuICAgICAgICAgICAgdXRpbC5mYWlsKF8ubWVzc2FnZXNbMV0sIHtcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogdmFsdWUsXG4gICAgICAgICAgICAgICAgYWN0dWFsOiBvYmplY3Rba2V5XSxcbiAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICBvYmplY3Q6IG9iamVjdCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGhhc0xvb3NlKF8pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoIV8uaGFzKG9iamVjdCwga2V5KSB8fCAhdXRpbC5sb29zZUlzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwoXy5tZXNzYWdlc1swXSwge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gbm90SGFzKF8pIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuLCBtYXgtcGFyYW1zXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgaWYgKF8uaGFzKG9iamVjdCwga2V5KSAmJlxuICAgICAgICAgICAgICAgICAgICB1dGlsLnN0cmljdElzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdXRpbC5mYWlsKF8ubWVzc2FnZXNbMl0sIHtcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChfLmhhcyhvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIHV0aWwuZmFpbChfLm1lc3NhZ2VzWzNdLCB7XG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IHZhbHVlLFxuICAgICAgICAgICAgICAgIGFjdHVhbDogb2JqZWN0W2tleV0sXG4gICAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgICAgb2JqZWN0OiBvYmplY3QsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBub3RIYXNMb29zZShfKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LWxlbiwgbWF4LXBhcmFtc1xuICAgIHJldHVybiBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgICAgIGlmIChfLmhhcyhvYmplY3QsIGtleSkgJiYgdXRpbC5sb29zZUlzKF8uZ2V0KG9iamVjdCwga2V5KSwgdmFsdWUpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwoXy5tZXNzYWdlc1syXSwge1xuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICBhY3R1YWw6IG9iamVjdFtrZXldLFxuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaGFzT3duS2V5KG9iamVjdCwga2V5KSB7IHJldHVybiBoYXNPd24uY2FsbChvYmplY3QsIGtleSkgfVxuZnVuY3Rpb24gaGFzSW5LZXkob2JqZWN0LCBrZXkpIHsgcmV0dXJuIGtleSBpbiBvYmplY3QgfVxuZnVuY3Rpb24gaGFzSW5Db2xsKG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3QuaGFzKGtleSkgfVxuZnVuY3Rpb24gaGFzT2JqZWN0R2V0KG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3Rba2V5XSB9XG5mdW5jdGlvbiBoYXNDb2xsR2V0KG9iamVjdCwga2V5KSB7IHJldHVybiBvYmplY3QuZ2V0KGtleSkgfVxuXG5mdW5jdGlvbiBjcmVhdGVIYXMoaGFzLCBnZXQsIG1lc3NhZ2VzKSB7XG4gICAgcmV0dXJuIHtoYXM6IGhhcywgZ2V0OiBnZXQsIG1lc3NhZ2VzOiBtZXNzYWdlc31cbn1cblxudmFyIGhhc093bk1ldGhvZHMgPSBjcmVhdGVIYXMoaGFzT3duS2V5LCBoYXNPYmplY3RHZXQsIFtcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUgb3duIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIG93biBrZXkge2V4cGVjdGVkfVwiLFxuICAgIFwiRXhwZWN0ZWQge29iamVjdH0gdG8gbm90IGhhdmUgb3duIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUgb3duIGtleSB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG52YXIgaGFzS2V5TWV0aG9kcyA9IGNyZWF0ZUhhcyhoYXNJbktleSwgaGFzT2JqZWN0R2V0LCBbXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtbGVuXG4gICAgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG4gICAgXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgaGF2ZSBrZXkge2tleX0gZXF1YWwgdG8ge2FjdHVhbH1cIixcbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBoYXZlIGtleSB7ZXhwZWN0ZWR9XCIsXG5dKVxuXG52YXIgaGFzTWV0aG9kcyA9IGNyZWF0ZUhhcyhoYXNJbkNvbGwsIGhhc0NvbGxHZXQsIFtcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGhhdmUga2V5IHtrZXl9IGVxdWFsIHRvIHtleHBlY3RlZH0sIGJ1dCBmb3VuZCB7YWN0dWFsfVwiLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1sZW5cbiAgICBcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGhhdmUga2V5IHtleHBlY3RlZH1cIixcbiAgICBcIkV4cGVjdGVkIHtvYmplY3R9IHRvIG5vdCBoYXZlIGtleSB7a2V5fSBlcXVhbCB0byB7YWN0dWFsfVwiLFxuICAgIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGhhdmUga2V5IHtleHBlY3RlZH1cIixcbl0pXG5cbmV4cG9ydHMuaGFzT3duID0gaGFzKGhhc093bk1ldGhvZHMpXG5leHBvcnRzLm5vdEhhc093biA9IG5vdEhhcyhoYXNPd25NZXRob2RzKVxuZXhwb3J0cy5oYXNPd25Mb29zZSA9IGhhc0xvb3NlKGhhc093bk1ldGhvZHMpXG5leHBvcnRzLm5vdEhhc093bkxvb3NlID0gbm90SGFzTG9vc2UoaGFzT3duTWV0aG9kcylcblxuZXhwb3J0cy5oYXNLZXkgPSBoYXMoaGFzS2V5TWV0aG9kcylcbmV4cG9ydHMubm90SGFzS2V5ID0gbm90SGFzKGhhc0tleU1ldGhvZHMpXG5leHBvcnRzLmhhc0tleUxvb3NlID0gaGFzTG9vc2UoaGFzS2V5TWV0aG9kcylcbmV4cG9ydHMubm90SGFzS2V5TG9vc2UgPSBub3RIYXNMb29zZShoYXNLZXlNZXRob2RzKVxuXG5leHBvcnRzLmhhcyA9IGhhcyhoYXNNZXRob2RzKVxuZXhwb3J0cy5ub3RIYXMgPSBub3RIYXMoaGFzTWV0aG9kcylcbmV4cG9ydHMuaGFzTG9vc2UgPSBoYXNMb29zZShoYXNNZXRob2RzKVxuZXhwb3J0cy5ub3RIYXNMb29zZSA9IG5vdEhhc0xvb3NlKGhhc01ldGhvZHMpXG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgbWF0Y2ggPSByZXF1aXJlKFwiY2xlYW4tbWF0Y2hcIilcbnZhciB1dGlsID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpXG5cbmZ1bmN0aW9uIGluY2x1ZGVzKGZ1bmMsIGFsbCwgYXJyYXksIHZhbHVlcykge1xuICAgIC8vIENoZWFwIGNhc2VzIGZpcnN0XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGFycmF5KSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKGFycmF5ID09PSB2YWx1ZXMpIHJldHVybiB0cnVlXG4gICAgaWYgKGFsbCAmJiBhcnJheS5sZW5ndGggPCB2YWx1ZXMubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlc1tpXVxuICAgICAgICB2YXIgdGVzdCA9IGZhbHNlXG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBhcnJheS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGZ1bmModmFsdWUsIGFycmF5W2pdKSkge1xuICAgICAgICAgICAgICAgIHRlc3QgPSB0cnVlXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0ZXN0ICE9PSBhbGwpIHJldHVybiB0ZXN0XG4gICAgfVxuXG4gICAgcmV0dXJuIGFsbFxufVxuXG5mdW5jdGlvbiBkZWZpbmVJbmNsdWRlcyhmdW5jLCBhbGwsIGludmVydCwgbWVzc2FnZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYXJyYXksIHZhbHVlcykge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGFycmF5YCBtdXN0IGJlIGFuIGFycmF5XCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWVzKSkgdmFsdWVzID0gW3ZhbHVlc11cblxuICAgICAgICBpZiAodmFsdWVzLmxlbmd0aCAmJiBpbmNsdWRlcyhmdW5jLCBhbGwsIGFycmF5LCB2YWx1ZXMpID09PSBpbnZlcnQpIHtcbiAgICAgICAgICAgIHV0aWwuZmFpbChtZXNzYWdlLCB7YWN0dWFsOiBhcnJheSwgdmFsdWVzOiB2YWx1ZXN9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5cbmV4cG9ydHMuaW5jbHVkZXMgPSBkZWZpbmVJbmNsdWRlcyh1dGlsLnN0cmljdElzLCB0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNEZWVwID0gZGVmaW5lSW5jbHVkZXMobWF0Y2guc3RyaWN0LCB0cnVlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLmluY2x1ZGVzTWF0Y2ggPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5sb29zZSwgdHJ1ZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5pbmNsdWRlc0FueSA9IGRlZmluZUluY2x1ZGVzKHV0aWwuc3RyaWN0SXMsIGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBoYXZlIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5pbmNsdWRlc0FueURlZXAgPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5zdHJpY3QsIGZhbHNlLCBmYWxzZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBtYXRjaCBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMuaW5jbHVkZXNBbnlNYXRjaCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLmxvb3NlLCBmYWxzZSwgZmFsc2UsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsID0gZGVmaW5lSW5jbHVkZXModXRpbC5zdHJpY3RJcywgdHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbGwgdmFsdWVzIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzQWxsRGVlcCA9IGRlZmluZUluY2x1ZGVzKG1hdGNoLnN0cmljdCwgdHJ1ZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYWxsIHZhbHVlcyBpbiB7dmFsdWVzfVwiKVxuZXhwb3J0cy5ub3RJbmNsdWRlc0FsbE1hdGNoID0gZGVmaW5lSW5jbHVkZXMobWF0Y2gubG9vc2UsIHRydWUsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFsbCB2YWx1ZXMgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMubm90SW5jbHVkZXMgPSBkZWZpbmVJbmNsdWRlcyh1dGlsLnN0cmljdElzLCBmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgaGF2ZSBhbnkgdmFsdWUgaW4ge3ZhbHVlc31cIilcbmV4cG9ydHMubm90SW5jbHVkZXNEZWVwID0gZGVmaW5lSW5jbHVkZXMobWF0Y2guc3RyaWN0LCBmYWxzZSwgdHJ1ZSwgXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgbWF0Y2ggYW55IHZhbHVlIGluIHt2YWx1ZXN9XCIpXG5leHBvcnRzLm5vdEluY2x1ZGVzTWF0Y2ggPSBkZWZpbmVJbmNsdWRlcyhtYXRjaC5sb29zZSwgZmFsc2UsIHRydWUsIFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IG1hdGNoIGFueSB2YWx1ZSBpbiB7dmFsdWVzfVwiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLyogZ2xvYmFsIFByb21pc2UgKi9cblxudmFyIHV0aWwgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0LXV0aWxcIilcbnZhciBjb21tb24gPSByZXF1aXJlKFwiLi90aHJvd3MtY29tbW9uXCIpXG5cbmV4cG9ydHMudGhyb3dzID0gZnVuY3Rpb24gKFR5cGUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBUeXBlXG4gICAgICAgIFR5cGUgPSBudWxsXG4gICAgfVxuXG4gICAgaWYgKFR5cGUgIT0gbnVsbCAmJiB0eXBlb2YgVHlwZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgVHlwZWAgbXVzdCBiZSBhIGZ1bmN0aW9uIGlmIHBhc3NlZFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGNhbGxiYWNrYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbihjYWxsYmFjaylcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IG5ldyB1dGlsLkFzc2VydGlvbkVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3dcIilcbiAgICB9LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoVHlwZSAhPSBudWxsICYmICEoZSBpbnN0YW5jZW9mIFR5cGUpKSB7XG4gICAgICAgICAgICB1dGlsLmZhaWwoXG4gICAgICAgICAgICAgICAgXCJFeHBlY3RlZCBjYWxsYmFjayB0byB0aHJvdyBhbiBpbnN0YW5jZSBvZiBcIiArXG4gICAgICAgICAgICAgICAgY29tbW9uLmdldE5hbWUoVHlwZSkgKyBcIiwgYnV0IGZvdW5kIHthY3R1YWx9XCIsXG4gICAgICAgICAgICAgICAge2FjdHVhbDogZX0pXG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5leHBvcnRzLnRocm93c01hdGNoID0gZnVuY3Rpb24gKG1hdGNoZXIsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyICE9PSBcInN0cmluZ1wiICYmXG4gICAgICAgICAgICB0eXBlb2YgbWF0Y2hlciAhPT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICAhKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApICYmXG4gICAgICAgICAgICAhY29tbW9uLmlzUGxhaW5PYmplY3QobWF0Y2hlcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAgIFwiYG1hdGNoZXJgIG11c3QgYmUgYSBzdHJpbmcsIGZ1bmN0aW9uLCBSZWdFeHAsIG9yIG9iamVjdFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYGNhbGxiYWNrYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAudGhlbihjYWxsYmFjaylcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IG5ldyB1dGlsLkFzc2VydGlvbkVycm9yKFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gdGhyb3dcIilcbiAgICB9LCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBpZiAoIWNvbW1vbi50aHJvd3NNYXRjaFRlc3QobWF0Y2hlciwgZSkpIHtcbiAgICAgICAgICAgIHV0aWwuZmFpbChcbiAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIGNhbGxiYWNrIHRvICB0aHJvdyBhbiBlcnJvciB0aGF0IG1hdGNoZXMgXCIgK1xuICAgICAgICAgICAgICAgIFwie2V4cGVjdGVkfSwgYnV0IGZvdW5kIHthY3R1YWx9XCIsXG4gICAgICAgICAgICAgICAge2V4cGVjdGVkOiBtYXRjaGVyLCBhY3R1YWw6IGV9KVxuICAgICAgICB9XG4gICAgfSlcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciB1dGlsID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpXG5cbmV4cG9ydHMuZ2V0TmFtZSA9IGZ1bmN0aW9uIChmdW5jKSB7XG4gICAgdmFyIG5hbWUgPSBmdW5jLm5hbWVcblxuICAgIGlmIChuYW1lID09IG51bGwpIG5hbWUgPSBmdW5jLmRpc3BsYXlOYW1lXG4gICAgaWYgKG5hbWUpIHJldHVybiB1dGlsLmVzY2FwZShuYW1lKVxuICAgIHJldHVybiBcIjxhbm9ueW1vdXM+XCJcbn1cblxuZXhwb3J0cy50aHJvd3NNYXRjaFRlc3QgPSBmdW5jdGlvbiAobWF0Y2hlciwgZSkge1xuICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIGUubWVzc2FnZSA9PT0gbWF0Y2hlclxuICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gISFtYXRjaGVyKGUpXG4gICAgaWYgKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiAhIW1hdGNoZXIudGVzdChlLm1lc3NhZ2UpXG5cbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1hdGNoZXIpXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV1cblxuICAgICAgICBpZiAoIShrZXkgaW4gZSkgfHwgIXV0aWwuc3RyaWN0SXMobWF0Y2hlcltrZXldLCBlW2tleV0pKSByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG5leHBvcnRzLmlzUGxhaW5PYmplY3QgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCA9PSBudWxsIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpID09PSBPYmplY3QucHJvdG90eXBlXG59XG4iLCJcInVzZSBzdHJpY3RcIlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJjbGVhbi1hc3NlcnQtdXRpbFwiKVxudmFyIGNvbW1vbiA9IHJlcXVpcmUoXCIuL3Rocm93cy1jb21tb25cIilcblxuZXhwb3J0cy50aHJvd3MgPSBmdW5jdGlvbiAoVHlwZSwgY2FsbGJhY2spIHtcbiAgICBpZiAoY2FsbGJhY2sgPT0gbnVsbCkge1xuICAgICAgICBjYWxsYmFjayA9IFR5cGVcbiAgICAgICAgVHlwZSA9IG51bGxcbiAgICB9XG5cbiAgICBpZiAoVHlwZSAhPSBudWxsICYmIHR5cGVvZiBUeXBlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBUeXBlYCBtdXN0IGJlIGEgZnVuY3Rpb24gaWYgcGFzc2VkXCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgY2FsbGJhY2tgIG11c3QgYmUgYSBmdW5jdGlvblwiKVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIGNhbGxiYWNrKCkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYWxsYmFjay1yZXR1cm5cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmIChUeXBlICE9IG51bGwgJiYgIShlIGluc3RhbmNlb2YgVHlwZSkpIHtcbiAgICAgICAgICAgIHV0aWwuZmFpbChcbiAgICAgICAgICAgICAgICBcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIHRocm93IGFuIGluc3RhbmNlIG9mIFwiICtcbiAgICAgICAgICAgICAgICBjb21tb24uZ2V0TmFtZShUeXBlKSArIFwiLCBidXQgZm91bmQge2FjdHVhbH1cIixcbiAgICAgICAgICAgICAgICB7YWN0dWFsOiBlfSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgdXRpbC5Bc3NlcnRpb25FcnJvcihcIkV4cGVjdGVkIGNhbGxiYWNrIHRvIHRocm93XCIpXG59XG5cbmV4cG9ydHMudGhyb3dzTWF0Y2ggPSBmdW5jdGlvbiAobWF0Y2hlciwgY2FsbGJhY2spIHtcbiAgICBpZiAodHlwZW9mIG1hdGNoZXIgIT09IFwic3RyaW5nXCIgJiZcbiAgICAgICAgICAgIHR5cGVvZiBtYXRjaGVyICE9PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgICAgICEobWF0Y2hlciBpbnN0YW5jZW9mIFJlZ0V4cCkgJiZcbiAgICAgICAgICAgICFjb21tb24uaXNQbGFpbk9iamVjdChtYXRjaGVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgXCJgbWF0Y2hlcmAgbXVzdCBiZSBhIHN0cmluZywgZnVuY3Rpb24sIFJlZ0V4cCwgb3Igb2JqZWN0XCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJgY2FsbGJhY2tgIG11c3QgYmUgYSBmdW5jdGlvblwiKVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIGNhbGxiYWNrKCkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjYWxsYmFjay1yZXR1cm5cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmICghY29tbW9uLnRocm93c01hdGNoVGVzdChtYXRjaGVyLCBlKSkge1xuICAgICAgICAgICAgdXRpbC5mYWlsKFxuICAgICAgICAgICAgICAgIFwiRXhwZWN0ZWQgY2FsbGJhY2sgdG8gIHRocm93IGFuIGVycm9yIHRoYXQgbWF0Y2hlcyBcIiArXG4gICAgICAgICAgICAgICAgXCJ7ZXhwZWN0ZWR9LCBidXQgZm91bmQge2FjdHVhbH1cIixcbiAgICAgICAgICAgICAgICB7ZXhwZWN0ZWQ6IG1hdGNoZXIsIGFjdHVhbDogZX0pXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IHV0aWwuQXNzZXJ0aW9uRXJyb3IoXCJFeHBlY3RlZCBjYWxsYmFjayB0byB0aHJvdy5cIilcbn1cbiIsIlwidXNlIHN0cmljdFwiXG5cbnZhciB1dGlsID0gcmVxdWlyZShcImNsZWFuLWFzc2VydC11dGlsXCIpXG5cbmV4cG9ydHMub2sgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICgheCkgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgdHJ1dGh5XCIsIHthY3R1YWw6IHh9KVxufVxuXG5leHBvcnRzLm5vdE9rID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCkgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgZmFsc3lcIiwge2FjdHVhbDogeH0pXG59XG5cbmV4cG9ydHMuaXNCb29sZWFuID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGEgYm9vbGVhblwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90Qm9vbGVhbiA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBib29sZWFuXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhIGZ1bmN0aW9uXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RGdW5jdGlvbiA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGEgZnVuY3Rpb25cIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmlzTnVtYmVyID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYSBudW1iZXJcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLm5vdE51bWJlciA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBiZSBhIG51bWJlclwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNPYmplY3QgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJvYmplY3RcIiB8fCB4ID09IG51bGwpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gYmUgYW4gb2JqZWN0XCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RPYmplY3QgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJvYmplY3RcIiAmJiB4ICE9IG51bGwpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGFuIG9iamVjdFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNTdHJpbmcgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBiZSBhIHN0cmluZ1wiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90U3RyaW5nID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAodHlwZW9mIHggPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGEgc3RyaW5nXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pc1N5bWJvbCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHR5cGVvZiB4ICE9PSBcInN5bWJvbFwiKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGEgc3ltYm9sXCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RTeW1ib2wgPSBmdW5jdGlvbiAoeCkge1xuICAgIGlmICh0eXBlb2YgeCA9PT0gXCJzeW1ib2xcIikge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBub3QgYmUgYSBzeW1ib2xcIiwge2FjdHVhbDogeH0pXG4gICAgfVxufVxuXG5leHBvcnRzLmV4aXN0cyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7YWN0dWFsfSB0byBleGlzdFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMubm90RXhpc3RzID0gZnVuY3Rpb24gKHgpIHtcbiAgICBpZiAoeCAhPSBudWxsKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIG5vdCBleGlzdFwiLCB7YWN0dWFsOiB4fSlcbiAgICB9XG59XG5cbmV4cG9ydHMuaXNBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHgpKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHthY3R1YWx9IHRvIGJlIGFuIGFycmF5XCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3RBcnJheSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoeCkpIHtcbiAgICAgICAgdXRpbC5mYWlsKFwiRXhwZWN0ZWQge2FjdHVhbH0gdG8gbm90IGJlIGFuIGFycmF5XCIsIHthY3R1YWw6IHh9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5pcyA9IGZ1bmN0aW9uIChUeXBlLCBvYmplY3QpIHtcbiAgICBpZiAodHlwZW9mIFR5cGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYFR5cGVgIG11c3QgYmUgYSBmdW5jdGlvblwiKVxuICAgIH1cblxuICAgIGlmICghKG9iamVjdCBpbnN0YW5jZW9mIFR5cGUpKSB7XG4gICAgICAgIHV0aWwuZmFpbChcIkV4cGVjdGVkIHtvYmplY3R9IHRvIGJlIGFuIGluc3RhbmNlIG9mIHtleHBlY3RlZH1cIiwge1xuICAgICAgICAgICAgZXhwZWN0ZWQ6IFR5cGUsXG4gICAgICAgICAgICBhY3R1YWw6IG9iamVjdC5jb25zdHJ1Y3RvcixcbiAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZXhwb3J0cy5ub3QgPSBmdW5jdGlvbiAoVHlwZSwgb2JqZWN0KSB7XG4gICAgaWYgKHR5cGVvZiBUeXBlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImBUeXBlYCBtdXN0IGJlIGEgZnVuY3Rpb25cIilcbiAgICB9XG5cbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVHlwZSkge1xuICAgICAgICB1dGlsLmZhaWwoXCJFeHBlY3RlZCB7b2JqZWN0fSB0byBub3QgYmUgYW4gaW5zdGFuY2Ugb2Yge2V4cGVjdGVkfVwiLCB7XG4gICAgICAgICAgICBleHBlY3RlZDogVHlwZSxcbiAgICAgICAgICAgIG9iamVjdDogb2JqZWN0LFxuICAgICAgICB9KVxuICAgIH1cbn1cbiIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIGNsZWFuLW1hdGNoXG4gKlxuICogQSBzaW1wbGUsIGZhc3QgRVMyMDE1KyBhd2FyZSBkZWVwIG1hdGNoaW5nIHV0aWxpdHkuXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE2IGFuZCBsYXRlciwgSXNpYWggTWVhZG93cyA8bWVAaXNpYWhtZWFkb3dzLmNvbT4uXG4gKlxuICogUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55XG4gKiBwdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQsIHByb3ZpZGVkIHRoYXQgdGhlIGFib3ZlXG4gKiBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIGFwcGVhciBpbiBhbGwgY29waWVzLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEhcbiAqIFJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxuICogQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxuICogSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NXG4gKiBMT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxuICogT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxuICogUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS5cbiAqL1xuXG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xuOyhmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiICYmIGV4cG9ydHMgIT0gbnVsbCkge1xuICAgICAgICBmYWN0b3J5KGdsb2JhbCwgZXhwb3J0cylcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBkZWZpbmUoXCJjbGVhbi1tYXRjaFwiLCBbXCJleHBvcnRzXCJdLCBmdW5jdGlvbiAoZXhwb3J0cykge1xuICAgICAgICAgICAgZmFjdG9yeShnbG9iYWwsIGV4cG9ydHMpXG4gICAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShnbG9iYWwsIGdsb2JhbC5tYXRjaCA9IHt9KVxuICAgIH1cbn0pKHR5cGVvZiBnbG9iYWwgPT09IFwib2JqZWN0XCIgJiYgZ2xvYmFsICE9PSBudWxsID8gZ2xvYmFsXG4gICAgOiB0eXBlb2Ygc2VsZiA9PT0gXCJvYmplY3RcIiAmJiBzZWxmICE9PSBudWxsID8gc2VsZlxuICAgIDogdHlwZW9mIHdpbmRvdyA9PT0gXCJvYmplY3RcIiAmJiB3aW5kb3cgIT09IG51bGwgPyB3aW5kb3dcbiAgICA6IHRoaXMsXG5mdW5jdGlvbiAoZ2xvYmFsLCBleHBvcnRzKSB7XG4gICAgLyogZXNsaW50LWVuYWJsZSAqL1xuICAgIFwidXNlIHN0cmljdFwiXG5cbiAgICAvKiBnbG9iYWwgU3ltYm9sLCBVaW50OEFycmF5LCBEYXRhVmlldywgQXJyYXlCdWZmZXIsIEFycmF5QnVmZmVyVmlldywgTWFwLFxuICAgIFNldCAqL1xuXG4gICAgLyoqXG4gICAgICogRGVlcCBtYXRjaGluZyBhbGdvcml0aG0sIHdpdGggemVybyBkZXBlbmRlbmNpZXMuIE5vdGUgdGhlIGZvbGxvd2luZzpcbiAgICAgKlxuICAgICAqIC0gVGhpcyBpcyByZWxhdGl2ZWx5IHBlcmZvcm1hbmNlLXR1bmVkLCBhbHRob3VnaCBpdCBwcmVmZXJzIGhpZ2hcbiAgICAgKiAgIGNvcnJlY3RuZXNzLiBQYXRjaCB3aXRoIGNhcmUsIHNpbmNlIHBlcmZvcm1hbmNlIGlzIGEgY29uY2Vybi5cbiAgICAgKiAtIFRoaXMgZG9lcyBwYWNrIGEgKmxvdCogb2YgZmVhdHVyZXMsIHdoaWNoIHNob3VsZCBleHBsYWluIHRoZSBsZW5ndGguXG4gICAgICogLSBTb21lIG9mIHRoZSBkdXBsaWNhdGlvbiBpcyBpbnRlbnRpb25hbC4gSXQncyBnZW5lcmFsbHkgY29tbWVudGVkLCBidXRcbiAgICAgKiAgIGl0J3MgbWFpbmx5IGZvciBwZXJmb3JtYW5jZSwgc2luY2UgdGhlIGVuZ2luZSBuZWVkcyBpdHMgdHlwZSBpbmZvLlxuICAgICAqIC0gUG9seWZpbGxlZCBjb3JlLWpzIFN5bWJvbHMgZnJvbSBjcm9zcy1vcmlnaW4gY29udGV4dHMgd2lsbCBuZXZlclxuICAgICAqICAgcmVnaXN0ZXIgYXMgYmVpbmcgYWN0dWFsIFN5bWJvbHMuXG4gICAgICpcbiAgICAgKiBBbmQgaW4gY2FzZSB5b3UncmUgd29uZGVyaW5nIGFib3V0IHRoZSBsb25nZXIgZnVuY3Rpb25zIGFuZCBvY2Nhc2lvbmFsXG4gICAgICogcmVwZXRpdGlvbiwgaXQncyBiZWNhdXNlIFY4J3MgaW5saW5lciBpc24ndCBhbHdheXMgaW50ZWxsaWdlbnQgZW5vdWdoIHRvXG4gICAgICogZGVhbCB3aXRoIHRoZSBzdXBlciBoaWdobHkgcG9seW1vcnBoaWMgZGF0YSB0aGlzIG9mdGVuIGRlYWxzIHdpdGgsIGFuZCBKU1xuICAgICAqIGRvZXNuJ3QgaGF2ZSBjb21waWxlLXRpbWUgbWFjcm9zLlxuICAgICAqL1xuXG4gICAgdmFyIG9iamVjdFRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuICAgIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG5cbiAgICB2YXIgc3VwcG9ydHNVbmljb2RlID0gaGFzT3duLmNhbGwoUmVnRXhwLnByb3RvdHlwZSwgXCJ1bmljb2RlXCIpXG4gICAgdmFyIHN1cHBvcnRzU3RpY2t5ID0gaGFzT3duLmNhbGwoUmVnRXhwLnByb3RvdHlwZSwgXCJzdGlja3lcIilcblxuICAgIC8vIExlZ2FjeSBlbmdpbmVzIGhhdmUgc2V2ZXJhbCBpc3N1ZXMgd2hlbiBpdCBjb21lcyB0byBgdHlwZW9mYC5cbiAgICB2YXIgaXNGdW5jdGlvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIFNsb3dJc0Z1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgICAgIHZhciB0YWcgPSBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKVxuXG4gICAgICAgICAgICByZXR1cm4gdGFnID09PSBcIltvYmplY3QgRnVuY3Rpb25dXCIgfHxcbiAgICAgICAgICAgICAgICB0YWcgPT09IFwiW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl1cIiB8fFxuICAgICAgICAgICAgICAgIHRhZyA9PT0gXCJbb2JqZWN0IEFzeW5jRnVuY3Rpb25dXCIgfHxcbiAgICAgICAgICAgICAgICB0YWcgPT09IFwiW29iamVjdCBQcm94eV1cIlxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaXNQb2lzb25lZChvYmplY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3QgIT0gbnVsbCAmJiB0eXBlb2Ygb2JqZWN0ICE9PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEluIFNhZmFyaSAxMCwgYHR5cGVvZiBQcm94eSA9PT0gXCJvYmplY3RcImBcbiAgICAgICAgaWYgKGlzUG9pc29uZWQoZ2xvYmFsLlByb3h5KSkgcmV0dXJuIFNsb3dJc0Z1bmN0aW9uXG5cbiAgICAgICAgLy8gSW4gU2FmYXJpIDgsIHNldmVyYWwgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JzIGFyZVxuICAgICAgICAvLyBgdHlwZW9mIEMgPT09IFwib2JqZWN0XCJgXG4gICAgICAgIGlmIChpc1BvaXNvbmVkKGdsb2JhbC5JbnQ4QXJyYXkpKSByZXR1cm4gU2xvd0lzRnVuY3Rpb25cblxuICAgICAgICAvLyBJbiBvbGQgVjgsIFJlZ0V4cHMgYXJlIGNhbGxhYmxlXG4gICAgICAgIGlmICh0eXBlb2YgL3gvID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBTbG93SXNGdW5jdGlvbiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cbiAgICAgICAgLy8gTGVhdmUgdGhpcyBmb3Igbm9ybWFsIHRoaW5ncy4gSXQncyBlYXNpbHkgaW5saW5lZC5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICB9XG4gICAgfSkoKVxuXG4gICAgLy8gU2V0IHVwIG91ciBvd24gYnVmZmVyIGNoZWNrLiBXZSBzaG91bGQgYWx3YXlzIGFjY2VwdCB0aGUgcG9seWZpbGwsIGV2ZW5cbiAgICAvLyBpbiBOb2RlLiBOb3RlIHRoYXQgaXQgdXNlcyBgZ2xvYmFsLkJ1ZmZlcmAgdG8gYXZvaWQgaW5jbHVkaW5nIGBidWZmZXJgIGluXG4gICAgLy8gdGhlIGJ1bmRsZS5cblxuICAgIHZhciBCdWZmZXJOYXRpdmUgPSAwXG4gICAgdmFyIEJ1ZmZlclBvbHlmaWxsID0gMVxuICAgIHZhciBCdWZmZXJTYWZhcmkgPSAyXG5cbiAgICB2YXIgYnVmZmVyU3VwcG9ydCA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIEZha2VCdWZmZXIoKSB7fVxuICAgICAgICBGYWtlQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZSB9XG5cbiAgICAgICAgLy8gT25seSBTYWZhcmkgNS03IGhhcyBldmVyIGhhZCB0aGlzIGlzc3VlLlxuICAgICAgICBpZiAobmV3IEZha2VCdWZmZXIoKS5jb25zdHJ1Y3RvciAhPT0gRmFrZUJ1ZmZlcikgcmV0dXJuIEJ1ZmZlclNhZmFyaVxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oZ2xvYmFsLkJ1ZmZlcikpIHJldHVybiBCdWZmZXJQb2x5ZmlsbFxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcikpIHJldHVybiBCdWZmZXJQb2x5ZmlsbFxuICAgICAgICAvLyBBdm9pZCBnbG9iYWwgcG9seWZpbGxzXG4gICAgICAgIGlmIChnbG9iYWwuQnVmZmVyLmlzQnVmZmVyKG5ldyBGYWtlQnVmZmVyKCkpKSByZXR1cm4gQnVmZmVyUG9seWZpbGxcbiAgICAgICAgcmV0dXJuIEJ1ZmZlck5hdGl2ZVxuICAgIH0pKClcblxuICAgIHZhciBnbG9iYWxJc0J1ZmZlciA9IGJ1ZmZlclN1cHBvcnQgPT09IEJ1ZmZlck5hdGl2ZVxuICAgICAgICA/IGdsb2JhbC5CdWZmZXIuaXNCdWZmZXJcbiAgICAgICAgOiB1bmRlZmluZWRcblxuICAgIGZ1bmN0aW9uIGlzQnVmZmVyKG9iamVjdCkge1xuICAgICAgICBpZiAoYnVmZmVyU3VwcG9ydCA9PT0gQnVmZmVyTmF0aXZlICYmIGdsb2JhbElzQnVmZmVyKG9iamVjdCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAoYnVmZmVyU3VwcG9ydCA9PT0gQnVmZmVyU2FmYXJpICYmIG9iamVjdC5faXNCdWZmZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgQiA9IG9iamVjdC5jb25zdHJ1Y3RvclxuXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihCKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmICghaXNGdW5jdGlvbihCLmlzQnVmZmVyKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIHJldHVybiBCLmlzQnVmZmVyKG9iamVjdClcbiAgICB9XG5cbiAgICAvLyBjb3JlLWpzJyBzeW1ib2xzIGFyZSBvYmplY3RzLCBhbmQgc29tZSBvbGQgdmVyc2lvbnMgb2YgVjggZXJyb25lb3VzbHkgaGFkXG4gICAgLy8gYHR5cGVvZiBTeW1ib2woKSA9PT0gXCJvYmplY3RcImAuXG4gICAgdmFyIHN5bWJvbHNBcmVPYmplY3RzID0gaXNGdW5jdGlvbihnbG9iYWwuU3ltYm9sKSAmJlxuICAgICAgICB0eXBlb2YgU3ltYm9sKCkgPT09IFwib2JqZWN0XCJcblxuICAgIC8vIGBjb250ZXh0YCBpcyBhIGJpdCBmaWVsZCwgd2l0aCB0aGUgZm9sbG93aW5nIGJpdHMuIFRoaXMgaXMgbm90IGFzIG11Y2hcbiAgICAvLyBmb3IgcGVyZm9ybWFuY2UgdGhhbiB0byBqdXN0IHJlZHVjZSB0aGUgbnVtYmVyIG9mIHBhcmFtZXRlcnMgSSBuZWVkIHRvIGJlXG4gICAgLy8gdGhyb3dpbmcgYXJvdW5kLlxuICAgIHZhciBTdHJpY3QgPSAxXG4gICAgdmFyIEluaXRpYWwgPSAyXG4gICAgdmFyIFNhbWVQcm90byA9IDRcblxuICAgIGV4cG9ydHMubG9vc2UgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gbWF0Y2goYSwgYiwgSW5pdGlhbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG4gICAgfVxuXG4gICAgZXhwb3J0cy5zdHJpY3QgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gbWF0Y2goYSwgYiwgU3RyaWN0IHwgSW5pdGlhbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQpXG4gICAgfVxuXG4gICAgLy8gRmVhdHVyZS10ZXN0IGRlbGF5ZWQgc3RhY2sgYWRkaXRpb25zIGFuZCBleHRyYSBrZXlzLiBQaGFudG9tSlMgYW5kIElFXG4gICAgLy8gYm90aCB3YWl0IHVudGlsIHRoZSBlcnJvciB3YXMgYWN0dWFsbHkgdGhyb3duIGZpcnN0LCBhbmQgYXNzaWduIHRoZW0gYXNcbiAgICAvLyBvd24gcHJvcGVydGllcywgd2hpY2ggaXMgdW5oZWxwZnVsIGZvciBhc3NlcnRpb25zLiBUaGlzIHJldHVybnMgYVxuICAgIC8vIGZ1bmN0aW9uIHRvIHNwZWVkIHVwIGNhc2VzIHdoZXJlIGBPYmplY3Qua2V5c2AgaXMgc3VmZmljaWVudCAoZS5nLiBpblxuICAgIC8vIENocm9tZS9GRi9Ob2RlKS5cbiAgICAvL1xuICAgIC8vIFRoaXMgd291bGRuJ3QgYmUgbmVjZXNzYXJ5IGlmIHRob3NlIGVuZ2luZXMgd291bGQgbWFrZSB0aGUgc3RhY2sgYVxuICAgIC8vIGdldHRlciwgYW5kIHJlY29yZCBpdCB3aGVuIHRoZSBlcnJvciB3YXMgY3JlYXRlZCwgbm90IHdoZW4gaXQgd2FzIHRocm93bi5cbiAgICAvLyBJdCBzcGVjaWZpY2FsbHkgZmlsdGVycyBvdXQgZXJyb3JzIGFuZCBvbmx5IGNoZWNrcyBleGlzdGluZyBkZXNjcmlwdG9ycyxcbiAgICAvLyBqdXN0IHRvIGtlZXAgdGhlIG1lc3MgZnJvbSBhZmZlY3RpbmcgZXZlcnl0aGluZyAoaXQncyBub3QgZnVsbHkgY29ycmVjdCxcbiAgICAvLyBidXQgaXQncyBuZWNlc3NhcnkpLlxuICAgIHZhciByZXF1aXJlc1Byb3h5ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRlc3QgPSBuZXcgRXJyb3IoKVxuICAgICAgICB2YXIgb2xkID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuXG4gICAgICAgIE9iamVjdC5rZXlzKHRlc3QpLmZvckVhY2goZnVuY3Rpb24gKGtleSkgeyBvbGRba2V5XSA9IHRydWUgfSlcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhyb3cgdGVzdFxuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgICAvLyBpZ25vcmVcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyh0ZXN0KS5zb21lKGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuICFvbGRba2V5XSB9KVxuICAgIH0pKClcblxuICAgIGZ1bmN0aW9uIGlzSWdub3JlZChvYmplY3QsIGtleSkge1xuICAgICAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgICBjYXNlIFwibGluZVwiOiBpZiAodHlwZW9mIG9iamVjdC5saW5lICE9PSBcIm51bWJlclwiKSByZXR1cm4gZmFsc2U7IGJyZWFrXG4gICAgICAgIGNhc2UgXCJzb3VyY2VVUkxcIjpcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0LnNvdXJjZVVSTCAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIGZhbHNlOyBicmVha1xuICAgICAgICBjYXNlIFwic3RhY2tcIjogaWYgKHR5cGVvZiBvYmplY3Quc3RhY2sgIT09IFwic3RyaW5nXCIpIHJldHVybiBmYWxzZTsgYnJlYWtcbiAgICAgICAgZGVmYXVsdDogcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBrZXkpXG5cbiAgICAgICAgcmV0dXJuICFkZXNjLmNvbmZpZ3VyYWJsZSAmJiBkZXNjLmVudW1lcmFibGUgJiYgIWRlc2Mud3JpdGFibGVcbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIG9ubHkgaW52b2tlZCB3aXRoIGVycm9ycywgc28gaXQncyBub3QgZ29pbmcgdG8gcHJlc2VudCBhXG4gICAgLy8gc2lnbmlmaWNhbnQgc2xvdyBkb3duLlxuICAgIGZ1bmN0aW9uIGdldEtleXNTdHJpcHBlZChvYmplY3QpIHtcbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmplY3QpXG4gICAgICAgIHZhciBjb3VudCA9IDBcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghaXNJZ25vcmVkKG9iamVjdCwga2V5c1tpXSkpIGtleXNbY291bnQrK10gPSBrZXlzW2ldXG4gICAgICAgIH1cblxuICAgICAgICBrZXlzLmxlbmd0aCA9IGNvdW50XG4gICAgICAgIHJldHVybiBrZXlzXG4gICAgfVxuXG4gICAgLy8gV2F5IGZhc3Rlciwgc2luY2UgdHlwZWQgYXJyYXkgaW5kaWNlcyBhcmUgYWx3YXlzIGRlbnNlIGFuZCBjb250YWluXG4gICAgLy8gbnVtYmVycy5cblxuICAgIC8vIFNldHVwIGZvciBgaXNCdWZmZXJPclZpZXdgIGFuZCBgaXNWaWV3YFxuICAgIHZhciBBcnJheUJ1ZmZlck5vbmUgPSAwXG4gICAgdmFyIEFycmF5QnVmZmVyTGVnYWN5ID0gMVxuICAgIHZhciBBcnJheUJ1ZmZlckN1cnJlbnQgPSAyXG5cbiAgICB2YXIgYXJyYXlCdWZmZXJTdXBwb3J0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFpc0Z1bmN0aW9uKGdsb2JhbC5VaW50OEFycmF5KSkgcmV0dXJuIEFycmF5QnVmZmVyTm9uZVxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oZ2xvYmFsLkRhdGFWaWV3KSkgcmV0dXJuIEFycmF5QnVmZmVyTm9uZVxuICAgICAgICBpZiAoIWlzRnVuY3Rpb24oZ2xvYmFsLkFycmF5QnVmZmVyKSkgcmV0dXJuIEFycmF5QnVmZmVyTm9uZVxuICAgICAgICBpZiAoaXNGdW5jdGlvbihnbG9iYWwuQXJyYXlCdWZmZXIuaXNWaWV3KSkgcmV0dXJuIEFycmF5QnVmZmVyQ3VycmVudFxuICAgICAgICBpZiAoaXNGdW5jdGlvbihnbG9iYWwuQXJyYXlCdWZmZXJWaWV3KSkgcmV0dXJuIEFycmF5QnVmZmVyTGVnYWN5XG4gICAgICAgIHJldHVybiBBcnJheUJ1ZmZlck5vbmVcbiAgICB9KSgpXG5cbiAgICAvLyBJZiB0eXBlZCBhcnJheXMgYXJlbid0IHN1cHBvcnRlZCAodGhleSB3ZXJlbid0IHRlY2huaWNhbGx5IHBhcnQgb2ZcbiAgICAvLyBFUzUsIGJ1dCBtYW55IGVuZ2luZXMgaW1wbGVtZW50ZWQgS2hyb25vcycgc3BlYyBiZWZvcmUgRVM2KSwgdGhlblxuICAgIC8vIGp1c3QgZmFsbCBiYWNrIHRvIGdlbmVyaWMgYnVmZmVyIGRldGVjdGlvbi5cblxuICAgIGZ1bmN0aW9uIGZsb2F0SXMoYSwgYikge1xuICAgICAgICAvLyBTbyBOYU5zIGFyZSBjb25zaWRlcmVkIGVxdWFsLlxuICAgICAgICByZXR1cm4gYSA9PT0gYiB8fCBhICE9PSBhICYmIGIgIT09IGIgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmUsIG1heC1sZW5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaFZpZXcoYSwgYikge1xuICAgICAgICB2YXIgY291bnQgPSBhLmxlbmd0aFxuXG4gICAgICAgIGlmIChjb3VudCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZVxuXG4gICAgICAgIHdoaWxlIChjb3VudCkge1xuICAgICAgICAgICAgY291bnQtLVxuICAgICAgICAgICAgaWYgKCFmbG9hdElzKGFbY291bnRdLCBiW2NvdW50XSkpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICB2YXIgaXNWaWV3ID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGFycmF5QnVmZmVyU3VwcG9ydCA9PT0gQXJyYXlCdWZmZXJOb25lKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIC8vIEVTNiB0eXBlZCBhcnJheXNcbiAgICAgICAgaWYgKGFycmF5QnVmZmVyU3VwcG9ydCA9PT0gQXJyYXlCdWZmZXJDdXJyZW50KSByZXR1cm4gQXJyYXlCdWZmZXIuaXNWaWV3XG4gICAgICAgIC8vIGxlZ2FjeSB0eXBlZCBhcnJheXNcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGlzVmlldyhvYmplY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlclZpZXdcbiAgICAgICAgfVxuICAgIH0pKClcblxuICAgIC8vIFN1cHBvcnQgY2hlY2tpbmcgbWFwcyBhbmQgc2V0cyBkZWVwbHkuIFRoZXkgYXJlIG9iamVjdC1saWtlIGVub3VnaCB0b1xuICAgIC8vIGNvdW50LCBhbmQgYXJlIHVzZWZ1bCBpbiB0aGVpciBvd24gcmlnaHQuIFRoZSBjb2RlIGlzIHJhdGhlciBtZXNzeSwgYnV0XG4gICAgLy8gbWFpbmx5IHRvIGtlZXAgdGhlIG9yZGVyLWluZGVwZW5kZW50IGNoZWNraW5nIGZyb20gYmVjb21pbmcgaW5zYW5lbHlcbiAgICAvLyBzbG93LlxuICAgIHZhciBzdXBwb3J0c01hcCA9IGlzRnVuY3Rpb24oZ2xvYmFsLk1hcClcbiAgICB2YXIgc3VwcG9ydHNTZXQgPSBpc0Z1bmN0aW9uKGdsb2JhbC5TZXQpXG5cbiAgICAvLyBPbmUgb2YgdGhlIHNldHMgYW5kIGJvdGggbWFwcycga2V5cyBhcmUgY29udmVydGVkIHRvIGFycmF5cyBmb3IgZmFzdGVyXG4gICAgLy8gaGFuZGxpbmcuXG4gICAgZnVuY3Rpb24ga2V5TGlzdChtYXApIHtcbiAgICAgICAgdmFyIGxpc3QgPSBuZXcgQXJyYXkobWFwLnNpemUpXG4gICAgICAgIHZhciBpID0gMFxuICAgICAgICB2YXIgaXRlciA9IG1hcC5rZXlzKClcblxuICAgICAgICBmb3IgKHZhciBuZXh0ID0gaXRlci5uZXh0KCk7ICFuZXh0LmRvbmU7IG5leHQgPSBpdGVyLm5leHQoKSkge1xuICAgICAgICAgICAgbGlzdFtpKytdID0gbmV4dC52YWx1ZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpc3RcbiAgICB9XG5cbiAgICAvLyBUaGUgcGFpciBvZiBhcnJheXMgYXJlIGFsaWduZWQgaW4gYSBzaW5nbGUgTyhuXjIpIG9wZXJhdGlvbiAobW9kIGRlZXBcbiAgICAvLyBtYXRjaGluZyBhbmQgcm90YXRpb24pLCBhZGFwdGluZyB0byBPKG4pIHdoZW4gdGhleSdyZSBhbHJlYWR5IGFsaWduZWQuXG4gICAgZnVuY3Rpb24gbWF0Y2hLZXkoY3VycmVudCwgYWtleXMsIHN0YXJ0LCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICBmb3IgKHZhciBpID0gc3RhcnQgKyAxOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBha2V5c1tpXVxuXG4gICAgICAgICAgICBpZiAobWF0Y2goY3VycmVudCwga2V5LCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBvbmNlIGVuZ2luZXMgYWN0dWFsbHkgb3B0aW1pemUgYGNvcHlXaXRoaW5gLCB1c2UgdGhhdFxuICAgICAgICAgICAgICAgIC8vIGluc3RlYWQuIEl0J2xsIGJlIG11Y2ggZmFzdGVyIHRoYW4gdGhpcyBsb29wLlxuICAgICAgICAgICAgICAgIHdoaWxlIChpID4gc3RhcnQpIGFrZXlzW2ldID0gYWtleXNbLS1pXVxuICAgICAgICAgICAgICAgIGFrZXlzW2ldID0ga2V5XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoVmFsdWVzKGEsIGIsIGFrZXlzLCBia2V5cywgZW5kLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFtYXRjaChhLmdldChha2V5c1tpXSksIGIuZ2V0KGJrZXlzW2ldKSxcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8vIFBvc3NpYmx5IGV4cGVuc2l2ZSBvcmRlci1pbmRlcGVuZGVudCBrZXktdmFsdWUgbWF0Y2guIEZpcnN0LCB0cnkgdG8gYXZvaWRcbiAgICAvLyBpdCBieSBjb25zZXJ2YXRpdmVseSBhc3N1bWluZyBldmVyeXRoaW5nIGlzIGluIG9yZGVyIC0gYSBjaGVhcCBPKG4pIGlzXG4gICAgLy8gYWx3YXlzIG5pY2VyIHRoYW4gYW4gZXhwZW5zaXZlIE8obl4yKS5cbiAgICBmdW5jdGlvbiBtYXRjaE1hcChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgdmFyIGVuZCA9IGEuc2l6ZVxuICAgICAgICB2YXIgYWtleXMgPSBrZXlMaXN0KGEpXG4gICAgICAgIHZhciBia2V5cyA9IGtleUxpc3QoYilcbiAgICAgICAgdmFyIGkgPSAwXG5cbiAgICAgICAgd2hpbGUgKGkgIT09IGVuZCAmJiBtYXRjaChha2V5c1tpXSwgYmtleXNbaV0sIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgaSsrXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaSA9PT0gZW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hWYWx1ZXMoYSwgYiwgYWtleXMsIGJrZXlzLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRG9uJ3QgY29tcGFyZSB0aGUgc2FtZSBrZXkgdHdpY2VcbiAgICAgICAgaWYgKCFtYXRjaEtleShia2V5c1tpXSwgYWtleXMsIGksIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBhYm92ZSBmYWlscywgd2hpbGUgd2UncmUgYXQgaXQsIGxldCdzIHNvcnQgdGhlbSBhcyB3ZSBnbywgc29cbiAgICAgICAgLy8gdGhlIGtleSBvcmRlciBtYXRjaGVzLlxuICAgICAgICB3aGlsZSAoKytpIDwgZW5kKSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gYmtleXNbaV1cblxuICAgICAgICAgICAgLy8gQWRhcHQgaWYgdGhlIGtleXMgYXJlIGFscmVhZHkgaW4gb3JkZXIsIHdoaWNoIGlzIGZyZXF1ZW50bHkgdGhlXG4gICAgICAgICAgICAvLyBjYXNlLlxuICAgICAgICAgICAgaWYgKCFtYXRjaChrZXksIGFrZXlzW2ldLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgJiZcbiAgICAgICAgICAgICAgICAgICAgIW1hdGNoS2V5KGtleSwgYWtleXMsIGksIGVuZCwgY29udGV4dCwgbGVmdCwgcmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWF0Y2hWYWx1ZXMoYSwgYiwgYWtleXMsIGJrZXlzLCBlbmQsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhc0FsbElkZW50aWNhbChhbGlzdCwgYikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWIuaGFzKGFsaXN0W2ldKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8vIENvbXBhcmUgdGhlIHZhbHVlcyBzdHJ1Y3R1cmFsbHksIGFuZCBpbmRlcGVuZGVudCBvZiBvcmRlci5cbiAgICBmdW5jdGlvbiBzZWFyY2hGb3IoYXZhbHVlLCBvYmplY3RzLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgZm9yICh2YXIgaiBpbiBvYmplY3RzKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwob2JqZWN0cywgaikpIHtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2goYXZhbHVlLCBvYmplY3RzW2pdLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG9iamVjdHNbal1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoYXNTdHJ1Y3R1cmUodmFsdWUsIGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCB8fFxuICAgICAgICAgICAgICAgICEoY29udGV4dCAmIFN0cmljdCkgJiYgdHlwZW9mIHZhbHVlID09PSBcInN5bWJvbFwiXG4gICAgfVxuXG4gICAgLy8gVGhlIHNldCBhbGdvcml0aG0gaXMgc3RydWN0dXJlZCBhIGxpdHRsZSBkaWZmZXJlbnRseS4gSXQgdGFrZXMgb25lIG9mIHRoZVxuICAgIC8vIHNldHMgaW50byBhbiBhcnJheSwgZG9lcyBhIGNoZWFwIGlkZW50aXR5IGNoZWNrLCB0aGVuIGRvZXMgdGhlIGRlZXBcbiAgICAvLyBjaGVjay5cbiAgICBmdW5jdGlvbiBtYXRjaFNldChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgLy8gVGhpcyBpcyB0byB0cnkgdG8gYXZvaWQgYW4gZXhwZW5zaXZlIHN0cnVjdHVyYWwgbWF0Y2ggb24gdGhlIGtleXMuXG4gICAgICAgIC8vIFRlc3QgZm9yIGlkZW50aXR5IGZpcnN0LlxuICAgICAgICB2YXIgYWxpc3QgPSBrZXlMaXN0KGEpXG5cbiAgICAgICAgaWYgKGhhc0FsbElkZW50aWNhbChhbGlzdCwgYikpIHJldHVybiB0cnVlXG5cbiAgICAgICAgdmFyIGl0ZXIgPSBiLnZhbHVlcygpXG4gICAgICAgIHZhciBjb3VudCA9IDBcbiAgICAgICAgdmFyIG9iamVjdHNcblxuICAgICAgICAvLyBHYXRoZXIgYWxsIHRoZSBvYmplY3RzXG4gICAgICAgIGZvciAodmFyIG5leHQgPSBpdGVyLm5leHQoKTsgIW5leHQuZG9uZTsgbmV4dCA9IGl0ZXIubmV4dCgpKSB7XG4gICAgICAgICAgICB2YXIgYnZhbHVlID0gbmV4dC52YWx1ZVxuXG4gICAgICAgICAgICBpZiAoaGFzU3RydWN0dXJlKGJ2YWx1ZSwgY29udGV4dCkpIHtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIG9iamVjdHMgbWFwIGxhemlseS4gTm90ZSB0aGF0IHRoaXMgYWxzbyBncmFic1xuICAgICAgICAgICAgICAgIC8vIFN5bWJvbHMgd2hlbiBub3Qgc3RyaWN0bHkgbWF0Y2hpbmcsIHNpbmNlIHRoZWlyIGRlc2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgLy8gaXMgY29tcGFyZWQuXG4gICAgICAgICAgICAgICAgaWYgKGNvdW50ID09PSAwKSBvYmplY3RzID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuICAgICAgICAgICAgICAgIG9iamVjdHNbY291bnQrK10gPSBidmFsdWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGV2ZXJ5dGhpbmcgaXMgYSBwcmltaXRpdmUsIHRoZW4gYWJvcnQuXG4gICAgICAgIGlmIChjb3VudCA9PT0gMCkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aGUgb2JqZWN0LCByZW1vdmluZyBlYWNoIG9uZSByZW1haW5pbmcgd2hlbiBtYXRjaGVkIChhbmRcbiAgICAgICAgLy8gYWJvcnRpbmcgaWYgbm9uZSBjYW4gYmUpLlxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHZhciBhdmFsdWUgPSBhbGlzdFtpXVxuXG4gICAgICAgICAgICBpZiAoaGFzU3RydWN0dXJlKGF2YWx1ZSwgY29udGV4dCkgJiZcbiAgICAgICAgICAgICAgICAgICAgIXNlYXJjaEZvcihhdmFsdWUsIG9iamVjdHMsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaFJlZ0V4cChhLCBiKSB7XG4gICAgICAgIHJldHVybiBhLnNvdXJjZSA9PT0gYi5zb3VyY2UgJiZcbiAgICAgICAgICAgIGEuZ2xvYmFsID09PSBiLmdsb2JhbCAmJlxuICAgICAgICAgICAgYS5pZ25vcmVDYXNlID09PSBiLmlnbm9yZUNhc2UgJiZcbiAgICAgICAgICAgIGEubXVsdGlsaW5lID09PSBiLm11bHRpbGluZSAmJlxuICAgICAgICAgICAgKCFzdXBwb3J0c1VuaWNvZGUgfHwgYS51bmljb2RlID09PSBiLnVuaWNvZGUpICYmXG4gICAgICAgICAgICAoIXN1cHBvcnRzU3RpY2t5IHx8IGEuc3RpY2t5ID09PSBiLnN0aWNreSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaFByZXBhcmVEZXNjZW5kKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICAvLyBDaGVjayBmb3IgY2lyY3VsYXIgcmVmZXJlbmNlcyBhZnRlciB0aGUgZmlyc3QgbGV2ZWwsIHdoZXJlIGl0J3NcbiAgICAgICAgLy8gcmVkdW5kYW50LiBOb3RlIHRoYXQgdGhleSBoYXZlIHRvIHBvaW50IHRvIHRoZSBzYW1lIGxldmVsIHRvIGFjdHVhbGx5XG4gICAgICAgIC8vIGJlIGNvbnNpZGVyZWQgZGVlcGx5IGVxdWFsLlxuICAgICAgICBpZiAoIShjb250ZXh0ICYgSW5pdGlhbCkpIHtcbiAgICAgICAgICAgIHZhciBsZWZ0SW5kZXggPSBsZWZ0LmluZGV4T2YoYSlcbiAgICAgICAgICAgIHZhciByaWdodEluZGV4ID0gcmlnaHQuaW5kZXhPZihiKVxuXG4gICAgICAgICAgICBpZiAobGVmdEluZGV4ICE9PSByaWdodEluZGV4KSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGlmIChsZWZ0SW5kZXggPj0gMCkgcmV0dXJuIHRydWVcblxuICAgICAgICAgICAgbGVmdC5wdXNoKGEpXG4gICAgICAgICAgICByaWdodC5wdXNoKGIpXG5cbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBtYXRjaElubmVyKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuXG4gICAgICAgICAgICBsZWZ0LnBvcCgpXG4gICAgICAgICAgICByaWdodC5wb3AoKVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hJbm5lcihhLCBiLCBjb250ZXh0ICYgfkluaXRpYWwsIFthXSwgW2JdKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hTYW1lUHJvdG8oYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIGlmIChzeW1ib2xzQXJlT2JqZWN0cyAmJiBhIGluc3RhbmNlb2YgU3ltYm9sKSB7XG4gICAgICAgICAgICByZXR1cm4gIShjb250ZXh0ICYgU3RyaWN0KSAmJiBhLnRvU3RyaW5nKCkgPT09IGIudG9TdHJpbmcoKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBSZWdFeHApIHJldHVybiBtYXRjaFJlZ0V4cChhLCBiKVxuICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIERhdGUpIHJldHVybiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKClcbiAgICAgICAgaWYgKGFycmF5QnVmZmVyU3VwcG9ydCAhPT0gQXJyYXlCdWZmZXJOb25lKSB7XG4gICAgICAgICAgICBpZiAoYSBpbnN0YW5jZW9mIERhdGFWaWV3KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoVmlldyhcbiAgICAgICAgICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkoYS5idWZmZXIsIGEuYnl0ZU9mZnNldCwgYS5ieXRlTGVuZ3RoKSxcbiAgICAgICAgICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkoYi5idWZmZXIsIGIuYnl0ZU9mZnNldCwgYi5ieXRlTGVuZ3RoKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hWaWV3KG5ldyBVaW50OEFycmF5KGEpLCBuZXcgVWludDhBcnJheShiKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc1ZpZXcoYSkpIHJldHVybiBtYXRjaFZpZXcoYSwgYilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0J1ZmZlcihhKSkgcmV0dXJuIG1hdGNoVmlldyhhLCBiKVxuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICAgICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGlmIChhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWVcbiAgICAgICAgfSBlbHNlIGlmIChzdXBwb3J0c01hcCAmJiBhIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICAgICAgICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgaWYgKGEuc2l6ZSA9PT0gMCkgcmV0dXJuIHRydWVcbiAgICAgICAgfSBlbHNlIGlmIChzdXBwb3J0c1NldCAmJiBhIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICAgICAgICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgaWYgKGEuc2l6ZSA9PT0gMCkgcmV0dXJuIHRydWVcbiAgICAgICAgfSBlbHNlIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSB7XG4gICAgICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChiKSAhPT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGlmIChhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWVcbiAgICAgICAgfSBlbHNlIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGIpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtYXRjaFByZXBhcmVEZXNjZW5kKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgIH1cblxuICAgIC8vIE1vc3Qgc3BlY2lhbCBjYXNlcyByZXF1aXJlIGJvdGggdHlwZXMgdG8gbWF0Y2gsIGFuZCBpZiBvbmx5IG9uZSBvZiB0aGVtXG4gICAgLy8gYXJlLCB0aGUgb2JqZWN0cyB0aGVtc2VsdmVzIGRvbid0IG1hdGNoLlxuICAgIGZ1bmN0aW9uIG1hdGNoRGlmZmVyZW50UHJvdG8oYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIGlmIChzeW1ib2xzQXJlT2JqZWN0cykge1xuICAgICAgICAgICAgaWYgKGEgaW5zdGFuY2VvZiBTeW1ib2wgfHwgYiBpbnN0YW5jZW9mIFN5bWJvbCkgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRleHQgJiBTdHJpY3QpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoYXJyYXlCdWZmZXJTdXBwb3J0ICE9PSBBcnJheUJ1ZmZlck5vbmUpIHtcbiAgICAgICAgICAgIGlmIChhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHwgYiBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNWaWV3KGEpIHx8IGlzVmlldyhiKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYSkgfHwgQXJyYXkuaXNBcnJheShiKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChzdXBwb3J0c01hcCAmJiAoYSBpbnN0YW5jZW9mIE1hcCB8fCBiIGluc3RhbmNlb2YgTWFwKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChzdXBwb3J0c1NldCAmJiAoYSBpbnN0YW5jZW9mIFNldCB8fCBiIGluc3RhbmNlb2YgU2V0KSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSB7XG4gICAgICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChiKSAhPT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIGlmIChhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqZWN0VG9TdHJpbmcuY2FsbChiKSA9PT0gXCJbb2JqZWN0IEFyZ3VtZW50c11cIikgcmV0dXJuIGZhbHNlXG4gICAgICAgIHJldHVybiBtYXRjaFByZXBhcmVEZXNjZW5kKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXBhcmFtcywgbWF4LWxlblxuICAgICAgICBpZiAoYSA9PT0gYikgcmV0dXJuIHRydWVcbiAgICAgICAgLy8gTmFOcyBhcmUgZXF1YWxcbiAgICAgICAgaWYgKGEgIT09IGEpIHJldHVybiBiICE9PSBiIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG4gICAgICAgIGlmIChhID09PSBudWxsIHx8IGIgPT09IG51bGwpIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAodHlwZW9mIGEgPT09IFwic3ltYm9sXCIgJiYgdHlwZW9mIGIgPT09IFwic3ltYm9sXCIpIHtcbiAgICAgICAgICAgIHJldHVybiAhKGNvbnRleHQgJiBTdHJpY3QpICYmIGEudG9TdHJpbmcoKSA9PT0gYi50b1N0cmluZygpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBhICE9PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBiICE9PSBcIm9iamVjdFwiKSByZXR1cm4gZmFsc2VcblxuICAgICAgICAvLyBVc3VhbGx5LCBib3RoIG9iamVjdHMgaGF2ZSBpZGVudGljYWwgcHJvdG90eXBlcywgYW5kIHRoYXQgYWxsb3dzIGZvclxuICAgICAgICAvLyBoYWxmIHRoZSB0eXBlIGNoZWNraW5nLlxuICAgICAgICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKGEpID09PSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYikpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaFNhbWVQcm90byhhLCBiLCBjb250ZXh0IHwgU2FtZVByb3RvLCBsZWZ0LCByaWdodClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaERpZmZlcmVudFByb3RvKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hBcnJheUxpa2UoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtcGFyYW1zLCBtYXgtbGVuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFtYXRjaChhW2ldLCBiW2ldLCBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBQaGFudG9tSlMgYW5kIFNsaW1lckpTIGJvdGggaGF2ZSBteXN0ZXJpb3VzIGlzc3VlcyB3aGVyZSBgRXJyb3JgIGlzXG4gICAgLy8gc29tZXRpbWVzIGVycm9uZW91c2x5IG9mIGEgZGlmZmVyZW50IGB3aW5kb3dgLCBhbmQgaXQgc2hvd3MgdXAgaW4gdGhlXG4gICAgLy8gdGVzdHMuIFRoaXMgbWVhbnMgSSBoYXZlIHRvIHVzZSBhIG11Y2ggc2xvd2VyIGFsZ29yaXRobSB0byBkZXRlY3QgRXJyb3JzLlxuICAgIC8vXG4gICAgLy8gUGhhbnRvbUpTOiBodHRwczovL2dpdGh1Yi5jb20vcGV0a2FhbnRvbm92L2JsdWViaXJkL2lzc3Vlcy8xMTQ2XG4gICAgLy8gU2xpbWVySlM6IGh0dHBzOi8vZ2l0aHViLmNvbS9sYXVyZW50ai9zbGltZXJqcy9pc3N1ZXMvNDAwXG4gICAgLy9cbiAgICAvLyAoWWVzLCB0aGUgUGhhbnRvbUpTIGJ1ZyBpcyBkZXRhaWxlZCBpbiB0aGUgQmx1ZWJpcmQgaXNzdWUgdHJhY2tlci4pXG4gICAgdmFyIGNoZWNrQ3Jvc3NPcmlnaW4gPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZ2xvYmFsLndpbmRvdyA9PSBudWxsIHx8IGdsb2JhbC53aW5kb3cubmF2aWdhdG9yID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAvc2xpbWVyanN8cGhhbnRvbWpzL2kudGVzdChnbG9iYWwud2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpXG4gICAgfSkoKVxuXG4gICAgdmFyIGVycm9yU3RyaW5nVHlwZXMgPSB7XG4gICAgICAgIFwiW29iamVjdCBFcnJvcl1cIjogdHJ1ZSxcbiAgICAgICAgXCJbb2JqZWN0IEV2YWxFcnJvcl1cIjogdHJ1ZSxcbiAgICAgICAgXCJbb2JqZWN0IFJhbmdlRXJyb3JdXCI6IHRydWUsXG4gICAgICAgIFwiW29iamVjdCBSZWZlcmVuY2VFcnJvcl1cIjogdHJ1ZSxcbiAgICAgICAgXCJbb2JqZWN0IFN5bnRheEVycm9yXVwiOiB0cnVlLFxuICAgICAgICBcIltvYmplY3QgVHlwZUVycm9yXVwiOiB0cnVlLFxuICAgICAgICBcIltvYmplY3QgVVJJRXJyb3JdXCI6IHRydWUsXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNQcm94aWVkRXJyb3Iob2JqZWN0KSB7XG4gICAgICAgIHdoaWxlIChvYmplY3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKGVycm9yU3RyaW5nVHlwZXNbb2JqZWN0VG9TdHJpbmcuY2FsbChvYmplY3QpXSkgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIG9iamVjdCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaElubmVyKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbWF4LXN0YXRlbWVudHMsIG1heC1wYXJhbXMsIG1heC1sZW5cbiAgICAgICAgdmFyIGFrZXlzLCBia2V5c1xuICAgICAgICB2YXIgaXNVbnByb3hpZWRFcnJvciA9IGZhbHNlXG5cbiAgICAgICAgaWYgKGNvbnRleHQgJiBTYW1lUHJvdG8pIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoQXJyYXlMaWtlKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3VwcG9ydHNNYXAgJiYgYSBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaE1hcChhLCBiLCBjb250ZXh0LCBsZWZ0LCByaWdodClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN1cHBvcnRzU2V0ICYmIGEgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hTZXQoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvYmplY3RUb1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoQXJyYXlMaWtlKGEsIGIsIGNvbnRleHQsIGxlZnQsIHJpZ2h0KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVxdWlyZXNQcm94eSAmJlxuICAgICAgICAgICAgICAgICAgICAoY2hlY2tDcm9zc09yaWdpbiA/IGlzUHJveGllZEVycm9yKGEpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGEgaW5zdGFuY2VvZiBFcnJvcikpIHtcbiAgICAgICAgICAgICAgICBha2V5cyA9IGdldEtleXNTdHJpcHBlZChhKVxuICAgICAgICAgICAgICAgIGJrZXlzID0gZ2V0S2V5c1N0cmlwcGVkKGIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFrZXlzID0gT2JqZWN0LmtleXMoYSlcbiAgICAgICAgICAgICAgICBia2V5cyA9IE9iamVjdC5rZXlzKGIpXG4gICAgICAgICAgICAgICAgaXNVbnByb3hpZWRFcnJvciA9IGEgaW5zdGFuY2VvZiBFcnJvclxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG9iamVjdFRvU3RyaW5nLmNhbGwoYSkgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hBcnJheUxpa2UoYSwgYiwgY29udGV4dCwgbGVmdCwgcmlnaHQpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHdlIHJlcXVpcmUgYSBwcm94eSwgYmUgcGVybWlzc2l2ZSBhbmQgY2hlY2sgdGhlIGB0b1N0cmluZ2BcbiAgICAgICAgICAgIC8vIHR5cGUuIFRoaXMgaXMgc28gaXQgd29ya3MgY3Jvc3Mtb3JpZ2luIGluIFBoYW50b21KUyBpblxuICAgICAgICAgICAgLy8gcGFydGljdWxhci5cbiAgICAgICAgICAgIGlmIChjaGVja0Nyb3NzT3JpZ2luID8gaXNQcm94aWVkRXJyb3IoYSkgOiBhIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFrZXlzID0gT2JqZWN0LmtleXMoYSlcbiAgICAgICAgICAgIGJrZXlzID0gT2JqZWN0LmtleXMoYilcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjb3VudCA9IGFrZXlzLmxlbmd0aFxuXG4gICAgICAgIGlmIChjb3VudCAhPT0gYmtleXMubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICAgICAgICAvLyBTaG9ydGN1dCBpZiB0aGVyZSdzIG5vdGhpbmcgdG8gbWF0Y2hcbiAgICAgICAgaWYgKGNvdW50ID09PSAwKSByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIHZhciBpXG5cbiAgICAgICAgaWYgKGlzVW5wcm94aWVkRXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFNob3J0Y3V0IGlmIHRoZSBwcm9wZXJ0aWVzIGFyZSBkaWZmZXJlbnQuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChha2V5c1tpXSAhPT0gXCJzdGFja1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwoYiwgYWtleXNbaV0pKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFZlcmlmeSB0aGF0IGFsbCB0aGUgYWtleXMnIHZhbHVlcyBtYXRjaGVkLlxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoYWtleXNbaV0gIT09IFwic3RhY2tcIiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgIW1hdGNoKGFbYWtleXNbaV1dLCBiW2FrZXlzW2ldXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LCBsZWZ0LCByaWdodCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gU2hvcnRjdXQgaWYgdGhlIHByb3BlcnRpZXMgYXJlIGRpZmZlcmVudC5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFoYXNPd24uY2FsbChiLCBha2V5c1tpXSkpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBWZXJpZnkgdGhhdCBhbGwgdGhlIGFrZXlzJyB2YWx1ZXMgbWF0Y2hlZC5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaChhW2FrZXlzW2ldXSwgYltha2V5c1tpXV0sIGNvbnRleHQsIGxlZnQsIHJpZ2h0KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbn0pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIHNlbWlcbiIsIi8vIFNlZTogaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2dvb2dsZS1kaWZmLW1hdGNoLXBhdGNoL3dpa2kvQVBJXG5leHBvcnQgZnVuY3Rpb24gY29udmVydENoYW5nZXNUb0RNUChjaGFuZ2VzKSB7XG4gIGxldCByZXQgPSBbXSxcbiAgICAgIGNoYW5nZSxcbiAgICAgIG9wZXJhdGlvbjtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgY2hhbmdlID0gY2hhbmdlc1tpXTtcbiAgICBpZiAoY2hhbmdlLmFkZGVkKSB7XG4gICAgICBvcGVyYXRpb24gPSAxO1xuICAgIH0gZWxzZSBpZiAoY2hhbmdlLnJlbW92ZWQpIHtcbiAgICAgIG9wZXJhdGlvbiA9IC0xO1xuICAgIH0gZWxzZSB7XG4gICAgICBvcGVyYXRpb24gPSAwO1xuICAgIH1cblxuICAgIHJldC5wdXNoKFtvcGVyYXRpb24sIGNoYW5nZS52YWx1ZV0pO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gY29udmVydENoYW5nZXNUb1hNTChjaGFuZ2VzKSB7XG4gIGxldCByZXQgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGNoYW5nZSA9IGNoYW5nZXNbaV07XG4gICAgaWYgKGNoYW5nZS5hZGRlZCkge1xuICAgICAgcmV0LnB1c2goJzxpbnM+Jyk7XG4gICAgfSBlbHNlIGlmIChjaGFuZ2UucmVtb3ZlZCkge1xuICAgICAgcmV0LnB1c2goJzxkZWw+Jyk7XG4gICAgfVxuXG4gICAgcmV0LnB1c2goZXNjYXBlSFRNTChjaGFuZ2UudmFsdWUpKTtcblxuICAgIGlmIChjaGFuZ2UuYWRkZWQpIHtcbiAgICAgIHJldC5wdXNoKCc8L2lucz4nKTtcbiAgICB9IGVsc2UgaWYgKGNoYW5nZS5yZW1vdmVkKSB7XG4gICAgICByZXQucHVzaCgnPC9kZWw+Jyk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXQuam9pbignJyk7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUhUTUwocykge1xuICBsZXQgbiA9IHM7XG4gIG4gPSBuLnJlcGxhY2UoLyYvZywgJyZhbXA7Jyk7XG4gIG4gPSBuLnJlcGxhY2UoLzwvZywgJyZsdDsnKTtcbiAgbiA9IG4ucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xuICBuID0gbi5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7Jyk7XG5cbiAgcmV0dXJuIG47XG59XG4iLCJpbXBvcnQgRGlmZiBmcm9tICcuL2Jhc2UnO1xuXG5leHBvcnQgY29uc3QgYXJyYXlEaWZmID0gbmV3IERpZmYoKTtcbmFycmF5RGlmZi50b2tlbml6ZSA9IGFycmF5RGlmZi5qb2luID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLnNsaWNlKCk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZGlmZkFycmF5cyhvbGRBcnIsIG5ld0FyciwgY2FsbGJhY2spIHsgcmV0dXJuIGFycmF5RGlmZi5kaWZmKG9sZEFyciwgbmV3QXJyLCBjYWxsYmFjayk7IH1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIERpZmYoKSB7fVxuXG5EaWZmLnByb3RvdHlwZSA9IHtcbiAgZGlmZihvbGRTdHJpbmcsIG5ld1N0cmluZywgb3B0aW9ucyA9IHt9KSB7XG4gICAgbGV0IGNhbGxiYWNrID0gb3B0aW9ucy5jYWxsYmFjaztcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGRvbmUodmFsdWUpIHtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayh1bmRlZmluZWQsIHZhbHVlKTsgfSwgMCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFsbG93IHN1YmNsYXNzZXMgdG8gbWFzc2FnZSB0aGUgaW5wdXQgcHJpb3IgdG8gcnVubmluZ1xuICAgIG9sZFN0cmluZyA9IHRoaXMuY2FzdElucHV0KG9sZFN0cmluZyk7XG4gICAgbmV3U3RyaW5nID0gdGhpcy5jYXN0SW5wdXQobmV3U3RyaW5nKTtcblxuICAgIG9sZFN0cmluZyA9IHRoaXMucmVtb3ZlRW1wdHkodGhpcy50b2tlbml6ZShvbGRTdHJpbmcpKTtcbiAgICBuZXdTdHJpbmcgPSB0aGlzLnJlbW92ZUVtcHR5KHRoaXMudG9rZW5pemUobmV3U3RyaW5nKSk7XG5cbiAgICBsZXQgbmV3TGVuID0gbmV3U3RyaW5nLmxlbmd0aCwgb2xkTGVuID0gb2xkU3RyaW5nLmxlbmd0aDtcbiAgICBsZXQgZWRpdExlbmd0aCA9IDE7XG4gICAgbGV0IG1heEVkaXRMZW5ndGggPSBuZXdMZW4gKyBvbGRMZW47XG4gICAgbGV0IGJlc3RQYXRoID0gW3sgbmV3UG9zOiAtMSwgY29tcG9uZW50czogW10gfV07XG5cbiAgICAvLyBTZWVkIGVkaXRMZW5ndGggPSAwLCBpLmUuIHRoZSBjb250ZW50IHN0YXJ0cyB3aXRoIHRoZSBzYW1lIHZhbHVlc1xuICAgIGxldCBvbGRQb3MgPSB0aGlzLmV4dHJhY3RDb21tb24oYmVzdFBhdGhbMF0sIG5ld1N0cmluZywgb2xkU3RyaW5nLCAwKTtcbiAgICBpZiAoYmVzdFBhdGhbMF0ubmV3UG9zICsgMSA+PSBuZXdMZW4gJiYgb2xkUG9zICsgMSA+PSBvbGRMZW4pIHtcbiAgICAgIC8vIElkZW50aXR5IHBlciB0aGUgZXF1YWxpdHkgYW5kIHRva2VuaXplclxuICAgICAgcmV0dXJuIGRvbmUoW3t2YWx1ZTogdGhpcy5qb2luKG5ld1N0cmluZyksIGNvdW50OiBuZXdTdHJpbmcubGVuZ3RofV0pO1xuICAgIH1cblxuICAgIC8vIE1haW4gd29ya2VyIG1ldGhvZC4gY2hlY2tzIGFsbCBwZXJtdXRhdGlvbnMgb2YgYSBnaXZlbiBlZGl0IGxlbmd0aCBmb3IgYWNjZXB0YW5jZS5cbiAgICBmdW5jdGlvbiBleGVjRWRpdExlbmd0aCgpIHtcbiAgICAgIGZvciAobGV0IGRpYWdvbmFsUGF0aCA9IC0xICogZWRpdExlbmd0aDsgZGlhZ29uYWxQYXRoIDw9IGVkaXRMZW5ndGg7IGRpYWdvbmFsUGF0aCArPSAyKSB7XG4gICAgICAgIGxldCBiYXNlUGF0aDtcbiAgICAgICAgbGV0IGFkZFBhdGggPSBiZXN0UGF0aFtkaWFnb25hbFBhdGggLSAxXSxcbiAgICAgICAgICAgIHJlbW92ZVBhdGggPSBiZXN0UGF0aFtkaWFnb25hbFBhdGggKyAxXSxcbiAgICAgICAgICAgIG9sZFBvcyA9IChyZW1vdmVQYXRoID8gcmVtb3ZlUGF0aC5uZXdQb3MgOiAwKSAtIGRpYWdvbmFsUGF0aDtcbiAgICAgICAgaWYgKGFkZFBhdGgpIHtcbiAgICAgICAgICAvLyBObyBvbmUgZWxzZSBpcyBnb2luZyB0byBhdHRlbXB0IHRvIHVzZSB0aGlzIHZhbHVlLCBjbGVhciBpdFxuICAgICAgICAgIGJlc3RQYXRoW2RpYWdvbmFsUGF0aCAtIDFdID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGNhbkFkZCA9IGFkZFBhdGggJiYgYWRkUGF0aC5uZXdQb3MgKyAxIDwgbmV3TGVuLFxuICAgICAgICAgICAgY2FuUmVtb3ZlID0gcmVtb3ZlUGF0aCAmJiAwIDw9IG9sZFBvcyAmJiBvbGRQb3MgPCBvbGRMZW47XG4gICAgICAgIGlmICghY2FuQWRkICYmICFjYW5SZW1vdmUpIHtcbiAgICAgICAgICAvLyBJZiB0aGlzIHBhdGggaXMgYSB0ZXJtaW5hbCB0aGVuIHBydW5lXG4gICAgICAgICAgYmVzdFBhdGhbZGlhZ29uYWxQYXRoXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNlbGVjdCB0aGUgZGlhZ29uYWwgdGhhdCB3ZSB3YW50IHRvIGJyYW5jaCBmcm9tLiBXZSBzZWxlY3QgdGhlIHByaW9yXG4gICAgICAgIC8vIHBhdGggd2hvc2UgcG9zaXRpb24gaW4gdGhlIG5ldyBzdHJpbmcgaXMgdGhlIGZhcnRoZXN0IGZyb20gdGhlIG9yaWdpblxuICAgICAgICAvLyBhbmQgZG9lcyBub3QgcGFzcyB0aGUgYm91bmRzIG9mIHRoZSBkaWZmIGdyYXBoXG4gICAgICAgIGlmICghY2FuQWRkIHx8IChjYW5SZW1vdmUgJiYgYWRkUGF0aC5uZXdQb3MgPCByZW1vdmVQYXRoLm5ld1BvcykpIHtcbiAgICAgICAgICBiYXNlUGF0aCA9IGNsb25lUGF0aChyZW1vdmVQYXRoKTtcbiAgICAgICAgICBzZWxmLnB1c2hDb21wb25lbnQoYmFzZVBhdGguY29tcG9uZW50cywgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBiYXNlUGF0aCA9IGFkZFBhdGg7ICAgLy8gTm8gbmVlZCB0byBjbG9uZSwgd2UndmUgcHVsbGVkIGl0IGZyb20gdGhlIGxpc3RcbiAgICAgICAgICBiYXNlUGF0aC5uZXdQb3MrKztcbiAgICAgICAgICBzZWxmLnB1c2hDb21wb25lbnQoYmFzZVBhdGguY29tcG9uZW50cywgdHJ1ZSwgdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9sZFBvcyA9IHNlbGYuZXh0cmFjdENvbW1vbihiYXNlUGF0aCwgbmV3U3RyaW5nLCBvbGRTdHJpbmcsIGRpYWdvbmFsUGF0aCk7XG5cbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBoaXQgdGhlIGVuZCBvZiBib3RoIHN0cmluZ3MsIHRoZW4gd2UgYXJlIGRvbmVcbiAgICAgICAgaWYgKGJhc2VQYXRoLm5ld1BvcyArIDEgPj0gbmV3TGVuICYmIG9sZFBvcyArIDEgPj0gb2xkTGVuKSB7XG4gICAgICAgICAgcmV0dXJuIGRvbmUoYnVpbGRWYWx1ZXMoc2VsZiwgYmFzZVBhdGguY29tcG9uZW50cywgbmV3U3RyaW5nLCBvbGRTdHJpbmcsIHNlbGYudXNlTG9uZ2VzdFRva2VuKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gT3RoZXJ3aXNlIHRyYWNrIHRoaXMgcGF0aCBhcyBhIHBvdGVudGlhbCBjYW5kaWRhdGUgYW5kIGNvbnRpbnVlLlxuICAgICAgICAgIGJlc3RQYXRoW2RpYWdvbmFsUGF0aF0gPSBiYXNlUGF0aDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBlZGl0TGVuZ3RoKys7XG4gICAgfVxuXG4gICAgLy8gUGVyZm9ybXMgdGhlIGxlbmd0aCBvZiBlZGl0IGl0ZXJhdGlvbi4gSXMgYSBiaXQgZnVnbHkgYXMgdGhpcyBoYXMgdG8gc3VwcG9ydCB0aGVcbiAgICAvLyBzeW5jIGFuZCBhc3luYyBtb2RlIHdoaWNoIGlzIG5ldmVyIGZ1bi4gTG9vcHMgb3ZlciBleGVjRWRpdExlbmd0aCB1bnRpbCBhIHZhbHVlXG4gICAgLy8gaXMgcHJvZHVjZWQuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAoZnVuY3Rpb24gZXhlYygpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAvLyBUaGlzIHNob3VsZCBub3QgaGFwcGVuLCBidXQgd2Ugd2FudCB0byBiZSBzYWZlLlxuICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgaWYgKGVkaXRMZW5ndGggPiBtYXhFZGl0TGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWV4ZWNFZGl0TGVuZ3RoKCkpIHtcbiAgICAgICAgICAgIGV4ZWMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDApO1xuICAgICAgfSgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2hpbGUgKGVkaXRMZW5ndGggPD0gbWF4RWRpdExlbmd0aCkge1xuICAgICAgICBsZXQgcmV0ID0gZXhlY0VkaXRMZW5ndGgoKTtcbiAgICAgICAgaWYgKHJldCkge1xuICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgcHVzaENvbXBvbmVudChjb21wb25lbnRzLCBhZGRlZCwgcmVtb3ZlZCkge1xuICAgIGxldCBsYXN0ID0gY29tcG9uZW50c1tjb21wb25lbnRzLmxlbmd0aCAtIDFdO1xuICAgIGlmIChsYXN0ICYmIGxhc3QuYWRkZWQgPT09IGFkZGVkICYmIGxhc3QucmVtb3ZlZCA9PT0gcmVtb3ZlZCkge1xuICAgICAgLy8gV2UgbmVlZCB0byBjbG9uZSBoZXJlIGFzIHRoZSBjb21wb25lbnQgY2xvbmUgb3BlcmF0aW9uIGlzIGp1c3RcbiAgICAgIC8vIGFzIHNoYWxsb3cgYXJyYXkgY2xvbmVcbiAgICAgIGNvbXBvbmVudHNbY29tcG9uZW50cy5sZW5ndGggLSAxXSA9IHtjb3VudDogbGFzdC5jb3VudCArIDEsIGFkZGVkOiBhZGRlZCwgcmVtb3ZlZDogcmVtb3ZlZCB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb21wb25lbnRzLnB1c2goe2NvdW50OiAxLCBhZGRlZDogYWRkZWQsIHJlbW92ZWQ6IHJlbW92ZWQgfSk7XG4gICAgfVxuICB9LFxuICBleHRyYWN0Q29tbW9uKGJhc2VQYXRoLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgZGlhZ29uYWxQYXRoKSB7XG4gICAgbGV0IG5ld0xlbiA9IG5ld1N0cmluZy5sZW5ndGgsXG4gICAgICAgIG9sZExlbiA9IG9sZFN0cmluZy5sZW5ndGgsXG4gICAgICAgIG5ld1BvcyA9IGJhc2VQYXRoLm5ld1BvcyxcbiAgICAgICAgb2xkUG9zID0gbmV3UG9zIC0gZGlhZ29uYWxQYXRoLFxuXG4gICAgICAgIGNvbW1vbkNvdW50ID0gMDtcbiAgICB3aGlsZSAobmV3UG9zICsgMSA8IG5ld0xlbiAmJiBvbGRQb3MgKyAxIDwgb2xkTGVuICYmIHRoaXMuZXF1YWxzKG5ld1N0cmluZ1tuZXdQb3MgKyAxXSwgb2xkU3RyaW5nW29sZFBvcyArIDFdKSkge1xuICAgICAgbmV3UG9zKys7XG4gICAgICBvbGRQb3MrKztcbiAgICAgIGNvbW1vbkNvdW50Kys7XG4gICAgfVxuXG4gICAgaWYgKGNvbW1vbkNvdW50KSB7XG4gICAgICBiYXNlUGF0aC5jb21wb25lbnRzLnB1c2goe2NvdW50OiBjb21tb25Db3VudH0pO1xuICAgIH1cblxuICAgIGJhc2VQYXRoLm5ld1BvcyA9IG5ld1BvcztcbiAgICByZXR1cm4gb2xkUG9zO1xuICB9LFxuXG4gIGVxdWFscyhsZWZ0LCByaWdodCkge1xuICAgIHJldHVybiBsZWZ0ID09PSByaWdodDtcbiAgfSxcbiAgcmVtb3ZlRW1wdHkoYXJyYXkpIHtcbiAgICBsZXQgcmV0ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFycmF5W2ldKSB7XG4gICAgICAgIHJldC5wdXNoKGFycmF5W2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfSxcbiAgY2FzdElucHV0KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9LFxuICB0b2tlbml6ZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5zcGxpdCgnJyk7XG4gIH0sXG4gIGpvaW4oY2hhcnMpIHtcbiAgICByZXR1cm4gY2hhcnMuam9pbignJyk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGJ1aWxkVmFsdWVzKGRpZmYsIGNvbXBvbmVudHMsIG5ld1N0cmluZywgb2xkU3RyaW5nLCB1c2VMb25nZXN0VG9rZW4pIHtcbiAgbGV0IGNvbXBvbmVudFBvcyA9IDAsXG4gICAgICBjb21wb25lbnRMZW4gPSBjb21wb25lbnRzLmxlbmd0aCxcbiAgICAgIG5ld1BvcyA9IDAsXG4gICAgICBvbGRQb3MgPSAwO1xuXG4gIGZvciAoOyBjb21wb25lbnRQb3MgPCBjb21wb25lbnRMZW47IGNvbXBvbmVudFBvcysrKSB7XG4gICAgbGV0IGNvbXBvbmVudCA9IGNvbXBvbmVudHNbY29tcG9uZW50UG9zXTtcbiAgICBpZiAoIWNvbXBvbmVudC5yZW1vdmVkKSB7XG4gICAgICBpZiAoIWNvbXBvbmVudC5hZGRlZCAmJiB1c2VMb25nZXN0VG9rZW4pIHtcbiAgICAgICAgbGV0IHZhbHVlID0gbmV3U3RyaW5nLnNsaWNlKG5ld1BvcywgbmV3UG9zICsgY29tcG9uZW50LmNvdW50KTtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5tYXAoZnVuY3Rpb24odmFsdWUsIGkpIHtcbiAgICAgICAgICBsZXQgb2xkVmFsdWUgPSBvbGRTdHJpbmdbb2xkUG9zICsgaV07XG4gICAgICAgICAgcmV0dXJuIG9sZFZhbHVlLmxlbmd0aCA+IHZhbHVlLmxlbmd0aCA/IG9sZFZhbHVlIDogdmFsdWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbXBvbmVudC52YWx1ZSA9IGRpZmYuam9pbih2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wb25lbnQudmFsdWUgPSBkaWZmLmpvaW4obmV3U3RyaW5nLnNsaWNlKG5ld1BvcywgbmV3UG9zICsgY29tcG9uZW50LmNvdW50KSk7XG4gICAgICB9XG4gICAgICBuZXdQb3MgKz0gY29tcG9uZW50LmNvdW50O1xuXG4gICAgICAvLyBDb21tb24gY2FzZVxuICAgICAgaWYgKCFjb21wb25lbnQuYWRkZWQpIHtcbiAgICAgICAgb2xkUG9zICs9IGNvbXBvbmVudC5jb3VudDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29tcG9uZW50LnZhbHVlID0gZGlmZi5qb2luKG9sZFN0cmluZy5zbGljZShvbGRQb3MsIG9sZFBvcyArIGNvbXBvbmVudC5jb3VudCkpO1xuICAgICAgb2xkUG9zICs9IGNvbXBvbmVudC5jb3VudDtcblxuICAgICAgLy8gUmV2ZXJzZSBhZGQgYW5kIHJlbW92ZSBzbyByZW1vdmVzIGFyZSBvdXRwdXQgZmlyc3QgdG8gbWF0Y2ggY29tbW9uIGNvbnZlbnRpb25cbiAgICAgIC8vIFRoZSBkaWZmaW5nIGFsZ29yaXRobSBpcyB0aWVkIHRvIGFkZCB0aGVuIHJlbW92ZSBvdXRwdXQgYW5kIHRoaXMgaXMgdGhlIHNpbXBsZXN0XG4gICAgICAvLyByb3V0ZSB0byBnZXQgdGhlIGRlc2lyZWQgb3V0cHV0IHdpdGggbWluaW1hbCBvdmVyaGVhZC5cbiAgICAgIGlmIChjb21wb25lbnRQb3MgJiYgY29tcG9uZW50c1tjb21wb25lbnRQb3MgLSAxXS5hZGRlZCkge1xuICAgICAgICBsZXQgdG1wID0gY29tcG9uZW50c1tjb21wb25lbnRQb3MgLSAxXTtcbiAgICAgICAgY29tcG9uZW50c1tjb21wb25lbnRQb3MgLSAxXSA9IGNvbXBvbmVudHNbY29tcG9uZW50UG9zXTtcbiAgICAgICAgY29tcG9uZW50c1tjb21wb25lbnRQb3NdID0gdG1wO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFNwZWNpYWwgY2FzZSBoYW5kbGUgZm9yIHdoZW4gb25lIHRlcm1pbmFsIGlzIGlnbm9yZWQuIEZvciB0aGlzIGNhc2Ugd2UgbWVyZ2UgdGhlXG4gIC8vIHRlcm1pbmFsIGludG8gdGhlIHByaW9yIHN0cmluZyBhbmQgZHJvcCB0aGUgY2hhbmdlLlxuICBsZXQgbGFzdENvbXBvbmVudCA9IGNvbXBvbmVudHNbY29tcG9uZW50TGVuIC0gMV07XG4gIGlmIChjb21wb25lbnRMZW4gPiAxXG4gICAgICAmJiAobGFzdENvbXBvbmVudC5hZGRlZCB8fCBsYXN0Q29tcG9uZW50LnJlbW92ZWQpXG4gICAgICAmJiBkaWZmLmVxdWFscygnJywgbGFzdENvbXBvbmVudC52YWx1ZSkpIHtcbiAgICBjb21wb25lbnRzW2NvbXBvbmVudExlbiAtIDJdLnZhbHVlICs9IGxhc3RDb21wb25lbnQudmFsdWU7XG4gICAgY29tcG9uZW50cy5wb3AoKTtcbiAgfVxuXG4gIHJldHVybiBjb21wb25lbnRzO1xufVxuXG5mdW5jdGlvbiBjbG9uZVBhdGgocGF0aCkge1xuICByZXR1cm4geyBuZXdQb3M6IHBhdGgubmV3UG9zLCBjb21wb25lbnRzOiBwYXRoLmNvbXBvbmVudHMuc2xpY2UoMCkgfTtcbn1cbiIsImltcG9ydCBEaWZmIGZyb20gJy4vYmFzZSc7XG5cbmV4cG9ydCBjb25zdCBjaGFyYWN0ZXJEaWZmID0gbmV3IERpZmYoKTtcbmV4cG9ydCBmdW5jdGlvbiBkaWZmQ2hhcnMob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKSB7IHJldHVybiBjaGFyYWN0ZXJEaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKTsgfVxuIiwiaW1wb3J0IERpZmYgZnJvbSAnLi9iYXNlJztcblxuZXhwb3J0IGNvbnN0IGNzc0RpZmYgPSBuZXcgRGlmZigpO1xuY3NzRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZS5zcGxpdCgvKFt7fTo7LF18XFxzKykvKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWZmQ3NzKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykgeyByZXR1cm4gY3NzRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjayk7IH1cbiIsImltcG9ydCBEaWZmIGZyb20gJy4vYmFzZSc7XG5pbXBvcnQge2xpbmVEaWZmfSBmcm9tICcuL2xpbmUnO1xuXG5jb25zdCBvYmplY3RQcm90b3R5cGVUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cblxuZXhwb3J0IGNvbnN0IGpzb25EaWZmID0gbmV3IERpZmYoKTtcbi8vIERpc2NyaW1pbmF0ZSBiZXR3ZWVuIHR3byBsaW5lcyBvZiBwcmV0dHktcHJpbnRlZCwgc2VyaWFsaXplZCBKU09OIHdoZXJlIG9uZSBvZiB0aGVtIGhhcyBhXG4vLyBkYW5nbGluZyBjb21tYSBhbmQgdGhlIG90aGVyIGRvZXNuJ3QuIFR1cm5zIG91dCBpbmNsdWRpbmcgdGhlIGRhbmdsaW5nIGNvbW1hIHlpZWxkcyB0aGUgbmljZXN0IG91dHB1dDpcbmpzb25EaWZmLnVzZUxvbmdlc3RUb2tlbiA9IHRydWU7XG5cbmpzb25EaWZmLnRva2VuaXplID0gbGluZURpZmYudG9rZW5pemU7XG5qc29uRGlmZi5jYXN0SW5wdXQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBjb25zdCB7dW5kZWZpbmVkUmVwbGFjZW1lbnR9ID0gdGhpcy5vcHRpb25zO1xuXG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gdmFsdWUgOiBKU09OLnN0cmluZ2lmeShjYW5vbmljYWxpemUodmFsdWUpLCBmdW5jdGlvbihrLCB2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZFJlcGxhY2VtZW50O1xuICAgIH1cblxuICAgIHJldHVybiB2O1xuICB9LCAnICAnKTtcbn07XG5qc29uRGlmZi5lcXVhbHMgPSBmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICByZXR1cm4gRGlmZi5wcm90b3R5cGUuZXF1YWxzKGxlZnQucmVwbGFjZSgvLChbXFxyXFxuXSkvZywgJyQxJyksIHJpZ2h0LnJlcGxhY2UoLywoW1xcclxcbl0pL2csICckMScpKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWZmSnNvbihvbGRPYmosIG5ld09iaiwgb3B0aW9ucykgeyByZXR1cm4ganNvbkRpZmYuZGlmZihvbGRPYmosIG5ld09iaiwgb3B0aW9ucyk7IH1cblxuLy8gVGhpcyBmdW5jdGlvbiBoYW5kbGVzIHRoZSBwcmVzZW5jZSBvZiBjaXJjdWxhciByZWZlcmVuY2VzIGJ5IGJhaWxpbmcgb3V0IHdoZW4gZW5jb3VudGVyaW5nIGFuXG4vLyBvYmplY3QgdGhhdCBpcyBhbHJlYWR5IG9uIHRoZSBcInN0YWNrXCIgb2YgaXRlbXMgYmVpbmcgcHJvY2Vzc2VkLlxuZXhwb3J0IGZ1bmN0aW9uIGNhbm9uaWNhbGl6ZShvYmosIHN0YWNrLCByZXBsYWNlbWVudFN0YWNrKSB7XG4gIHN0YWNrID0gc3RhY2sgfHwgW107XG4gIHJlcGxhY2VtZW50U3RhY2sgPSByZXBsYWNlbWVudFN0YWNrIHx8IFtdO1xuXG4gIGxldCBpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkgKz0gMSkge1xuICAgIGlmIChzdGFja1tpXSA9PT0gb2JqKSB7XG4gICAgICByZXR1cm4gcmVwbGFjZW1lbnRTdGFja1tpXTtcbiAgICB9XG4gIH1cblxuICBsZXQgY2Fub25pY2FsaXplZE9iajtcblxuICBpZiAoJ1tvYmplY3QgQXJyYXldJyA9PT0gb2JqZWN0UHJvdG90eXBlVG9TdHJpbmcuY2FsbChvYmopKSB7XG4gICAgc3RhY2sucHVzaChvYmopO1xuICAgIGNhbm9uaWNhbGl6ZWRPYmogPSBuZXcgQXJyYXkob2JqLmxlbmd0aCk7XG4gICAgcmVwbGFjZW1lbnRTdGFjay5wdXNoKGNhbm9uaWNhbGl6ZWRPYmopO1xuICAgIGZvciAoaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGNhbm9uaWNhbGl6ZWRPYmpbaV0gPSBjYW5vbmljYWxpemUob2JqW2ldLCBzdGFjaywgcmVwbGFjZW1lbnRTdGFjayk7XG4gICAgfVxuICAgIHN0YWNrLnBvcCgpO1xuICAgIHJlcGxhY2VtZW50U3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIGNhbm9uaWNhbGl6ZWRPYmo7XG4gIH1cblxuICBpZiAob2JqICYmIG9iai50b0pTT04pIHtcbiAgICBvYmogPSBvYmoudG9KU09OKCk7XG4gIH1cblxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgb2JqICE9PSBudWxsKSB7XG4gICAgc3RhY2sucHVzaChvYmopO1xuICAgIGNhbm9uaWNhbGl6ZWRPYmogPSB7fTtcbiAgICByZXBsYWNlbWVudFN0YWNrLnB1c2goY2Fub25pY2FsaXplZE9iaik7XG4gICAgbGV0IHNvcnRlZEtleXMgPSBbXSxcbiAgICAgICAga2V5O1xuICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBzb3J0ZWRLZXlzLnB1c2goa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgc29ydGVkS2V5cy5zb3J0KCk7XG4gICAgZm9yIChpID0gMDsgaSA8IHNvcnRlZEtleXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGtleSA9IHNvcnRlZEtleXNbaV07XG4gICAgICBjYW5vbmljYWxpemVkT2JqW2tleV0gPSBjYW5vbmljYWxpemUob2JqW2tleV0sIHN0YWNrLCByZXBsYWNlbWVudFN0YWNrKTtcbiAgICB9XG4gICAgc3RhY2sucG9wKCk7XG4gICAgcmVwbGFjZW1lbnRTdGFjay5wb3AoKTtcbiAgfSBlbHNlIHtcbiAgICBjYW5vbmljYWxpemVkT2JqID0gb2JqO1xuICB9XG4gIHJldHVybiBjYW5vbmljYWxpemVkT2JqO1xufVxuIiwiaW1wb3J0IERpZmYgZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7Z2VuZXJhdGVPcHRpb25zfSBmcm9tICcuLi91dGlsL3BhcmFtcyc7XG5cbmV4cG9ydCBjb25zdCBsaW5lRGlmZiA9IG5ldyBEaWZmKCk7XG5saW5lRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGxldCByZXRMaW5lcyA9IFtdLFxuICAgICAgbGluZXNBbmROZXdsaW5lcyA9IHZhbHVlLnNwbGl0KC8oXFxufFxcclxcbikvKTtcblxuICAvLyBJZ25vcmUgdGhlIGZpbmFsIGVtcHR5IHRva2VuIHRoYXQgb2NjdXJzIGlmIHRoZSBzdHJpbmcgZW5kcyB3aXRoIGEgbmV3IGxpbmVcbiAgaWYgKCFsaW5lc0FuZE5ld2xpbmVzW2xpbmVzQW5kTmV3bGluZXMubGVuZ3RoIC0gMV0pIHtcbiAgICBsaW5lc0FuZE5ld2xpbmVzLnBvcCgpO1xuICB9XG5cbiAgLy8gTWVyZ2UgdGhlIGNvbnRlbnQgYW5kIGxpbmUgc2VwYXJhdG9ycyBpbnRvIHNpbmdsZSB0b2tlbnNcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lc0FuZE5ld2xpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGxpbmUgPSBsaW5lc0FuZE5ld2xpbmVzW2ldO1xuXG4gICAgaWYgKGkgJSAyICYmICF0aGlzLm9wdGlvbnMubmV3bGluZUlzVG9rZW4pIHtcbiAgICAgIHJldExpbmVzW3JldExpbmVzLmxlbmd0aCAtIDFdICs9IGxpbmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaWdub3JlV2hpdGVzcGFjZSkge1xuICAgICAgICBsaW5lID0gbGluZS50cmltKCk7XG4gICAgICB9XG4gICAgICByZXRMaW5lcy5wdXNoKGxpbmUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXRMaW5lcztcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWZmTGluZXMob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKSB7IHJldHVybiBsaW5lRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjayk7IH1cbmV4cG9ydCBmdW5jdGlvbiBkaWZmVHJpbW1lZExpbmVzKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykge1xuICBsZXQgb3B0aW9ucyA9IGdlbmVyYXRlT3B0aW9ucyhjYWxsYmFjaywge2lnbm9yZVdoaXRlc3BhY2U6IHRydWV9KTtcbiAgcmV0dXJuIGxpbmVEaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIsIG9wdGlvbnMpO1xufVxuIiwiaW1wb3J0IERpZmYgZnJvbSAnLi9iYXNlJztcblxuXG5leHBvcnQgY29uc3Qgc2VudGVuY2VEaWZmID0gbmV3IERpZmYoKTtcbnNlbnRlbmNlRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZS5zcGxpdCgvKFxcUy4rP1suIT9dKSg/PVxccyt8JCkvKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWZmU2VudGVuY2VzKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykgeyByZXR1cm4gc2VudGVuY2VEaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKTsgfVxuIiwiaW1wb3J0IERpZmYgZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7Z2VuZXJhdGVPcHRpb25zfSBmcm9tICcuLi91dGlsL3BhcmFtcyc7XG5cbi8vIEJhc2VkIG9uIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0xhdGluX3NjcmlwdF9pbl9Vbmljb2RlXG4vL1xuLy8gUmFuZ2VzIGFuZCBleGNlcHRpb25zOlxuLy8gTGF0aW4tMSBTdXBwbGVtZW50LCAwMDgw4oCTMDBGRlxuLy8gIC0gVSswMEQ3ICDDlyBNdWx0aXBsaWNhdGlvbiBzaWduXG4vLyAgLSBVKzAwRjcgIMO3IERpdmlzaW9uIHNpZ25cbi8vIExhdGluIEV4dGVuZGVkLUEsIDAxMDDigJMwMTdGXG4vLyBMYXRpbiBFeHRlbmRlZC1CLCAwMTgw4oCTMDI0RlxuLy8gSVBBIEV4dGVuc2lvbnMsIDAyNTDigJMwMkFGXG4vLyBTcGFjaW5nIE1vZGlmaWVyIExldHRlcnMsIDAyQjDigJMwMkZGXG4vLyAgLSBVKzAyQzcgIMuHICYjNzExOyAgQ2Fyb25cbi8vICAtIFUrMDJEOCAgy5ggJiM3Mjg7ICBCcmV2ZVxuLy8gIC0gVSswMkQ5ICDLmSAmIzcyOTsgIERvdCBBYm92ZVxuLy8gIC0gVSswMkRBICDLmiAmIzczMDsgIFJpbmcgQWJvdmVcbi8vICAtIFUrMDJEQiAgy5sgJiM3MzE7ICBPZ29uZWtcbi8vICAtIFUrMDJEQyAgy5wgJiM3MzI7ICBTbWFsbCBUaWxkZVxuLy8gIC0gVSswMkREICDLnSAmIzczMzsgIERvdWJsZSBBY3V0ZSBBY2NlbnRcbi8vIExhdGluIEV4dGVuZGVkIEFkZGl0aW9uYWwsIDFFMDDigJMxRUZGXG5jb25zdCBleHRlbmRlZFdvcmRDaGFycyA9IC9eW2EtekEtWlxcdXtDMH0tXFx1e0ZGfVxcdXtEOH0tXFx1e0Y2fVxcdXtGOH0tXFx1ezJDNn1cXHV7MkM4fS1cXHV7MkQ3fVxcdXsyREV9LVxcdXsyRkZ9XFx1ezFFMDB9LVxcdXsxRUZGfV0rJC91O1xuXG5jb25zdCByZVdoaXRlc3BhY2UgPSAvXFxTLztcblxuZXhwb3J0IGNvbnN0IHdvcmREaWZmID0gbmV3IERpZmYoKTtcbndvcmREaWZmLmVxdWFscyA9IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiBsZWZ0ID09PSByaWdodCB8fCAodGhpcy5vcHRpb25zLmlnbm9yZVdoaXRlc3BhY2UgJiYgIXJlV2hpdGVzcGFjZS50ZXN0KGxlZnQpICYmICFyZVdoaXRlc3BhY2UudGVzdChyaWdodCkpO1xufTtcbndvcmREaWZmLnRva2VuaXplID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgbGV0IHRva2VucyA9IHZhbHVlLnNwbGl0KC8oXFxzK3xcXGIpLyk7XG5cbiAgLy8gSm9pbiB0aGUgYm91bmRhcnkgc3BsaXRzIHRoYXQgd2UgZG8gbm90IGNvbnNpZGVyIHRvIGJlIGJvdW5kYXJpZXMuIFRoaXMgaXMgcHJpbWFyaWx5IHRoZSBleHRlbmRlZCBMYXRpbiBjaGFyYWN0ZXIgc2V0LlxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAvLyBJZiB3ZSBoYXZlIGFuIGVtcHR5IHN0cmluZyBpbiB0aGUgbmV4dCBmaWVsZCBhbmQgd2UgaGF2ZSBvbmx5IHdvcmQgY2hhcnMgYmVmb3JlIGFuZCBhZnRlciwgbWVyZ2VcbiAgICBpZiAoIXRva2Vuc1tpICsgMV0gJiYgdG9rZW5zW2kgKyAyXVxuICAgICAgICAgICYmIGV4dGVuZGVkV29yZENoYXJzLnRlc3QodG9rZW5zW2ldKVxuICAgICAgICAgICYmIGV4dGVuZGVkV29yZENoYXJzLnRlc3QodG9rZW5zW2kgKyAyXSkpIHtcbiAgICAgIHRva2Vuc1tpXSArPSB0b2tlbnNbaSArIDJdO1xuICAgICAgdG9rZW5zLnNwbGljZShpICsgMSwgMik7XG4gICAgICBpLS07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRva2Vucztcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBkaWZmV29yZHMob2xkU3RyLCBuZXdTdHIsIGNhbGxiYWNrKSB7XG4gIGxldCBvcHRpb25zID0gZ2VuZXJhdGVPcHRpb25zKGNhbGxiYWNrLCB7aWdub3JlV2hpdGVzcGFjZTogdHJ1ZX0pO1xuICByZXR1cm4gd29yZERpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgb3B0aW9ucyk7XG59XG5leHBvcnQgZnVuY3Rpb24gZGlmZldvcmRzV2l0aFNwYWNlKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykge1xuICByZXR1cm4gd29yZERpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spO1xufVxuIiwiLyogU2VlIExJQ0VOU0UgZmlsZSBmb3IgdGVybXMgb2YgdXNlICovXG5cbi8qXG4gKiBUZXh0IGRpZmYgaW1wbGVtZW50YXRpb24uXG4gKlxuICogVGhpcyBsaWJyYXJ5IHN1cHBvcnRzIHRoZSBmb2xsb3dpbmcgQVBJUzpcbiAqIEpzRGlmZi5kaWZmQ2hhcnM6IENoYXJhY3RlciBieSBjaGFyYWN0ZXIgZGlmZlxuICogSnNEaWZmLmRpZmZXb3JkczogV29yZCAoYXMgZGVmaW5lZCBieSBcXGIgcmVnZXgpIGRpZmYgd2hpY2ggaWdub3JlcyB3aGl0ZXNwYWNlXG4gKiBKc0RpZmYuZGlmZkxpbmVzOiBMaW5lIGJhc2VkIGRpZmZcbiAqXG4gKiBKc0RpZmYuZGlmZkNzczogRGlmZiB0YXJnZXRlZCBhdCBDU1MgY29udGVudFxuICpcbiAqIFRoZXNlIG1ldGhvZHMgYXJlIGJhc2VkIG9uIHRoZSBpbXBsZW1lbnRhdGlvbiBwcm9wb3NlZCBpblxuICogXCJBbiBPKE5EKSBEaWZmZXJlbmNlIEFsZ29yaXRobSBhbmQgaXRzIFZhcmlhdGlvbnNcIiAoTXllcnMsIDE5ODYpLlxuICogaHR0cDovL2NpdGVzZWVyeC5pc3QucHN1LmVkdS92aWV3ZG9jL3N1bW1hcnk/ZG9pPTEwLjEuMS40LjY5MjdcbiAqL1xuaW1wb3J0IERpZmYgZnJvbSAnLi9kaWZmL2Jhc2UnO1xuaW1wb3J0IHtkaWZmQ2hhcnN9IGZyb20gJy4vZGlmZi9jaGFyYWN0ZXInO1xuaW1wb3J0IHtkaWZmV29yZHMsIGRpZmZXb3Jkc1dpdGhTcGFjZX0gZnJvbSAnLi9kaWZmL3dvcmQnO1xuaW1wb3J0IHtkaWZmTGluZXMsIGRpZmZUcmltbWVkTGluZXN9IGZyb20gJy4vZGlmZi9saW5lJztcbmltcG9ydCB7ZGlmZlNlbnRlbmNlc30gZnJvbSAnLi9kaWZmL3NlbnRlbmNlJztcblxuaW1wb3J0IHtkaWZmQ3NzfSBmcm9tICcuL2RpZmYvY3NzJztcbmltcG9ydCB7ZGlmZkpzb24sIGNhbm9uaWNhbGl6ZX0gZnJvbSAnLi9kaWZmL2pzb24nO1xuXG5pbXBvcnQge2RpZmZBcnJheXN9IGZyb20gJy4vZGlmZi9hcnJheSc7XG5cbmltcG9ydCB7YXBwbHlQYXRjaCwgYXBwbHlQYXRjaGVzfSBmcm9tICcuL3BhdGNoL2FwcGx5JztcbmltcG9ydCB7cGFyc2VQYXRjaH0gZnJvbSAnLi9wYXRjaC9wYXJzZSc7XG5pbXBvcnQge3N0cnVjdHVyZWRQYXRjaCwgY3JlYXRlVHdvRmlsZXNQYXRjaCwgY3JlYXRlUGF0Y2h9IGZyb20gJy4vcGF0Y2gvY3JlYXRlJztcblxuaW1wb3J0IHtjb252ZXJ0Q2hhbmdlc1RvRE1QfSBmcm9tICcuL2NvbnZlcnQvZG1wJztcbmltcG9ydCB7Y29udmVydENoYW5nZXNUb1hNTH0gZnJvbSAnLi9jb252ZXJ0L3htbCc7XG5cbmV4cG9ydCB7XG4gIERpZmYsXG5cbiAgZGlmZkNoYXJzLFxuICBkaWZmV29yZHMsXG4gIGRpZmZXb3Jkc1dpdGhTcGFjZSxcbiAgZGlmZkxpbmVzLFxuICBkaWZmVHJpbW1lZExpbmVzLFxuICBkaWZmU2VudGVuY2VzLFxuXG4gIGRpZmZDc3MsXG4gIGRpZmZKc29uLFxuXG4gIGRpZmZBcnJheXMsXG5cbiAgc3RydWN0dXJlZFBhdGNoLFxuICBjcmVhdGVUd29GaWxlc1BhdGNoLFxuICBjcmVhdGVQYXRjaCxcbiAgYXBwbHlQYXRjaCxcbiAgYXBwbHlQYXRjaGVzLFxuICBwYXJzZVBhdGNoLFxuICBjb252ZXJ0Q2hhbmdlc1RvRE1QLFxuICBjb252ZXJ0Q2hhbmdlc1RvWE1MLFxuICBjYW5vbmljYWxpemVcbn07XG4iLCJpbXBvcnQge3BhcnNlUGF0Y2h9IGZyb20gJy4vcGFyc2UnO1xuaW1wb3J0IGRpc3RhbmNlSXRlcmF0b3IgZnJvbSAnLi4vdXRpbC9kaXN0YW5jZS1pdGVyYXRvcic7XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVBhdGNoKHNvdXJjZSwgdW5pRGlmZiwgb3B0aW9ucyA9IHt9KSB7XG4gIGlmICh0eXBlb2YgdW5pRGlmZiA9PT0gJ3N0cmluZycpIHtcbiAgICB1bmlEaWZmID0gcGFyc2VQYXRjaCh1bmlEaWZmKTtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHVuaURpZmYpKSB7XG4gICAgaWYgKHVuaURpZmYubGVuZ3RoID4gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdhcHBseVBhdGNoIG9ubHkgd29ya3Mgd2l0aCBhIHNpbmdsZSBpbnB1dC4nKTtcbiAgICB9XG5cbiAgICB1bmlEaWZmID0gdW5pRGlmZlswXTtcbiAgfVxuXG4gIC8vIEFwcGx5IHRoZSBkaWZmIHRvIHRoZSBpbnB1dFxuICBsZXQgbGluZXMgPSBzb3VyY2Uuc3BsaXQoL1xcclxcbnxbXFxuXFx2XFxmXFxyXFx4ODVdLyksXG4gICAgICBkZWxpbWl0ZXJzID0gc291cmNlLm1hdGNoKC9cXHJcXG58W1xcblxcdlxcZlxcclxceDg1XS9nKSB8fCBbXSxcbiAgICAgIGh1bmtzID0gdW5pRGlmZi5odW5rcyxcblxuICAgICAgY29tcGFyZUxpbmUgPSBvcHRpb25zLmNvbXBhcmVMaW5lIHx8ICgobGluZU51bWJlciwgbGluZSwgb3BlcmF0aW9uLCBwYXRjaENvbnRlbnQpID0+IGxpbmUgPT09IHBhdGNoQ29udGVudCksXG4gICAgICBlcnJvckNvdW50ID0gMCxcbiAgICAgIGZ1enpGYWN0b3IgPSBvcHRpb25zLmZ1enpGYWN0b3IgfHwgMCxcbiAgICAgIG1pbkxpbmUgPSAwLFxuICAgICAgb2Zmc2V0ID0gMCxcblxuICAgICAgcmVtb3ZlRU9GTkwsXG4gICAgICBhZGRFT0ZOTDtcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBodW5rIGV4YWN0bHkgZml0cyBvbiB0aGUgcHJvdmlkZWQgbG9jYXRpb25cbiAgICovXG4gIGZ1bmN0aW9uIGh1bmtGaXRzKGh1bmssIHRvUG9zKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBodW5rLmxpbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICBsZXQgbGluZSA9IGh1bmsubGluZXNbal0sXG4gICAgICAgICAgb3BlcmF0aW9uID0gbGluZVswXSxcbiAgICAgICAgICBjb250ZW50ID0gbGluZS5zdWJzdHIoMSk7XG5cbiAgICAgIGlmIChvcGVyYXRpb24gPT09ICcgJyB8fCBvcGVyYXRpb24gPT09ICctJykge1xuICAgICAgICAvLyBDb250ZXh0IHNhbml0eSBjaGVja1xuICAgICAgICBpZiAoIWNvbXBhcmVMaW5lKHRvUG9zICsgMSwgbGluZXNbdG9Qb3NdLCBvcGVyYXRpb24sIGNvbnRlbnQpKSB7XG4gICAgICAgICAgZXJyb3JDb3VudCsrO1xuXG4gICAgICAgICAgaWYgKGVycm9yQ291bnQgPiBmdXp6RmFjdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRvUG9zKys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBTZWFyY2ggYmVzdCBmaXQgb2Zmc2V0cyBmb3IgZWFjaCBodW5rIGJhc2VkIG9uIHRoZSBwcmV2aW91cyBvbmVzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaHVua3MubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgaHVuayA9IGh1bmtzW2ldLFxuICAgICAgICBtYXhMaW5lID0gbGluZXMubGVuZ3RoIC0gaHVuay5vbGRMaW5lcyxcbiAgICAgICAgbG9jYWxPZmZzZXQgPSAwLFxuICAgICAgICB0b1BvcyA9IG9mZnNldCArIGh1bmsub2xkU3RhcnQgLSAxO1xuXG4gICAgbGV0IGl0ZXJhdG9yID0gZGlzdGFuY2VJdGVyYXRvcih0b1BvcywgbWluTGluZSwgbWF4TGluZSk7XG5cbiAgICBmb3IgKDsgbG9jYWxPZmZzZXQgIT09IHVuZGVmaW5lZDsgbG9jYWxPZmZzZXQgPSBpdGVyYXRvcigpKSB7XG4gICAgICBpZiAoaHVua0ZpdHMoaHVuaywgdG9Qb3MgKyBsb2NhbE9mZnNldCkpIHtcbiAgICAgICAgaHVuay5vZmZzZXQgPSBvZmZzZXQgKz0gbG9jYWxPZmZzZXQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsb2NhbE9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gU2V0IGxvd2VyIHRleHQgbGltaXQgdG8gZW5kIG9mIHRoZSBjdXJyZW50IGh1bmssIHNvIG5leHQgb25lcyBkb24ndCB0cnlcbiAgICAvLyB0byBmaXQgb3ZlciBhbHJlYWR5IHBhdGNoZWQgdGV4dFxuICAgIG1pbkxpbmUgPSBodW5rLm9mZnNldCArIGh1bmsub2xkU3RhcnQgKyBodW5rLm9sZExpbmVzO1xuICB9XG5cbiAgLy8gQXBwbHkgcGF0Y2ggaHVua3NcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBodW5rcy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBodW5rID0gaHVua3NbaV0sXG4gICAgICAgIHRvUG9zID0gaHVuay5vZmZzZXQgKyBodW5rLm5ld1N0YXJ0IC0gMTtcbiAgICBpZiAoaHVuay5uZXdMaW5lcyA9PSAwKSB7IHRvUG9zKys7IH1cblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgaHVuay5saW5lcy5sZW5ndGg7IGorKykge1xuICAgICAgbGV0IGxpbmUgPSBodW5rLmxpbmVzW2pdLFxuICAgICAgICAgIG9wZXJhdGlvbiA9IGxpbmVbMF0sXG4gICAgICAgICAgY29udGVudCA9IGxpbmUuc3Vic3RyKDEpLFxuICAgICAgICAgIGRlbGltaXRlciA9IGh1bmsubGluZWRlbGltaXRlcnNbal07XG5cbiAgICAgIGlmIChvcGVyYXRpb24gPT09ICcgJykge1xuICAgICAgICB0b1BvcysrO1xuICAgICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09ICctJykge1xuICAgICAgICBsaW5lcy5zcGxpY2UodG9Qb3MsIDEpO1xuICAgICAgICBkZWxpbWl0ZXJzLnNwbGljZSh0b1BvcywgMSk7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09ICcrJykge1xuICAgICAgICBsaW5lcy5zcGxpY2UodG9Qb3MsIDAsIGNvbnRlbnQpO1xuICAgICAgICBkZWxpbWl0ZXJzLnNwbGljZSh0b1BvcywgMCwgZGVsaW1pdGVyKTtcbiAgICAgICAgdG9Qb3MrKztcbiAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSAnXFxcXCcpIHtcbiAgICAgICAgbGV0IHByZXZpb3VzT3BlcmF0aW9uID0gaHVuay5saW5lc1tqIC0gMV0gPyBodW5rLmxpbmVzW2ogLSAxXVswXSA6IG51bGw7XG4gICAgICAgIGlmIChwcmV2aW91c09wZXJhdGlvbiA9PT0gJysnKSB7XG4gICAgICAgICAgcmVtb3ZlRU9GTkwgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHByZXZpb3VzT3BlcmF0aW9uID09PSAnLScpIHtcbiAgICAgICAgICBhZGRFT0ZOTCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBIYW5kbGUgRU9GTkwgaW5zZXJ0aW9uL3JlbW92YWxcbiAgaWYgKHJlbW92ZUVPRk5MKSB7XG4gICAgd2hpbGUgKCFsaW5lc1tsaW5lcy5sZW5ndGggLSAxXSkge1xuICAgICAgbGluZXMucG9wKCk7XG4gICAgICBkZWxpbWl0ZXJzLnBvcCgpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChhZGRFT0ZOTCkge1xuICAgIGxpbmVzLnB1c2goJycpO1xuICAgIGRlbGltaXRlcnMucHVzaCgnXFxuJyk7XG4gIH1cbiAgZm9yIChsZXQgX2sgPSAwOyBfayA8IGxpbmVzLmxlbmd0aCAtIDE7IF9rKyspIHtcbiAgICBsaW5lc1tfa10gPSBsaW5lc1tfa10gKyBkZWxpbWl0ZXJzW19rXTtcbiAgfVxuICByZXR1cm4gbGluZXMuam9pbignJyk7XG59XG5cbi8vIFdyYXBwZXIgdGhhdCBzdXBwb3J0cyBtdWx0aXBsZSBmaWxlIHBhdGNoZXMgdmlhIGNhbGxiYWNrcy5cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVBhdGNoZXModW5pRGlmZiwgb3B0aW9ucykge1xuICBpZiAodHlwZW9mIHVuaURpZmYgPT09ICdzdHJpbmcnKSB7XG4gICAgdW5pRGlmZiA9IHBhcnNlUGF0Y2godW5pRGlmZik7XG4gIH1cblxuICBsZXQgY3VycmVudEluZGV4ID0gMDtcbiAgZnVuY3Rpb24gcHJvY2Vzc0luZGV4KCkge1xuICAgIGxldCBpbmRleCA9IHVuaURpZmZbY3VycmVudEluZGV4KytdO1xuICAgIGlmICghaW5kZXgpIHtcbiAgICAgIHJldHVybiBvcHRpb25zLmNvbXBsZXRlKCk7XG4gICAgfVxuXG4gICAgb3B0aW9ucy5sb2FkRmlsZShpbmRleCwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLmNvbXBsZXRlKGVycik7XG4gICAgICB9XG5cbiAgICAgIGxldCB1cGRhdGVkQ29udGVudCA9IGFwcGx5UGF0Y2goZGF0YSwgaW5kZXgsIG9wdGlvbnMpO1xuICAgICAgb3B0aW9ucy5wYXRjaGVkKGluZGV4LCB1cGRhdGVkQ29udGVudCwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gb3B0aW9ucy5jb21wbGV0ZShlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvY2Vzc0luZGV4KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBwcm9jZXNzSW5kZXgoKTtcbn1cbiIsImltcG9ydCB7ZGlmZkxpbmVzfSBmcm9tICcuLi9kaWZmL2xpbmUnO1xuXG5leHBvcnQgZnVuY3Rpb24gc3RydWN0dXJlZFBhdGNoKG9sZEZpbGVOYW1lLCBuZXdGaWxlTmFtZSwgb2xkU3RyLCBuZXdTdHIsIG9sZEhlYWRlciwgbmV3SGVhZGVyLCBvcHRpb25zKSB7XG4gIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuICBpZiAodHlwZW9mIG9wdGlvbnMuY29udGV4dCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBvcHRpb25zLmNvbnRleHQgPSA0O1xuICB9XG5cbiAgY29uc3QgZGlmZiA9IGRpZmZMaW5lcyhvbGRTdHIsIG5ld1N0ciwgb3B0aW9ucyk7XG4gIGRpZmYucHVzaCh7dmFsdWU6ICcnLCBsaW5lczogW119KTsgICAvLyBBcHBlbmQgYW4gZW1wdHkgdmFsdWUgdG8gbWFrZSBjbGVhbnVwIGVhc2llclxuXG4gIGZ1bmN0aW9uIGNvbnRleHRMaW5lcyhsaW5lcykge1xuICAgIHJldHVybiBsaW5lcy5tYXAoZnVuY3Rpb24oZW50cnkpIHsgcmV0dXJuICcgJyArIGVudHJ5OyB9KTtcbiAgfVxuXG4gIGxldCBodW5rcyA9IFtdO1xuICBsZXQgb2xkUmFuZ2VTdGFydCA9IDAsIG5ld1JhbmdlU3RhcnQgPSAwLCBjdXJSYW5nZSA9IFtdLFxuICAgICAgb2xkTGluZSA9IDEsIG5ld0xpbmUgPSAxO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpZmYubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXJyZW50ID0gZGlmZltpXSxcbiAgICAgICAgICBsaW5lcyA9IGN1cnJlbnQubGluZXMgfHwgY3VycmVudC52YWx1ZS5yZXBsYWNlKC9cXG4kLywgJycpLnNwbGl0KCdcXG4nKTtcbiAgICBjdXJyZW50LmxpbmVzID0gbGluZXM7XG5cbiAgICBpZiAoY3VycmVudC5hZGRlZCB8fCBjdXJyZW50LnJlbW92ZWQpIHtcbiAgICAgIC8vIElmIHdlIGhhdmUgcHJldmlvdXMgY29udGV4dCwgc3RhcnQgd2l0aCB0aGF0XG4gICAgICBpZiAoIW9sZFJhbmdlU3RhcnQpIHtcbiAgICAgICAgY29uc3QgcHJldiA9IGRpZmZbaSAtIDFdO1xuICAgICAgICBvbGRSYW5nZVN0YXJ0ID0gb2xkTGluZTtcbiAgICAgICAgbmV3UmFuZ2VTdGFydCA9IG5ld0xpbmU7XG5cbiAgICAgICAgaWYgKHByZXYpIHtcbiAgICAgICAgICBjdXJSYW5nZSA9IG9wdGlvbnMuY29udGV4dCA+IDAgPyBjb250ZXh0TGluZXMocHJldi5saW5lcy5zbGljZSgtb3B0aW9ucy5jb250ZXh0KSkgOiBbXTtcbiAgICAgICAgICBvbGRSYW5nZVN0YXJ0IC09IGN1clJhbmdlLmxlbmd0aDtcbiAgICAgICAgICBuZXdSYW5nZVN0YXJ0IC09IGN1clJhbmdlLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBPdXRwdXQgb3VyIGNoYW5nZXNcbiAgICAgIGN1clJhbmdlLnB1c2goLi4uIGxpbmVzLm1hcChmdW5jdGlvbihlbnRyeSkge1xuICAgICAgICByZXR1cm4gKGN1cnJlbnQuYWRkZWQgPyAnKycgOiAnLScpICsgZW50cnk7XG4gICAgICB9KSk7XG5cbiAgICAgIC8vIFRyYWNrIHRoZSB1cGRhdGVkIGZpbGUgcG9zaXRpb25cbiAgICAgIGlmIChjdXJyZW50LmFkZGVkKSB7XG4gICAgICAgIG5ld0xpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2xkTGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElkZW50aWNhbCBjb250ZXh0IGxpbmVzLiBUcmFjayBsaW5lIGNoYW5nZXNcbiAgICAgIGlmIChvbGRSYW5nZVN0YXJ0KSB7XG4gICAgICAgIC8vIENsb3NlIG91dCBhbnkgY2hhbmdlcyB0aGF0IGhhdmUgYmVlbiBvdXRwdXQgKG9yIGpvaW4gb3ZlcmxhcHBpbmcpXG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGggPD0gb3B0aW9ucy5jb250ZXh0ICogMiAmJiBpIDwgZGlmZi5sZW5ndGggLSAyKSB7XG4gICAgICAgICAgLy8gT3ZlcmxhcHBpbmdcbiAgICAgICAgICBjdXJSYW5nZS5wdXNoKC4uLiBjb250ZXh0TGluZXMobGluZXMpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBlbmQgdGhlIHJhbmdlIGFuZCBvdXRwdXRcbiAgICAgICAgICBsZXQgY29udGV4dFNpemUgPSBNYXRoLm1pbihsaW5lcy5sZW5ndGgsIG9wdGlvbnMuY29udGV4dCk7XG4gICAgICAgICAgY3VyUmFuZ2UucHVzaCguLi4gY29udGV4dExpbmVzKGxpbmVzLnNsaWNlKDAsIGNvbnRleHRTaXplKSkpO1xuXG4gICAgICAgICAgbGV0IGh1bmsgPSB7XG4gICAgICAgICAgICBvbGRTdGFydDogb2xkUmFuZ2VTdGFydCxcbiAgICAgICAgICAgIG9sZExpbmVzOiAob2xkTGluZSAtIG9sZFJhbmdlU3RhcnQgKyBjb250ZXh0U2l6ZSksXG4gICAgICAgICAgICBuZXdTdGFydDogbmV3UmFuZ2VTdGFydCxcbiAgICAgICAgICAgIG5ld0xpbmVzOiAobmV3TGluZSAtIG5ld1JhbmdlU3RhcnQgKyBjb250ZXh0U2l6ZSksXG4gICAgICAgICAgICBsaW5lczogY3VyUmFuZ2VcbiAgICAgICAgICB9O1xuICAgICAgICAgIGlmIChpID49IGRpZmYubGVuZ3RoIC0gMiAmJiBsaW5lcy5sZW5ndGggPD0gb3B0aW9ucy5jb250ZXh0KSB7XG4gICAgICAgICAgICAvLyBFT0YgaXMgaW5zaWRlIHRoaXMgaHVua1xuICAgICAgICAgICAgbGV0IG9sZEVPRk5ld2xpbmUgPSAoL1xcbiQvLnRlc3Qob2xkU3RyKSk7XG4gICAgICAgICAgICBsZXQgbmV3RU9GTmV3bGluZSA9ICgvXFxuJC8udGVzdChuZXdTdHIpKTtcbiAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT0gMCAmJiAhb2xkRU9GTmV3bGluZSkge1xuICAgICAgICAgICAgICAvLyBzcGVjaWFsIGNhc2U6IG9sZCBoYXMgbm8gZW9sIGFuZCBubyB0cmFpbGluZyBjb250ZXh0OyBuby1ubCBjYW4gZW5kIHVwIGJlZm9yZSBhZGRzXG4gICAgICAgICAgICAgIGN1clJhbmdlLnNwbGljZShodW5rLm9sZExpbmVzLCAwLCAnXFxcXCBObyBuZXdsaW5lIGF0IGVuZCBvZiBmaWxlJyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFvbGRFT0ZOZXdsaW5lIHx8ICFuZXdFT0ZOZXdsaW5lKSB7XG4gICAgICAgICAgICAgIGN1clJhbmdlLnB1c2goJ1xcXFwgTm8gbmV3bGluZSBhdCBlbmQgb2YgZmlsZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBodW5rcy5wdXNoKGh1bmspO1xuXG4gICAgICAgICAgb2xkUmFuZ2VTdGFydCA9IDA7XG4gICAgICAgICAgbmV3UmFuZ2VTdGFydCA9IDA7XG4gICAgICAgICAgY3VyUmFuZ2UgPSBbXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgb2xkTGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgICBuZXdMaW5lICs9IGxpbmVzLmxlbmd0aDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG9sZEZpbGVOYW1lOiBvbGRGaWxlTmFtZSwgbmV3RmlsZU5hbWU6IG5ld0ZpbGVOYW1lLFxuICAgIG9sZEhlYWRlcjogb2xkSGVhZGVyLCBuZXdIZWFkZXI6IG5ld0hlYWRlcixcbiAgICBodW5rczogaHVua3NcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVR3b0ZpbGVzUGF0Y2gob2xkRmlsZU5hbWUsIG5ld0ZpbGVOYW1lLCBvbGRTdHIsIG5ld1N0ciwgb2xkSGVhZGVyLCBuZXdIZWFkZXIsIG9wdGlvbnMpIHtcbiAgY29uc3QgZGlmZiA9IHN0cnVjdHVyZWRQYXRjaChvbGRGaWxlTmFtZSwgbmV3RmlsZU5hbWUsIG9sZFN0ciwgbmV3U3RyLCBvbGRIZWFkZXIsIG5ld0hlYWRlciwgb3B0aW9ucyk7XG5cbiAgY29uc3QgcmV0ID0gW107XG4gIGlmIChvbGRGaWxlTmFtZSA9PSBuZXdGaWxlTmFtZSkge1xuICAgIHJldC5wdXNoKCdJbmRleDogJyArIG9sZEZpbGVOYW1lKTtcbiAgfVxuICByZXQucHVzaCgnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PScpO1xuICByZXQucHVzaCgnLS0tICcgKyBkaWZmLm9sZEZpbGVOYW1lICsgKHR5cGVvZiBkaWZmLm9sZEhlYWRlciA9PT0gJ3VuZGVmaW5lZCcgPyAnJyA6ICdcXHQnICsgZGlmZi5vbGRIZWFkZXIpKTtcbiAgcmV0LnB1c2goJysrKyAnICsgZGlmZi5uZXdGaWxlTmFtZSArICh0eXBlb2YgZGlmZi5uZXdIZWFkZXIgPT09ICd1bmRlZmluZWQnID8gJycgOiAnXFx0JyArIGRpZmYubmV3SGVhZGVyKSk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaWZmLmh1bmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaHVuayA9IGRpZmYuaHVua3NbaV07XG4gICAgcmV0LnB1c2goXG4gICAgICAnQEAgLScgKyBodW5rLm9sZFN0YXJ0ICsgJywnICsgaHVuay5vbGRMaW5lc1xuICAgICAgKyAnICsnICsgaHVuay5uZXdTdGFydCArICcsJyArIGh1bmsubmV3TGluZXNcbiAgICAgICsgJyBAQCdcbiAgICApO1xuICAgIHJldC5wdXNoLmFwcGx5KHJldCwgaHVuay5saW5lcyk7XG4gIH1cblxuICByZXR1cm4gcmV0LmpvaW4oJ1xcbicpICsgJ1xcbic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQYXRjaChmaWxlTmFtZSwgb2xkU3RyLCBuZXdTdHIsIG9sZEhlYWRlciwgbmV3SGVhZGVyLCBvcHRpb25zKSB7XG4gIHJldHVybiBjcmVhdGVUd29GaWxlc1BhdGNoKGZpbGVOYW1lLCBmaWxlTmFtZSwgb2xkU3RyLCBuZXdTdHIsIG9sZEhlYWRlciwgbmV3SGVhZGVyLCBvcHRpb25zKTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBwYXJzZVBhdGNoKHVuaURpZmYsIG9wdGlvbnMgPSB7fSkge1xuICBsZXQgZGlmZnN0ciA9IHVuaURpZmYuc3BsaXQoL1xcclxcbnxbXFxuXFx2XFxmXFxyXFx4ODVdLyksXG4gICAgICBkZWxpbWl0ZXJzID0gdW5pRGlmZi5tYXRjaCgvXFxyXFxufFtcXG5cXHZcXGZcXHJcXHg4NV0vZykgfHwgW10sXG4gICAgICBsaXN0ID0gW10sXG4gICAgICBpID0gMDtcblxuICBmdW5jdGlvbiBwYXJzZUluZGV4KCkge1xuICAgIGxldCBpbmRleCA9IHt9O1xuICAgIGxpc3QucHVzaChpbmRleCk7XG5cbiAgICAvLyBQYXJzZSBkaWZmIG1ldGFkYXRhXG4gICAgd2hpbGUgKGkgPCBkaWZmc3RyLmxlbmd0aCkge1xuICAgICAgbGV0IGxpbmUgPSBkaWZmc3RyW2ldO1xuXG4gICAgICAvLyBGaWxlIGhlYWRlciBmb3VuZCwgZW5kIHBhcnNpbmcgZGlmZiBtZXRhZGF0YVxuICAgICAgaWYgKC9eKFxcLVxcLVxcLXxcXCtcXCtcXCt8QEApXFxzLy50ZXN0KGxpbmUpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBEaWZmIGluZGV4XG4gICAgICBsZXQgaGVhZGVyID0gKC9eKD86SW5kZXg6fGRpZmYoPzogLXIgXFx3KykrKVxccysoLis/KVxccyokLykuZXhlYyhsaW5lKTtcbiAgICAgIGlmIChoZWFkZXIpIHtcbiAgICAgICAgaW5kZXguaW5kZXggPSBoZWFkZXJbMV07XG4gICAgICB9XG5cbiAgICAgIGkrKztcbiAgICB9XG5cbiAgICAvLyBQYXJzZSBmaWxlIGhlYWRlcnMgaWYgdGhleSBhcmUgZGVmaW5lZC4gVW5pZmllZCBkaWZmIHJlcXVpcmVzIHRoZW0sIGJ1dFxuICAgIC8vIHRoZXJlJ3Mgbm8gdGVjaG5pY2FsIGlzc3VlcyB0byBoYXZlIGFuIGlzb2xhdGVkIGh1bmsgd2l0aG91dCBmaWxlIGhlYWRlclxuICAgIHBhcnNlRmlsZUhlYWRlcihpbmRleCk7XG4gICAgcGFyc2VGaWxlSGVhZGVyKGluZGV4KTtcblxuICAgIC8vIFBhcnNlIGh1bmtzXG4gICAgaW5kZXguaHVua3MgPSBbXTtcblxuICAgIHdoaWxlIChpIDwgZGlmZnN0ci5sZW5ndGgpIHtcbiAgICAgIGxldCBsaW5lID0gZGlmZnN0cltpXTtcblxuICAgICAgaWYgKC9eKEluZGV4OnxkaWZmfFxcLVxcLVxcLXxcXCtcXCtcXCspXFxzLy50ZXN0KGxpbmUpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIGlmICgvXkBALy50ZXN0KGxpbmUpKSB7XG4gICAgICAgIGluZGV4Lmh1bmtzLnB1c2gocGFyc2VIdW5rKCkpO1xuICAgICAgfSBlbHNlIGlmIChsaW5lICYmIG9wdGlvbnMuc3RyaWN0KSB7XG4gICAgICAgIC8vIElnbm9yZSB1bmV4cGVjdGVkIGNvbnRlbnQgdW5sZXNzIGluIHN0cmljdCBtb2RlXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBsaW5lICcgKyAoaSArIDEpICsgJyAnICsgSlNPTi5zdHJpbmdpZnkobGluZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFBhcnNlcyB0aGUgLS0tIGFuZCArKysgaGVhZGVycywgaWYgbm9uZSBhcmUgZm91bmQsIG5vIGxpbmVzXG4gIC8vIGFyZSBjb25zdW1lZC5cbiAgZnVuY3Rpb24gcGFyc2VGaWxlSGVhZGVyKGluZGV4KSB7XG4gICAgY29uc3QgaGVhZGVyUGF0dGVybiA9IC9eKC0tLXxcXCtcXCtcXCspXFxzKyhbXFxTIF0qKSg/OlxcdCguKj8pXFxzKik/JC87XG4gICAgY29uc3QgZmlsZUhlYWRlciA9IGhlYWRlclBhdHRlcm4uZXhlYyhkaWZmc3RyW2ldKTtcbiAgICBpZiAoZmlsZUhlYWRlcikge1xuICAgICAgbGV0IGtleVByZWZpeCA9IGZpbGVIZWFkZXJbMV0gPT09ICctLS0nID8gJ29sZCcgOiAnbmV3JztcbiAgICAgIGluZGV4W2tleVByZWZpeCArICdGaWxlTmFtZSddID0gZmlsZUhlYWRlclsyXTtcbiAgICAgIGluZGV4W2tleVByZWZpeCArICdIZWFkZXInXSA9IGZpbGVIZWFkZXJbM107XG5cbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICAvLyBQYXJzZXMgYSBodW5rXG4gIC8vIFRoaXMgYXNzdW1lcyB0aGF0IHdlIGFyZSBhdCB0aGUgc3RhcnQgb2YgYSBodW5rLlxuICBmdW5jdGlvbiBwYXJzZUh1bmsoKSB7XG4gICAgbGV0IGNodW5rSGVhZGVySW5kZXggPSBpLFxuICAgICAgICBjaHVua0hlYWRlckxpbmUgPSBkaWZmc3RyW2krK10sXG4gICAgICAgIGNodW5rSGVhZGVyID0gY2h1bmtIZWFkZXJMaW5lLnNwbGl0KC9AQCAtKFxcZCspKD86LChcXGQrKSk/IFxcKyhcXGQrKSg/OiwoXFxkKykpPyBAQC8pO1xuXG4gICAgbGV0IGh1bmsgPSB7XG4gICAgICBvbGRTdGFydDogK2NodW5rSGVhZGVyWzFdLFxuICAgICAgb2xkTGluZXM6ICtjaHVua0hlYWRlclsyXSB8fCAxLFxuICAgICAgbmV3U3RhcnQ6ICtjaHVua0hlYWRlclszXSxcbiAgICAgIG5ld0xpbmVzOiArY2h1bmtIZWFkZXJbNF0gfHwgMSxcbiAgICAgIGxpbmVzOiBbXSxcbiAgICAgIGxpbmVkZWxpbWl0ZXJzOiBbXVxuICAgIH07XG5cbiAgICBsZXQgYWRkQ291bnQgPSAwLFxuICAgICAgICByZW1vdmVDb3VudCA9IDA7XG4gICAgZm9yICg7IGkgPCBkaWZmc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBMaW5lcyBzdGFydGluZyB3aXRoICctLS0nIGNvdWxkIGJlIG1pc3Rha2VuIGZvciB0aGUgXCJyZW1vdmUgbGluZVwiIG9wZXJhdGlvblxuICAgICAgLy8gQnV0IHRoZXkgY291bGQgYmUgdGhlIGhlYWRlciBmb3IgdGhlIG5leHQgZmlsZS4gVGhlcmVmb3JlIHBydW5lIHN1Y2ggY2FzZXMgb3V0LlxuICAgICAgaWYgKGRpZmZzdHJbaV0uaW5kZXhPZignLS0tICcpID09PSAwXG4gICAgICAgICAgICAmJiAoaSArIDIgPCBkaWZmc3RyLmxlbmd0aClcbiAgICAgICAgICAgICYmIGRpZmZzdHJbaSArIDFdLmluZGV4T2YoJysrKyAnKSA9PT0gMFxuICAgICAgICAgICAgJiYgZGlmZnN0cltpICsgMl0uaW5kZXhPZignQEAnKSA9PT0gMCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbGV0IG9wZXJhdGlvbiA9IGRpZmZzdHJbaV1bMF07XG5cbiAgICAgIGlmIChvcGVyYXRpb24gPT09ICcrJyB8fCBvcGVyYXRpb24gPT09ICctJyB8fCBvcGVyYXRpb24gPT09ICcgJyB8fCBvcGVyYXRpb24gPT09ICdcXFxcJykge1xuICAgICAgICBodW5rLmxpbmVzLnB1c2goZGlmZnN0cltpXSk7XG4gICAgICAgIGh1bmsubGluZWRlbGltaXRlcnMucHVzaChkZWxpbWl0ZXJzW2ldIHx8ICdcXG4nKTtcblxuICAgICAgICBpZiAob3BlcmF0aW9uID09PSAnKycpIHtcbiAgICAgICAgICBhZGRDb3VudCsrO1xuICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbiA9PT0gJy0nKSB7XG4gICAgICAgICAgcmVtb3ZlQ291bnQrKztcbiAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09ICcgJykge1xuICAgICAgICAgIGFkZENvdW50Kys7XG4gICAgICAgICAgcmVtb3ZlQ291bnQrKztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIHRoZSBlbXB0eSBibG9jayBjb3VudCBjYXNlXG4gICAgaWYgKCFhZGRDb3VudCAmJiBodW5rLm5ld0xpbmVzID09PSAxKSB7XG4gICAgICBodW5rLm5ld0xpbmVzID0gMDtcbiAgICB9XG4gICAgaWYgKCFyZW1vdmVDb3VudCAmJiBodW5rLm9sZExpbmVzID09PSAxKSB7XG4gICAgICBodW5rLm9sZExpbmVzID0gMDtcbiAgICB9XG5cbiAgICAvLyBQZXJmb3JtIG9wdGlvbmFsIHNhbml0eSBjaGVja2luZ1xuICAgIGlmIChvcHRpb25zLnN0cmljdCkge1xuICAgICAgaWYgKGFkZENvdW50ICE9PSBodW5rLm5ld0xpbmVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQWRkZWQgbGluZSBjb3VudCBkaWQgbm90IG1hdGNoIGZvciBodW5rIGF0IGxpbmUgJyArIChjaHVua0hlYWRlckluZGV4ICsgMSkpO1xuICAgICAgfVxuICAgICAgaWYgKHJlbW92ZUNvdW50ICE9PSBodW5rLm9sZExpbmVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUmVtb3ZlZCBsaW5lIGNvdW50IGRpZCBub3QgbWF0Y2ggZm9yIGh1bmsgYXQgbGluZSAnICsgKGNodW5rSGVhZGVySW5kZXggKyAxKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGh1bms7XG4gIH1cblxuICB3aGlsZSAoaSA8IGRpZmZzdHIubGVuZ3RoKSB7XG4gICAgcGFyc2VJbmRleCgpO1xuICB9XG5cbiAgcmV0dXJuIGxpc3Q7XG59XG4iLCIvLyBJdGVyYXRvciB0aGF0IHRyYXZlcnNlcyBpbiB0aGUgcmFuZ2Ugb2YgW21pbiwgbWF4XSwgc3RlcHBpbmdcbi8vIGJ5IGRpc3RhbmNlIGZyb20gYSBnaXZlbiBzdGFydCBwb3NpdGlvbi4gSS5lLiBmb3IgWzAsIDRdLCB3aXRoXG4vLyBzdGFydCBvZiAyLCB0aGlzIHdpbGwgaXRlcmF0ZSAyLCAzLCAxLCA0LCAwLlxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oc3RhcnQsIG1pbkxpbmUsIG1heExpbmUpIHtcbiAgbGV0IHdhbnRGb3J3YXJkID0gdHJ1ZSxcbiAgICAgIGJhY2t3YXJkRXhoYXVzdGVkID0gZmFsc2UsXG4gICAgICBmb3J3YXJkRXhoYXVzdGVkID0gZmFsc2UsXG4gICAgICBsb2NhbE9mZnNldCA9IDE7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGl0ZXJhdG9yKCkge1xuICAgIGlmICh3YW50Rm9yd2FyZCAmJiAhZm9yd2FyZEV4aGF1c3RlZCkge1xuICAgICAgaWYgKGJhY2t3YXJkRXhoYXVzdGVkKSB7XG4gICAgICAgIGxvY2FsT2Zmc2V0Kys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3YW50Rm9yd2FyZCA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBpZiB0cnlpbmcgdG8gZml0IGJleW9uZCB0ZXh0IGxlbmd0aCwgYW5kIGlmIG5vdCwgY2hlY2sgaXQgZml0c1xuICAgICAgLy8gYWZ0ZXIgb2Zmc2V0IGxvY2F0aW9uIChvciBkZXNpcmVkIGxvY2F0aW9uIG9uIGZpcnN0IGl0ZXJhdGlvbilcbiAgICAgIGlmIChzdGFydCArIGxvY2FsT2Zmc2V0IDw9IG1heExpbmUpIHtcbiAgICAgICAgcmV0dXJuIGxvY2FsT2Zmc2V0O1xuICAgICAgfVxuXG4gICAgICBmb3J3YXJkRXhoYXVzdGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIWJhY2t3YXJkRXhoYXVzdGVkKSB7XG4gICAgICBpZiAoIWZvcndhcmRFeGhhdXN0ZWQpIHtcbiAgICAgICAgd2FudEZvcndhcmQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBDaGVjayBpZiB0cnlpbmcgdG8gZml0IGJlZm9yZSB0ZXh0IGJlZ2lubmluZywgYW5kIGlmIG5vdCwgY2hlY2sgaXQgZml0c1xuICAgICAgLy8gYmVmb3JlIG9mZnNldCBsb2NhdGlvblxuICAgICAgaWYgKG1pbkxpbmUgPD0gc3RhcnQgLSBsb2NhbE9mZnNldCkge1xuICAgICAgICByZXR1cm4gLWxvY2FsT2Zmc2V0Kys7XG4gICAgICB9XG5cbiAgICAgIGJhY2t3YXJkRXhoYXVzdGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBpdGVyYXRvcigpO1xuICAgIH1cblxuICAgIC8vIFdlIHRyaWVkIHRvIGZpdCBodW5rIGJlZm9yZSB0ZXh0IGJlZ2lubmluZyBhbmQgYmV5b25kIHRleHQgbGVuZ2h0LCB0aGVuXG4gICAgLy8gaHVuayBjYW4ndCBmaXQgb24gdGhlIHRleHQuIFJldHVybiB1bmRlZmluZWRcbiAgfTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZU9wdGlvbnMob3B0aW9ucywgZGVmYXVsdHMpIHtcbiAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgZGVmYXVsdHMuY2FsbGJhY2sgPSBvcHRpb25zO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMpIHtcbiAgICBmb3IgKGxldCBuYW1lIGluIG9wdGlvbnMpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICBkZWZhdWx0c1tuYW1lXSA9IG9wdGlvbnNbbmFtZV07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWZhdWx0cztcbn1cbiIsIlxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvckVhY2ggKG9iaiwgZm4sIGN0eCkge1xuICAgIGlmICh0b1N0cmluZy5jYWxsKGZuKSAhPT0gJ1tvYmplY3QgRnVuY3Rpb25dJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpdGVyYXRvciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICB9XG4gICAgdmFyIGwgPSBvYmoubGVuZ3RoO1xuICAgIGlmIChsID09PSArbCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgZm4uY2FsbChjdHgsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrKSkge1xuICAgICAgICAgICAgICAgIGZuLmNhbGwoY3R4LCBvYmpba10sIGssIG9iaik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4iLCJcbnZhciBpbmRleE9mID0gW10uaW5kZXhPZjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnIsIG9iail7XG4gIGlmIChpbmRleE9mKSByZXR1cm4gYXJyLmluZGV4T2Yob2JqKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoYXJyW2ldID09PSBvYmopIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxudmFyIGlzRnVuY3Rpb24gPSBmdW5jdGlvbiAoZm4pIHtcblx0cmV0dXJuICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicgJiYgIShmbiBpbnN0YW5jZW9mIFJlZ0V4cCkpIHx8IHRvU3RyaW5nLmNhbGwoZm4pID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmb3JFYWNoKG9iaiwgZm4pIHtcblx0aWYgKCFpc0Z1bmN0aW9uKGZuKSkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ2l0ZXJhdG9yIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXHR9XG5cdHZhciBpLCBrLFxuXHRcdGlzU3RyaW5nID0gdHlwZW9mIG9iaiA9PT0gJ3N0cmluZycsXG5cdFx0bCA9IG9iai5sZW5ndGgsXG5cdFx0Y29udGV4dCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyID8gYXJndW1lbnRzWzJdIDogbnVsbDtcblx0aWYgKGwgPT09ICtsKSB7XG5cdFx0Zm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuXHRcdFx0aWYgKGNvbnRleHQgPT09IG51bGwpIHtcblx0XHRcdFx0Zm4oaXNTdHJpbmcgPyBvYmouY2hhckF0KGkpIDogb2JqW2ldLCBpLCBvYmopO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Zm4uY2FsbChjb250ZXh0LCBpc1N0cmluZyA/IG9iai5jaGFyQXQoaSkgOiBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGZvciAoayBpbiBvYmopIHtcblx0XHRcdGlmIChoYXNPd24uY2FsbChvYmosIGspKSB7XG5cdFx0XHRcdGlmIChjb250ZXh0ID09PSBudWxsKSB7XG5cdFx0XHRcdFx0Zm4ob2JqW2tdLCBrLCBvYmopO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZuLmNhbGwoY29udGV4dCwgb2JqW2tdLCBrLCBvYmopO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gbW9kaWZpZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZXMtc2hpbXMvZXM1LXNoaW1cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LFxuXHR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdGZvckVhY2ggPSByZXF1aXJlKCcuL2ZvcmVhY2gnKSxcblx0aXNBcmdzID0gcmVxdWlyZSgnLi9pc0FyZ3VtZW50cycpLFxuXHRoYXNEb250RW51bUJ1ZyA9ICEoeyd0b1N0cmluZyc6IG51bGx9KS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgndG9TdHJpbmcnKSxcblx0aGFzUHJvdG9FbnVtQnVnID0gKGZ1bmN0aW9uICgpIHt9KS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgncHJvdG90eXBlJyksXG5cdGRvbnRFbnVtcyA9IFtcblx0XHRcInRvU3RyaW5nXCIsXG5cdFx0XCJ0b0xvY2FsZVN0cmluZ1wiLFxuXHRcdFwidmFsdWVPZlwiLFxuXHRcdFwiaGFzT3duUHJvcGVydHlcIixcblx0XHRcImlzUHJvdG90eXBlT2ZcIixcblx0XHRcInByb3BlcnR5SXNFbnVtZXJhYmxlXCIsXG5cdFx0XCJjb25zdHJ1Y3RvclwiXG5cdF07XG5cbnZhciBrZXlzU2hpbSA9IGZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG5cdHZhciBpc09iamVjdCA9IG9iamVjdCAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0Jyxcblx0XHRpc0Z1bmN0aW9uID0gdG9TdHJpbmcuY2FsbChvYmplY3QpID09PSAnW29iamVjdCBGdW5jdGlvbl0nLFxuXHRcdGlzQXJndW1lbnRzID0gaXNBcmdzKG9iamVjdCksXG5cdFx0dGhlS2V5cyA9IFtdO1xuXG5cdGlmICghaXNPYmplY3QgJiYgIWlzRnVuY3Rpb24gJiYgIWlzQXJndW1lbnRzKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdC5rZXlzIGNhbGxlZCBvbiBhIG5vbi1vYmplY3RcIik7XG5cdH1cblxuXHRpZiAoaXNBcmd1bWVudHMpIHtcblx0XHRmb3JFYWNoKG9iamVjdCwgZnVuY3Rpb24gKHZhbHVlLCBpbmRleCkge1xuXHRcdFx0dGhlS2V5cy5wdXNoKGluZGV4KTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHR2YXIgbmFtZSxcblx0XHRcdHNraXBQcm90byA9IGhhc1Byb3RvRW51bUJ1ZyAmJiBpc0Z1bmN0aW9uO1xuXG5cdFx0Zm9yIChuYW1lIGluIG9iamVjdCkge1xuXHRcdFx0aWYgKCEoc2tpcFByb3RvICYmIG5hbWUgPT09ICdwcm90b3R5cGUnKSAmJiBoYXMuY2FsbChvYmplY3QsIG5hbWUpKSB7XG5cdFx0XHRcdHRoZUtleXMucHVzaChuYW1lKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpZiAoaGFzRG9udEVudW1CdWcpIHtcblx0XHR2YXIgY3RvciA9IG9iamVjdC5jb25zdHJ1Y3Rvcixcblx0XHRcdHNraXBDb25zdHJ1Y3RvciA9IGN0b3IgJiYgY3Rvci5wcm90b3R5cGUgPT09IG9iamVjdDtcblxuXHRcdGZvckVhY2goZG9udEVudW1zLCBmdW5jdGlvbiAoZG9udEVudW0pIHtcblx0XHRcdGlmICghKHNraXBDb25zdHJ1Y3RvciAmJiBkb250RW51bSA9PT0gJ2NvbnN0cnVjdG9yJykgJiYgaGFzLmNhbGwob2JqZWN0LCBkb250RW51bSkpIHtcblx0XHRcdFx0dGhlS2V5cy5wdXNoKGRvbnRFbnVtKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXHRyZXR1cm4gdGhlS2V5cztcbn07XG5cbmtleXNTaGltLnNoaW0gPSBmdW5jdGlvbiBzaGltT2JqZWN0S2V5cygpIHtcblx0aWYgKCFPYmplY3Qua2V5cykge1xuXHRcdE9iamVjdC5rZXlzID0ga2V5c1NoaW07XG5cdH1cblx0cmV0dXJuIE9iamVjdC5rZXlzIHx8IGtleXNTaGltO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXlzU2hpbTtcblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcblx0dmFyIHN0ciA9IHRvU3RyaW5nLmNhbGwodmFsdWUpO1xuXHR2YXIgaXNBcmd1bWVudHMgPSBzdHIgPT09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuXHRpZiAoIWlzQXJndW1lbnRzKSB7XG5cdFx0aXNBcmd1bWVudHMgPSBzdHIgIT09ICdbb2JqZWN0IEFycmF5XSdcblx0XHRcdCYmIHZhbHVlICE9PSBudWxsXG5cdFx0XHQmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnXG5cdFx0XHQmJiB0eXBlb2YgdmFsdWUubGVuZ3RoID09PSAnbnVtYmVyJ1xuXHRcdFx0JiYgdmFsdWUubGVuZ3RoID49IDBcblx0XHRcdCYmIHRvU3RyaW5nLmNhbGwodmFsdWUuY2FsbGVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblx0fVxuXHRyZXR1cm4gaXNBcmd1bWVudHM7XG59O1xuXG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgbWFwID0gcmVxdWlyZSgnYXJyYXktbWFwJyk7XG52YXIgaW5kZXhPZiA9IHJlcXVpcmUoJ2luZGV4b2YnKTtcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpO1xudmFyIGZvckVhY2ggPSByZXF1aXJlKCdmb3JlYWNoJyk7XG52YXIgcmVkdWNlID0gcmVxdWlyZSgnYXJyYXktcmVkdWNlJyk7XG52YXIgZ2V0T2JqZWN0S2V5cyA9IHJlcXVpcmUoJ29iamVjdC1rZXlzJyk7XG52YXIgSlNPTiA9IHJlcXVpcmUoJ2pzb24zJyk7XG5cbi8qKlxuICogTWFrZSBzdXJlIGBPYmplY3Qua2V5c2Agd29yayBmb3IgYHVuZGVmaW5lZGBcbiAqIHZhbHVlcyB0aGF0IGFyZSBzdGlsbCB0aGVyZSwgbGlrZSBgZG9jdW1lbnQuYWxsYC5cbiAqIGh0dHA6Ly9saXN0cy53My5vcmcvQXJjaGl2ZXMvUHVibGljL3B1YmxpYy1odG1sLzIwMDlKdW4vMDU0Ni5odG1sXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gb2JqZWN0S2V5cyh2YWwpe1xuICBpZiAoT2JqZWN0LmtleXMpIHJldHVybiBPYmplY3Qua2V5cyh2YWwpO1xuICByZXR1cm4gZ2V0T2JqZWN0S2V5cyh2YWwpO1xufVxuXG4vKipcbiAqIE1vZHVsZSBleHBvcnRzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaW5zcGVjdDtcblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqIEBsaWNlbnNlIE1JVCAowqkgSm95ZW50KVxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBfZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaGFzT3duKG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGZvckVhY2goYXJyYXksIGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd24odmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAgZm9yRWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBvYmplY3RLZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuICYmIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoaW5kZXhPZihrZXlzLCAnbWVzc2FnZScpID49IDAgfHwgaW5kZXhPZihrZXlzLCAnZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBtYXAoa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKSB7XG4gICAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgZGVzYztcbiAgfVxuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duKHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChpbmRleE9mKGN0eC5zZWVuLCBkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBtYXAoc3RyLnNwbGl0KCdcXG4nKSwgZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIG1hcChzdHIuc3BsaXQoJ1xcbicpLCBmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IHJlZHVjZShvdXRwdXQsIGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5mdW5jdGlvbiBfZXh0ZW5kKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBvYmplY3RLZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn1cbiIsIi8qISBKU09OIHYzLjMuMCB8IGh0dHA6Ly9iZXN0aWVqcy5naXRodWIuaW8vanNvbjMgfCBDb3B5cmlnaHQgMjAxMi0yMDE0LCBLaXQgQ2FtYnJpZGdlIHwgaHR0cDovL2tpdC5taXQtbGljZW5zZS5vcmcgKi9cbjsoZnVuY3Rpb24gKHJvb3QpIHtcbiAgLy8gRGV0ZWN0IHRoZSBgZGVmaW5lYCBmdW5jdGlvbiBleHBvc2VkIGJ5IGFzeW5jaHJvbm91cyBtb2R1bGUgbG9hZGVycy4gVGhlXG4gIC8vIHN0cmljdCBgZGVmaW5lYCBjaGVjayBpcyBuZWNlc3NhcnkgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBgci5qc2AuXG4gIHZhciBpc0xvYWRlciA9IHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kO1xuXG4gIC8vIFVzZSB0aGUgYGdsb2JhbGAgb2JqZWN0IGV4cG9zZWQgYnkgTm9kZSAoaW5jbHVkaW5nIEJyb3dzZXJpZnkgdmlhXG4gIC8vIGBpbnNlcnQtbW9kdWxlLWdsb2JhbHNgKSwgTmFyd2hhbCwgYW5kIFJpbmdvIGFzIHRoZSBkZWZhdWx0IGNvbnRleHQuXG4gIC8vIFJoaW5vIGV4cG9ydHMgYSBgZ2xvYmFsYCBmdW5jdGlvbiBpbnN0ZWFkLlxuICB2YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gXCJvYmplY3RcIiAmJiBnbG9iYWw7XG4gIGlmIChmcmVlR2xvYmFsICYmIChmcmVlR2xvYmFsW1wiZ2xvYmFsXCJdID09PSBmcmVlR2xvYmFsIHx8IGZyZWVHbG9iYWxbXCJ3aW5kb3dcIl0gPT09IGZyZWVHbG9iYWwpKSB7XG4gICAgcm9vdCA9IGZyZWVHbG9iYWw7XG4gIH1cblxuICAvLyBQdWJsaWM6IEluaXRpYWxpemVzIEpTT04gMyB1c2luZyB0aGUgZ2l2ZW4gYGNvbnRleHRgIG9iamVjdCwgYXR0YWNoaW5nIHRoZVxuICAvLyBgc3RyaW5naWZ5YCBhbmQgYHBhcnNlYCBmdW5jdGlvbnMgdG8gdGhlIHNwZWNpZmllZCBgZXhwb3J0c2Agb2JqZWN0LlxuICBmdW5jdGlvbiBydW5JbkNvbnRleHQoY29udGV4dCwgZXhwb3J0cykge1xuICAgIGNvbnRleHQgfHwgKGNvbnRleHQgPSByb290W1wiT2JqZWN0XCJdKCkpO1xuICAgIGV4cG9ydHMgfHwgKGV4cG9ydHMgPSByb290W1wiT2JqZWN0XCJdKCkpO1xuXG4gICAgLy8gTmF0aXZlIGNvbnN0cnVjdG9yIGFsaWFzZXMuXG4gICAgdmFyIE51bWJlciA9IGNvbnRleHRbXCJOdW1iZXJcIl0gfHwgcm9vdFtcIk51bWJlclwiXSxcbiAgICAgICAgU3RyaW5nID0gY29udGV4dFtcIlN0cmluZ1wiXSB8fCByb290W1wiU3RyaW5nXCJdLFxuICAgICAgICBPYmplY3QgPSBjb250ZXh0W1wiT2JqZWN0XCJdIHx8IHJvb3RbXCJPYmplY3RcIl0sXG4gICAgICAgIERhdGUgPSBjb250ZXh0W1wiRGF0ZVwiXSB8fCByb290W1wiRGF0ZVwiXSxcbiAgICAgICAgU3ludGF4RXJyb3IgPSBjb250ZXh0W1wiU3ludGF4RXJyb3JcIl0gfHwgcm9vdFtcIlN5bnRheEVycm9yXCJdLFxuICAgICAgICBUeXBlRXJyb3IgPSBjb250ZXh0W1wiVHlwZUVycm9yXCJdIHx8IHJvb3RbXCJUeXBlRXJyb3JcIl0sXG4gICAgICAgIE1hdGggPSBjb250ZXh0W1wiTWF0aFwiXSB8fCByb290W1wiTWF0aFwiXSxcbiAgICAgICAgbmF0aXZlSlNPTiA9IGNvbnRleHRbXCJKU09OXCJdIHx8IHJvb3RbXCJKU09OXCJdO1xuXG4gICAgLy8gRGVsZWdhdGUgdG8gdGhlIG5hdGl2ZSBgc3RyaW5naWZ5YCBhbmQgYHBhcnNlYCBpbXBsZW1lbnRhdGlvbnMuXG4gICAgaWYgKHR5cGVvZiBuYXRpdmVKU09OID09IFwib2JqZWN0XCIgJiYgbmF0aXZlSlNPTikge1xuICAgICAgZXhwb3J0cy5zdHJpbmdpZnkgPSBuYXRpdmVKU09OLnN0cmluZ2lmeTtcbiAgICAgIGV4cG9ydHMucGFyc2UgPSBuYXRpdmVKU09OLnBhcnNlO1xuICAgIH1cblxuICAgIC8vIENvbnZlbmllbmNlIGFsaWFzZXMuXG4gICAgdmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZSxcbiAgICAgICAgZ2V0Q2xhc3MgPSBvYmplY3RQcm90by50b1N0cmluZyxcbiAgICAgICAgaXNQcm9wZXJ0eSwgZm9yRWFjaCwgdW5kZWY7XG5cbiAgICAvLyBUZXN0IHRoZSBgRGF0ZSNnZXRVVEMqYCBtZXRob2RzLiBCYXNlZCBvbiB3b3JrIGJ5IEBZYWZmbGUuXG4gICAgdmFyIGlzRXh0ZW5kZWQgPSBuZXcgRGF0ZSgtMzUwOTgyNzMzNDU3MzI5Mik7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFRoZSBgZ2V0VVRDRnVsbFllYXJgLCBgTW9udGhgLCBhbmQgYERhdGVgIG1ldGhvZHMgcmV0dXJuIG5vbnNlbnNpY2FsXG4gICAgICAvLyByZXN1bHRzIGZvciBjZXJ0YWluIGRhdGVzIGluIE9wZXJhID49IDEwLjUzLlxuICAgICAgaXNFeHRlbmRlZCA9IGlzRXh0ZW5kZWQuZ2V0VVRDRnVsbFllYXIoKSA9PSAtMTA5MjUyICYmIGlzRXh0ZW5kZWQuZ2V0VVRDTW9udGgoKSA9PT0gMCAmJiBpc0V4dGVuZGVkLmdldFVUQ0RhdGUoKSA9PT0gMSAmJlxuICAgICAgICAvLyBTYWZhcmkgPCAyLjAuMiBzdG9yZXMgdGhlIGludGVybmFsIG1pbGxpc2Vjb25kIHRpbWUgdmFsdWUgY29ycmVjdGx5LFxuICAgICAgICAvLyBidXQgY2xpcHMgdGhlIHZhbHVlcyByZXR1cm5lZCBieSB0aGUgZGF0ZSBtZXRob2RzIHRvIHRoZSByYW5nZSBvZlxuICAgICAgICAvLyBzaWduZWQgMzItYml0IGludGVnZXJzIChbLTIgKiogMzEsIDIgKiogMzEgLSAxXSkuXG4gICAgICAgIGlzRXh0ZW5kZWQuZ2V0VVRDSG91cnMoKSA9PSAxMCAmJiBpc0V4dGVuZGVkLmdldFVUQ01pbnV0ZXMoKSA9PSAzNyAmJiBpc0V4dGVuZGVkLmdldFVUQ1NlY29uZHMoKSA9PSA2ICYmIGlzRXh0ZW5kZWQuZ2V0VVRDTWlsbGlzZWNvbmRzKCkgPT0gNzA4O1xuICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cblxuICAgIC8vIEludGVybmFsOiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIG5hdGl2ZSBgSlNPTi5zdHJpbmdpZnlgIGFuZCBgcGFyc2VgXG4gICAgLy8gaW1wbGVtZW50YXRpb25zIGFyZSBzcGVjLWNvbXBsaWFudC4gQmFzZWQgb24gd29yayBieSBLZW4gU255ZGVyLlxuICAgIGZ1bmN0aW9uIGhhcyhuYW1lKSB7XG4gICAgICBpZiAoaGFzW25hbWVdICE9PSB1bmRlZikge1xuICAgICAgICAvLyBSZXR1cm4gY2FjaGVkIGZlYXR1cmUgdGVzdCByZXN1bHQuXG4gICAgICAgIHJldHVybiBoYXNbbmFtZV07XG4gICAgICB9XG4gICAgICB2YXIgaXNTdXBwb3J0ZWQ7XG4gICAgICBpZiAobmFtZSA9PSBcImJ1Zy1zdHJpbmctY2hhci1pbmRleFwiKSB7XG4gICAgICAgIC8vIElFIDw9IDcgZG9lc24ndCBzdXBwb3J0IGFjY2Vzc2luZyBzdHJpbmcgY2hhcmFjdGVycyB1c2luZyBzcXVhcmVcbiAgICAgICAgLy8gYnJhY2tldCBub3RhdGlvbi4gSUUgOCBvbmx5IHN1cHBvcnRzIHRoaXMgZm9yIHByaW1pdGl2ZXMuXG4gICAgICAgIGlzU3VwcG9ydGVkID0gXCJhXCJbMF0gIT0gXCJhXCI7XG4gICAgICB9IGVsc2UgaWYgKG5hbWUgPT0gXCJqc29uXCIpIHtcbiAgICAgICAgLy8gSW5kaWNhdGVzIHdoZXRoZXIgYm90aCBgSlNPTi5zdHJpbmdpZnlgIGFuZCBgSlNPTi5wYXJzZWAgYXJlXG4gICAgICAgIC8vIHN1cHBvcnRlZC5cbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBoYXMoXCJqc29uLXN0cmluZ2lmeVwiKSAmJiBoYXMoXCJqc29uLXBhcnNlXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHZhbHVlLCBzZXJpYWxpemVkID0gJ3tcImFcIjpbMSx0cnVlLGZhbHNlLG51bGwsXCJcXFxcdTAwMDBcXFxcYlxcXFxuXFxcXGZcXFxcclxcXFx0XCJdfSc7XG4gICAgICAgIC8vIFRlc3QgYEpTT04uc3RyaW5naWZ5YC5cbiAgICAgICAgaWYgKG5hbWUgPT0gXCJqc29uLXN0cmluZ2lmeVwiKSB7XG4gICAgICAgICAgdmFyIHN0cmluZ2lmeSA9IGV4cG9ydHMuc3RyaW5naWZ5LCBzdHJpbmdpZnlTdXBwb3J0ZWQgPSB0eXBlb2Ygc3RyaW5naWZ5ID09IFwiZnVuY3Rpb25cIiAmJiBpc0V4dGVuZGVkO1xuICAgICAgICAgIGlmIChzdHJpbmdpZnlTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgIC8vIEEgdGVzdCBmdW5jdGlvbiBvYmplY3Qgd2l0aCBhIGN1c3RvbSBgdG9KU09OYCBtZXRob2QuXG4gICAgICAgICAgICAodmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgfSkudG9KU09OID0gdmFsdWU7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBzdHJpbmdpZnlTdXBwb3J0ZWQgPVxuICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggMy4xYjEgYW5kIGIyIHNlcmlhbGl6ZSBzdHJpbmcsIG51bWJlciwgYW5kIGJvb2xlYW5cbiAgICAgICAgICAgICAgICAvLyBwcmltaXRpdmVzIGFzIG9iamVjdCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkoMCkgPT09IFwiMFwiICYmXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIGIyLCBhbmQgSlNPTiAyIHNlcmlhbGl6ZSB3cmFwcGVkIHByaW1pdGl2ZXMgYXMgb2JqZWN0XG4gICAgICAgICAgICAgICAgLy8gbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBOdW1iZXIoKSkgPT09IFwiMFwiICYmXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBTdHJpbmcoKSkgPT0gJ1wiXCInICYmXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIHZhbHVlIGlzIGBudWxsYCwgYHVuZGVmaW5lZGAsIG9yXG4gICAgICAgICAgICAgICAgLy8gZG9lcyBub3QgZGVmaW5lIGEgY2Fub25pY2FsIEpTT04gcmVwcmVzZW50YXRpb24gKHRoaXMgYXBwbGllcyB0b1xuICAgICAgICAgICAgICAgIC8vIG9iamVjdHMgd2l0aCBgdG9KU09OYCBwcm9wZXJ0aWVzIGFzIHdlbGwsICp1bmxlc3MqIHRoZXkgYXJlIG5lc3RlZFxuICAgICAgICAgICAgICAgIC8vIHdpdGhpbiBhbiBvYmplY3Qgb3IgYXJyYXkpLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShnZXRDbGFzcykgPT09IHVuZGVmICYmXG4gICAgICAgICAgICAgICAgLy8gSUUgOCBzZXJpYWxpemVzIGB1bmRlZmluZWRgIGFzIGBcInVuZGVmaW5lZFwiYC4gU2FmYXJpIDw9IDUuMS43IGFuZFxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIzIHBhc3MgdGhpcyB0ZXN0LlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeSh1bmRlZikgPT09IHVuZGVmICYmXG4gICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS43IGFuZCBGRiAzLjFiMyB0aHJvdyBgRXJyb3JgcyBhbmQgYFR5cGVFcnJvcmBzLFxuICAgICAgICAgICAgICAgIC8vIHJlc3BlY3RpdmVseSwgaWYgdGhlIHZhbHVlIGlzIG9taXR0ZWQgZW50aXJlbHkuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KCkgPT09IHVuZGVmICYmXG4gICAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIG5vdCBhIG51bWJlcixcbiAgICAgICAgICAgICAgICAvLyBzdHJpbmcsIGFycmF5LCBvYmplY3QsIEJvb2xlYW4sIG9yIGBudWxsYCBsaXRlcmFsLiBUaGlzIGFwcGxpZXMgdG9cbiAgICAgICAgICAgICAgICAvLyBvYmplY3RzIHdpdGggY3VzdG9tIGB0b0pTT05gIG1ldGhvZHMgYXMgd2VsbCwgdW5sZXNzIHRoZXkgYXJlIG5lc3RlZFxuICAgICAgICAgICAgICAgIC8vIGluc2lkZSBvYmplY3Qgb3IgYXJyYXkgbGl0ZXJhbHMuIFlVSSAzLjAuMGIxIGlnbm9yZXMgY3VzdG9tIGB0b0pTT05gXG4gICAgICAgICAgICAgICAgLy8gbWV0aG9kcyBlbnRpcmVseS5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkodmFsdWUpID09PSBcIjFcIiAmJlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdmFsdWVdKSA9PSBcIlsxXVwiICYmXG4gICAgICAgICAgICAgICAgLy8gUHJvdG90eXBlIDw9IDEuNi4xIHNlcmlhbGl6ZXMgYFt1bmRlZmluZWRdYCBhcyBgXCJbXVwiYCBpbnN0ZWFkIG9mXG4gICAgICAgICAgICAgICAgLy8gYFwiW251bGxdXCJgLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbdW5kZWZdKSA9PSBcIltudWxsXVwiICYmXG4gICAgICAgICAgICAgICAgLy8gWVVJIDMuMC4wYjEgZmFpbHMgdG8gc2VyaWFsaXplIGBudWxsYCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobnVsbCkgPT0gXCJudWxsXCIgJiZcbiAgICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiBoYWx0cyBzZXJpYWxpemF0aW9uIGlmIGFuIGFycmF5IGNvbnRhaW5zIGEgZnVuY3Rpb246XG4gICAgICAgICAgICAgICAgLy8gYFsxLCB0cnVlLCBnZXRDbGFzcywgMV1gIHNlcmlhbGl6ZXMgYXMgXCJbMSx0cnVlLF0sXCIuIEZGIDMuMWIzXG4gICAgICAgICAgICAgICAgLy8gZWxpZGVzIG5vbi1KU09OIHZhbHVlcyBmcm9tIG9iamVjdHMgYW5kIGFycmF5cywgdW5sZXNzIHRoZXlcbiAgICAgICAgICAgICAgICAvLyBkZWZpbmUgY3VzdG9tIGB0b0pTT05gIG1ldGhvZHMuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KFt1bmRlZiwgZ2V0Q2xhc3MsIG51bGxdKSA9PSBcIltudWxsLG51bGwsbnVsbF1cIiAmJlxuICAgICAgICAgICAgICAgIC8vIFNpbXBsZSBzZXJpYWxpemF0aW9uIHRlc3QuIEZGIDMuMWIxIHVzZXMgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2VzXG4gICAgICAgICAgICAgICAgLy8gd2hlcmUgY2hhcmFjdGVyIGVzY2FwZSBjb2RlcyBhcmUgZXhwZWN0ZWQgKGUuZy4sIGBcXGJgID0+IGBcXHUwMDA4YCkuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KHsgXCJhXCI6IFt2YWx1ZSwgdHJ1ZSwgZmFsc2UsIG51bGwsIFwiXFx4MDBcXGJcXG5cXGZcXHJcXHRcIl0gfSkgPT0gc2VyaWFsaXplZCAmJlxuICAgICAgICAgICAgICAgIC8vIEZGIDMuMWIxIGFuZCBiMiBpZ25vcmUgdGhlIGBmaWx0ZXJgIGFuZCBgd2lkdGhgIGFyZ3VtZW50cy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobnVsbCwgdmFsdWUpID09PSBcIjFcIiAmJlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShbMSwgMl0sIG51bGwsIDEpID09IFwiW1xcbiAxLFxcbiAyXFxuXVwiICYmXG4gICAgICAgICAgICAgICAgLy8gSlNPTiAyLCBQcm90b3R5cGUgPD0gMS43LCBhbmQgb2xkZXIgV2ViS2l0IGJ1aWxkcyBpbmNvcnJlY3RseVxuICAgICAgICAgICAgICAgIC8vIHNlcmlhbGl6ZSBleHRlbmRlZCB5ZWFycy5cbiAgICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoLTguNjRlMTUpKSA9PSAnXCItMjcxODIxLTA0LTIwVDAwOjAwOjAwLjAwMFpcIicgJiZcbiAgICAgICAgICAgICAgICAvLyBUaGUgbWlsbGlzZWNvbmRzIGFyZSBvcHRpb25hbCBpbiBFUyA1LCBidXQgcmVxdWlyZWQgaW4gNS4xLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSg4LjY0ZTE1KSkgPT0gJ1wiKzI3NTc2MC0wOS0xM1QwMDowMDowMC4wMDBaXCInICYmXG4gICAgICAgICAgICAgICAgLy8gRmlyZWZveCA8PSAxMS4wIGluY29ycmVjdGx5IHNlcmlhbGl6ZXMgeWVhcnMgcHJpb3IgdG8gMCBhcyBuZWdhdGl2ZVxuICAgICAgICAgICAgICAgIC8vIGZvdXItZGlnaXQgeWVhcnMgaW5zdGVhZCBvZiBzaXgtZGlnaXQgeWVhcnMuIENyZWRpdHM6IEBZYWZmbGUuXG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC02MjE5ODc1NTJlNSkpID09ICdcIi0wMDAwMDEtMDEtMDFUMDA6MDA6MDAuMDAwWlwiJyAmJlxuICAgICAgICAgICAgICAgIC8vIFNhZmFyaSA8PSA1LjEuNSBhbmQgT3BlcmEgPj0gMTAuNTMgaW5jb3JyZWN0bHkgc2VyaWFsaXplIG1pbGxpc2Vjb25kXG4gICAgICAgICAgICAgICAgLy8gdmFsdWVzIGxlc3MgdGhhbiAxMDAwLiBDcmVkaXRzOiBAWWFmZmxlLlxuICAgICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtMSkpID09ICdcIjE5NjktMTItMzFUMjM6NTk6NTkuOTk5WlwiJztcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICBzdHJpbmdpZnlTdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaXNTdXBwb3J0ZWQgPSBzdHJpbmdpZnlTdXBwb3J0ZWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGVzdCBgSlNPTi5wYXJzZWAuXG4gICAgICAgIGlmIChuYW1lID09IFwianNvbi1wYXJzZVwiKSB7XG4gICAgICAgICAgdmFyIHBhcnNlID0gZXhwb3J0cy5wYXJzZTtcbiAgICAgICAgICBpZiAodHlwZW9mIHBhcnNlID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIGIyIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIGlmIGEgYmFyZSBsaXRlcmFsIGlzIHByb3ZpZGVkLlxuICAgICAgICAgICAgICAvLyBDb25mb3JtaW5nIGltcGxlbWVudGF0aW9ucyBzaG91bGQgYWxzbyBjb2VyY2UgdGhlIGluaXRpYWwgYXJndW1lbnQgdG9cbiAgICAgICAgICAgICAgLy8gYSBzdHJpbmcgcHJpb3IgdG8gcGFyc2luZy5cbiAgICAgICAgICAgICAgaWYgKHBhcnNlKFwiMFwiKSA9PT0gMCAmJiAhcGFyc2UoZmFsc2UpKSB7XG4gICAgICAgICAgICAgICAgLy8gU2ltcGxlIHBhcnNpbmcgdGVzdC5cbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBhcnNlKHNlcmlhbGl6ZWQpO1xuICAgICAgICAgICAgICAgIHZhciBwYXJzZVN1cHBvcnRlZCA9IHZhbHVlW1wiYVwiXS5sZW5ndGggPT0gNSAmJiB2YWx1ZVtcImFcIl1bMF0gPT09IDE7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPD0gNS4xLjIgYW5kIEZGIDMuMWIxIGFsbG93IHVuZXNjYXBlZCB0YWJzIGluIHN0cmluZ3MuXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gIXBhcnNlKCdcIlxcdFwiJyk7XG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG4gICAgICAgICAgICAgICAgICBpZiAocGFyc2VTdXBwb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBGRiA0LjAgYW5kIDQuMC4xIGFsbG93IGxlYWRpbmcgYCtgIHNpZ25zIGFuZCBsZWFkaW5nXG4gICAgICAgICAgICAgICAgICAgICAgLy8gZGVjaW1hbCBwb2ludHMuIEZGIDQuMCwgNC4wLjEsIGFuZCBJRSA5LTEwIGFsc28gYWxsb3dcbiAgICAgICAgICAgICAgICAgICAgICAvLyBjZXJ0YWluIG9jdGFsIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgICAgICAgIHBhcnNlU3VwcG9ydGVkID0gcGFyc2UoXCIwMVwiKSAhPT0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlU3VwcG9ydGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gRkYgNC4wLCA0LjAuMSwgYW5kIFJoaW5vIDEuN1IzLVI0IGFsbG93IHRyYWlsaW5nIGRlY2ltYWxcbiAgICAgICAgICAgICAgICAgICAgICAvLyBwb2ludHMuIFRoZXNlIGVudmlyb25tZW50cywgYWxvbmcgd2l0aCBGRiAzLjFiMSBhbmQgMixcbiAgICAgICAgICAgICAgICAgICAgICAvLyBhbHNvIGFsbG93IHRyYWlsaW5nIGNvbW1hcyBpbiBKU09OIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9IHBhcnNlKFwiMS5cIikgIT09IDE7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpc1N1cHBvcnRlZCA9IHBhcnNlU3VwcG9ydGVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaGFzW25hbWVdID0gISFpc1N1cHBvcnRlZDtcbiAgICB9XG5cbiAgICBpZiAoIWhhcyhcImpzb25cIikpIHtcbiAgICAgIC8vIENvbW1vbiBgW1tDbGFzc11dYCBuYW1lIGFsaWFzZXMuXG4gICAgICB2YXIgZnVuY3Rpb25DbGFzcyA9IFwiW29iamVjdCBGdW5jdGlvbl1cIixcbiAgICAgICAgICBkYXRlQ2xhc3MgPSBcIltvYmplY3QgRGF0ZV1cIixcbiAgICAgICAgICBudW1iZXJDbGFzcyA9IFwiW29iamVjdCBOdW1iZXJdXCIsXG4gICAgICAgICAgc3RyaW5nQ2xhc3MgPSBcIltvYmplY3QgU3RyaW5nXVwiLFxuICAgICAgICAgIGFycmF5Q2xhc3MgPSBcIltvYmplY3QgQXJyYXldXCIsXG4gICAgICAgICAgYm9vbGVhbkNsYXNzID0gXCJbb2JqZWN0IEJvb2xlYW5dXCI7XG5cbiAgICAgIC8vIERldGVjdCBpbmNvbXBsZXRlIHN1cHBvcnQgZm9yIGFjY2Vzc2luZyBzdHJpbmcgY2hhcmFjdGVycyBieSBpbmRleC5cbiAgICAgIHZhciBjaGFySW5kZXhCdWdneSA9IGhhcyhcImJ1Zy1zdHJpbmctY2hhci1pbmRleFwiKTtcblxuICAgICAgLy8gRGVmaW5lIGFkZGl0aW9uYWwgdXRpbGl0eSBtZXRob2RzIGlmIHRoZSBgRGF0ZWAgbWV0aG9kcyBhcmUgYnVnZ3kuXG4gICAgICBpZiAoIWlzRXh0ZW5kZWQpIHtcbiAgICAgICAgdmFyIGZsb29yID0gTWF0aC5mbG9vcjtcbiAgICAgICAgLy8gQSBtYXBwaW5nIGJldHdlZW4gdGhlIG1vbnRocyBvZiB0aGUgeWVhciBhbmQgdGhlIG51bWJlciBvZiBkYXlzIGJldHdlZW5cbiAgICAgICAgLy8gSmFudWFyeSAxc3QgYW5kIHRoZSBmaXJzdCBvZiB0aGUgcmVzcGVjdGl2ZSBtb250aC5cbiAgICAgICAgdmFyIE1vbnRocyA9IFswLCAzMSwgNTksIDkwLCAxMjAsIDE1MSwgMTgxLCAyMTIsIDI0MywgMjczLCAzMDQsIDMzNF07XG4gICAgICAgIC8vIEludGVybmFsOiBDYWxjdWxhdGVzIHRoZSBudW1iZXIgb2YgZGF5cyBiZXR3ZWVuIHRoZSBVbml4IGVwb2NoIGFuZCB0aGVcbiAgICAgICAgLy8gZmlyc3QgZGF5IG9mIHRoZSBnaXZlbiBtb250aC5cbiAgICAgICAgdmFyIGdldERheSA9IGZ1bmN0aW9uICh5ZWFyLCBtb250aCkge1xuICAgICAgICAgIHJldHVybiBNb250aHNbbW9udGhdICsgMzY1ICogKHllYXIgLSAxOTcwKSArIGZsb29yKCh5ZWFyIC0gMTk2OSArIChtb250aCA9ICsobW9udGggPiAxKSkpIC8gNCkgLSBmbG9vcigoeWVhciAtIDE5MDEgKyBtb250aCkgLyAxMDApICsgZmxvb3IoKHllYXIgLSAxNjAxICsgbW9udGgpIC8gNDAwKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gSW50ZXJuYWw6IERldGVybWluZXMgaWYgYSBwcm9wZXJ0eSBpcyBhIGRpcmVjdCBwcm9wZXJ0eSBvZiB0aGUgZ2l2ZW5cbiAgICAgIC8vIG9iamVjdC4gRGVsZWdhdGVzIHRvIHRoZSBuYXRpdmUgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgbWV0aG9kLlxuICAgICAgaWYgKCEoaXNQcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5KSkge1xuICAgICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgdmFyIG1lbWJlcnMgPSB7fSwgY29uc3RydWN0b3I7XG4gICAgICAgICAgaWYgKChtZW1iZXJzLl9fcHJvdG9fXyA9IG51bGwsIG1lbWJlcnMuX19wcm90b19fID0ge1xuICAgICAgICAgICAgLy8gVGhlICpwcm90byogcHJvcGVydHkgY2Fubm90IGJlIHNldCBtdWx0aXBsZSB0aW1lcyBpbiByZWNlbnRcbiAgICAgICAgICAgIC8vIHZlcnNpb25zIG9mIEZpcmVmb3ggYW5kIFNlYU1vbmtleS5cbiAgICAgICAgICAgIFwidG9TdHJpbmdcIjogMVxuICAgICAgICAgIH0sIG1lbWJlcnMpLnRvU3RyaW5nICE9IGdldENsYXNzKSB7XG4gICAgICAgICAgICAvLyBTYWZhcmkgPD0gMi4wLjMgZG9lc24ndCBpbXBsZW1lbnQgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAsIGJ1dFxuICAgICAgICAgICAgLy8gc3VwcG9ydHMgdGhlIG11dGFibGUgKnByb3RvKiBwcm9wZXJ0eS5cbiAgICAgICAgICAgIGlzUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgLy8gQ2FwdHVyZSBhbmQgYnJlYWsgdGhlIG9iamVjdGdzIHByb3RvdHlwZSBjaGFpbiAoc2VlIHNlY3Rpb24gOC42LjJcbiAgICAgICAgICAgICAgLy8gb2YgdGhlIEVTIDUuMSBzcGVjKS4gVGhlIHBhcmVudGhlc2l6ZWQgZXhwcmVzc2lvbiBwcmV2ZW50cyBhblxuICAgICAgICAgICAgICAvLyB1bnNhZmUgdHJhbnNmb3JtYXRpb24gYnkgdGhlIENsb3N1cmUgQ29tcGlsZXIuXG4gICAgICAgICAgICAgIHZhciBvcmlnaW5hbCA9IHRoaXMuX19wcm90b19fLCByZXN1bHQgPSBwcm9wZXJ0eSBpbiAodGhpcy5fX3Byb3RvX18gPSBudWxsLCB0aGlzKTtcbiAgICAgICAgICAgICAgLy8gUmVzdG9yZSB0aGUgb3JpZ2luYWwgcHJvdG90eXBlIGNoYWluLlxuICAgICAgICAgICAgICB0aGlzLl9fcHJvdG9fXyA9IG9yaWdpbmFsO1xuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gQ2FwdHVyZSBhIHJlZmVyZW5jZSB0byB0aGUgdG9wLWxldmVsIGBPYmplY3RgIGNvbnN0cnVjdG9yLlxuICAgICAgICAgICAgY29uc3RydWN0b3IgPSBtZW1iZXJzLmNvbnN0cnVjdG9yO1xuICAgICAgICAgICAgLy8gVXNlIHRoZSBgY29uc3RydWN0b3JgIHByb3BlcnR5IHRvIHNpbXVsYXRlIGBPYmplY3QjaGFzT3duUHJvcGVydHlgIGluXG4gICAgICAgICAgICAvLyBvdGhlciBlbnZpcm9ubWVudHMuXG4gICAgICAgICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgIHZhciBwYXJlbnQgPSAodGhpcy5jb25zdHJ1Y3RvciB8fCBjb25zdHJ1Y3RvcikucHJvdG90eXBlO1xuICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHkgaW4gdGhpcyAmJiAhKHByb3BlcnR5IGluIHBhcmVudCAmJiB0aGlzW3Byb3BlcnR5XSA9PT0gcGFyZW50W3Byb3BlcnR5XSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBtZW1iZXJzID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gaXNQcm9wZXJ0eS5jYWxsKHRoaXMsIHByb3BlcnR5KTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gSW50ZXJuYWw6IEEgc2V0IG9mIHByaW1pdGl2ZSB0eXBlcyB1c2VkIGJ5IGBpc0hvc3RUeXBlYC5cbiAgICAgIHZhciBQcmltaXRpdmVUeXBlcyA9IHtcbiAgICAgICAgXCJib29sZWFuXCI6IDEsXG4gICAgICAgIFwibnVtYmVyXCI6IDEsXG4gICAgICAgIFwic3RyaW5nXCI6IDEsXG4gICAgICAgIFwidW5kZWZpbmVkXCI6IDFcbiAgICAgIH07XG5cbiAgICAgIC8vIEludGVybmFsOiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBvYmplY3QgYHByb3BlcnR5YCB2YWx1ZSBpcyBhXG4gICAgICAvLyBub24tcHJpbWl0aXZlLlxuICAgICAgdmFyIGlzSG9zdFR5cGUgPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBvYmplY3RbcHJvcGVydHldO1xuICAgICAgICByZXR1cm4gdHlwZSA9PSBcIm9iamVjdFwiID8gISFvYmplY3RbcHJvcGVydHldIDogIVByaW1pdGl2ZVR5cGVzW3R5cGVdO1xuICAgICAgfTtcblxuICAgICAgLy8gSW50ZXJuYWw6IE5vcm1hbGl6ZXMgdGhlIGBmb3IuLi5pbmAgaXRlcmF0aW9uIGFsZ29yaXRobSBhY3Jvc3NcbiAgICAgIC8vIGVudmlyb25tZW50cy4gRWFjaCBlbnVtZXJhdGVkIGtleSBpcyB5aWVsZGVkIHRvIGEgYGNhbGxiYWNrYCBmdW5jdGlvbi5cbiAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgc2l6ZSA9IDAsIFByb3BlcnRpZXMsIG1lbWJlcnMsIHByb3BlcnR5O1xuXG4gICAgICAgIC8vIFRlc3RzIGZvciBidWdzIGluIHRoZSBjdXJyZW50IGVudmlyb25tZW50J3MgYGZvci4uLmluYCBhbGdvcml0aG0uIFRoZVxuICAgICAgICAvLyBgdmFsdWVPZmAgcHJvcGVydHkgaW5oZXJpdHMgdGhlIG5vbi1lbnVtZXJhYmxlIGZsYWcgZnJvbVxuICAgICAgICAvLyBgT2JqZWN0LnByb3RvdHlwZWAgaW4gb2xkZXIgdmVyc2lvbnMgb2YgSUUsIE5ldHNjYXBlLCBhbmQgTW96aWxsYS5cbiAgICAgICAgKFByb3BlcnRpZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdGhpcy52YWx1ZU9mID0gMDtcbiAgICAgICAgfSkucHJvdG90eXBlLnZhbHVlT2YgPSAwO1xuXG4gICAgICAgIC8vIEl0ZXJhdGUgb3ZlciBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYFByb3BlcnRpZXNgIGNsYXNzLlxuICAgICAgICBtZW1iZXJzID0gbmV3IFByb3BlcnRpZXMoKTtcbiAgICAgICAgZm9yIChwcm9wZXJ0eSBpbiBtZW1iZXJzKSB7XG4gICAgICAgICAgLy8gSWdub3JlIGFsbCBwcm9wZXJ0aWVzIGluaGVyaXRlZCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC5cbiAgICAgICAgICBpZiAoaXNQcm9wZXJ0eS5jYWxsKG1lbWJlcnMsIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgc2l6ZSsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBQcm9wZXJ0aWVzID0gbWVtYmVycyA9IG51bGw7XG5cbiAgICAgICAgLy8gTm9ybWFsaXplIHRoZSBpdGVyYXRpb24gYWxnb3JpdGhtLlxuICAgICAgICBpZiAoIXNpemUpIHtcbiAgICAgICAgICAvLyBBIGxpc3Qgb2Ygbm9uLWVudW1lcmFibGUgcHJvcGVydGllcyBpbmhlcml0ZWQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuXG4gICAgICAgICAgbWVtYmVycyA9IFtcInZhbHVlT2ZcIiwgXCJ0b1N0cmluZ1wiLCBcInRvTG9jYWxlU3RyaW5nXCIsIFwicHJvcGVydHlJc0VudW1lcmFibGVcIiwgXCJpc1Byb3RvdHlwZU9mXCIsIFwiaGFzT3duUHJvcGVydHlcIiwgXCJjb25zdHJ1Y3RvclwiXTtcbiAgICAgICAgICAvLyBJRSA8PSA4LCBNb3ppbGxhIDEuMCwgYW5kIE5ldHNjYXBlIDYuMiBpZ25vcmUgc2hhZG93ZWQgbm9uLWVudW1lcmFibGVcbiAgICAgICAgICAvLyBwcm9wZXJ0aWVzLlxuICAgICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHksIGxlbmd0aDtcbiAgICAgICAgICAgIHZhciBoYXNQcm9wZXJ0eSA9ICFpc0Z1bmN0aW9uICYmIHR5cGVvZiBvYmplY3QuY29uc3RydWN0b3IgIT0gXCJmdW5jdGlvblwiICYmIGlzSG9zdFR5cGUob2JqZWN0LCBcImhhc093blByb3BlcnR5XCIpID8gb2JqZWN0Lmhhc093blByb3BlcnR5IDogaXNQcm9wZXJ0eTtcbiAgICAgICAgICAgIGZvciAocHJvcGVydHkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICAgIC8vIEdlY2tvIDw9IDEuMCBlbnVtZXJhdGVzIHRoZSBgcHJvdG90eXBlYCBwcm9wZXJ0eSBvZiBmdW5jdGlvbnMgdW5kZXJcbiAgICAgICAgICAgICAgLy8gY2VydGFpbiBjb25kaXRpb25zOyBJRSBkb2VzIG5vdC5cbiAgICAgICAgICAgICAgaWYgKCEoaXNGdW5jdGlvbiAmJiBwcm9wZXJ0eSA9PSBcInByb3RvdHlwZVwiKSAmJiBoYXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBNYW51YWxseSBpbnZva2UgdGhlIGNhbGxiYWNrIGZvciBlYWNoIG5vbi1lbnVtZXJhYmxlIHByb3BlcnR5LlxuICAgICAgICAgICAgZm9yIChsZW5ndGggPSBtZW1iZXJzLmxlbmd0aDsgcHJvcGVydHkgPSBtZW1iZXJzWy0tbGVuZ3RoXTsgaGFzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSAmJiBjYWxsYmFjayhwcm9wZXJ0eSkpO1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoc2l6ZSA9PSAyKSB7XG4gICAgICAgICAgLy8gU2FmYXJpIDw9IDIuMC40IGVudW1lcmF0ZXMgc2hhZG93ZWQgcHJvcGVydGllcyB0d2ljZS5cbiAgICAgICAgICBmb3JFYWNoID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIHNldCBvZiBpdGVyYXRlZCBwcm9wZXJ0aWVzLlxuICAgICAgICAgICAgdmFyIG1lbWJlcnMgPSB7fSwgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eTtcbiAgICAgICAgICAgIGZvciAocHJvcGVydHkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICAgIC8vIFN0b3JlIGVhY2ggcHJvcGVydHkgbmFtZSB0byBwcmV2ZW50IGRvdWJsZSBlbnVtZXJhdGlvbi4gVGhlXG4gICAgICAgICAgICAgIC8vIGBwcm90b3R5cGVgIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyBpcyBub3QgZW51bWVyYXRlZCBkdWUgdG8gY3Jvc3MtXG4gICAgICAgICAgICAgIC8vIGVudmlyb25tZW50IGluY29uc2lzdGVuY2llcy5cbiAgICAgICAgICAgICAgaWYgKCEoaXNGdW5jdGlvbiAmJiBwcm9wZXJ0eSA9PSBcInByb3RvdHlwZVwiKSAmJiAhaXNQcm9wZXJ0eS5jYWxsKG1lbWJlcnMsIHByb3BlcnR5KSAmJiAobWVtYmVyc1twcm9wZXJ0eV0gPSAxKSAmJiBpc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIE5vIGJ1Z3MgZGV0ZWN0ZWQ7IHVzZSB0aGUgc3RhbmRhcmQgYGZvci4uLmluYCBhbGdvcml0aG0uXG4gICAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICB2YXIgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eSwgaXNDb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgIGZvciAocHJvcGVydHkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgaXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpICYmICEoaXNDb25zdHJ1Y3RvciA9IHByb3BlcnR5ID09PSBcImNvbnN0cnVjdG9yXCIpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBNYW51YWxseSBpbnZva2UgdGhlIGNhbGxiYWNrIGZvciB0aGUgYGNvbnN0cnVjdG9yYCBwcm9wZXJ0eSBkdWUgdG9cbiAgICAgICAgICAgIC8vIGNyb3NzLWVudmlyb25tZW50IGluY29uc2lzdGVuY2llcy5cbiAgICAgICAgICAgIGlmIChpc0NvbnN0cnVjdG9yIHx8IGlzUHJvcGVydHkuY2FsbChvYmplY3QsIChwcm9wZXJ0eSA9IFwiY29uc3RydWN0b3JcIikpKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb3JFYWNoKG9iamVjdCwgY2FsbGJhY2spO1xuICAgICAgfTtcblxuICAgICAgLy8gUHVibGljOiBTZXJpYWxpemVzIGEgSmF2YVNjcmlwdCBgdmFsdWVgIGFzIGEgSlNPTiBzdHJpbmcuIFRoZSBvcHRpb25hbFxuICAgICAgLy8gYGZpbHRlcmAgYXJndW1lbnQgbWF5IHNwZWNpZnkgZWl0aGVyIGEgZnVuY3Rpb24gdGhhdCBhbHRlcnMgaG93IG9iamVjdCBhbmRcbiAgICAgIC8vIGFycmF5IG1lbWJlcnMgYXJlIHNlcmlhbGl6ZWQsIG9yIGFuIGFycmF5IG9mIHN0cmluZ3MgYW5kIG51bWJlcnMgdGhhdFxuICAgICAgLy8gaW5kaWNhdGVzIHdoaWNoIHByb3BlcnRpZXMgc2hvdWxkIGJlIHNlcmlhbGl6ZWQuIFRoZSBvcHRpb25hbCBgd2lkdGhgXG4gICAgICAvLyBhcmd1bWVudCBtYXkgYmUgZWl0aGVyIGEgc3RyaW5nIG9yIG51bWJlciB0aGF0IHNwZWNpZmllcyB0aGUgaW5kZW50YXRpb25cbiAgICAgIC8vIGxldmVsIG9mIHRoZSBvdXRwdXQuXG4gICAgICBpZiAoIWhhcyhcImpzb24tc3RyaW5naWZ5XCIpKSB7XG4gICAgICAgIC8vIEludGVybmFsOiBBIG1hcCBvZiBjb250cm9sIGNoYXJhY3RlcnMgYW5kIHRoZWlyIGVzY2FwZWQgZXF1aXZhbGVudHMuXG4gICAgICAgIHZhciBFc2NhcGVzID0ge1xuICAgICAgICAgIDkyOiBcIlxcXFxcXFxcXCIsXG4gICAgICAgICAgMzQ6ICdcXFxcXCInLFxuICAgICAgICAgIDg6IFwiXFxcXGJcIixcbiAgICAgICAgICAxMjogXCJcXFxcZlwiLFxuICAgICAgICAgIDEwOiBcIlxcXFxuXCIsXG4gICAgICAgICAgMTM6IFwiXFxcXHJcIixcbiAgICAgICAgICA5OiBcIlxcXFx0XCJcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogQ29udmVydHMgYHZhbHVlYCBpbnRvIGEgemVyby1wYWRkZWQgc3RyaW5nIHN1Y2ggdGhhdCBpdHNcbiAgICAgICAgLy8gbGVuZ3RoIGlzIGF0IGxlYXN0IGVxdWFsIHRvIGB3aWR0aGAuIFRoZSBgd2lkdGhgIG11c3QgYmUgPD0gNi5cbiAgICAgICAgdmFyIGxlYWRpbmdaZXJvZXMgPSBcIjAwMDAwMFwiO1xuICAgICAgICB2YXIgdG9QYWRkZWRTdHJpbmcgPSBmdW5jdGlvbiAod2lkdGgsIHZhbHVlKSB7XG4gICAgICAgICAgLy8gVGhlIGB8fCAwYCBleHByZXNzaW9uIGlzIG5lY2Vzc2FyeSB0byB3b3JrIGFyb3VuZCBhIGJ1ZyBpblxuICAgICAgICAgIC8vIE9wZXJhIDw9IDcuNTR1MiB3aGVyZSBgMCA9PSAtMGAsIGJ1dCBgU3RyaW5nKC0wKSAhPT0gXCIwXCJgLlxuICAgICAgICAgIHJldHVybiAobGVhZGluZ1plcm9lcyArICh2YWx1ZSB8fCAwKSkuc2xpY2UoLXdpZHRoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogRG91YmxlLXF1b3RlcyBhIHN0cmluZyBgdmFsdWVgLCByZXBsYWNpbmcgYWxsIEFTQ0lJIGNvbnRyb2xcbiAgICAgICAgLy8gY2hhcmFjdGVycyAoY2hhcmFjdGVycyB3aXRoIGNvZGUgdW5pdCB2YWx1ZXMgYmV0d2VlbiAwIGFuZCAzMSkgd2l0aFxuICAgICAgICAvLyB0aGVpciBlc2NhcGVkIGVxdWl2YWxlbnRzLiBUaGlzIGlzIGFuIGltcGxlbWVudGF0aW9uIG9mIHRoZVxuICAgICAgICAvLyBgUXVvdGUodmFsdWUpYCBvcGVyYXRpb24gZGVmaW5lZCBpbiBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLlxuICAgICAgICB2YXIgdW5pY29kZVByZWZpeCA9IFwiXFxcXHUwMFwiO1xuICAgICAgICB2YXIgcXVvdGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gJ1wiJywgaW5kZXggPSAwLCBsZW5ndGggPSB2YWx1ZS5sZW5ndGgsIHVzZUNoYXJJbmRleCA9ICFjaGFySW5kZXhCdWdneSB8fCBsZW5ndGggPiAxMDtcbiAgICAgICAgICB2YXIgc3ltYm9scyA9IHVzZUNoYXJJbmRleCAmJiAoY2hhckluZGV4QnVnZ3kgPyB2YWx1ZS5zcGxpdChcIlwiKSA6IHZhbHVlKTtcbiAgICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIHZhciBjaGFyQ29kZSA9IHZhbHVlLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgICAgICAgICAgLy8gSWYgdGhlIGNoYXJhY3RlciBpcyBhIGNvbnRyb2wgY2hhcmFjdGVyLCBhcHBlbmQgaXRzIFVuaWNvZGUgb3JcbiAgICAgICAgICAgIC8vIHNob3J0aGFuZCBlc2NhcGUgc2VxdWVuY2U7IG90aGVyd2lzZSwgYXBwZW5kIHRoZSBjaGFyYWN0ZXIgYXMtaXMuXG4gICAgICAgICAgICBzd2l0Y2ggKGNoYXJDb2RlKSB7XG4gICAgICAgICAgICAgIGNhc2UgODogY2FzZSA5OiBjYXNlIDEwOiBjYXNlIDEyOiBjYXNlIDEzOiBjYXNlIDM0OiBjYXNlIDkyOlxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSBFc2NhcGVzW2NoYXJDb2RlXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPCAzMikge1xuICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IHVuaWNvZGVQcmVmaXggKyB0b1BhZGRlZFN0cmluZygyLCBjaGFyQ29kZS50b1N0cmluZygxNikpO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB1c2VDaGFySW5kZXggPyBzeW1ib2xzW2luZGV4XSA6IHZhbHVlLmNoYXJBdChpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQgKyAnXCInO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSBzZXJpYWxpemVzIGFuIG9iamVjdC4gSW1wbGVtZW50cyB0aGVcbiAgICAgICAgLy8gYFN0cihrZXksIGhvbGRlcilgLCBgSk8odmFsdWUpYCwgYW5kIGBKQSh2YWx1ZSlgIG9wZXJhdGlvbnMuXG4gICAgICAgIHZhciBzZXJpYWxpemUgPSBmdW5jdGlvbiAocHJvcGVydHksIG9iamVjdCwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLCBzdGFjaykge1xuICAgICAgICAgIHZhciB2YWx1ZSwgY2xhc3NOYW1lLCB5ZWFyLCBtb250aCwgZGF0ZSwgdGltZSwgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcywgcmVzdWx0cywgZWxlbWVudCwgaW5kZXgsIGxlbmd0aCwgcHJlZml4LCByZXN1bHQ7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIE5lY2Vzc2FyeSBmb3IgaG9zdCBvYmplY3Qgc3VwcG9ydC5cbiAgICAgICAgICAgIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiICYmIHZhbHVlKSB7XG4gICAgICAgICAgICBjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKTtcbiAgICAgICAgICAgIGlmIChjbGFzc05hbWUgPT0gZGF0ZUNsYXNzICYmICFpc1Byb3BlcnR5LmNhbGwodmFsdWUsIFwidG9KU09OXCIpKSB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA+IC0xIC8gMCAmJiB2YWx1ZSA8IDEgLyAwKSB7XG4gICAgICAgICAgICAgICAgLy8gRGF0ZXMgYXJlIHNlcmlhbGl6ZWQgYWNjb3JkaW5nIHRvIHRoZSBgRGF0ZSN0b0pTT05gIG1ldGhvZFxuICAgICAgICAgICAgICAgIC8vIHNwZWNpZmllZCBpbiBFUyA1LjEgc2VjdGlvbiAxNS45LjUuNDQuIFNlZSBzZWN0aW9uIDE1LjkuMS4xNVxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgSVNPIDg2MDEgZGF0ZSB0aW1lIHN0cmluZyBmb3JtYXQuXG4gICAgICAgICAgICAgICAgaWYgKGdldERheSkge1xuICAgICAgICAgICAgICAgICAgLy8gTWFudWFsbHkgY29tcHV0ZSB0aGUgeWVhciwgbW9udGgsIGRhdGUsIGhvdXJzLCBtaW51dGVzLFxuICAgICAgICAgICAgICAgICAgLy8gc2Vjb25kcywgYW5kIG1pbGxpc2Vjb25kcyBpZiB0aGUgYGdldFVUQypgIG1ldGhvZHMgYXJlXG4gICAgICAgICAgICAgICAgICAvLyBidWdneS4gQWRhcHRlZCBmcm9tIEBZYWZmbGUncyBgZGF0ZS1zaGltYCBwcm9qZWN0LlxuICAgICAgICAgICAgICAgICAgZGF0ZSA9IGZsb29yKHZhbHVlIC8gODY0ZTUpO1xuICAgICAgICAgICAgICAgICAgZm9yICh5ZWFyID0gZmxvb3IoZGF0ZSAvIDM2NS4yNDI1KSArIDE5NzAgLSAxOyBnZXREYXkoeWVhciArIDEsIDApIDw9IGRhdGU7IHllYXIrKyk7XG4gICAgICAgICAgICAgICAgICBmb3IgKG1vbnRoID0gZmxvb3IoKGRhdGUgLSBnZXREYXkoeWVhciwgMCkpIC8gMzAuNDIpOyBnZXREYXkoeWVhciwgbW9udGggKyAxKSA8PSBkYXRlOyBtb250aCsrKTtcbiAgICAgICAgICAgICAgICAgIGRhdGUgPSAxICsgZGF0ZSAtIGdldERheSh5ZWFyLCBtb250aCk7XG4gICAgICAgICAgICAgICAgICAvLyBUaGUgYHRpbWVgIHZhbHVlIHNwZWNpZmllcyB0aGUgdGltZSB3aXRoaW4gdGhlIGRheSAoc2VlIEVTXG4gICAgICAgICAgICAgICAgICAvLyA1LjEgc2VjdGlvbiAxNS45LjEuMikuIFRoZSBmb3JtdWxhIGAoQSAlIEIgKyBCKSAlIEJgIGlzIHVzZWRcbiAgICAgICAgICAgICAgICAgIC8vIHRvIGNvbXB1dGUgYEEgbW9kdWxvIEJgLCBhcyB0aGUgYCVgIG9wZXJhdG9yIGRvZXMgbm90XG4gICAgICAgICAgICAgICAgICAvLyBjb3JyZXNwb25kIHRvIHRoZSBgbW9kdWxvYCBvcGVyYXRpb24gZm9yIG5lZ2F0aXZlIG51bWJlcnMuXG4gICAgICAgICAgICAgICAgICB0aW1lID0gKHZhbHVlICUgODY0ZTUgKyA4NjRlNSkgJSA4NjRlNTtcbiAgICAgICAgICAgICAgICAgIC8vIFRoZSBob3VycywgbWludXRlcywgc2Vjb25kcywgYW5kIG1pbGxpc2Vjb25kcyBhcmUgb2J0YWluZWQgYnlcbiAgICAgICAgICAgICAgICAgIC8vIGRlY29tcG9zaW5nIHRoZSB0aW1lIHdpdGhpbiB0aGUgZGF5LiBTZWUgc2VjdGlvbiAxNS45LjEuMTAuXG4gICAgICAgICAgICAgICAgICBob3VycyA9IGZsb29yKHRpbWUgLyAzNmU1KSAlIDI0O1xuICAgICAgICAgICAgICAgICAgbWludXRlcyA9IGZsb29yKHRpbWUgLyA2ZTQpICUgNjA7XG4gICAgICAgICAgICAgICAgICBzZWNvbmRzID0gZmxvb3IodGltZSAvIDFlMykgJSA2MDtcbiAgICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IHRpbWUgJSAxZTM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHllYXIgPSB2YWx1ZS5nZXRVVENGdWxsWWVhcigpO1xuICAgICAgICAgICAgICAgICAgbW9udGggPSB2YWx1ZS5nZXRVVENNb250aCgpO1xuICAgICAgICAgICAgICAgICAgZGF0ZSA9IHZhbHVlLmdldFVUQ0RhdGUoKTtcbiAgICAgICAgICAgICAgICAgIGhvdXJzID0gdmFsdWUuZ2V0VVRDSG91cnMoKTtcbiAgICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSB2YWx1ZS5nZXRVVENNaW51dGVzKCk7XG4gICAgICAgICAgICAgICAgICBzZWNvbmRzID0gdmFsdWUuZ2V0VVRDU2Vjb25kcygpO1xuICAgICAgICAgICAgICAgICAgbWlsbGlzZWNvbmRzID0gdmFsdWUuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIFNlcmlhbGl6ZSBleHRlbmRlZCB5ZWFycyBjb3JyZWN0bHkuXG4gICAgICAgICAgICAgICAgdmFsdWUgPSAoeWVhciA8PSAwIHx8IHllYXIgPj0gMWU0ID8gKHllYXIgPCAwID8gXCItXCIgOiBcIitcIikgKyB0b1BhZGRlZFN0cmluZyg2LCB5ZWFyIDwgMCA/IC15ZWFyIDogeWVhcikgOiB0b1BhZGRlZFN0cmluZyg0LCB5ZWFyKSkgK1xuICAgICAgICAgICAgICAgICAgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBtb250aCArIDEpICsgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBkYXRlKSArXG4gICAgICAgICAgICAgICAgICAvLyBNb250aHMsIGRhdGVzLCBob3VycywgbWludXRlcywgYW5kIHNlY29uZHMgc2hvdWxkIGhhdmUgdHdvXG4gICAgICAgICAgICAgICAgICAvLyBkaWdpdHM7IG1pbGxpc2Vjb25kcyBzaG91bGQgaGF2ZSB0aHJlZS5cbiAgICAgICAgICAgICAgICAgIFwiVFwiICsgdG9QYWRkZWRTdHJpbmcoMiwgaG91cnMpICsgXCI6XCIgKyB0b1BhZGRlZFN0cmluZygyLCBtaW51dGVzKSArIFwiOlwiICsgdG9QYWRkZWRTdHJpbmcoMiwgc2Vjb25kcykgK1xuICAgICAgICAgICAgICAgICAgLy8gTWlsbGlzZWNvbmRzIGFyZSBvcHRpb25hbCBpbiBFUyA1LjAsIGJ1dCByZXF1aXJlZCBpbiA1LjEuXG4gICAgICAgICAgICAgICAgICBcIi5cIiArIHRvUGFkZGVkU3RyaW5nKDMsIG1pbGxpc2Vjb25kcykgKyBcIlpcIjtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG51bGw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlLnRvSlNPTiA9PSBcImZ1bmN0aW9uXCIgJiYgKChjbGFzc05hbWUgIT0gbnVtYmVyQ2xhc3MgJiYgY2xhc3NOYW1lICE9IHN0cmluZ0NsYXNzICYmIGNsYXNzTmFtZSAhPSBhcnJheUNsYXNzKSB8fCBpc1Byb3BlcnR5LmNhbGwodmFsdWUsIFwidG9KU09OXCIpKSkge1xuICAgICAgICAgICAgICAvLyBQcm90b3R5cGUgPD0gMS42LjEgYWRkcyBub24tc3RhbmRhcmQgYHRvSlNPTmAgbWV0aG9kcyB0byB0aGVcbiAgICAgICAgICAgICAgLy8gYE51bWJlcmAsIGBTdHJpbmdgLCBgRGF0ZWAsIGFuZCBgQXJyYXlgIHByb3RvdHlwZXMuIEpTT04gM1xuICAgICAgICAgICAgICAvLyBpZ25vcmVzIGFsbCBgdG9KU09OYCBtZXRob2RzIG9uIHRoZXNlIG9iamVjdHMgdW5sZXNzIHRoZXkgYXJlXG4gICAgICAgICAgICAgIC8vIGRlZmluZWQgZGlyZWN0bHkgb24gYW4gaW5zdGFuY2UuXG4gICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9KU09OKHByb3BlcnR5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHJlcGxhY2VtZW50IGZ1bmN0aW9uIHdhcyBwcm92aWRlZCwgY2FsbCBpdCB0byBvYnRhaW4gdGhlIHZhbHVlXG4gICAgICAgICAgICAvLyBmb3Igc2VyaWFsaXphdGlvbi5cbiAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suY2FsbChvYmplY3QsIHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFwibnVsbFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKTtcbiAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGJvb2xlYW5DbGFzcykge1xuICAgICAgICAgICAgLy8gQm9vbGVhbnMgYXJlIHJlcHJlc2VudGVkIGxpdGVyYWxseS5cbiAgICAgICAgICAgIHJldHVybiBcIlwiICsgdmFsdWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gbnVtYmVyQ2xhc3MpIHtcbiAgICAgICAgICAgIC8vIEpTT04gbnVtYmVycyBtdXN0IGJlIGZpbml0ZS4gYEluZmluaXR5YCBhbmQgYE5hTmAgYXJlIHNlcmlhbGl6ZWQgYXNcbiAgICAgICAgICAgIC8vIGBcIm51bGxcImAuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgPiAtMSAvIDAgJiYgdmFsdWUgPCAxIC8gMCA/IFwiXCIgKyB2YWx1ZSA6IFwibnVsbFwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzKSB7XG4gICAgICAgICAgICAvLyBTdHJpbmdzIGFyZSBkb3VibGUtcXVvdGVkIGFuZCBlc2NhcGVkLlxuICAgICAgICAgICAgcmV0dXJuIHF1b3RlKFwiXCIgKyB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZSBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoaXMgaXMgYSBsaW5lYXIgc2VhcmNoOyBwZXJmb3JtYW5jZVxuICAgICAgICAgICAgLy8gaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mIHVuaXF1ZSBuZXN0ZWQgb2JqZWN0cy5cbiAgICAgICAgICAgIGZvciAobGVuZ3RoID0gc3RhY2subGVuZ3RoOyBsZW5ndGgtLTspIHtcbiAgICAgICAgICAgICAgaWYgKHN0YWNrW2xlbmd0aF0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLy8gQ3ljbGljIHN0cnVjdHVyZXMgY2Fubm90IGJlIHNlcmlhbGl6ZWQgYnkgYEpTT04uc3RyaW5naWZ5YC5cbiAgICAgICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQWRkIHRoZSBvYmplY3QgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgICAgICAgICAgc3RhY2sucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICAvLyBTYXZlIHRoZSBjdXJyZW50IGluZGVudGF0aW9uIGxldmVsIGFuZCBpbmRlbnQgb25lIGFkZGl0aW9uYWwgbGV2ZWwuXG4gICAgICAgICAgICBwcmVmaXggPSBpbmRlbnRhdGlvbjtcbiAgICAgICAgICAgIGluZGVudGF0aW9uICs9IHdoaXRlc3BhY2U7XG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGFycmF5Q2xhc3MpIHtcbiAgICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIGFycmF5IGVsZW1lbnRzLlxuICAgICAgICAgICAgICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gdmFsdWUubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBzZXJpYWxpemUoaW5kZXgsIHZhbHVlLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sIHN0YWNrKTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZWxlbWVudCA9PT0gdW5kZWYgPyBcIm51bGxcIiA6IGVsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdHMubGVuZ3RoID8gKHdoaXRlc3BhY2UgPyBcIltcXG5cIiArIGluZGVudGF0aW9uICsgcmVzdWx0cy5qb2luKFwiLFxcblwiICsgaW5kZW50YXRpb24pICsgXCJcXG5cIiArIHByZWZpeCArIFwiXVwiIDogKFwiW1wiICsgcmVzdWx0cy5qb2luKFwiLFwiKSArIFwiXVwiKSkgOiBcIltdXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBSZWN1cnNpdmVseSBzZXJpYWxpemUgb2JqZWN0IG1lbWJlcnMuIE1lbWJlcnMgYXJlIHNlbGVjdGVkIGZyb21cbiAgICAgICAgICAgICAgLy8gZWl0aGVyIGEgdXNlci1zcGVjaWZpZWQgbGlzdCBvZiBwcm9wZXJ0eSBuYW1lcywgb3IgdGhlIG9iamVjdFxuICAgICAgICAgICAgICAvLyBpdHNlbGYuXG4gICAgICAgICAgICAgIGZvckVhY2gocHJvcGVydGllcyB8fCB2YWx1ZSwgZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBzZXJpYWxpemUocHJvcGVydHksIHZhbHVlLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sIHN0YWNrKTtcbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCAhPT0gdW5kZWYpIHtcbiAgICAgICAgICAgICAgICAgIC8vIEFjY29yZGluZyB0byBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zOiBcIklmIGBnYXBgIHt3aGl0ZXNwYWNlfVxuICAgICAgICAgICAgICAgICAgLy8gaXMgbm90IHRoZSBlbXB0eSBzdHJpbmcsIGxldCBgbWVtYmVyYCB7cXVvdGUocHJvcGVydHkpICsgXCI6XCJ9XG4gICAgICAgICAgICAgICAgICAvLyBiZSB0aGUgY29uY2F0ZW5hdGlvbiBvZiBgbWVtYmVyYCBhbmQgdGhlIGBzcGFjZWAgY2hhcmFjdGVyLlwiXG4gICAgICAgICAgICAgICAgICAvLyBUaGUgXCJgc3BhY2VgIGNoYXJhY3RlclwiIHJlZmVycyB0byB0aGUgbGl0ZXJhbCBzcGFjZVxuICAgICAgICAgICAgICAgICAgLy8gY2hhcmFjdGVyLCBub3QgdGhlIGBzcGFjZWAge3dpZHRofSBhcmd1bWVudCBwcm92aWRlZCB0b1xuICAgICAgICAgICAgICAgICAgLy8gYEpTT04uc3RyaW5naWZ5YC5cbiAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChxdW90ZShwcm9wZXJ0eSkgKyBcIjpcIiArICh3aGl0ZXNwYWNlID8gXCIgXCIgOiBcIlwiKSArIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdHMubGVuZ3RoID8gKHdoaXRlc3BhY2UgPyBcIntcXG5cIiArIGluZGVudGF0aW9uICsgcmVzdWx0cy5qb2luKFwiLFxcblwiICsgaW5kZW50YXRpb24pICsgXCJcXG5cIiArIHByZWZpeCArIFwifVwiIDogKFwie1wiICsgcmVzdWx0cy5qb2luKFwiLFwiKSArIFwifVwiKSkgOiBcInt9XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIG9iamVjdCBmcm9tIHRoZSB0cmF2ZXJzZWQgb2JqZWN0IHN0YWNrLlxuICAgICAgICAgICAgc3RhY2sucG9wKCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBQdWJsaWM6IGBKU09OLnN0cmluZ2lmeWAuIFNlZSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLlxuICAgICAgICBleHBvcnRzLnN0cmluZ2lmeSA9IGZ1bmN0aW9uIChzb3VyY2UsIGZpbHRlciwgd2lkdGgpIHtcbiAgICAgICAgICB2YXIgd2hpdGVzcGFjZSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIGNsYXNzTmFtZTtcbiAgICAgICAgICBpZiAodHlwZW9mIGZpbHRlciA9PSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIGZpbHRlciA9PSBcIm9iamVjdFwiICYmIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKGZpbHRlcikpID09IGZ1bmN0aW9uQ2xhc3MpIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmaWx0ZXI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzKSB7XG4gICAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIHByb3BlcnR5IG5hbWVzIGFycmF5IGludG8gYSBtYWtlc2hpZnQgc2V0LlxuICAgICAgICAgICAgICBwcm9wZXJ0aWVzID0ge307XG4gICAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMCwgbGVuZ3RoID0gZmlsdGVyLmxlbmd0aCwgdmFsdWU7IGluZGV4IDwgbGVuZ3RoOyB2YWx1ZSA9IGZpbHRlcltpbmRleCsrXSwgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKSksIGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcyB8fCBjbGFzc05hbWUgPT0gbnVtYmVyQ2xhc3MpICYmIChwcm9wZXJ0aWVzW3ZhbHVlXSA9IDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHdpZHRoKSB7XG4gICAgICAgICAgICBpZiAoKGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwod2lkdGgpKSA9PSBudW1iZXJDbGFzcykge1xuICAgICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBgd2lkdGhgIHRvIGFuIGludGVnZXIgYW5kIGNyZWF0ZSBhIHN0cmluZyBjb250YWluaW5nXG4gICAgICAgICAgICAgIC8vIGB3aWR0aGAgbnVtYmVyIG9mIHNwYWNlIGNoYXJhY3RlcnMuXG4gICAgICAgICAgICAgIGlmICgod2lkdGggLT0gd2lkdGggJSAxKSA+IDApIHtcbiAgICAgICAgICAgICAgICBmb3IgKHdoaXRlc3BhY2UgPSBcIlwiLCB3aWR0aCA+IDEwICYmICh3aWR0aCA9IDEwKTsgd2hpdGVzcGFjZS5sZW5ndGggPCB3aWR0aDsgd2hpdGVzcGFjZSArPSBcIiBcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzKSB7XG4gICAgICAgICAgICAgIHdoaXRlc3BhY2UgPSB3aWR0aC5sZW5ndGggPD0gMTAgPyB3aWR0aCA6IHdpZHRoLnNsaWNlKDAsIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gT3BlcmEgPD0gNy41NHUyIGRpc2NhcmRzIHRoZSB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIGVtcHR5IHN0cmluZyBrZXlzXG4gICAgICAgICAgLy8gKGBcIlwiYCkgb25seSBpZiB0aGV5IGFyZSB1c2VkIGRpcmVjdGx5IHdpdGhpbiBhbiBvYmplY3QgbWVtYmVyIGxpc3RcbiAgICAgICAgICAvLyAoZS5nLiwgYCEoXCJcIiBpbiB7IFwiXCI6IDF9KWApLlxuICAgICAgICAgIHJldHVybiBzZXJpYWxpemUoXCJcIiwgKHZhbHVlID0ge30sIHZhbHVlW1wiXCJdID0gc291cmNlLCB2YWx1ZSksIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBcIlwiLCBbXSk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIFB1YmxpYzogUGFyc2VzIGEgSlNPTiBzb3VyY2Ugc3RyaW5nLlxuICAgICAgaWYgKCFoYXMoXCJqc29uLXBhcnNlXCIpKSB7XG4gICAgICAgIHZhciBmcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlO1xuXG4gICAgICAgIC8vIEludGVybmFsOiBBIG1hcCBvZiBlc2NhcGVkIGNvbnRyb2wgY2hhcmFjdGVycyBhbmQgdGhlaXIgdW5lc2NhcGVkXG4gICAgICAgIC8vIGVxdWl2YWxlbnRzLlxuICAgICAgICB2YXIgVW5lc2NhcGVzID0ge1xuICAgICAgICAgIDkyOiBcIlxcXFxcIixcbiAgICAgICAgICAzNDogJ1wiJyxcbiAgICAgICAgICA0NzogXCIvXCIsXG4gICAgICAgICAgOTg6IFwiXFxiXCIsXG4gICAgICAgICAgMTE2OiBcIlxcdFwiLFxuICAgICAgICAgIDExMDogXCJcXG5cIixcbiAgICAgICAgICAxMDI6IFwiXFxmXCIsXG4gICAgICAgICAgMTE0OiBcIlxcclwiXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFN0b3JlcyB0aGUgcGFyc2VyIHN0YXRlLlxuICAgICAgICB2YXIgSW5kZXgsIFNvdXJjZTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogUmVzZXRzIHRoZSBwYXJzZXIgc3RhdGUgYW5kIHRocm93cyBhIGBTeW50YXhFcnJvcmAuXG4gICAgICAgIHZhciBhYm9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBJbmRleCA9IFNvdXJjZSA9IG51bGw7XG4gICAgICAgICAgdGhyb3cgU3ludGF4RXJyb3IoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogUmV0dXJucyB0aGUgbmV4dCB0b2tlbiwgb3IgYFwiJFwiYCBpZiB0aGUgcGFyc2VyIGhhcyByZWFjaGVkXG4gICAgICAgIC8vIHRoZSBlbmQgb2YgdGhlIHNvdXJjZSBzdHJpbmcuIEEgdG9rZW4gbWF5IGJlIGEgc3RyaW5nLCBudW1iZXIsIGBudWxsYFxuICAgICAgICAvLyBsaXRlcmFsLCBvciBCb29sZWFuIGxpdGVyYWwuXG4gICAgICAgIHZhciBsZXggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIHNvdXJjZSA9IFNvdXJjZSwgbGVuZ3RoID0gc291cmNlLmxlbmd0aCwgdmFsdWUsIGJlZ2luLCBwb3NpdGlvbiwgaXNTaWduZWQsIGNoYXJDb2RlO1xuICAgICAgICAgIHdoaWxlIChJbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XG4gICAgICAgICAgICBzd2l0Y2ggKGNoYXJDb2RlKSB7XG4gICAgICAgICAgICAgIGNhc2UgOTogY2FzZSAxMDogY2FzZSAxMzogY2FzZSAzMjpcbiAgICAgICAgICAgICAgICAvLyBTa2lwIHdoaXRlc3BhY2UgdG9rZW5zLCBpbmNsdWRpbmcgdGFicywgY2FycmlhZ2UgcmV0dXJucywgbGluZVxuICAgICAgICAgICAgICAgIC8vIGZlZWRzLCBhbmQgc3BhY2UgY2hhcmFjdGVycy5cbiAgICAgICAgICAgICAgICBJbmRleCsrO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICBjYXNlIDEyMzogY2FzZSAxMjU6IGNhc2UgOTE6IGNhc2UgOTM6IGNhc2UgNTg6IGNhc2UgNDQ6XG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgYSBwdW5jdHVhdG9yIHRva2VuIChge2AsIGB9YCwgYFtgLCBgXWAsIGA6YCwgb3IgYCxgKSBhdFxuICAgICAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgICAgICAgICAgICAgIHZhbHVlID0gY2hhckluZGV4QnVnZ3kgPyBzb3VyY2UuY2hhckF0KEluZGV4KSA6IHNvdXJjZVtJbmRleF07XG4gICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgIGNhc2UgMzQ6XG4gICAgICAgICAgICAgICAgLy8gYFwiYCBkZWxpbWl0cyBhIEpTT04gc3RyaW5nOyBhZHZhbmNlIHRvIHRoZSBuZXh0IGNoYXJhY3RlciBhbmRcbiAgICAgICAgICAgICAgICAvLyBiZWdpbiBwYXJzaW5nIHRoZSBzdHJpbmcuIFN0cmluZyB0b2tlbnMgYXJlIHByZWZpeGVkIHdpdGggdGhlXG4gICAgICAgICAgICAgICAgLy8gc2VudGluZWwgYEBgIGNoYXJhY3RlciB0byBkaXN0aW5ndWlzaCB0aGVtIGZyb20gcHVuY3R1YXRvcnMgYW5kXG4gICAgICAgICAgICAgICAgLy8gZW5kLW9mLXN0cmluZyB0b2tlbnMuXG4gICAgICAgICAgICAgICAgZm9yICh2YWx1ZSA9IFwiQFwiLCBJbmRleCsrOyBJbmRleCA8IGxlbmd0aDspIHtcbiAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlIDwgMzIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5lc2NhcGVkIEFTQ0lJIGNvbnRyb2wgY2hhcmFjdGVycyAodGhvc2Ugd2l0aCBhIGNvZGUgdW5pdFxuICAgICAgICAgICAgICAgICAgICAvLyBsZXNzIHRoYW4gdGhlIHNwYWNlIGNoYXJhY3RlcikgYXJlIG5vdCBwZXJtaXR0ZWQuXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoYXJDb2RlID09IDkyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEEgcmV2ZXJzZSBzb2xpZHVzIChgXFxgKSBtYXJrcyB0aGUgYmVnaW5uaW5nIG9mIGFuIGVzY2FwZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gY29udHJvbCBjaGFyYWN0ZXIgKGluY2x1ZGluZyBgXCJgLCBgXFxgLCBhbmQgYC9gKSBvciBVbmljb2RlXG4gICAgICAgICAgICAgICAgICAgIC8vIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgOTI6IGNhc2UgMzQ6IGNhc2UgNDc6IGNhc2UgOTg6IGNhc2UgMTE2OiBjYXNlIDExMDogY2FzZSAxMDI6IGNhc2UgMTE0OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmV2aXZlIGVzY2FwZWQgY29udHJvbCBjaGFyYWN0ZXJzLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gVW5lc2NhcGVzW2NoYXJDb2RlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEluZGV4Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICBjYXNlIDExNzpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGBcXHVgIG1hcmtzIHRoZSBiZWdpbm5pbmcgb2YgYSBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgdG8gdGhlIGZpcnN0IGNoYXJhY3RlciBhbmQgdmFsaWRhdGUgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3VyLWRpZ2l0IGNvZGUgcG9pbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICBiZWdpbiA9ICsrSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHBvc2l0aW9uID0gSW5kZXggKyA0OyBJbmRleCA8IHBvc2l0aW9uOyBJbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBIHZhbGlkIHNlcXVlbmNlIGNvbXByaXNlcyBmb3VyIGhleGRpZ2l0cyAoY2FzZS1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5zZW5zaXRpdmUpIHRoYXQgZm9ybSBhIHNpbmdsZSBoZXhhZGVjaW1hbCB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcgfHwgY2hhckNvZGUgPj0gOTcgJiYgY2hhckNvZGUgPD0gMTAyIHx8IGNoYXJDb2RlID49IDY1ICYmIGNoYXJDb2RlIDw9IDcwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludmFsaWQgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmV2aXZlIHRoZSBlc2NhcGVkIGNoYXJhY3Rlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IGZyb21DaGFyQ29kZShcIjB4XCIgKyBzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW52YWxpZCBlc2NhcGUgc2VxdWVuY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gMzQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBBbiB1bmVzY2FwZWQgZG91YmxlLXF1b3RlIGNoYXJhY3RlciBtYXJrcyB0aGUgZW5kIG9mIHRoZVxuICAgICAgICAgICAgICAgICAgICAgIC8vIHN0cmluZy5cbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgYmVnaW4gPSBJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgLy8gT3B0aW1pemUgZm9yIHRoZSBjb21tb24gY2FzZSB3aGVyZSBhIHN0cmluZyBpcyB2YWxpZC5cbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGNoYXJDb2RlID49IDMyICYmIGNoYXJDb2RlICE9IDkyICYmIGNoYXJDb2RlICE9IDM0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBBcHBlbmQgdGhlIHN0cmluZyBhcy1pcy5cbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChJbmRleCkgPT0gMzQpIHtcbiAgICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgdG8gdGhlIG5leHQgY2hhcmFjdGVyIGFuZCByZXR1cm4gdGhlIHJldml2ZWQgc3RyaW5nLlxuICAgICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gVW50ZXJtaW5hdGVkIHN0cmluZy5cbiAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIFBhcnNlIG51bWJlcnMgYW5kIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgIGJlZ2luID0gSW5kZXg7XG4gICAgICAgICAgICAgICAgLy8gQWR2YW5jZSBwYXN0IHRoZSBuZWdhdGl2ZSBzaWduLCBpZiBvbmUgaXMgc3BlY2lmaWVkLlxuICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0NSkge1xuICAgICAgICAgICAgICAgICAgaXNTaWduZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgYW4gaW50ZWdlciBvciBmbG9hdGluZy1wb2ludCB2YWx1ZS5cbiAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpIHtcbiAgICAgICAgICAgICAgICAgIC8vIExlYWRpbmcgemVyb2VzIGFyZSBpbnRlcnByZXRlZCBhcyBvY3RhbCBsaXRlcmFscy5cbiAgICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0OCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXggKyAxKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIG9jdGFsIGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICBpc1NpZ25lZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGludGVnZXIgY29tcG9uZW50LlxuICAgICAgICAgICAgICAgICAgZm9yICg7IEluZGV4IDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCkpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IEluZGV4KyspO1xuICAgICAgICAgICAgICAgICAgLy8gRmxvYXRzIGNhbm5vdCBjb250YWluIGEgbGVhZGluZyBkZWNpbWFsIHBvaW50OyBob3dldmVyLCB0aGlzXG4gICAgICAgICAgICAgICAgICAvLyBjYXNlIGlzIGFscmVhZHkgYWNjb3VudGVkIGZvciBieSB0aGUgcGFyc2VyLlxuICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSA9PSA0Nikge1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbiA9ICsrSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBkZWNpbWFsIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgICAgICAgZm9yICg7IHBvc2l0aW9uIDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChwb3NpdGlvbikpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IHBvc2l0aW9uKyspO1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPT0gSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIHRyYWlsaW5nIGRlY2ltYWwuXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBJbmRleCA9IHBvc2l0aW9uO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgZXhwb25lbnRzLiBUaGUgYGVgIGRlbm90aW5nIHRoZSBleHBvbmVudCBpc1xuICAgICAgICAgICAgICAgICAgLy8gY2FzZS1pbnNlbnNpdGl2ZS5cbiAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDEwMSB8fCBjaGFyQ29kZSA9PSA2OSkge1xuICAgICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xuICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIHBhc3QgdGhlIHNpZ24gZm9sbG93aW5nIHRoZSBleHBvbmVudCwgaWYgb25lIGlzXG4gICAgICAgICAgICAgICAgICAgIC8vIHNwZWNpZmllZC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDQzIHx8IGNoYXJDb2RlID09IDQ1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgSW5kZXgrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgZXhwb25lbnRpYWwgY29tcG9uZW50LlxuICAgICAgICAgICAgICAgICAgICBmb3IgKHBvc2l0aW9uID0gSW5kZXg7IHBvc2l0aW9uIDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChwb3NpdGlvbikpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IHBvc2l0aW9uKyspO1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPT0gSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIGVtcHR5IGV4cG9uZW50LlxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgSW5kZXggPSBwb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8vIENvZXJjZSB0aGUgcGFyc2VkIHZhbHVlIHRvIGEgSmF2YVNjcmlwdCBudW1iZXIuXG4gICAgICAgICAgICAgICAgICByZXR1cm4gK3NvdXJjZS5zbGljZShiZWdpbiwgSW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBBIG5lZ2F0aXZlIHNpZ24gbWF5IG9ubHkgcHJlY2VkZSBudW1iZXJzLlxuICAgICAgICAgICAgICAgIGlmIChpc1NpZ25lZCkge1xuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYHRydWVgLCBgZmFsc2VgLCBhbmQgYG51bGxgIGxpdGVyYWxzLlxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNCkgPT0gXCJ0cnVlXCIpIHtcbiAgICAgICAgICAgICAgICAgIEluZGV4ICs9IDQ7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA1KSA9PSBcImZhbHNlXCIpIHtcbiAgICAgICAgICAgICAgICAgIEluZGV4ICs9IDU7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNCkgPT0gXCJudWxsXCIpIHtcbiAgICAgICAgICAgICAgICAgIEluZGV4ICs9IDQ7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gVW5yZWNvZ25pemVkIHRva2VuLlxuICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJldHVybiB0aGUgc2VudGluZWwgYCRgIGNoYXJhY3RlciBpZiB0aGUgcGFyc2VyIGhhcyByZWFjaGVkIHRoZSBlbmRcbiAgICAgICAgICAvLyBvZiB0aGUgc291cmNlIHN0cmluZy5cbiAgICAgICAgICByZXR1cm4gXCIkXCI7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gSW50ZXJuYWw6IFBhcnNlcyBhIEpTT04gYHZhbHVlYCB0b2tlbi5cbiAgICAgICAgdmFyIGdldCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgIHZhciByZXN1bHRzLCBoYXNNZW1iZXJzO1xuICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIiRcIikge1xuICAgICAgICAgICAgLy8gVW5leHBlY3RlZCBlbmQgb2YgaW5wdXQuXG4gICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGlmICgoY2hhckluZGV4QnVnZ3kgPyB2YWx1ZS5jaGFyQXQoMCkgOiB2YWx1ZVswXSkgPT0gXCJAXCIpIHtcbiAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBzZW50aW5lbCBgQGAgY2hhcmFjdGVyLlxuICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuc2xpY2UoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBQYXJzZSBvYmplY3QgYW5kIGFycmF5IGxpdGVyYWxzLlxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiW1wiKSB7XG4gICAgICAgICAgICAgIC8vIFBhcnNlcyBhIEpTT04gYXJyYXksIHJldHVybmluZyBhIG5ldyBKYXZhU2NyaXB0IGFycmF5LlxuICAgICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICAgIGZvciAoOzsgaGFzTWVtYmVycyB8fCAoaGFzTWVtYmVycyA9IHRydWUpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcbiAgICAgICAgICAgICAgICAvLyBBIGNsb3Npbmcgc3F1YXJlIGJyYWNrZXQgbWFya3MgdGhlIGVuZCBvZiB0aGUgYXJyYXkgbGl0ZXJhbC5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJdXCIpIHtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgYXJyYXkgbGl0ZXJhbCBjb250YWlucyBlbGVtZW50cywgdGhlIGN1cnJlbnQgdG9rZW5cbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgYmUgYSBjb21tYSBzZXBhcmF0aW5nIHRoZSBwcmV2aW91cyBlbGVtZW50IGZyb20gdGhlXG4gICAgICAgICAgICAgICAgLy8gbmV4dC5cbiAgICAgICAgICAgICAgICBpZiAoaGFzTWVtYmVycykge1xuICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbGV4KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIl1cIikge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdHJhaWxpbmcgYCxgIGluIGFycmF5IGxpdGVyYWwuXG4gICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQSBgLGAgbXVzdCBzZXBhcmF0ZSBlYWNoIGFycmF5IGVsZW1lbnQuXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEVsaXNpb25zIGFuZCBsZWFkaW5nIGNvbW1hcyBhcmUgbm90IHBlcm1pdHRlZC5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChnZXQodmFsdWUpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gXCJ7XCIpIHtcbiAgICAgICAgICAgICAgLy8gUGFyc2VzIGEgSlNPTiBvYmplY3QsIHJldHVybmluZyBhIG5ldyBKYXZhU2NyaXB0IG9iamVjdC5cbiAgICAgICAgICAgICAgcmVzdWx0cyA9IHt9O1xuICAgICAgICAgICAgICBmb3IgKDs7IGhhc01lbWJlcnMgfHwgKGhhc01lbWJlcnMgPSB0cnVlKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gbGV4KCk7XG4gICAgICAgICAgICAgICAgLy8gQSBjbG9zaW5nIGN1cmx5IGJyYWNlIG1hcmtzIHRoZSBlbmQgb2YgdGhlIG9iamVjdCBsaXRlcmFsLlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIn1cIikge1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIElmIHRoZSBvYmplY3QgbGl0ZXJhbCBjb250YWlucyBtZW1iZXJzLCB0aGUgY3VycmVudCB0b2tlblxuICAgICAgICAgICAgICAgIC8vIHNob3VsZCBiZSBhIGNvbW1hIHNlcGFyYXRvci5cbiAgICAgICAgICAgICAgICBpZiAoaGFzTWVtYmVycykge1xuICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiLFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gbGV4KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIn1cIikge1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdHJhaWxpbmcgYCxgIGluIG9iamVjdCBsaXRlcmFsLlxuICAgICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEEgYCxgIG11c3Qgc2VwYXJhdGUgZWFjaCBvYmplY3QgbWVtYmVyLlxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBMZWFkaW5nIGNvbW1hcyBhcmUgbm90IHBlcm1pdHRlZCwgb2JqZWN0IHByb3BlcnR5IG5hbWVzIG11c3QgYmVcbiAgICAgICAgICAgICAgICAvLyBkb3VibGUtcXVvdGVkIHN0cmluZ3MsIGFuZCBhIGA6YCBtdXN0IHNlcGFyYXRlIGVhY2ggcHJvcGVydHlcbiAgICAgICAgICAgICAgICAvLyBuYW1lIGFuZCB2YWx1ZS5cbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIgfHwgdHlwZW9mIHZhbHVlICE9IFwic3RyaW5nXCIgfHwgKGNoYXJJbmRleEJ1Z2d5ID8gdmFsdWUuY2hhckF0KDApIDogdmFsdWVbMF0pICE9IFwiQFwiIHx8IGxleCgpICE9IFwiOlwiKSB7XG4gICAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRzW3ZhbHVlLnNsaWNlKDEpXSA9IGdldChsZXgoKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBVbmV4cGVjdGVkIHRva2VuIGVuY291bnRlcmVkLlxuICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEludGVybmFsOiBVcGRhdGVzIGEgdHJhdmVyc2VkIG9iamVjdCBtZW1iZXIuXG4gICAgICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAoc291cmNlLCBwcm9wZXJ0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICB2YXIgZWxlbWVudCA9IHdhbGsoc291cmNlLCBwcm9wZXJ0eSwgY2FsbGJhY2spO1xuICAgICAgICAgIGlmIChlbGVtZW50ID09PSB1bmRlZikge1xuICAgICAgICAgICAgZGVsZXRlIHNvdXJjZVtwcm9wZXJ0eV07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNvdXJjZVtwcm9wZXJ0eV0gPSBlbGVtZW50O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyBJbnRlcm5hbDogUmVjdXJzaXZlbHkgdHJhdmVyc2VzIGEgcGFyc2VkIEpTT04gb2JqZWN0LCBpbnZva2luZyB0aGVcbiAgICAgICAgLy8gYGNhbGxiYWNrYCBmdW5jdGlvbiBmb3IgZWFjaCB2YWx1ZS4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcbiAgICAgICAgLy8gYFdhbGsoaG9sZGVyLCBuYW1lKWAgb3BlcmF0aW9uIGRlZmluZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMi5cbiAgICAgICAgdmFyIHdhbGsgPSBmdW5jdGlvbiAoc291cmNlLCBwcm9wZXJ0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBzb3VyY2VbcHJvcGVydHldLCBsZW5ndGg7XG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiICYmIHZhbHVlKSB7XG4gICAgICAgICAgICAvLyBgZm9yRWFjaGAgY2FuJ3QgYmUgdXNlZCB0byB0cmF2ZXJzZSBhbiBhcnJheSBpbiBPcGVyYSA8PSA4LjU0XG4gICAgICAgICAgICAvLyBiZWNhdXNlIGl0cyBgT2JqZWN0I2hhc093blByb3BlcnR5YCBpbXBsZW1lbnRhdGlvbiByZXR1cm5zIGBmYWxzZWBcbiAgICAgICAgICAgIC8vIGZvciBhcnJheSBpbmRpY2VzIChlLmcuLCBgIVsxLCAyLCAzXS5oYXNPd25Qcm9wZXJ0eShcIjBcIilgKS5cbiAgICAgICAgICAgIGlmIChnZXRDbGFzcy5jYWxsKHZhbHVlKSA9PSBhcnJheUNsYXNzKSB7XG4gICAgICAgICAgICAgIGZvciAobGVuZ3RoID0gdmFsdWUubGVuZ3RoOyBsZW5ndGgtLTspIHtcbiAgICAgICAgICAgICAgICB1cGRhdGUodmFsdWUsIGxlbmd0aCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmb3JFYWNoKHZhbHVlLCBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGUodmFsdWUsIHByb3BlcnR5LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2suY2FsbChzb3VyY2UsIHByb3BlcnR5LCB2YWx1ZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gUHVibGljOiBgSlNPTi5wYXJzZWAuIFNlZSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4yLlxuICAgICAgICBleHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gKHNvdXJjZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICB2YXIgcmVzdWx0LCB2YWx1ZTtcbiAgICAgICAgICBJbmRleCA9IDA7XG4gICAgICAgICAgU291cmNlID0gXCJcIiArIHNvdXJjZTtcbiAgICAgICAgICByZXN1bHQgPSBnZXQobGV4KCkpO1xuICAgICAgICAgIC8vIElmIGEgSlNPTiBzdHJpbmcgY29udGFpbnMgbXVsdGlwbGUgdG9rZW5zLCBpdCBpcyBpbnZhbGlkLlxuICAgICAgICAgIGlmIChsZXgoKSAhPSBcIiRcIikge1xuICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gUmVzZXQgdGhlIHBhcnNlciBzdGF0ZS5cbiAgICAgICAgICBJbmRleCA9IFNvdXJjZSA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrICYmIGdldENsYXNzLmNhbGwoY2FsbGJhY2spID09IGZ1bmN0aW9uQ2xhc3MgPyB3YWxrKCh2YWx1ZSA9IHt9LCB2YWx1ZVtcIlwiXSA9IHJlc3VsdCwgdmFsdWUpLCBcIlwiLCBjYWxsYmFjaykgOiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgZXhwb3J0c1tcInJ1bkluQ29udGV4dFwiXSA9IHJ1bkluQ29udGV4dDtcbiAgICByZXR1cm4gZXhwb3J0cztcbiAgfVxuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PSBcIm9iamVjdFwiICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUgJiYgIWlzTG9hZGVyKSB7XG4gICAgLy8gRXhwb3J0IGZvciBDb21tb25KUyBlbnZpcm9ubWVudHMuXG4gICAgcnVuSW5Db250ZXh0KHJvb3QsIGV4cG9ydHMpO1xuICB9IGVsc2Uge1xuICAgIC8vIEV4cG9ydCBmb3Igd2ViIGJyb3dzZXJzIGFuZCBKYXZhU2NyaXB0IGVuZ2luZXMuXG4gICAgdmFyIG5hdGl2ZUpTT04gPSByb290LkpTT047XG4gICAgdmFyIEpTT04zID0gcnVuSW5Db250ZXh0KHJvb3QsIChyb290W1wiSlNPTjNcIl0gPSB7XG4gICAgICAvLyBQdWJsaWM6IFJlc3RvcmVzIHRoZSBvcmlnaW5hbCB2YWx1ZSBvZiB0aGUgZ2xvYmFsIGBKU09OYCBvYmplY3QgYW5kXG4gICAgICAvLyByZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBgSlNPTjNgIG9iamVjdC5cbiAgICAgIFwibm9Db25mbGljdFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJvb3QuSlNPTiA9IG5hdGl2ZUpTT047XG4gICAgICAgIHJldHVybiBKU09OMztcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICByb290LkpTT04gPSB7XG4gICAgICBcInBhcnNlXCI6IEpTT04zLnBhcnNlLFxuICAgICAgXCJzdHJpbmdpZnlcIjogSlNPTjMuc3RyaW5naWZ5XG4gICAgfTtcbiAgfVxuXG4gIC8vIEV4cG9ydCBmb3IgYXN5bmNocm9ub3VzIG1vZHVsZSBsb2FkZXJzLlxuICBpZiAoaXNMb2FkZXIpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIEpTT04zO1xuICAgIH0pO1xuICB9XG59KHRoaXMpKTtcbiIsIlwidXNlIHN0cmljdFwiXG5cbi8vIFRoaXMgaXMgYSByZXBvcnRlciB0aGF0IG1pbWljcyBNb2NoYSdzIGBkb3RgIHJlcG9ydGVyXG5cbnZhciBSID0gcmVxdWlyZShcIi4uL2xpYi9yZXBvcnRlclwiKVxuXG5mdW5jdGlvbiB3aWR0aCgpIHtcbiAgICByZXR1cm4gUi53aW5kb3dXaWR0aCgpICogNCAvIDMgfCAwXG59XG5cbmZ1bmN0aW9uIHByaW50RG90KF8sIGNvbG9yKSB7XG4gICAgZnVuY3Rpb24gZW1pdCgpIHtcbiAgICAgICAgcmV0dXJuIF8ud3JpdGUoUi5jb2xvcihjb2xvcixcbiAgICAgICAgICAgIGNvbG9yID09PSBcImZhaWxcIiA/IFIuc3ltYm9scygpLkRvdEZhaWwgOiBSLnN5bWJvbHMoKS5Eb3QpKVxuICAgIH1cblxuICAgIGlmIChfLnN0YXRlLmNvdW50ZXIrKyAlIHdpZHRoKCkgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIF8ud3JpdGUoUi5uZXdsaW5lKCkgKyBcIiAgXCIpLnRoZW4oZW1pdClcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZW1pdCgpXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFIub24oXCJkb3RcIiwge1xuICAgIGFjY2VwdHM6IFtcIndyaXRlXCIsIFwicmVzZXRcIiwgXCJjb2xvcnNcIl0sXG4gICAgY3JlYXRlOiBSLmNvbnNvbGVSZXBvcnRlcixcbiAgICBiZWZvcmU6IFIuc2V0Q29sb3IsXG4gICAgYWZ0ZXI6IFIudW5zZXRDb2xvcixcbiAgICBpbml0OiBmdW5jdGlvbiAoc3RhdGUpIHsgc3RhdGUuY291bnRlciA9IDAgfSxcblxuICAgIHJlcG9ydDogZnVuY3Rpb24gKF8sIHJlcG9ydCkge1xuICAgICAgICBpZiAocmVwb3J0LmlzRW50ZXIgfHwgcmVwb3J0LmlzUGFzcykge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50RG90KF8sIFIuc3BlZWQocmVwb3J0KSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNIb29rIHx8IHJlcG9ydC5pc0ZhaWwpIHtcbiAgICAgICAgICAgIF8ucHVzaEVycm9yKHJlcG9ydClcbiAgICAgICAgICAgIC8vIFByaW50IGEgZG90IHJlZ2FyZGxlc3Mgb2YgaG9vayBzdWNjZXNzXG4gICAgICAgICAgICByZXR1cm4gcHJpbnREb3QoXywgXCJmYWlsXCIpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50RG90KF8sIFwic2tpcFwiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VuZCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoKS50aGVuKF8ucHJpbnRSZXN1bHRzLmJpbmQoXykpXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzRXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChfLnN0YXRlLmNvdW50ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5wcmludCgpLnRoZW4oXy5wcmludEVycm9yLmJpbmQoXywgcmVwb3J0KSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnRFcnJvcihyZXBvcnQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cbiAgICB9LFxufSlcbiIsIlwidXNlIHN0cmljdFwiXG5cbmV4cG9ydHMuZG90ID0gcmVxdWlyZShcIi4vZG90XCIpXG5leHBvcnRzLnNwZWMgPSByZXF1aXJlKFwiLi9zcGVjXCIpXG5leHBvcnRzLnRhcCA9IHJlcXVpcmUoXCIuL3RhcFwiKVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLy8gVGhpcyBpcyBhIHJlcG9ydGVyIHRoYXQgbWltaWNzIE1vY2hhJ3MgYHNwZWNgIHJlcG9ydGVyLlxuXG52YXIgUiA9IHJlcXVpcmUoXCIuLi9saWIvcmVwb3J0ZXJcIilcbnZhciBjID0gUi5jb2xvclxuXG5mdW5jdGlvbiBpbmRlbnQobGV2ZWwpIHtcbiAgICB2YXIgcmV0ID0gXCJcIlxuXG4gICAgd2hpbGUgKGxldmVsLS0pIHJldCArPSBcIiAgXCJcbiAgICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGdldE5hbWUobGV2ZWwsIHJlcG9ydCkge1xuICAgIHJldHVybiByZXBvcnQucGF0aFtsZXZlbCAtIDFdLm5hbWVcbn1cblxuZnVuY3Rpb24gcHJpbnRSZXBvcnQoXywgcmVwb3J0LCBpbml0KSB7XG4gICAgaWYgKF8uc3RhdGUubGVhdmluZykge1xuICAgICAgICBfLnN0YXRlLmxlYXZpbmcgPSBmYWxzZVxuICAgICAgICByZXR1cm4gXy5wcmludCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoaW5kZW50KF8uc3RhdGUubGV2ZWwpICsgaW5pdCgpKVxuICAgICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBfLnByaW50KGluZGVudChfLnN0YXRlLmxldmVsKSArIGluaXQoKSlcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUi5vbihcInNwZWNcIiwge1xuICAgIGFjY2VwdHM6IFtcIndyaXRlXCIsIFwicmVzZXRcIiwgXCJjb2xvcnNcIl0sXG4gICAgY3JlYXRlOiBSLmNvbnNvbGVSZXBvcnRlcixcbiAgICBiZWZvcmU6IFIuc2V0Q29sb3IsXG4gICAgYWZ0ZXI6IFIudW5zZXRDb2xvcixcblxuICAgIGluaXQ6IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICBzdGF0ZS5sZXZlbCA9IDFcbiAgICAgICAgc3RhdGUubGVhdmluZyA9IGZhbHNlXG4gICAgfSxcblxuICAgIHJlcG9ydDogZnVuY3Rpb24gKF8sIHJlcG9ydCkge1xuICAgICAgICBpZiAocmVwb3J0LmlzU3RhcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KClcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFbnRlcikge1xuICAgICAgICAgICAgdmFyIGxldmVsID0gXy5zdGF0ZS5sZXZlbCsrXG4gICAgICAgICAgICB2YXIgbGFzdCA9IHJlcG9ydC5wYXRoW2xldmVsIC0gMV1cblxuICAgICAgICAgICAgXy5zdGF0ZS5sZWF2aW5nID0gZmFsc2VcbiAgICAgICAgICAgIGlmIChsYXN0LmluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF8ucHJpbnQoaW5kZW50KGxldmVsKSArIGxhc3QubmFtZSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5wcmludChpbmRlbnQobGV2ZWwpICsgbGFzdC5uYW1lKVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0xlYXZlKSB7XG4gICAgICAgICAgICBfLnN0YXRlLmxldmVsLS1cbiAgICAgICAgICAgIF8uc3RhdGUubGVhdmluZyA9IHRydWVcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNQYXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJpbnRSZXBvcnQoXywgcmVwb3J0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0ciA9XG4gICAgICAgICAgICAgICAgICAgIGMoXCJjaGVja21hcmtcIiwgUi5zeW1ib2xzKCkuUGFzcyArIFwiIFwiKSArXG4gICAgICAgICAgICAgICAgICAgIGMoXCJwYXNzXCIsIGdldE5hbWUoXy5zdGF0ZS5sZXZlbCwgcmVwb3J0KSlcblxuICAgICAgICAgICAgICAgIHZhciBzcGVlZCA9IFIuc3BlZWQocmVwb3J0KVxuXG4gICAgICAgICAgICAgICAgaWYgKHNwZWVkICE9PSBcImZhc3RcIikge1xuICAgICAgICAgICAgICAgICAgICBzdHIgKz0gYyhzcGVlZCwgXCIgKFwiICsgcmVwb3J0LmR1cmF0aW9uICsgXCJtcylcIilcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0hvb2sgfHwgcmVwb3J0LmlzRmFpbCkge1xuICAgICAgICAgICAgXy5wdXNoRXJyb3IocmVwb3J0KVxuXG4gICAgICAgICAgICAvLyBEb24ndCBwcmludCB0aGUgZGVzY3JpcHRpb24gbGluZSBvbiBjdW11bGF0aXZlIGhvb2tzXG4gICAgICAgICAgICBpZiAocmVwb3J0LmlzSG9vayAmJiAocmVwb3J0LmlzQmVmb3JlQWxsIHx8IHJlcG9ydC5pc0FmdGVyQWxsKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHByaW50UmVwb3J0KF8sIHJlcG9ydCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjKFwiZmFpbFwiLFxuICAgICAgICAgICAgICAgICAgICBfLmVycm9ycy5sZW5ndGggKyBcIikgXCIgKyBnZXROYW1lKF8uc3RhdGUubGV2ZWwsIHJlcG9ydCkgK1xuICAgICAgICAgICAgICAgICAgICBSLmZvcm1hdFJlc3QocmVwb3J0KSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzU2tpcCkge1xuICAgICAgICAgICAgcmV0dXJuIHByaW50UmVwb3J0KF8sIHJlcG9ydCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjKFwic2tpcFwiLCBcIi0gXCIgKyBnZXROYW1lKF8uc3RhdGUubGV2ZWwsIHJlcG9ydCkpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcG9ydC5pc0VuZCkgcmV0dXJuIF8ucHJpbnRSZXN1bHRzKClcbiAgICAgICAgaWYgKHJlcG9ydC5pc0Vycm9yKSByZXR1cm4gXy5wcmludEVycm9yKHJlcG9ydClcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH0sXG59KVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuLy8gVGhpcyBpcyBhIGJhc2ljIFRBUC1nZW5lcmF0aW5nIHJlcG9ydGVyLlxuXG52YXIgcGVhY2ggPSByZXF1aXJlKFwiLi4vbGliL3V0aWxcIikucGVhY2hcbnZhciBSID0gcmVxdWlyZShcIi4uL2xpYi9yZXBvcnRlclwiKVxudmFyIGluc3BlY3QgPSByZXF1aXJlKFwiY2xlYW4tYXNzZXJ0LXV0aWxcIikuaW5zcGVjdFxuXG5mdW5jdGlvbiBzaG91bGRCcmVhayhtaW5MZW5ndGgsIHN0cikge1xuICAgIHJldHVybiBzdHIubGVuZ3RoID4gUi53aW5kb3dXaWR0aCgpIC0gbWluTGVuZ3RoIHx8IC9cXHI/XFxufFs6Py1dLy50ZXN0KHN0cilcbn1cblxuZnVuY3Rpb24gdGVtcGxhdGUoXywgcmVwb3J0LCB0bXBsLCBza2lwKSB7XG4gICAgaWYgKCFza2lwKSBfLnN0YXRlLmNvdW50ZXIrK1xuICAgIHZhciBwYXRoID0gUi5qb2luUGF0aChyZXBvcnQpLnJlcGxhY2UoL1xcJC9nLCBcIiQkJCRcIilcblxuICAgIHJldHVybiBfLnByaW50KFxuICAgICAgICB0bXBsLnJlcGxhY2UoLyVjL2csIF8uc3RhdGUuY291bnRlcilcbiAgICAgICAgICAgIC5yZXBsYWNlKC8lcC9nLCBwYXRoICsgUi5mb3JtYXRSZXN0KHJlcG9ydCkpKVxufVxuXG5mdW5jdGlvbiBwcmludExpbmVzKF8sIHZhbHVlLCBza2lwRmlyc3QpIHtcbiAgICB2YXIgbGluZXMgPSB2YWx1ZS5zcGxpdCgvXFxyP1xcbi9nKVxuXG4gICAgaWYgKHNraXBGaXJzdCkgbGluZXMuc2hpZnQoKVxuICAgIHJldHVybiBwZWFjaChsaW5lcywgZnVuY3Rpb24gKGxpbmUpIHsgcmV0dXJuIF8ucHJpbnQoXCIgICAgXCIgKyBsaW5lKSB9KVxufVxuXG5mdW5jdGlvbiBwcmludFJhdyhfLCBrZXksIHN0cikge1xuICAgIGlmIChzaG91bGRCcmVhayhrZXkubGVuZ3RoLCBzdHIpKSB7XG4gICAgICAgIHJldHVybiBfLnByaW50KFwiICBcIiArIGtleSArIFwiOiB8LVwiKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBwcmludExpbmVzKF8sIHN0ciwgZmFsc2UpIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIF8ucHJpbnQoXCIgIFwiICsga2V5ICsgXCI6IFwiICsgc3RyKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcHJpbnRWYWx1ZShfLCBrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHByaW50UmF3KF8sIGtleSwgaW5zcGVjdCh2YWx1ZSkpXG59XG5cbmZ1bmN0aW9uIHByaW50TGluZShwLCBfLCBsaW5lKSB7XG4gICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KGxpbmUpIH0pXG59XG5cbmZ1bmN0aW9uIHByaW50RXJyb3IoXywgcmVwb3J0KSB7XG4gICAgdmFyIGVyciA9IHJlcG9ydC5lcnJvclxuXG4gICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgRXJyb3IpKSB7XG4gICAgICAgIHJldHVybiBwcmludFZhbHVlKF8sIFwidmFsdWVcIiwgZXJyKVxuICAgIH1cblxuICAgIC8vIExldCdzICpub3QqIGRlcGVuZCBvbiB0aGUgY29uc3RydWN0b3IgYmVpbmcgVGhhbGxpdW0ncy4uLlxuICAgIGlmIChlcnIubmFtZSAhPT0gXCJBc3NlcnRpb25FcnJvclwiKSB7XG4gICAgICAgIHJldHVybiBfLnByaW50KFwiICBzdGFjazogfC1cIikudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJpbnRMaW5lcyhfLCBSLmdldFN0YWNrKGVyciksIGZhbHNlKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiBwcmludFZhbHVlKF8sIFwiZXhwZWN0ZWRcIiwgZXJyLmV4cGVjdGVkKVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHByaW50VmFsdWUoXywgXCJhY3R1YWxcIiwgZXJyLmFjdHVhbCkgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBwcmludFJhdyhfLCBcIm1lc3NhZ2VcIiwgZXJyLm1lc3NhZ2UpIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgc3RhY2s6IHwtXCIpIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IGVyci5tZXNzYWdlXG5cbiAgICAgICAgZXJyLm1lc3NhZ2UgPSBcIlwiXG4gICAgICAgIHJldHVybiBwcmludExpbmVzKF8sIFIuZ2V0U3RhY2soZXJyKSwgdHJ1ZSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyBlcnIubWVzc2FnZSA9IG1lc3NhZ2UgfSlcbiAgICB9KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFIub24oXCJ0YXBcIiwge1xuICAgIGFjY2VwdHM6IFtcIndyaXRlXCIsIFwicmVzZXRcIl0sXG4gICAgY3JlYXRlOiBSLmNvbnNvbGVSZXBvcnRlcixcbiAgICBpbml0OiBmdW5jdGlvbiAoc3RhdGUpIHsgc3RhdGUuY291bnRlciA9IDAgfSxcblxuICAgIHJlcG9ydDogZnVuY3Rpb24gKF8sIHJlcG9ydCkge1xuICAgICAgICBpZiAocmVwb3J0LmlzU3RhcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBfLnByaW50KFwiVEFQIHZlcnNpb24gMTNcIilcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNFbnRlcikge1xuICAgICAgICAgICAgLy8gUHJpbnQgYSBsZWFkaW5nIGNvbW1lbnQsIHRvIG1ha2Ugc29tZSBUQVAgZm9ybWF0dGVycyBwcmV0dGllci5cbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZShfLCByZXBvcnQsIFwiIyAlcFwiLCB0cnVlKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIm9rICVjXCIpIH0pXG4gICAgICAgIH0gZWxzZSBpZiAocmVwb3J0LmlzUGFzcykge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlKF8sIHJlcG9ydCwgXCJvayAlYyAlcFwiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0ZhaWwgfHwgcmVwb3J0LmlzSG9vaykge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlKF8sIHJlcG9ydCwgXCJub3Qgb2sgJWMgJXBcIilcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIgIC0tLVwiKSB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gcHJpbnRFcnJvcihfLCByZXBvcnQpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiICAuLi5cIikgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXBvcnQuaXNTa2lwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGUoXywgcmVwb3J0LCBcIm9rICVjICMgc2tpcCAlcFwiKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0VuZCkge1xuICAgICAgICAgICAgdmFyIHAgPSBfLnByaW50KFwiMS4uXCIgKyBfLnN0YXRlLmNvdW50ZXIpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBfLnByaW50KFwiIyB0ZXN0cyBcIiArIF8udGVzdHMpIH0pXG5cbiAgICAgICAgICAgIGlmIChfLnBhc3MpIHAgPSBwcmludExpbmUocCwgXywgXCIjIHBhc3MgXCIgKyBfLnBhc3MpXG4gICAgICAgICAgICBpZiAoXy5mYWlsKSBwID0gcHJpbnRMaW5lKHAsIF8sIFwiIyBmYWlsIFwiICsgXy5mYWlsKVxuICAgICAgICAgICAgaWYgKF8uc2tpcCkgcCA9IHByaW50TGluZShwLCBfLCBcIiMgc2tpcCBcIiArIF8uc2tpcClcbiAgICAgICAgICAgIHJldHVybiBwcmludExpbmUocCwgXywgXCIjIGR1cmF0aW9uIFwiICsgUi5mb3JtYXRUaW1lKF8uZHVyYXRpb24pKVxuICAgICAgICB9IGVsc2UgaWYgKHJlcG9ydC5pc0Vycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gXy5wcmludChcIkJhaWwgb3V0IVwiKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gXy5wcmludChcIiAgLS0tXCIpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiBwcmludEVycm9yKF8sIHJlcG9ydCkgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF8ucHJpbnQoXCIgIC4uLlwiKSB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9XG4gICAgfSxcbn0pXG4iXX0=
