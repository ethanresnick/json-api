import Negotiator = require("negotiator");
import APIError from "../../../types/APIError";
import {objectIsEmpty} from "../../../util/type-handling";

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
export default function(acceptHeader, availableBaseTypes) {
  return new Promise<string>(function(resolve, reject) {
    const negotiator = new Negotiator({headers: {accept: acceptHeader}});
    const hasParams = (it) => !objectIsEmpty(it.parameters);
    const jsonApiBaseType = "application/vnd.api+json";

    // If an endpoint supports JSON API's media type, it implicity
    // supports JSON too. Though we'll only respond with JSON if *necessary*.
    const endpointSupportsJsonApi =
      availableBaseTypes.indexOf(jsonApiBaseType) !== -1;

    const syntheticAvailableBaseTypes = endpointSupportsJsonApi
      ? ["application/json"].concat(availableBaseTypes)
      : availableBaseTypes;

    // Take a first stab at finding the preferred type with negotiator,
    // but then we'll only use that type below if it's *not* json api,
    // because we can't rely on negotiator to reason propery about parameters.
    const acceptables = negotiator.mediaTypes(undefined, {"detailed": true});
    const preferredType = negotiator.mediaType(syntheticAvailableBaseTypes);

    // Find all the Accept clauses that specifically reference json api.
    const jsonApiRanges = acceptables.filter((it) =>
      it.type.toLowerCase() === jsonApiBaseType
    );

    const notAcceptableError =
      new APIError({ status: 406, title: "Not Acceptable" });

    // If we do have JSON API in the Accept header and all instances
    // are parameterized, this is explicitly a 406.
    if(jsonApiRanges.length && jsonApiRanges.every(hasParams)) {
      reject(notAcceptableError);
    }

    // For everything but the JSON API media type, trust
    // negotiator to handle things correctly.
    else if(preferredType && preferredType.toLowerCase() !== jsonApiBaseType) {
      resolve(preferredType);
    }

    // Otherwise, our preferred type is non existent or it's json api and,
    // if it's json api, we have it unparameterized at least once.
    else if(jsonApiRanges.length && endpointSupportsJsonApi) {
      resolve("application/vnd.api+json");
    }
    else {
      reject(notAcceptableError);
    }
  });
}
