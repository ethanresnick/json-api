"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("./Query");
const utils_1 = require("./utils");
class RemoveFromRelationshipQuery extends Query_1.default {
    constructor(opts) {
        super({ type: opts.type });
        utils_1.assertKeysTruthy(["id", "relationshipName"], opts);
        this.query = Object.assign({}, this.query, { id: opts.id, relationshipName: opts.relationshipName, linkage: opts.linkage });
    }
    get id() {
        return this.query.id;
    }
    get relationshipName() {
        return this.query.relationshipName;
    }
    get linkage() {
        return this.query.linkage;
    }
}
exports.default = RemoveFromRelationshipQuery;
