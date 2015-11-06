"use strict";

var _get = require("babel-runtime/helpers/get")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _regeneratorRuntime = require("babel-runtime/regenerator")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _vary = require("vary");

var _vary2 = _interopRequireDefault(_vary);

var _controllersAPI = require("../controllers/API");

var _controllersAPI2 = _interopRequireDefault(_controllersAPI);

var _Base2 = require("./Base");

var _Base3 = _interopRequireDefault(_Base2);

/**
 * This controller receives requests directly from Koa and sends responses
 * directly through it, but it converts incoming requests to, and generates
 * responses, from Request and Response objects that are defined by this
 * framework in a way that's not particular to Koa. This controller thereby
 * acts as a translation-layer between Koa and the rest of this json-api
 * framework.
 *
 * @param {Object} options A set of configuration options.
 *
 * @param {boolean} options.tunnel Whether to turn on PATCH tunneling. See:
 *    http://jsonapi.org/recommendations/#patchless-clients
 *
 * @param {boolean} options.handleContentNegotiation If the JSON API library
 *    can't produce a representation for the response that the client can
 *    `Accept`, should it return 406 or should it hand the request back to
 *    Koa (i.e. yield next) so that subsequent handlers can attempt to
 *    find an alternate representation? By default, it does the former. But you
 *    can set this option to false to have this code just pass on to Koa.
 */

var KoaStrategy = (function (_Base) {
  _inherits(KoaStrategy, _Base);

  function KoaStrategy(apiController, docsController, options) {
    _classCallCheck(this, KoaStrategy);

    _get(Object.getPrototypeOf(KoaStrategy.prototype), "constructor", this).call(this, apiController, docsController, options);
  }

  // For requests like GET /:type, GET /:type/:id/:relationship,
  // POST /:type PATCH /:type/:id, PATCH /:type, DELETE /:type/:idOrLabel,
  // DELETE /:type, GET /:type/:id/links/:relationship,
  // PATCH /:type/:id/links/:relationship, POST /:type/:id/links/:relationship,
  // and DELETE /:type/:id/links/:relationship.

  _createClass(KoaStrategy, [{
    key: "apiRequest",
    value: function apiRequest() {
      var strategy = this;
      return _regeneratorRuntime.mark(function callee$2$0(next) {
        var ctx, reqObj, resObj, delegate406Handling;
        return _regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
          while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
              ctx = this;
              context$3$0.prev = 1;
              context$3$0.next = 4;
              return strategy.buildRequestObject(ctx.req, ctx.protocol, ctx.host, ctx.params);

            case 4:
              reqObj = context$3$0.sent;
              context$3$0.next = 7;
              return strategy.api.handle(reqObj, ctx);

            case 7:
              resObj = context$3$0.sent;
              delegate406Handling = strategy.sendResources(resObj, ctx);

              if (!delegate406Handling) {
                context$3$0.next = 12;
                break;
              }

              context$3$0.next = 12;
              return next;

            case 12:
              context$3$0.next = 17;
              break;

            case 14:
              context$3$0.prev = 14;
              context$3$0.t0 = context$3$0["catch"](1);

              strategy.sendError(context$3$0.t0, this);

            case 17:
            case "end":
              return context$3$0.stop();
          }
        }, callee$2$0, this, [[1, 14]]);
      });
    }

    // For requests for the documentation.
  }, {
    key: "docsRequest",
    value: function docsRequest() {
      var strategy = this;
      return _regeneratorRuntime.mark(function callee$2$0(next) {
        var ctx, reqObj, resObj, delegate406Handling;
        return _regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
          while (1) switch (context$3$0.prev = context$3$0.next) {
            case 0:
              ctx = this;
              context$3$0.prev = 1;
              context$3$0.next = 4;
              return strategy.buildRequestObject(ctx.req, ctx.protocol, ctx.host, ctx.params);

            case 4:
              reqObj = context$3$0.sent;
              context$3$0.next = 7;
              return strategy.docs.handle(reqObj, ctx);

            case 7:
              resObj = context$3$0.sent;
              delegate406Handling = strategy.sendResources(resObj, ctx);

              if (!delegate406Handling) {
                context$3$0.next = 12;
                break;
              }

              context$3$0.next = 12;
              return next;

            case 12:
              context$3$0.next = 17;
              break;

            case 14:
              context$3$0.prev = 14;
              context$3$0.t0 = context$3$0["catch"](1);

              strategy.sendError(context$3$0.t0, this);

            case 17:
            case "end":
              return context$3$0.stop();
          }
        }, callee$2$0, this, [[1, 14]]);
      });
    }
  }, {
    key: "sendResources",
    value: function sendResources(responseObject, ctx) {
      if (responseObject.headers.vary) {
        (0, _vary2["default"])(ctx.res, responseObject.headers.vary);
      }

      if (!responseObject.contentType) {
        if (this.config.handleContentNegotiation) {
          ctx.status = 406;
        } else {
          return true;
        }
      } else {
        ctx.set("Content-Type", responseObject.contentType);
        ctx.status = responseObject.status || 200;

        if (responseObject.headers.location) {
          ctx.set("Location", responseObject.headers.location);
        }

        if (responseObject.body !== null) {
          ctx.body = new Buffer(responseObject.body);
        }
      }
    }

    /**
     * A user of this library may wish to send an error response for an exception
     * that originated outside of the JSON API Pipeline and that's outside the
     * main spec's scope (e.g. an authentication error). So, the controller
     * exposes this method which allows them to do that.
     *
     * @param {Error|APIError|Error[]|APIError[]} errors Error or array of errors
     * @param {Object} ctx Koa's context object
     */
  }, {
    key: "sendError",
    value: function sendError(errors, ctx) {
      var _this = this;

      _controllersAPI2["default"].responseFromExternalError(errors, ctx.headers.accept).then(function (responseObject) {
        return _this.sendResources(responseObject, ctx);
      })["catch"](function (err) {
        // if we hit an error generating our error...
        ctx["throw"](err.message, err.status);
      });
    }
  }]);

  return KoaStrategy;
})(_Base3["default"]);

exports["default"] = KoaStrategy;
module.exports = exports["default"];