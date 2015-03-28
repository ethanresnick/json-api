"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var Collection = (function () {
  function Collection() {
    var resources = arguments[0] === undefined ? [] : arguments[0];

    _classCallCheck(this, Collection);

    this.resources = resources;
  }

  _createClass(Collection, {
    ids: {
      get: function () {
        return this.resources.map(function (it) {
          return it.id;
        });
      }
    },
    types: {
      get: function () {
        return this.resources.map(function (it) {
          return it.type;
        });
      }
    },
    add: {
      value: function add(resource) {
        this.resources.push(resource);
      }
    }
  });

  return Collection;
})();

module.exports = Collection;