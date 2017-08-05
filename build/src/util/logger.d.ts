/// <reference types="debug" />
import debug = require("debug");
declare const loggers: {
    info: debug.IDebugger;
    warn: debug.IDebugger;
    error: debug.IDebugger;
};
export default loggers;
