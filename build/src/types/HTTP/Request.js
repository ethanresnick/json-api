"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    }
}
exports.default = Request;
