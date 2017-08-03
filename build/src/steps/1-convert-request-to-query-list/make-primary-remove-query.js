"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
function default_1(request) {
    return Promise.resolve().then(() => {
        request.frameworkParams.relationship && index_1.assertBodyPresent(request);
        return {};
    });
}
exports.default = default_1;
