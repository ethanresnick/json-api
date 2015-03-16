"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.checkBodyExistence = checkBodyExistence;
exports.checkBodyParsesAsJSON = checkBodyParsesAsJSON;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var Q = _interopRequire(require("q"));

var APIError = _interopRequire(require("../../../types/APIError"));

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

function checkBodyParsesAsJSON(req) {
  return Q.nfcall(bodyParser.json({ type: "*/*" }), req, res).then(function () {}, function (err) {
    switch (err.message) {
      case /encoding unsupported/i:
        reject(new APIError(415, null, err.message));
        break;

      case /empty body/i:
        req.body = null;
        resolve();
        break;

      case /invalid json/i:
        reject(new APIError(400, null, "Request contains invalid JSON."));
        break;

      default:
        if (err instanceof SyntaxError) {
          err.title = "Request contains invalid JSON.";
          err.status = 400;
        }
        reject(new APIError.fromError(err));
    }
  });
}