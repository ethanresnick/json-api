"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("./Query");
const utils_1 = require("./utils");
class RemoveFromRelationshipQuery extends Query_1.default {
    constructor(opts) {
        super({ using: opts.using });
        utils_1.assertKeysTruthy(["resourceId", "relationshipName"], opts);
        this.query = Object.assign({}, this.query, { resourceId: opts.resourceId, relationshipName: opts.relationshipName, linkage: opts.linkage });
    }
    get resourceId() {
        return this.query.resourceId;
    }
    get relationshipName() {
        return this.query.relationshipName;
    }
    get linkage() {
        return this.query.linkage;
    }
}
exports.default = RemoveFromRelationshipQuery;
