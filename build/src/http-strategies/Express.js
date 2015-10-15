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

var _typesHTTPRequest2 = _interopRequireDefault(_typesHTTPRequest);

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

var ExpressStrategy = (function () {
  function ExpressStrategy(apiController, docsController, options) {
    _classCallCheck(this, ExpressStrategy);

    var defaultOptions = {
      tunnel: false,
      handleContentNegotiation: true
    };

    this.api = apiController;
    this.docs = docsController;
    this.config = _Object$assign({}, defaultOptions, options); // apply options
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

      buildRequestObject(req, this.config.tunnel).then(function (requestObject) {
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
    var requestedMethod = (req.headers["x-http-method-override"] || "").toLowerCase();
    if (allowTunneling && it.method === "post" && requestedMethod === "patch") {
      it.method = "patch";
    } else if (requestedMethod) {
      reject(new _typesAPIError2["default"](400, undefined, "Cannot tunnel to the method \"" + requestedMethod.toUpperCase() + "\"."));
    }

    if (hasBody(req)) {
      if (!isReadableStream(req)) {
        return reject(new _typesAPIError2["default"](500, undefined, "Request body could not be parsed. Make sure other no other middleware has already parsed the request body."));
      }

      it.contentType = req.headers["content-type"];
      var typeParsed = _contentType2["default"].parse(req);

      var bodyParserOptions = {};
      bodyParserOptions.encoding = typeParsed.parameters.charset || "utf8";
      bodyParserOptions.limit = "1mb";
      if (req.headers["content-length"] && !isNaN(req.headers["content-length"])) {
        bodyParserOptions.length = req.headers["content-length"];
      }

      // The req has not yet been read, so let's read it
      (0, _rawBody2["default"])(req, bodyParserOptions, function (err, string) {
        if (err) {
          reject(err);
        }

        // Even though we passed the hasBody check, the body could still be
        // empty, so we check the length. (We can't check this before doing
        // getRawBody because, while Content-Length: 0 signals an empty body,
        // there's no similar in-advance clue for detecting empty bodies when
        // Transfer-Encoding: chunked is being used.)
        else if (string.length === 0) {
            it.hasBody = false;
            it.body = "";
            resolve(it);
          } else {
            try {
              it.hasBody = true;
              it.body = JSON.parse(string);
              resolve(it);
            } catch (error) {
              reject(new _typesAPIError2["default"](400, undefined, "Request contains invalid JSON."));
            }
          }
      });
    } else {
      it.hasBody = false;
      it.body = undefined;
      resolve(it);
    }
  });
}

function hasBody(req) {
  return req.headers["transfer-encoding"] !== undefined || !isNaN(req.headers["content-length"]);
}

function isReadableStream(req) {
  return typeof req._readableState === "object" && req._readableState.endEmitted === false;
}
module.exports = exports["default"];