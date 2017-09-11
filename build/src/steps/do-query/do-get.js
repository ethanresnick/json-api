"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
function default_1(request, response, registry, query) {
    const type = request.type;
    const adapter = registry.dbAdapter(type);
    if (!request.aboutRelationship) {
        return adapter.doQuery(query).then(([primary, included, collectionSizeOrNull]) => {
            response.primary = primary;
            response.included = included;
            if (collectionSizeOrNull != null) {
                response.meta.total = collectionSizeOrNull;
            }
        });
    }
    else {
        return adapter.doQuery(query).then(([resource]) => {
            const relationship = resource.relationships &&
                resource.relationships[request.relationship];
            if (!relationship) {
                const title = "Invalid relationship name.";
                const detail = `${request.relationship} is not a valid ` +
                    `relationship name on resources of type '${type}'`;
                throw new APIError_1.default(404, undefined, title, detail);
            }
            response.primary = relationship.linkage;
        });
    }
}
exports.default = default_1;
