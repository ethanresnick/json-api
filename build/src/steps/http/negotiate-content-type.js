"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Q = _interopRequire(require("q"));

var APIError = _interopRequire(require("../../types/APIError"));

var Negotiator = _interopRequire(require("negotiator"));

var parseAccept = _interopRequire(require("../../../lib/accept-parser"));

var arrayValuesMatch = require("../../util/arrays").arrayValuesMatch;

module.exports = function (acceptHeader, usedExt, supportedExt) {
  return Q.Promise(function (resolve, reject) {
    var accepts = parseAccept(acceptHeader || "*/*");
    var negotiator = new Negotiator({ headers: { accept: acceptHeader } });

    // Find all the Accept clauses that specifically reference json api.
    var jsonAPIAcceptsExts = accepts.filter(function (it) {
      return it.type === "application" && it.subtype === "vnd.api+json";
    }).map(function (it) {
      return (
        // and map them to they extensions they ask for, trimming the quotes off
        // of each extension, because the parser's too stupid to do that.
        it.params.ext ? it.params.ext.split(",").map(function (it2) {
          return it2.replace(/^\"+|\"+$/g, "");
        }) : []
      );
    });
    // If we have an Accept clause that asks for JSON-API
    // with exactly the extensions we're using, then we're golden.
    if (jsonAPIAcceptsExts.some(function (it) {
      return arrayValuesMatch(it, usedExt);
    })) {
      var usedExtString = usedExt.length ? "; ext=\"" + usedExt.join(",") + "\"" : "";
      var supportedExtString = "supported-ext=\"" + supportedExt.join(",") + "\"";
      resolve("application/vnd.api+json; " + supportedExtString + "" + usedExtString);
    }

    // Otherwise, if they'll accept json, we're ok.
    else if (negotiator.mediaType(["application/json"])) {
      resolve("application/json");
    }

    // They don't accept json api with our particular extensions,
    // or json in general, so we have to 406.
    else {
      reject(new APIError(406, null, "Not Acceptable"));
    }
  });
};