"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

_Object$defineProperty(exports, "__esModule", {
  value: true
});

var Collection = (function () {
  function Collection() {
    var resources = arguments[0] === undefined ? [] : arguments[0];

    _classCallCheck(this, Collection);

    this.resources = resources;
  }

  _createClass(Collection, [{
    key: "ids",
    get: function () {
      return this.resources.map(function (it) {
        return it.id;
      });
    }
  }, {
    key: "types",
    get: function () {
      return this.resources.map(function (it) {
        return it.type;
      });
    }
  }, {
    key: "add",
    value: function add(resource) {
      this.resources.push(resource);
    }
  }]);

  return Collection;
})();

exports["default"] = Collection;
module.exports = exports["default"];