"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const Negotiator = require("negotiator");
const APIError_1 = require("../../../types/APIError");
const type_handling_1 = require("../../../util/type-handling");
function default_1(acceptHeader, availableBaseTypes) {
    return Q.Promise(function (resolve, reject) {
        const negotiator = new Negotiator({ headers: { accept: acceptHeader } });
        const hasParams = (it) => !type_handling_1.objectIsEmpty(it.parameters);
        const endpointSupportsJsonApi = availableBaseTypes.indexOf("application/vnd.api+json") !== -1;
        const syntheticAvailableBaseTypes = endpointSupportsJsonApi
            ? ["application/json"].concat(availableBaseTypes)
            : availableBaseTypes;
        const acceptables = negotiator.mediaTypes(undefined, { "detailed": true });
        const preferredType = negotiator.mediaType(syntheticAvailableBaseTypes);
        const jsonApiRanges = acceptables.filter((it) => it.type.toLowerCase() === "application/vnd.api+json");
        if (jsonApiRanges.length && jsonApiRanges.every(hasParams)) {
            reject(new APIError_1.default(406, null, "Not Acceptable"));
        }
        else if (preferredType.toLowerCase() !== "application/vnd.api+json") {
            resolve(preferredType);
        }
        else if (jsonApiRanges.length && endpointSupportsJsonApi) {
            resolve("application/vnd.api+json");
        }
        else {
            reject(new APIError_1.default(406, null, "Not Acceptable"));
        }
    });
}
exports.default = default_1;
