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

var _qs = require("qs");

var _qs2 = _interopRequireDefault(_qs);

var _contentType = require("content-type");

var _contentType2 = _interopRequireDefault(_contentType);

var _rawBody = require("raw-body");

var _rawBody2 = _interopRequireDefault(_rawBody);

var _typesAPIError = require("../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

var _typesHTTPRequest = require("../types/HTTP/Request");

var _typesHTTPRequest2 = _interopRequireDefault(_typesHTTPRequest);

/**
 * This controller is the base for http strategy classes. It's built around
 * the premise that most if not all http frameworks are built on top of the
 * core http module and as such should provide the original IncomingMessage
 * object. This allows the buildRequestObject method to be framework agnostic
 * in it's translation to the json-api Request object.
 *
 * @param {Object} options A set of configuration options.
 *
 * @param {boolean} options.tunnel Whether to turn on PATCH tunneling. See:
 *    http://jsonapi.org/recommendations/#patchless-clients
 *
 * @param {boolean} options.handleContentNegotiation If the JSON API library
 *    can't produce a representation for the response that the client can
 *    `Accept`, should it return 406 or should it hand the request back to
 *    to the framwork so that subsequent handlers can attempt to find an
 *    alternate representation? By default, it does the former.
 */

var BaseStrategy = (function () {
  function BaseStrategy(apiController, docsController, options) {
    _classCallCheck(this, BaseStrategy);

    var defaultOptions = {
      tunnel: false,
      handleContentNegotiation: true
    };

    this.api = apiController;
    this.docs = docsController;
    this.config = _Object$assign({}, defaultOptions, options); // apply options
  }

  /**
   * Builds a Request object from an IncomingMessage object. It is not
   * possible to infer the protocol or the url params from the IncomingMessage
   * object alone so they must be passed as arguments. Optionally a query object
   * can be passed, otherwise the query parameters will be inferred from the
   * IncomingMessage url property and parsed using the qs node module.
   *
   * @param {http.IncomingMessage} req original request object from core node module http
   * @param {string} protocol
   * @param {string} host
   * @param {Object} params object containing url parameters
   * @param {Object} [query] object containing query parameters
   */

  _createClass(BaseStrategy, [{
    key: "buildRequestObject",
    value: function buildRequestObject(req, protocol, host, params, query) {
      var config = this.config;

      return _q2["default"].Promise(function (resolve, reject) {
        var it = new _typesHTTPRequest2["default"]();

        // Handle route & query params
        if (query) {
          it.queryParams = query;
        } else if (req.url.indexOf("?") !== -1) {
          it.queryParams = _qs2["default"].parse(req.url.split("?")[1]);
        }

        it.allowLabel = !!(params.idOrLabel && !params.id);
        it.idOrIds = params.id || params.idOrLabel;
        it.type = params.type;
        it.aboutRelationship = !!params.relationship;
        it.relationship = params.related || params.relationship;

        // Handle HTTP/Conneg.
        protocol = protocol || (req.connection.encrypted ? "https" : "http");
        host = host || req.headers.host;

        it.uri = protocol + "://" + host + req.url;
        it.method = req.method.toLowerCase();
        it.accepts = req.headers.accept;

        // Support Verb tunneling, but only for PATCH and only if user turns it on.
        // Turning on any tunneling automatically could be a security issue.
        var requestedMethod = (req.headers["x-http-method-override"] || "").toLowerCase();
        if (config.tunnel && it.method === "post" && requestedMethod === "patch") {
          it.method = "patch";
        } else if (requestedMethod) {
          reject(new _typesAPIError2["default"](400, undefined, "Cannot tunnel to the method \"" + requestedMethod.toUpperCase() + "\"."));
        }

        if (hasBody(req)) {

          it.contentType = req.headers["content-type"];
          var typeParsed = _contentType2["default"].parse(req);

          if (isReadableStream(req)) {

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
          }
          // The request has been read, but the rawBody property has been set
          else if (!req.rawBody) {
              it.hasBody = true;
              it.body = JSON.parse(rawBody);
              it.rawBody = req.rawBody;
            }
            // The request has been read, but the body has been set
            else if (typeof req.body === 'object') {
                it.hasBody = true;
                it.body = req.body;
              }
              // The request has been read, but neither req.body or req.rawBody have been set
              else {
                  return reject(new _typesAPIError2["default"](500, undefined, "Request body could not be parsed. If other middleware has parsed the body, make sure to set the body or rawBody properties on the request object."));
                }
        } else {
          it.hasBody = false;
          it.body = undefined;
          resolve(it);
        }
      });
    }
  }]);

  return BaseStrategy;
})();

exports["default"] = BaseStrategy;

function hasBody(req) {
  return req.headers["transfer-encoding"] !== undefined || !isNaN(req.headers["content-length"]);
}

function isReadableStream(req) {
  return typeof req._readableState === "object" && req._readableState.endEmitted === false;
}
module.exports = exports["default"];