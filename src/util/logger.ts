import debug = require("debug");
import { entries as objectEntries } from "./objectValueEntries";

// create an logger for each log level
const loggers = {
  info: debug("twilio-ivr:info"),
  warn: debug("twilio-ivr:warn"),
  error: debug("twilio-ivr:error")
}

// Bind each logger to the corresponding console method.
objectEntries(loggers).forEach(([name, logger]) => {
  logger.log = (<any>console)[name].bind(console);
})

export default loggers;
