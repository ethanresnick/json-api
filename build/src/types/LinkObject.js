"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _slicedToArray = require("babel-runtime/helpers/sliced-to-array")["default"];

var LinkObject = (function () {
  function LinkObject(linkage, relatedURI, selfURI) {
    _classCallCheck(this, LinkObject);

    var _ref = [linkage, relatedURI, selfURI];

    var _ref2 = _slicedToArray(_ref, 3);

    this.linkage = _ref2[0];
    this.relatedURI = _ref2[1];
    this.selfURI = _ref2[2];
  }

  _createClass(LinkObject, {
    empty: {
      value: function empty() {
        this.linkage.empty();
      }
    }
  });

  return LinkObject;
})();

module.exports = LinkObject;