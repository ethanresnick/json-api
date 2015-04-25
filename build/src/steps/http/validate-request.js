"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

exports.checkBodyExistence = checkBodyExistence;
exports.checkContentType = checkContentType;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var Q = _interopRequire(require("q"));

var APIError = _interopRequire(require("../../types/APIError"));

function checkBodyExistence(requestContext) {
  return Q.Promise(function (resolve, reject) {
    var needsBody = ["post", "patch"].indexOf(requestContext.method) !== -1 || requestContext.method === "delete" && requestContext.aboutLinkObject || requestContext.method === "delete" && !requestContext.idOrIds && requestContext.ext.indexOf("bulk") !== -1;

    if (requestContext.hasBody === needsBody) {
      resolve();
    } else if (needsBody) {
      reject(new APIError(400, undefined, "This request needs a body, but didn't have one."));
    } else {
      reject(new APIError(400, undefined, "This request should not have a body, but does."));
    }
  });
}

function checkContentType(requestContext, supportedExt) {
  // From the spec: The value of the ext media type parameter... MUST
  // be limited to a subset of the extensions supported by the server.
  var invalidExt = requestContext.ext.filter(function (v) {
    return supportedExt.indexOf(v) === -1;
  });

  return Q.Promise(function (resolve, reject) {
    if (requestContext.contentType !== "application/vnd.api+json") {
      var message = "The request's Content-Type must be application/vnd.api+json, " + "optionally including an ext parameter whose value is a comma-separated " + ("list of supported extensions, which include: " + supportedExt.join(",") + ".");

      reject(new APIError(415, null, message));
    } else if (invalidExt.length) {
      var message = "You're requesting the following unsupported extensions: " + ("" + invalidExt.join(",") + ". The server supports only the extensions: ") + ("" + supportedExt.join(",") + ".");

      reject(new APIError(415, null, message));
    } else {
      resolve();
    }
  });
}