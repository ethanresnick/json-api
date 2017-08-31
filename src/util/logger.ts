import debug = require("debug");
import { entries as objectEntries } from "./objectValueEntries";

// create an logger for each log level
const loggers = {
  info: debug("json-api:info"),
  warn: debug("json-api:warn"),
  error: debug("json-api:error")
}

// Bind each logger to the corresponding console method.
objectEntries(loggers).forEach(([name, logger]) => {
  logger.log = (<any>console)[name].bind(console);
})

export default loggers;
