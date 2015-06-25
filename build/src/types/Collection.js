"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Collection = (function () {
  function Collection() {
    var resources = arguments[0] === undefined ? [] : arguments[0];

    _classCallCheck(this, Collection);

    this.resources = resources;
  }

  _createClass(Collection, [{
    key: "add",
    value: function add(resource) {
      this.resources.push(resource);
    }
  }, {
    key: "ids",
    get: function get() {
      return this.resources.map(function (it) {
        return it.id;
      });
    }
  }, {
    key: "types",
    get: function get() {
      return this.resources.map(function (it) {
        return it.type;
      });
    }
  }]);

  return Collection;
})();

exports["default"] = Collection;
module.exports = exports["default"];