"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _typesAPIError = require("../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

exports["default"] = function (body) {
  return _q2["default"].Promise(function (resolve, reject) {
    var ownProp = Object.prototype.hasOwnProperty;
    var errMessage = "Request body is not a valid JSON API document.";

    if (typeof body !== "object" || !ownProp.call(body, "data")) {
      reject(new _typesAPIError2["default"](400, null, errMessage));
    } else {
      resolve();
    }
  });
};

module.exports = exports["default"];