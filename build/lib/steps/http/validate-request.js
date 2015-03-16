"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.checkBodyExistence = checkBodyExistence;
exports.checkBodyParsesAsJSON = checkBodyParsesAsJSON;
exports.checkContentType = checkContentType;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var Q = _interopRequire(require("q"));

var APIError = _interopRequire(require("../../types/APIError"));

function checkBodyExistence(requestContext) {
  return Q.Promise(function (resolve, reject) {
    if (requestContext.hasBody === requestContext.needsBody) {
      resolve();
    } else if (requestContext.needsBody) {
      reject(new APIError(400, null, "This request needs a body, but didn't have one."));
    } else {
      reject(new APIError(400, null, "This request should not have a body, but does."));
    }
  });
}

function checkBodyParsesAsJSON(req, res, bodyParser) {
  return Q.nfcall(bodyParser.json({ type: "*/*" }), req, res).then(function () {}, function (err) {
    switch (err.message) {
      case /encoding unsupported/i:
        throw new APIError(415, null, err.message);
        break;

      case /empty body/i:
        req.body = null;
        return Q();
        break;

      case /invalid json/i:
        throw new APIError(400, null, "Request contains invalid JSON.");
        break;

      default:
        if (err instanceof SyntaxError) {
          err.title = "Request contains invalid JSON.";
          err.status = 400;
        }
        throw APIError.fromError(err);
    }
  });
}

function checkContentType(requestContext, supportedExt) {
  // From the spec: The value of the ext media type parameter... MUST
  // be limited to a subset of the extensions supported by the server.
  var invalidExt = requestContext.ext.filter(function (v) {
    return supportedExt.indexOf(v) == -1;
  });

  return Q.Promise(function (resolve, reject) {
    if (requestContext.contentType != "application/vnd.api+json") {
      var message = "The request's Content-Type must be application/vnd.api+json, optionally " + "including an ext parameter whose value is a comma-separated list of " + ("supported extensions, which include: " + supportedExt.join(",") + ".");

      reject(new APIError(415, null, message));
    } else if (invalidExt.length) {
      var message = "You're requesting the following unsupported extensions: " + invalidExt.join(",") + ". " + ("The server supports only the extensions: " + supportedExt.join(",") + ".");

      reject(new APIError(415, null, message));
    } else {
      resolve();
    }
  });
}