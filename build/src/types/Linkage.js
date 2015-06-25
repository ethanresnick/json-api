"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Linkage = (function () {
  /**
   * Linkage can be either: null, an empty array,
   * an object of the form {type, id}, or [{type, id}].
   */

  function Linkage(value) {
    _classCallCheck(this, Linkage);

    this.set(value);
  }

  _createClass(Linkage, [{
    key: "set",
    value: function set(value) {
      if (value === null) {
        this.value = value;
      } else if (!Array.isArray(value)) {
        if (isValidLinkageObject(value)) {
          this.value = value;
        } else {
          throw new InvalidLinkageError(value);
        }
      } else {
        this.value = [];
        value.forEach(this.add.bind(this));
      }
    }
  }, {
    key: "add",
    value: function add(newValue) {
      if (Array.isArray(this.value)) {
        if (isValidLinkageObject(newValue)) {
          this.value.push(newValue);
        } else {
          throw new InvalidLinkageError(newValue);
        }
      } else {
        throw new Error("You can only add values to Linkage objects for to-many relationships.");
      }
    }
  }, {
    key: "empty",
    value: function empty() {
      this.value = Array.isArray(this.value) ? [] : null;
    }
  }]);

  return Linkage;
})();

exports["default"] = Linkage;

function InvalidLinkageError(value) {
  return new Error("Invalid linkage value: " + JSON.stringify(value));
}

function isValidLinkageObject(it) {
  return typeof it.type === "string" && typeof it.id === "string";
}
module.exports = exports["default"];