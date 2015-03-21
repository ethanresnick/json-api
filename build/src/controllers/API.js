"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Q = _interopRequire(require("q"));

var contentType = _interopRequire(require("content-type"));

var getRawBody = _interopRequire(require("raw-body"));

var pipeline = _interopRequire(require("../Pipeline"));

var RequestContext = _interopRequire(require("../types/Context/RequestContext"));

var APIError = _interopRequire(require("../types/APIError"));

var Document = _interopRequire(require("../types/Document"));

var negotiateContentType = _interopRequire(require("../steps/http/negotiate-content-type"));

/**
 * This controller offers the outside world distinct entry points into the
 * pipeline for handling different types of requests. It also acts as the only
 * point of interaction between this library and express. Inside the pipeline,
 * we use the ResponseContext that this controller provides to generate a
 * ResponseContext object, which the controller then turns into a response.
 */

var APIController = (function () {
  function APIController(registry) {
    _classCallCheck(this, APIController);

    this.pipeline = pipeline(registry);
  }

  _createClass(APIController, {
    resourceRequest: {

      // For requests like GET /:type, GET /:type/:id/:relationship,
      // POST /:type with or without ext=bulk, PATCH /:type/:id,
      // PATCH /:type with ext=bulk, DELETE /:type/:idOrLabel, and
      // DELETE /:type; ext=bulk

      value: function resourceRequest(req, res, next) {
        var _this = this;

        buildRequestContext(req).then(function (context) {
          _this.pipeline(context, req, res).then(function (responseContext) {
            _this.sendResources(responseContext, res);
          });
        }, function (err) {
          res.status(err.status).send(err.message);
        });
      }
    },
    linkObjectRequest: {

      // For requests like GET /:type/:id/links/:relationship,
      // PATCH /:type/:id/links/:relationship, POST /:type/:id/links/:relationship,
      // and DELETE /:type/:id/links/:relationship.

      value: function linkObjectRequest(req, res, next) {
        var _this = this;

        buildRequestContext(req).then(function (context) {
          context.aboutLinkObject = true;
          _this.pipeline(context, req, res).then(function (responseContext) {
            _this.sendResources(responseContext, res);
          });
        }, function (err) {
          res.status(err.status).send(err.message);
        });
      }
    },
    sendResources: {
      value: function sendResources(responseContext, res) {
        if (!responseContext.contentType) {
          res.status(406).send();
        } else {
          res.set("Content-Type", responseContext.contentType);
          res.status(responseContext.status || 200);

          if (responseContext.location) {
            res.set("Location", responseContext.location);
          }

          if (responseContext.body !== null) {
            res.json(responseContext.body).end();
          } else {
            res.end();
          }
        }
      }
    },
    sendError: {

      /**
       * A user of this library may wish to send an error for something that
       * the JSON API Pipeline can't process because it's outside the main spec's
       * scope (e.g. an authentication error). So, the controller exposes this
       * method which allows them to do that. (Even if we refactor some of this
       * logic down the line to be handled in the pipeline--e.g. giving it another
       * path--it's good to expose this on the controller's interface.)
       */

      value: function sendError(error, req, res) {
        var _this = this;

        buildRequestContext(req).then(function (context) {
          negotiateContentType(context.accepts, [], _this.pipeline.supportedExt).then(function (contentType) {
            var errors = [APIError.fromError(error)];
            res.set("Content-Type", contentType);
            res.status(errors[0].status || 400);
            res.send(new Document(errors).get());
          }, function () {
            res.status(406).send();
          });
        });
      }
    }
  });

  return APIController;
})();

module.exports = APIController;

function buildRequestContext(req) {
  return Q.Promise(function (resolve, reject) {
    var context = new RequestContext();

    // Handle route & query params
    context.queryParams = req.query;
    context.allowLabel = !!(req.params.idOrLabel && !req.params.id);
    context.idOrIds = req.params.id || req.params.idOrLabel;
    context.type = req.params.type;
    context.relationship = req.params.relationship;

    // Handle HTTP/Conneg.
    context.accepts = req.headers.accept;
    context.method = req.method.toLowerCase();

    context.hasBody = hasBody(req);

    if (context.hasBody) {
      var typeParsed = contentType.parse(req);
      var bodyParserOptions = {};

      context.contentType = typeParsed.type;
      if (typeParsed.parameters.ext) {
        context.ext = typeParsed.parameters.ext.split(",");
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
            context.body = JSON.parse(string);
            resolve(context);
          } catch (error) {
            var parseErr = new Error("Request contains invalid JSON.");
            parseErr.status = error.statusCode = 400;
            reject(err);
          }
        }
      });
    } else {
      context.body = null;
      resolve(context);
    }
  });
}

function hasBody(req) {
  return req.headers["transfer-encoding"] !== undefined || !isNaN(req.headers["content-length"]);
}