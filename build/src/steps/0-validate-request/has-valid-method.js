"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const index_1 = require("../../types/index");
function hasValidMethod({ method }) {
    if (index_1.requestValidMethods.indexOf(method) === -1) {
        const detail = `The method "${method}" is not supported.` +
            (method === "put" ? " See http://jsonapi.org/faq/#wheres-put" : "");
        return Promise.reject(new APIError_1.default(405, undefined, "Method not supported.", detail));
    }
    return Promise.resolve();
}
exports.default = hasValidMethod;
