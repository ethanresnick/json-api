"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_handling_1 = require("../../util/type-handling");
let propDesc = { writable: true, enumerable: true };
class Response {
    constructor() {
        this.ext = [];
        this.errors = [];
        this.contentType = null;
        this.headers = {};
        this.status = null;
        this.body = null;
        Object.defineProperty(this, "primary", propDesc);
        Object.defineProperty(this, "included", propDesc);
        Object.defineProperty(this, "links", propDesc);
        Object.defineProperty(this, "meta", propDesc);
    }
}
exports.Response = Response;
exports.default = type_handling_1.ValueObject(Response);
