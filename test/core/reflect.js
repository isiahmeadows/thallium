/* eslint max-nested-callbacks: [2, 5] */

describe("core/reflect", function () {
    "use strict"

    describe("get current", function () {
        it("returns the correct instance", function () {
            var tt = t.internal.root()

            assert.equal(tt.reflect.current, tt.reflect)
        })

        it("returns the correct instance in a child test", function () {
            var tt = t.internal.root()
            var inner, found

            // Don't print anything
            tt.reporter = function () {}
            tt.test("test", function (tt) {
                inner = tt.reflect
                found = tt.reflect.current
            })

            return tt.runTree().then(function () {
                assert.equal(found, inner)
            })
        })
    })

    context("hooks on reflect", function () {
        run({
            beforeAll: function (tt, callback) {
                tt.reflect.beforeAll(callback)
                assert.equal(tt.reflect.hasBeforeAll(callback), true)
            },

            beforeEach: function (tt, callback) {
                tt.reflect.before(callback)
                assert.equal(tt.reflect.hasBefore(callback), true)
            },

            afterAll: function (tt, callback) {
                tt.reflect.afterAll(callback)
                assert.equal(tt.reflect.hasAfterAll(callback), true)
            },

            afterEach: function (tt, callback) {
                tt.reflect.after(callback)
                assert.equal(tt.reflect.hasAfter(callback), true)
            },
        })
    })

    context("hooks on root", function () {
        run({
            beforeAll: function (tt, callback) {
                tt.beforeAll(callback)
                assert.equal(tt.reflect.hasBeforeAll(callback), true)
            },

            beforeEach: function (tt, callback) {
                tt.before(callback)
                assert.equal(tt.reflect.hasBefore(callback), true)
            },

            afterAll: function (tt, callback) {
                tt.afterAll(callback)
                assert.equal(tt.reflect.hasAfterAll(callback), true)
            },

            afterEach: function (tt, callback) {
                tt.after(callback)
                assert.equal(tt.reflect.hasAfter(callback), true)
            },
        })
    })

    function run(_) {
        describe("before all", function () {
            it("works with no tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.beforeAll(tt, function () { called++ })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 0)
                })
            })

            it("works with one test", function () {
                var called = 0
                var tt = t.internal.root()

                _.beforeAll(tt, function () { called++ })
                tt.test("test", function () {})

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("works with two tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.beforeAll(tt, function () { called++ })
                tt.test("test", function () {})
                tt.test("test", function () {})

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("avoids child tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.beforeAll(tt, function () { called++ })
                tt.test("test", function () {
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("works inside child tests", function () {
                var called = 0
                var tt = t.internal.root()

                tt.test("test", function () {
                    _.beforeAll(tt, function () { called++ })
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("executes in the right order", function () {
                var queue = []
                var tt = t.internal.root()

                _.beforeAll(tt, function () { queue.push("root") })
                tt.test("test", function () {
                    _.beforeAll(tt, function () { queue.push("inner") })
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.match(queue, ["root", "inner"])
                })
            })
        })

        describe("before each", function () {
            it("works with no tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.beforeEach(tt, function () { called++ })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 0)
                })
            })

            it("works with one test", function () {
                var called = 0
                var tt = t.internal.root()

                _.beforeEach(tt, function () { called++ })
                tt.test("test", function () {})

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("works with two tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.beforeEach(tt, function () { called++ })
                tt.test("test", function () {})
                tt.test("test", function () {})

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 2)
                })
            })

            it("hits child tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.beforeEach(tt, function () { called++ })
                tt.test("test", function () {
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 2)
                })
            })

            it("works inside child tests", function () {
                var called = 0
                var tt = t.internal.root()

                tt.test("test", function () {
                    _.beforeEach(tt, function () { called++ })
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("executes in the right order", function () {
                var queue = []
                var tt = t.internal.root()

                _.beforeEach(tt, function () { queue.push("root") })
                tt.test("test", function () {
                    _.beforeEach(tt, function () { queue.push("inner") })
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.match(queue, ["root", "root", "inner"])
                })
            })
        })

        describe("after each", function () {
            it("works with no tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.afterEach(tt, function () { called++ })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 0)
                })
            })

            it("works with one test", function () {
                var called = 0
                var tt = t.internal.root()

                _.afterEach(tt, function () { called++ })
                tt.test("test", function () {})

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("works with two tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.afterEach(tt, function () { called++ })
                tt.test("test", function () {})
                tt.test("test", function () {})

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 2)
                })
            })

            it("hits child tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.afterEach(tt, function () { called++ })
                tt.test("test", function () {
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 2)
                })
            })

            it("works inside child tests", function () {
                var called = 0
                var tt = t.internal.root()

                tt.test("test", function () {
                    _.afterEach(tt, function () { called++ })
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("executes in the right order", function () {
                var queue = []
                var tt = t.internal.root()

                _.afterEach(tt, function () { queue.push("root") })
                tt.test("test", function () {
                    _.afterEach(tt, function () { queue.push("inner") })
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.match(queue, ["inner", "root", "root"])
                })
            })
        })

        describe("after all", function () {
            it("works with no tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.afterAll(tt, function () { called++ })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 0)
                })
            })

            it("works with one test", function () {
                var called = 0
                var tt = t.internal.root()

                _.afterAll(tt, function () { called++ })
                tt.test("test", function () {})

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("works with two tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.afterAll(tt, function () { called++ })
                tt.test("test", function () {})
                tt.test("test", function () {})

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("avoids child tests", function () {
                var called = 0
                var tt = t.internal.root()

                _.afterAll(tt, function () { called++ })
                tt.test("test", function () {
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("works inside child tests", function () {
                var called = 0
                var tt = t.internal.root()

                tt.test("test", function () {
                    _.afterAll(tt, function () { called++ })
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.equal(called, 1)
                })
            })

            it("executes in the right order", function () {
                var queue = []
                var tt = t.internal.root()

                _.afterAll(tt, function () { queue.push("root") })
                tt.test("test", function () {
                    _.afterAll(tt, function () { queue.push("inner") })
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.match(queue, ["inner", "root"])
                })
            })
        })

        describe("all hooks", function () {
            it("works with no tests", function () {
                var queue = []
                var tt = t.internal.root()

                _.beforeAll(tt, function () { queue.push("before all") })
                _.beforeEach(tt, function () { queue.push("before each") })
                _.afterEach(tt, function () { queue.push("after each") })
                _.afterAll(tt, function () { queue.push("after all") })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.match(queue, [])
                })
            })

            it("works with one test", function () {
                var queue = []
                var tt = t.internal.root()

                _.beforeAll(tt, function () { queue.push("before all") })
                _.beforeEach(tt, function () { queue.push("before each") })
                _.afterEach(tt, function () { queue.push("after each") })
                _.afterAll(tt, function () { queue.push("after all") })
                tt.test("test", function () {})

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.match(queue, [
                        "before all",
                        "before each",
                        "after each",
                        "after all",
                    ])
                })
            })

            it("works with two tests", function () {
                var queue = []
                var tt = t.internal.root()

                _.beforeAll(tt, function () { queue.push("before all") })
                _.beforeEach(tt, function () { queue.push("before each") })
                _.afterEach(tt, function () { queue.push("after each") })
                _.afterAll(tt, function () { queue.push("after all") })
                tt.test("test", function () {})
                tt.test("test", function () {})

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.match(queue, [
                        "before all",
                        "before each",
                        "after each",
                        "before each",
                        "after each",
                        "after all",
                    ])
                })
            })

            it("works with child tests", function () {
                var queue = []
                var tt = t.internal.root()

                _.beforeAll(tt, function () { queue.push("before all") })
                _.beforeEach(tt, function () { queue.push("before each") })
                _.afterEach(tt, function () { queue.push("after each") })
                _.afterAll(tt, function () { queue.push("after all") })
                tt.test("test", function () {
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.match(queue, [
                        "before all",
                        "before each",
                        "before each",
                        "after each",
                        "after each",
                        "after all",
                    ])
                })
            })

            it("works inside child tests", function () {
                var queue = []
                var tt = t.internal.root()

                tt.test("test", function () {
                    _.beforeAll(tt, function () { queue.push("before all") }) // eslint-disable-line max-len
                    _.beforeEach(tt, function () { queue.push("before each") }) // eslint-disable-line max-len
                    _.afterEach(tt, function () { queue.push("after each") }) // eslint-disable-line max-len
                    _.afterAll(tt, function () { queue.push("after all") })
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.match(queue, [
                        "before all",
                        "before each",
                        "after each",
                        "after all",
                    ])
                })
            })

            it("executes in the right order", function () {
                var queue = []
                var tt = t.internal.root()

                _.beforeAll(tt, function () { queue.push("root before all") }) // eslint-disable-line max-len
                _.beforeEach(tt, function () { queue.push("root before each") }) // eslint-disable-line max-len
                _.afterEach(tt, function () { queue.push("root after each") }) // eslint-disable-line max-len
                _.afterAll(tt, function () { queue.push("root after all") }) // eslint-disable-line max-len
                tt.test("test", function () {
                    _.beforeAll(tt, function () { queue.push("inner before all") }) // eslint-disable-line max-len
                    _.beforeEach(tt, function () { queue.push("inner before each") }) // eslint-disable-line max-len
                    _.afterEach(tt, function () { queue.push("inner after each") }) // eslint-disable-line max-len
                    _.afterAll(tt, function () { queue.push("inner after all") }) // eslint-disable-line max-len
                    tt.test("test", function () {})
                })

                // Don't print anything
                tt.reporter = function () {}
                return tt.runTree().then(function () {
                    assert.match(queue, [
                        "root before all",
                        "root before each",
                        "inner before all",
                        "root before each",
                        "inner before each",
                        "inner after each",
                        "root after each",
                        "inner after all",
                        "root after each",
                        "root after all",
                    ])
                })
            })
        })

        describe("removing before all", function () {
            it("works", function () {
                var tt = t.internal.root()

                function callback() {}
                _.beforeAll(tt, callback)
                tt.reflect.removeBeforeAll(callback)
                assert.equal(tt.reflect.hasBeforeAll(callback), false)
            })
        })

        describe("removing before each", function () {
            it("works", function () {
                var tt = t.internal.root()

                function callback() {}
                _.beforeEach(tt, callback)
                tt.reflect.removeBefore(callback)
                assert.equal(tt.reflect.hasBefore(callback), false)
            })
        })

        describe("removing after each", function () {
            it("works", function () {
                var tt = t.internal.root()

                function callback() {}
                _.beforeEach(tt, callback)
                tt.reflect.removeAfter(callback)
                assert.equal(tt.reflect.hasAfter(callback), false)
            })
        })

        describe("removing after all", function () {
            it("works", function () {
                var tt = t.internal.root()

                function callback() {}
                _.afterAll(tt, callback)
                tt.reflect.removeAfterAll(callback)
                assert.equal(tt.reflect.hasAfterAll(callback), false)
            })
        })
    }
})
