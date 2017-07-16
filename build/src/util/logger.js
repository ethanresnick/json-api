"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const objectValueEntries_1 = require("./objectValueEntries");
const loggers = {
    info: debug("twilio-ivr:info"),
    warn: debug("twilio-ivr:warn"),
    error: debug("twilio-ivr:error")
};
objectValueEntries_1.entries(loggers).forEach(([name, logger]) => {
    logger.log = console[name].bind(console);
});
exports.default = loggers;
