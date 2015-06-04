"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

var _Object$keys = require("babel-runtime/core-js/object/keys")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = validateContentType;

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _contentType = require("content-type");

var _contentType2 = _interopRequireDefault(_contentType);

var _typesAPIError = require("../../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

var _utilTypeHandling = require("../../../util/type-handling");

function validateContentType(requestContext, supportedExt) {
  return _q2["default"].Promise(function (resolve, reject) {
    var contentType = _contentType2["default"].parse(requestContext.contentType);

    // In the future, we might delegate back to the framework if the client
    // provides a base content type other than json-api's. But, for now, we 415.
    if (contentType.type !== "application/vnd.api+json") {
      var detail = "The request's Content-Type must be application/vnd.api+json, " + "but you provided: " + contentType.type + ".";

      reject(new _typesAPIError2["default"](415, null, "Invalid Media Type", detail));
    } else if (!(0, _utilTypeHandling.objectIsEmpty)(contentType.parameters)) {
      var detail = "The request's Content-Type must be application/vnd.api+json, with " + "no parameters. But the Content-Type you provided contained the " + ("parameters: " + _Object$keys(contentType.parameters).join(", ") + ".");

      reject(new _typesAPIError2["default"](415, null, "Invalid Media Type Parameter(s)", detail));
    } else {
      resolve();
    }
  });
}

module.exports = exports["default"];