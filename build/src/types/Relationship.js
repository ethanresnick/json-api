"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Relationship {
    constructor(linkage, relatedURITemplate = undefined, selfURITemplate = undefined) {
        Object.assign(this, { linkage, relatedURITemplate, selfURITemplate });
    }
    empty() {
        if (!this.linkage) {
            throw new Error("Relationship has no linkage");
        }
        this.linkage.empty();
    }
}
exports.default = Relationship;
