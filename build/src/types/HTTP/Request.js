"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_handling_1 = require("../../util/type-handling");
class Request {
    constructor() {
        this.hasBody = null;
        this.needsBody = null;
        Object.defineProperty(this, "body", { writable: true, enumerable: true });
        this.method = null;
        this.uri = null;
        this.contentType = null;
        this.accepts = null;
        this.ext = [];
        this.allowLabel = false;
        this.idOrIds = null;
        this.type = null;
        this.relationship = null;
        this.aboutRelationship = false;
        this.primary = null;
        this.queryParams = {};
        Object.defineProperty(this, "rawQueryString", { writable: true, enumerable: true });
    }
}
exports.Request = Request;
exports.default = type_handling_1.ValueObject(Request);
