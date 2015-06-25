"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _negotiator = require("negotiator");

var _negotiator2 = _interopRequireDefault(_negotiator);

var _typesAPIError = require("../../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

var _utilTypeHandling = require("../../../util/type-handling");

/**
 * Negotiate the Content-Type to use for the response.
 *
 * More arguments may be added to the function later to support
 * negotiating on parameters for extensions.
 *
 * @param {String} acceptHeader The raw `Accept` header string from the client.
 * @param {Array[String]} availableBaseTypes A list of "type/subtype"
 *    representations, without that the server can produce for the
 *    requested resource.
 * @return {Promise} A Promise that resolves to the Content-Type to use,
 *    or false if no acceptable one exists.
 */

exports["default"] = function (acceptHeader, availableBaseTypes) {
  return _q2["default"].Promise(function (resolve, reject) {
    var negotiator = new _negotiator2["default"]({ headers: { accept: acceptHeader } });
    var hasParams = function hasParams(it) {
      return !(0, _utilTypeHandling.objectIsEmpty)(it.parameters);
    };

    // If an endpoint supports JSON API's media type, it implicity
    // supports JSON too. Though we'll only respond with JSON if *necessary*.
    var endpointSupportsJsonApi = availableBaseTypes.indexOf("application/vnd.api+json") !== -1;
    var syntheticAvailableBaseTypes = endpointSupportsJsonApi ? ["application/json"].concat(availableBaseTypes) : availableBaseTypes;

    // Take a first stab at finding the preferred type with negotiator,
    // but then we'll only use that type below if it's *not* json api,
    // because we can't rely on negotiator to reason propery about parameters.
    var acceptables = negotiator.mediaTypes(undefined, { "detailed": true });
    var preferredType = negotiator.mediaType(syntheticAvailableBaseTypes);

    // Find all the Accept clauses that specifically reference json api.
    var jsonApiRanges = acceptables.filter(function (it) {
      return it.type.toLowerCase() === "application/vnd.api+json";
    });

    // If we do have JSON API in the Accept header and all instances
    // are parameterized, this is explicitly a 406.
    if (jsonApiRanges.length && jsonApiRanges.every(hasParams)) {
      reject(new _typesAPIError2["default"](406, null, "Not Acceptable"));
    }

    // For everything but the JSON API media type, trust
    // negotiator to handle things correctly.
    else if (preferredType.toLowerCase() !== "application/vnd.api+json") {
      resolve(preferredType);
    }

    // Otherwise, our preferred type is non existent or json api and, if it's
    // json api, we have it unparameterized at least once.
    else if (jsonApiRanges.length && endpointSupportsJsonApi) {
      resolve("application/vnd.api+json");
    } else {
      reject(new _typesAPIError2["default"](406, null, "Not Acceptable"));
    }
  });
};

module.exports = exports["default"];