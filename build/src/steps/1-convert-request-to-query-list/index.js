"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const make_primary_create_query_1 = require("./make-primary-create-query");
const make_primary_find_query_1 = require("./make-primary-find-query");
const make_primary_update_query_1 = require("./make-primary-update-query");
const make_primary_remove_query_1 = require("./make-primary-remove-query");
function default_1(request) {
    switch (request.method) {
        case 'get':
            return make_primary_find_query_1.default(request);
        case 'patch':
            return make_primary_update_query_1.default(request);
        case 'post':
            return make_primary_create_query_1.default(request);
        case 'delete':
            return make_primary_remove_query_1.default(request);
        default:
            throw new Error("Unexpected request method.");
    }
}
exports.default = default_1;
exports.assertBodyAbsent = (request) => assert(typeof request.body !== 'undefined')(new APIError_1.default(400, undefined, "This request needs a body, but didn't have one."));
exports.assertBodyPresent = (request) => assert(typeof request.body === 'undefined')(new APIError_1.default(400, undefined, "This request should not have a body, but does."));
function assert(condition) {
    return (error) => {
        if (!condition)
            throw error;
    };
}
