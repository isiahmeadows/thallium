/* tslint:disable */

import * as Core from "./core";

export {
    Callback,

    ReportType,
    Location,
    Report,
    ExtraCall,
    StartReport,
    EnterReport,
    LeaveReport,
    PassReport,
    FailReport,
    SkipReport,
    EndReport,
    ExtraReport,

    Plugin,
    Reporter,

    DefineImpl,
    WrapImpl,
    AddImpl,

    AssertionResult,
    AssertionError,

    Reflect,
    IteratorResult,
    Iterator,
    ObjectMap,
    AsyncDone,
    AsyncReturn,
    AsyncCallback,
} from "./core";

import {Assertions} from "./assertions";

export interface Test extends Core.Test, Assertions {}

declare const t: Test;
export default t;
