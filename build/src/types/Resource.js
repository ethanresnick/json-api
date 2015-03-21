"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var deleteNested = require("../util/misc").deleteNested;

var Resource = (function () {
  function Resource(type, id) {
    var attrs = arguments[2] === undefined ? {} : arguments[2];
    var links = arguments[3] === undefined ? {} : arguments[3];
    var meta = arguments[4] === undefined ? {} : arguments[4];

    _classCallCheck(this, Resource);

    var _ref = [type, id, attrs, links, meta];

    var _ref2 = _slicedToArray(_ref, 5);

    this.type = _ref2[0];
    this.id = _ref2[1];
    this.attrs = _ref2[2];
    this.links = _ref2[3];
    this.meta = _ref2[4];
  }

  _createClass(Resource, {
    removeAttr: {
      value: function removeAttr(attrPath) {
        if (this._attrs) {
          deleteNested(attrPath, this._attrs);
        }
      }
    },
    attrs: {
      get: function () {
        return this._attrs;
      },
      set: function (attrs) {
        validateAttrs(attrs);
        this._attrs = attrs;
      }
    },
    type: {
      get: function () {
        return this._type;
      },
      set: function (type) {
        validateType(type);
        this._type = String(type).toString();
      }
    },
    id: {
      get: function () {
        return this._id;
      },
      set: function (id) {
        // allow empty id, e.g. for the case of a new resource
        // posted from the client and not yet saved.
        this._id = id ? String(id).toString() : undefined;
      }
    }
  });

  return Resource;
})();

module.exports = Resource;

function validateAttrs(attrs) {
  if (typeof attrs !== "object" || Array.isArray(attrs)) {
    throw new Error("Attrs must be an object.");
  }

  ["id", "type", "meta", "links"].forEach(function (it) {
    if (attrs[it]) throw new Error(it + " is an invalid attribute name");
  });
}

function validateType(type) {
  if (!type) throw new Error("type is required");
}