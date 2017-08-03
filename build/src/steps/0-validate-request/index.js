"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const has_valid_method_1 = require("./has-valid-method");
const has_valid_content_type_1 = require("./has-valid-content-type");
const has_valid_jsonapi_doc_body_1 = require("./has-valid-jsonapi-doc-body");
function default_1(extraRequestValidators = []) {
    return function (request) {
        return Promise.all([
            has_valid_method_1.default(request),
            has_valid_content_type_1.default(request),
            has_valid_jsonapi_doc_body_1.default(request),
            ...extraRequestValidators.map(f => f(request))
        ]).then(() => request);
    };
}
exports.default = default_1;
