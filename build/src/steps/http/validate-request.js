"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
function checkBodyExistence(requestContext) {
    return new Promise(function (resolve, reject) {
        let needsBody = ["post", "patch"].indexOf(requestContext.method) !== -1 ||
            (requestContext.method === "delete" && requestContext.aboutRelationship) ||
            (requestContext.method === "delete" && !requestContext.idOrIds && requestContext.ext.indexOf("bulk") !== -1);
        if (requestContext.hasBody === needsBody) {
            resolve();
        }
        else if (needsBody) {
            reject(new APIError_1.default(400, undefined, "This request needs a body, but didn't have one."));
        }
        else {
            reject(new APIError_1.default(400, undefined, "This request should not have a body, but does."));
        }
    });
}
exports.checkBodyExistence = checkBodyExistence;
function checkMethod({ method }) {
    if (["patch", "post", "delete", "get"].indexOf(method) === -1) {
        let detail = `The method "${method}" is not supported.` + (method === "put" ? " See http://jsonapi.org/faq/#wheres-put" : "");
        return Promise.reject(new APIError_1.default(405, undefined, "Method not supported.", detail));
    }
    else {
        return Promise.resolve();
    }
}
exports.checkMethod = checkMethod;
