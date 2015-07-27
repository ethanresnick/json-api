/**
 * This class represents the type of a field (i.e. what type of data it holds)
 * within a resource's schema.
 */
"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var FieldType = (function () {
  function FieldType(baseType) {
    var isArray = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

    _classCallCheck(this, FieldType);

    var _ref = [baseType, isArray];
    this.baseType = _ref[0];
    this.isArray = _ref[1];
  }

  _createClass(FieldType, [{
    key: "toString",
    value: function toString() {
      return (this.isArray ? "Array[" : "") + this.baseType + (this.isArray ? "]" : "");
    }
  }]);

  return FieldType;
})();

exports["default"] = FieldType;
module.exports = exports["default"];