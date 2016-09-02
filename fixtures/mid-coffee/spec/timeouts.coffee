'use strict'

###
Note: updates to this should also be reflected in test/core/timeouts.js, as this
is trying to represent more real-world usage.
###

t = require 'thallium'
{Report, Location, toReportType} = require '../../../lib/tests.js'

# Note that this entire section may be flaky on slower machines. Thankfully,
# these have been tested against a slower machine, so it should hopefully not
# be too bad.
t.test 'core (timeouts) (FLAKE)', ->
    n = @reflect().report
    p = @reflect().loc

    @reflect().add push: (_, ret) -> (arg, done) =>
        # Any equality tests on either of these are inherently flaky.
        @hasOwn arg, 'duration'
        @number arg.duration
        @hasOwn arg, 'slow'
        @number arg.slow
        if arg.pass() or arg.fail() or arg.enter()
            arg.duration = 10
            arg.slow = 75
        else
            arg.duration = -1
            arg.slow = 0
        ret.push(arg)
        done()

    @async 'succeeds with own', ->
        tt = @reflect().base()
        ret = []

        tt.reporter @push(ret)

        tt.async 'test', (_, done) ->
            # It's highly unlikely the engine will take this long to finish.
            @timeout 10
            done()

        tt.run().then =>
            @match ret, [
                n 'start', []
                n 'pass', [p('test', 0)]
                n 'end', []
            ]

    @async 'fails with own', ->
        tt = @reflect().base()
        ret = []

        tt.reporter @push(ret)

        tt.async 'test', (_, done) ->
            @timeout 50
            # It's highly unlikely the engine will take this long to finish
            setTimeout (-> done()), 200

        tt.run().then =>
            @match ret, [
                n 'start', []
                n 'fail', [p('test', 0)], new Error 'Timeout of 50 reached'
                n 'end', []
            ]

    @async 'succeeds with inherited', ->
        tt = @reflect().base()
        ret = []

        tt.reporter @push(ret)

        tt.test 'test'
        .timeout 50
        .async 'inner', (_, done) -> done()

        tt.run().then =>
            @match ret, [
                n 'start', []
                n 'enter', [p('test', 0)]
                n 'pass', [p('test', 0), p('inner', 0)]
                n 'leave', [p('test', 0)]
                n 'end', []
            ]

    @async 'fails with inherited', ->
        tt = @reflect().base()
        ret = []

        tt.reporter @push(ret)

        tt.test 'test'
        .timeout 50
        .async 'inner', (_, done) ->
            # It's highly unlikely the engine will take this long to finish.
            setTimeout (-> done()), 200

        tt.run().then =>
            @match ret, [
                n 'start', []
                n 'enter', [p('test', 0)]
                n 'fail', [p('test', 0), p('inner', 0)],
                    new Error 'Timeout of 50 reached'
                n 'leave', [p('test', 0)]
                n 'end', []
            ]

    @async 'gets own block timeout', ->
        tt = @reflect().base()
        active = raw = undefined

        tt.test 'test', ->
            @timeout 50
            active = @reflect().activeTimeout()
            raw = @reflect().timeout()

        tt.run().then =>
            @equal active, 50
            @equal raw, 50

    @test 'gets own inline timeout', ->
        tt = @reflect().base()
        ttt = tt.test('test').timeout 50

        @equal ttt.reflect().activeTimeout(), 50
        @equal ttt.reflect().timeout(), 50

    @async 'gets inherited block timeout', ->
        tt = @reflect().base()
        active = raw = undefined

        tt.test 'test'
        .timeout 50
        .test 'inner', ->
            active = @reflect().activeTimeout()
            raw = @reflect().timeout()

        tt.run().then =>
            @equal active, 50
            @equal raw, 0

    @test 'gets inherited inline timeout', ->
        tt = @reflect().base()

        ttt = tt.test 'test'
        .timeout 50
        .test 'inner'

        @equal ttt.reflect().activeTimeout(), 50
        @equal ttt.reflect().timeout(), 0

    @async 'gets default timeout', ->
        tt = @reflect().base()
        active = raw = undefined

        tt.test 'test', ->
            active = @reflect().activeTimeout()
            raw = @reflect().timeout()

        tt.run().then =>
            @equal active, 2000
            @equal raw, 0