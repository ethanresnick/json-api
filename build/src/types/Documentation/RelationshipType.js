"use strict";

var _get = require("babel-runtime/helpers/get")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _FieldType2 = require("./FieldType");

var _FieldType3 = _interopRequireDefault(_FieldType2);

var RelationshipType = (function (_FieldType) {
  function RelationshipType(toMany, targetModel, targetType) {
    _classCallCheck(this, RelationshipType);

    _get(Object.getPrototypeOf(RelationshipType.prototype), "constructor", this).call(this, "Relationship", toMany);
    var _ref = [targetModel, targetType];
    this.targetModel = _ref[0];
    this.targetType = _ref[1];
  }

  _inherits(RelationshipType, _FieldType);

  _createClass(RelationshipType, [{
    key: "toString",
    value: function toString() {
      return (this.isArray ? "Array[" : "") + this.targetModel + "Id" + (this.isArray ? "]" : "");
    }
  }]);

  return RelationshipType;
})(_FieldType3["default"]);

exports["default"] = RelationshipType;
module.exports = exports["default"];