"use strict"

var t = require("thallium")

t.test("core (basic)", function () {
    t.test("has `base()`", function () { t.skip() })
    t.test("has `test()`", function () { t.skip() })
    t.test("has `parent()`", function () { t.skip() })
    t.test("can accept a string + function", function () { t.skip() })
    t.test("can accept a string", function () { t.skip() })
    t.test("returns the current instance when given a callback", function () { t.skip() }) // eslint-disable-line max-len
    t.test("returns a prototypal clone when not given a callback", function () { t.skip() }) // eslint-disable-line max-len
    t.test("runs block tests within tests", function () { t.skip() })
    t.test("runs successful inline tests within tests", function () { t.skip() }) // eslint-disable-line max-len
    t.test("accepts a callback with `t.run()`", function () { t.skip() })
})
