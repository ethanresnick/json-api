"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Q = _interopRequire(require("q"));

var APIError = _interopRequire(require("../../../types/APIError"));

module.exports = function (requestContext) {
  return Q.Promise(function (resolve, reject) {
    if (requestContext.hasBody === requestContext.needsBody) {
      resolve();
    } else if (requestContext.needsBody) {
      reject(new APIError(400, null, "This request needs a body, but didn't have one."));
    } else {
      reject(new APIError(400, null, "This request should not have a body, but does."));
    }
  });
};