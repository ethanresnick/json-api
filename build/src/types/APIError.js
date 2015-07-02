"use strict";

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _slicedToArray = require("babel-runtime/helpers/sliced-to-array")["default"];

var _Array$from3 = require("babel-runtime/core-js/array/from")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});
var nonEnumerable = { writable: true, enumerable: false };

var APIError = (function (_Error) {
  /*eslint-disable no-unused-vars */

  function APIError(status, code, title, detail, links, paths) {
    var _this = this;

    _classCallCheck(this, APIError);

    _get(Object.getPrototypeOf(APIError.prototype), "constructor", this).call(this);

    // Hack around lack of proxy support and default non-enumerability
    // of class accessor properties, while still giving us validation.
    Object.defineProperty(this, "_status", nonEnumerable);
    Object.defineProperty(this, "_code", nonEnumerable);
    Object.defineProperty(this, "status", {
      enumerable: true,
      get: function get() {
        return _this._status;
      },
      set: function set(value) {
        if (typeof value !== "undefined" && value !== null) {
          _this._status = String(value).toString();
        } else {
          _this._status = value;
        }
      }
    });
    Object.defineProperty(this, "code", {
      enumerable: true,
      get: function get() {
        return _this._code;
      },
      set: function set(value) {
        if (typeof value !== "undefined" && value !== null) {
          _this._code = String(value).toString();
        } else {
          _this._code = value;
        }
      }
    });

    var _Array$from = _Array$from3(arguments);

    var _Array$from2 = _slicedToArray(_Array$from, 6);

    this.status = _Array$from2[0];
    this.code = _Array$from2[1];
    this.title = _Array$from2[2];
    this.detail = _Array$from2[3];
    this.links = _Array$from2[4];
    this.paths = _Array$from2[5];
  }

  _inherits(APIError, _Error);

  _createClass(APIError, null, [{
    key: "fromError",

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
      if (err instanceof APIError) {
        return err;
      }

      var title = err.title || err.isJSONAPIDisplayReady && err.message || "An unknown error occurred while trying to process this request.";

      // most of the args below will probably be null/undefined, but that's fine.
      return new APIError(err.status || err.statusCode || 500, err.code, title, err.message || err.details, err.links, err.paths);
    }
  }]);

  return APIError;
})(Error);

exports["default"] = APIError;
module.exports = exports["default"];