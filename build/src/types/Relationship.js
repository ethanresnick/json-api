"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Relationship = (function () {
  function Relationship(linkage, relatedURITemplate, selfURITemplate) {
    _classCallCheck(this, Relationship);

    _Object$assign(this, { linkage: linkage, relatedURITemplate: relatedURITemplate, selfURITemplate: selfURITemplate });
  }

  _createClass(Relationship, [{
    key: "empty",
    value: function empty() {
      this.linkage.empty();
    }
  }]);

  return Relationship;
})();

exports["default"] = Relationship;
module.exports = exports["default"];