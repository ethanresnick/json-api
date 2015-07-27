"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _vary = require("vary");

var _vary2 = _interopRequireDefault(_vary);

var _contentType = require("content-type");

var _contentType2 = _interopRequireDefault(_contentType);

var _rawBody = require("raw-body");

var _rawBody2 = _interopRequireDefault(_rawBody);

var _controllersAPI = require("../controllers/API");

var _controllersAPI2 = _interopRequireDefault(_controllersAPI);

var _typesAPIError = require("../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

var _typesHTTPRequest = require("../types/HTTP/Request");

/**
 * This controller receives requests directly from express and sends responses
 * direclty through it, but it converts incoming requests to, and generates
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
 *    find an alternate representation? By defualt, it does the former. But you
 *    can set this option to false to have this code just pass on to express.
 */

var _typesHTTPRequest2 = _interopRequireDefault(_typesHTTPRequest);

var ExpressStrategy = (function () {
  function ExpressStrategy(apiController, docsController, options) {
    _classCallCheck(this, ExpressStrategy);

    var defaultOptions = {
      tunnel: false,
      handleContentNegotiation: true
    };

    this.api = apiController;
    this.docs = docsController;
    this.config = _Object$assign(defaultOptions, options); // apply options
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

      buildRequestObject(req, this.config.tunnel).then(function (requestObject) {
        _this.api.handle(requestObject, req, res).then(function (responseObject) {
          _this.sendResources(responseObject, res, next);
        });
      }, function (err) {
        res.status(err.status).send(err.message);
      }).done();
    }

    // For requests for the documentation.
  }, {
    key: "docsRequest",
    value: function docsRequest(req, res, next) {
      var _this2 = this;

      buildRequestObject(req, this.config.tunnel).then(function (requestObject) {
        _this2.docs.handle(requestObject).then(function (responseObject) {
          _this2.sendResources(responseObject, res, next);
        });
      }).done();
    }
  }, {
    key: "sendResources",
    value: function sendResources(responseObject, res, next) {
      if (responseObject.headers.vary) {
        (0, _vary2["default"])(res, responseObject.headers.vary);
      }

      if (!responseObject.contentType) {
        this.config.handleContentNegotiation ? res.status(406).send() : next();
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
     */
  }, {
    key: "sendError",
    value: function sendError(error, req, res) {
      var _this3 = this;

      buildRequestObject(req).then(function (requestObject) {
        _controllersAPI2["default"].responseFromExternalError(requestObject, error, _this3.api.registry).then(function (responseObject) {
          return _this3.sendResources(responseObject, res, function () {});
        });
      });
    }

    /**
     * @TODO Uses this ExpressStrategy to create an express app with
     * preconfigured routes that can be mounted as a subapp.
     */
  }, {
    key: "toApp",
    value: function toApp(typesToExcludedMethods) {}
  }]);

  return ExpressStrategy;
})();

exports["default"] = ExpressStrategy;

function buildRequestObject(req, allowTunneling) {
  return _q2["default"].Promise(function (resolve, reject) {
    var it = new _typesHTTPRequest2["default"]();

    // Handle route & query params
    it.queryParams = req.query;
    it.allowLabel = !!(req.params.idOrLabel && !req.params.id);
    it.idOrIds = req.params.id || req.params.idOrLabel;
    it.type = req.params.type;
    it.aboutRelationship = !!req.params.relationship;
    it.relationship = req.params.related || req.params.relationship;

    // Handle HTTP/Conneg.
    it.uri = req.protocol + "://" + req.get("Host") + req.originalUrl;
    it.method = req.method.toLowerCase();
    it.accepts = req.headers.accept;

    // Support Verb tunneling, but only for PATCH and only if user turns it on.
    // Turning on any tunneling automatically could be a security issue.
    var requestedMethod = (req.headers["X-HTTP-Method-Override"] || "").toLowerCase();
    if (allowTunneling && it.method === "post" && requestedMethod === "patch") {
      it.method = "patch";
    } else if (requestedMethod) {
      reject(new _typesAPIError2["default"](400, undefined, "Cannot tunnel to the method \"" + requestedMethod + "\"."));
    }

    it.hasBody = hasBody(req);

    if (it.hasBody) {
      it.contentType = req.headers["content-type"];
      var typeParsed = _contentType2["default"].parse(req);

      var bodyParserOptions = {};
      bodyParserOptions.encoding = typeParsed.parameters.charset || "utf8";
      bodyParserOptions.limit = "1mb";
      if (req.headers["content-length"] && !isNaN(req.headers["content-length"])) {
        bodyParserOptions.length = req.headers["content-length"];
      }

      (0, _rawBody2["default"])(req, bodyParserOptions, function (err, string) {
        if (err) {
          reject(err);
        } else {
          try {
            it.body = JSON.parse(string);
            resolve(it);
          } catch (error) {
            reject(new _typesAPIError2["default"](400, undefined, "Request contains invalid JSON."));
          }
        }
      });
    } else {
      it.body = null;
      resolve(it);
    }
  });
}

function hasBody(req) {
  return req.headers["transfer-encoding"] !== undefined || !isNaN(req.headers["content-length"]);
}
module.exports = exports["default"];