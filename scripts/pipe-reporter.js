"use strict"

/* eslint-env node */

// Much easier to use a concise DSL than for serialization to compare in
// assertions. Short description:
//
// Global scope:
//
//  Type     Value
//   |         |
//  \|/       \|/
// start = undefined
//
// Inside a test:
//
//   Test index     Subtest index             Value
// Type  |  Test name     |   Subtest name      |
//  |    |      |         |        |            |
// \|/  \|/    \|/       \|/      \|/          \|/
// fail [0: test name] > [1: subtest name] = "value"

function fix(value) {
    if (typeof value === "string") return JSON.stringify(value)
    if (typeof value === "number") return value
    if (typeof value === "boolean") return value
    if (typeof value === "function") return JSON.stringify(value.toString())
    if (typeof value === "symbol") return JSON.stringify(value.toString())
    if (value == null) return value
    if (value instanceof Error) return JSON.stringify(value.toString())
    return value
}

module.exports = function (ev) {
    var path = ev.path
    .map(function (x) { return "[" + x.index + ": " + x.name + "]" })
    .join(" > ")

    console.log(ev.type + " " + (path ? path + " = " : "= ") + fix(ev.value))
}
