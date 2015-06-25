"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var RelationshipObject = (function () {
  function RelationshipObject(linkage, relatedURI, selfURI) {
    _classCallCheck(this, RelationshipObject);

    var _ref = [linkage, relatedURI, selfURI];
    this.linkage = _ref[0];
    this.relatedURI = _ref[1];
    this.selfURI = _ref[2];
  }

  _createClass(RelationshipObject, [{
    key: "empty",
    value: function empty() {
      this.linkage.empty();
    }
  }]);

  return RelationshipObject;
})();

exports["default"] = RelationshipObject;
module.exports = exports["default"];