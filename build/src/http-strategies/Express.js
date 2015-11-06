"use strict";

var _get = require("babel-runtime/helpers/get")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

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
 * This controller receives requests directly from express and sends responses
 * directly through it, but it converts incoming requests to, and generates
 * responses, from Request and Response objects that are defined by this
 * framework in a way that's not particular to express. This controller thereby
 * acts as a translation-layer between express and the rest of this json-api
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
 *    Express (i.e. call next()) so that subsequent handlers can attempt to
 *    find an alternate representation? By default, it does the former. But you
 *    can set this option to false to have this code just pass on to Express.
 */

var ExpressStrategy = (function (_Base) {
  _inherits(ExpressStrategy, _Base);

  function ExpressStrategy(apiController, docsController, options) {
    _classCallCheck(this, ExpressStrategy);

    _get(Object.getPrototypeOf(ExpressStrategy.prototype), "constructor", this).call(this, apiController, docsController, options);
  }

  // For requests like GET /:type, GET /:type/:id/:relationship,
  // POST /:type PATCH /:type/:id, PATCH /:type, DELETE /:type/:idOrLabel,
  // DELETE /:type, GET /:type/:id/links/:relationship,
  // PATCH /:type/:id/links/:relationship, POST /:type/:id/links/:relationship,
  // and DELETE /:type/:id/links/:relationship.

  _createClass(ExpressStrategy, [{
    key: "apiRequest",
    value: function apiRequest(req, res, next) {
      var _this = this;

      this.buildRequestObject(req, req.protocol, req.get("Host"), req.params, req.query).then(function (requestObject) {
        return _this.api.handle(requestObject, req, res).then(function (responseObject) {
          _this.sendResources(responseObject, res, next);
        });
      })["catch"](function (err) {
        _this.sendError(err, req, res);
      });
    }

    // For requests for the documentation.
  }, {
    key: "docsRequest",
    value: function docsRequest(req, res, next) {
      var _this2 = this;

      this.buildRequestObject(req, req.protocol, req.get("Host"), req.params, req.query).then(function (requestObject) {
        return _this2.docs.handle(requestObject, req, res).then(function (responseObject) {
          _this2.sendResources(responseObject, res, next);
        });
      })["catch"](function (err) {
        _this2.sendError(err, req, res);
      });
    }
  }, {
    key: "sendResources",
    value: function sendResources(responseObject, res, next) {
      if (responseObject.headers.vary) {
        (0, _vary2["default"])(res, responseObject.headers.vary);
      }

      if (!responseObject.contentType) {
        if (this.config.handleContentNegotiation) {
          res.status(406).send();
        } else {
          next();
        }
      } else {
        res.set("Content-Type", responseObject.contentType);
        res.status(responseObject.status || 200);

        if (responseObject.headers.location) {
          res.set("Location", responseObject.headers.location);
        }

        if (responseObject.body !== null) {
          res.send(new Buffer(responseObject.body)).end();
        } else {
          res.end();
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
     * @param {Object} req Express's request object
     * @param {Object} res Express's response object
     */
  }, {
    key: "sendError",
    value: function sendError(errors, req, res) {
      var _this3 = this;

      _controllersAPI2["default"].responseFromExternalError(errors, req.headers.accept).then(function (responseObject) {
        return _this3.sendResources(responseObject, res, function () {});
      })["catch"](function (err) {
        // if we hit an error generating our error...
        res.status(err.status).send(err.message);
      });
    }

    /**
     * @TODO Uses this ExpressStrategy to create an express app with
     * preconfigured routes that can be mounted as a subapp.
    toApp(typesToExcludedMethods) {
    }
    */
  }]);

  return ExpressStrategy;
})(_Base3["default"]);

exports["default"] = ExpressStrategy;
module.exports = exports["default"];