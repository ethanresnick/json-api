"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Field = function Field(name, type, validation, friendlyName, defaultVal) {
  if (validation === undefined) validation = {};

  _classCallCheck(this, Field);

  // call the property kind to
  // distinguish it from json api type
  this.kind = type;

  this.name = name;
  this.validation = validation;
  this.friendlyName = friendlyName;
  this["default"] = defaultVal;
};

exports["default"] = Field;
module.exports = exports["default"];