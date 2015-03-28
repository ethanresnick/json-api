"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _slicedToArray = require("babel-runtime/helpers/sliced-to-array")["default"];

var _core = require("babel-runtime/core-js")["default"];

var nonEnumerable = { writable: true, enumerable: false };

var APIError = (function (_Error) {
  /*eslint-disable no-unused-vars */

  function APIError(status, code, title, detail, links, paths) {
    var _this = this;

    _classCallCheck(this, APIError);

    // Hack around lack of proxy support and default non-enumerability
    // of class accessor properties, while still giving us validation.
    Object.defineProperty(this, "_status", nonEnumerable);
    Object.defineProperty(this, "_code", nonEnumerable);
    Object.defineProperty(this, "status", {
      enumerable: true,
      get: function () {
        return _this._status;
      },
      set: function (value) {
        if (typeof value !== "undefined" && value !== null) {
          _this._status = String(value).toString();
        } else {
          _this._status = value;
        }
      }
    });
    Object.defineProperty(this, "code", {
      enumerable: true,
      get: function () {
        return _this._code;
      },
      set: function (value) {
        if (typeof value !== "undefined" && value !== null) {
          _this._code = String(value).toString();
        } else {
          _this._code = value;
        }
      }
    });

    var _ref = _core.Array.from(arguments);

    var _ref2 = _slicedToArray(_ref, 6);

    this.status = _ref2[0];
    this.code = _ref2[1];
    this.title = _ref2[2];
    this.detail = _ref2[3];
    this.links = _ref2[4];
    this.paths = _ref2[5];
  }

  _inherits(APIError, _Error);

  _createClass(APIError, null, {
    fromError: {
      /*eslint-enable */

      /**
       * Creates a JSON-API Compliant Error Object from a JS Error object
       *
       * Note: the spec allows error objects to have arbitrary properties
       * beyond the ones for which it defines a meaning (ie. id, href, code,
       * status, path, etc.), but this function strips out all such properties
       * in order to offer a neater result (as JS error objects often contain
       * all kinds of crap).
       */

      value: function fromError(err) {
        return new APIError(err.status || err.statusCode || 500, err.code, // most of the parameters below
        err.title, // will probably be null/undefined,
        err.message, // but that's fine.
        err.links, err.paths);
      }
    }
  });

  return APIError;
})(Error);

module.exports = APIError;