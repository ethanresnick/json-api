"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var Q = _interopRequire(require("q"));

var groupResourcesByType = require("../../util/type-handling").groupResourcesByType;

var arrayContains = require("../../util/arrays").arrayContains;

var isSubsetOf = require("../../util/misc").isSubsetOf;

var APIError = _interopRequire(require("../../types/APIError"));

module.exports = function (body) {
  return Q.Promise(function (resolve, reject) {
    var ownProp = Object.prototype.hasOwnProperty;
    var errMessage = "Request body is not a valid JSON API document.";

    if (typeof body !== "object" || !ownProp.call(body, "data")) {
      reject(new APIError(400, null, errMessage));
    } else {
      resolve();
    }
  });
};