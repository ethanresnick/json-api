"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
function default_1(requestContext, responseContext, registry, query) {
    const type = requestContext.type;
    const adapter = registry.dbAdapter(type);
    if (!requestContext.aboutRelationship) {
        return adapter.doQuery(query).then(([primary, included, collectionSizeOrNull]) => {
            responseContext.primary = primary;
            responseContext.included = included;
            if (collectionSizeOrNull != null) {
                responseContext.meta.total = collectionSizeOrNull;
            }
        });
    }
    else {
        return adapter.doQuery(query).then(([resource]) => {
            const relationship = resource.relationships &&
                resource.relationships[requestContext.relationship];
            if (!relationship) {
                const title = "Invalid relationship name.";
                const detail = `${requestContext.relationship} is not a valid ` +
                    `relationship name on resources of type '${type}'`;
                throw new APIError_1.default(404, undefined, title, detail);
            }
            responseContext.primary = relationship.linkage;
        });
    }
}
exports.default = default_1;
