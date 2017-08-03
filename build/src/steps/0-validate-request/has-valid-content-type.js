"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const type_handling_1 = require("../../util/type-handling");
function hasValidContentType({ headers, body }) {
    return Promise.resolve().then(() => {
        if (typeof body === "undefined") {
            return;
        }
        if (typeof headers.contentType === "undefined") {
            throw new APIError_1.default(400, undefined, "Missing Content Type");
        }
        if (headers.contentType.type !== "application/vnd.api+json") {
            const detail = "The request's Content-Type must be application/vnd.api+json, " +
                `but you provided got ${headers.contentType.type}.`;
            throw new APIError_1.default(415, undefined, "Invalid Media Type", detail);
        }
        const typeParams = Object.assign({}, headers.contentType.parameters);
        delete typeParams.charset;
        if (!type_handling_1.objectIsEmpty(headers.contentType.parameters)) {
            const detail = "The request's Content-Type must be application/vnd.api+json, with " +
                "no parameters. But the Content-Type you provided contained the " +
                `parameters: ${Object.keys(typeParams).join(", ")}.`;
            throw new APIError_1.default(415, undefined, "Invalid Media Type Parameter(s)", detail);
        }
        return;
    });
}
exports.default = hasValidContentType;
