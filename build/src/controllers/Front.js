"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var Q = _interopRequire(require("q"));

var templating = _interopRequire(require("url-template"));

var jade = _interopRequire(require("jade"));

var path = _interopRequire(require("path"));

var contentType = _interopRequire(require("content-type"));

var getRawBody = _interopRequire(require("raw-body"));

var API = _interopRequire(require("./API"));

var Documentation = _interopRequire(require("./Documentation"));

var Request = _interopRequire(require("../types/HTTP/Request"));

var ResourceTypeRegistry = _interopRequire(require("../ResourceTypeRegistry"));

/**
 * This controller (or a subclass of it if the user isn't on express) has the
 * job of converting the framework's req, res objects into framework-neutral
 * Request and Response objects, which it then provides to our other controllers
 * (API and Documentation) that do the real work. They generate a Response
 * object, so they're totally shielded from the framework's details, and then
 * this controller turns that into a true response.
 */

var FrontController = (function () {
  function FrontController(apiController, docsController) {
    _classCallCheck(this, FrontController);

    this.api = apiController;
    this.docs = docsController;
  }

  _createClass(FrontController, {
    apiRequest: {

      // For requests like GET /:type, GET /:type/:id/:relationship,
      // POST /:type with or without ext=bulk, PATCH /:type/:id,
      // PATCH /:type with ext=bulk, DELETE /:type/:idOrLabel,
      // DELETE /:type; ext=bulk, GET /:type/:id/links/:relationship,
      // PATCH /:type/:id/links/:relationship, POST /:type/:id/links/:relationship,
      // and DELETE /:type/:id/links/:relationship.

      value: function apiRequest(req, res, next) {
        var _this = this;

        buildRequestObject(req).then(function (requestObject) {
          _this.api.handle(requestObject, req, res).then(function (responseObject) {
            _this.sendResources(responseObject, res);
          });
        }, function (err) {
          res.status(err.status).send(err.message);
        });
      }
    },
    docsRequest: {

      // For requests for the documentation.

      value: function docsRequest(req, res, next) {
        var _this = this;

        buildRequestObject(req).then(function (requestObject) {
          _this.docs.handle(requestObject).then(function (responseObject) {
            _this.sendResources(responseObject, res);
          });
        });
      }
    },
    sendResources: {
      value: function sendResources(responseObject, res) {
        if (!responseObject.contentType) {
          res.status(406).send();
        } else {
          res.set("Content-Type", responseObject.contentType);
          res.status(responseObject.status || 200);

          if (responseObject.location) {
            res.set("Location", responseObject.location);
          }

          if (responseObject.body !== null) {
            res.send(responseObject.body).end();
          } else {
            res.end();
          }
        }
      }
    },
    sendError: {

      /**
       * A user of this library may wish to send an error response for an exception
       * that originated outside of the JSON API Pipeline and that's outside the
       * main spec's scope (e.g. an authentication error). So, the controller
       * exposes this method which allows them to do that.
       */

      value: function sendError(error, req, res) {
        var _this = this;

        buildRequestObject(req).then(function (requestObject) {
          API.responseFromExternalError(requestObject, error, _this.api.registry).then(function (responseObject) {
            return _this.sendResources(responseObject, res);
          });
        });
      }
    }
  });

  return FrontController;
})();

module.exports = FrontController;

function buildRequestObject(req) {
  return Q.Promise(function (resolve, reject) {
    var it = new Request();

    // Handle route & query params
    it.queryParams = req.query;
    it.allowLabel = !!(req.params.idOrLabel && !req.params.id);
    it.idOrIds = req.params.id || req.params.idOrLabel;
    it.type = req.params.type;
    it.aboutLinkObject = !!req.params.relationship;
    it.relationship = req.params.related || req.params.relationship;

    // Handle HTTP/Conneg.
    it.uri = req.protocol + "://" + req.get("Host") + req.originalUrl;
    it.method = req.method.toLowerCase();
    it.accepts = req.headers.accept;

    it.hasBody = hasBody(req);

    if (it.hasBody) {
      var typeParsed = contentType.parse(req);
      var bodyParserOptions = {};

      it.contentType = typeParsed.type;
      if (typeParsed.parameters.ext) {
        it.ext = typeParsed.parameters.ext.split(",");
      }

      bodyParserOptions.encoding = typeParsed.parameters.charset || "utf8";
      bodyParserOptions.limit = "1mb";
      if (req.headers["content-length"] && !isNaN(req.headers["content-length"])) {
        bodyParserOptions.length = req.headers["content-length"];
      }

      getRawBody(req, bodyParserOptions, function (err, string) {
        if (err) {
          reject(err);
        } else {
          try {
            it.body = JSON.parse(string);
            resolve(it);
          } catch (error) {
            var parseErr = new Error("Request contains invalid JSON.");
            parseErr.status = error.statusCode = 400;
            reject(err);
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
