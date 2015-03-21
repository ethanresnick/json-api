"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var polyfill = _interopRequire(require("babel/polyfill"));

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

    var _ref = Array.from(arguments);

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