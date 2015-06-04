"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

_Object$defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require("mongoose");

var _mongoose2 = _interopRequireDefault(_mongoose);

var schema = _mongoose2["default"].Schema({
  name: String,
  email: { type: String, lowercase: true },
  gender: {
    type: String,
    "enum": ["male", "female", "other"]
  }
});

exports["default"] = _mongoose2["default"].model("Person", schema);
module.exports = exports["default"];