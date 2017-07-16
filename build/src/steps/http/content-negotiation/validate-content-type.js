"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contentTypeParser = require("content-type");
const APIError_1 = require("../../../types/APIError");
const type_handling_1 = require("../../../util/type-handling");
function validateContentType(requestContext, supportedExt) {
    return new Promise(function (resolve, reject) {
        let contentType = contentTypeParser.parse(requestContext.contentType);
        delete contentType.parameters.charset;
        if (contentType.type !== "application/vnd.api+json") {
            let detail = "The request's Content-Type must be application/vnd.api+json, " +
                "but you provided " + contentType.type + ".";
            reject(new APIError_1.default(415, undefined, "Invalid Media Type", detail));
        }
        else if (!type_handling_1.objectIsEmpty(contentType.parameters)) {
            let detail = "The request's Content-Type must be application/vnd.api+json, with " +
                "no parameters. But the Content-Type you provided contained the " +
                `parameters: ${Object.keys(contentType.parameters).join(", ")}.`;
            reject(new APIError_1.default(415, undefined, "Invalid Media Type Parameter(s)", detail));
        }
        else {
            resolve();
        }
    });
}
exports.default = validateContentType;
