"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkBodyExistence = checkBodyExistence;

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _typesAPIError = require("../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

function checkBodyExistence(requestContext) {
  return _q2["default"].Promise(function (resolve, reject) {
    var needsBody = ["post", "patch"].indexOf(requestContext.method) !== -1 || requestContext.method === "delete" && requestContext.aboutRelationship || requestContext.method === "delete" && !requestContext.idOrIds && requestContext.ext.indexOf("bulk") !== -1;

    if (requestContext.hasBody === needsBody) {
      resolve();
    } else if (needsBody) {
      reject(new _typesAPIError2["default"](400, undefined, "This request needs a body, but didn't have one."));
    } else {
      reject(new _typesAPIError2["default"](400, undefined, "This request should not have a body, but does."));
    }
  });
}