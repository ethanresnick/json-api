"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Linkage = (function () {
  /**
   * Linkage can be either: null, an empty array,
   * an object of the form {type, id}, or [{type, id}].
   */

  function Linkage(value) {
    _classCallCheck(this, Linkage);

    this.set(value);
  }

  _createClass(Linkage, {
    set: {
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
    },
    add: {
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
    },
    empty: {
      value: function empty() {
        this.value = Array.isArray(this.value) ? [] : null;
      }
    }
  });

  return Linkage;
})();

module.exports = Linkage;

function InvalidLinkageError(value) {
  return new Error("Invalid linkage value: " + JSON.stringify(value));
}

function isValidLinkageObject(it) {
  return typeof it.type === "string" && typeof it.id === "string";
}