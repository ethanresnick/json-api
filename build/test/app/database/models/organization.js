"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require("mongoose");

var _mongoose2 = _interopRequireDefault(_mongoose);

var _libUtils = require("../lib/utils");

var _libUtils2 = _interopRequireDefault(_libUtils);

var ObjectId = _mongoose2["default"].Schema.Types.ObjectId;

function OrganizationSchema() {
  _mongoose2["default"].Schema.apply(this, arguments);
  this.add({
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    liaisons: [{ ref: "Person", type: ObjectId }]
  });
}

_libUtils2["default"].inherit(OrganizationSchema, _mongoose2["default"].Schema);

var schema = new OrganizationSchema();
var model = _mongoose2["default"].model("Organization", schema);

exports["default"] = { "model": model, schema: OrganizationSchema };
module.exports = exports["default"];