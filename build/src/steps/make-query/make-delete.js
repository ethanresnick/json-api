"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const Collection_1 = require("../../types/Collection");
const DeleteQuery_1 = require("../../types/Query/DeleteQuery");
const RemoveFromRelationshipQuery_1 = require("../../types/Query/RemoveFromRelationshipQuery");
function default_1(request, registry) {
    const type = request.type;
    if (request.aboutRelationship) {
        if (Array.isArray(request.idOrIds)) {
            throw new APIError_1.default(400, undefined, "You can only remove resources from the linkage of one resource at a time.");
        }
        return new RemoveFromRelationshipQuery_1.default({
            type: type,
            id: request.idOrIds,
            relationshipName: request.relationship,
            linkage: request.primary
        });
    }
    const bulkDelete = !request.idOrIds;
    if (bulkDelete) {
        if (!(request.primary instanceof Collection_1.default)) {
            const title = "You must provide an array of objects to do a bulk delete.";
            throw new APIError_1.default(400, undefined, title);
        }
        if (!request.primary.resources.every((it) => typeof it.id !== "undefined")) {
            const title = "Every object provided for a bulk delete must contain a `type` and `id`.";
            throw new APIError_1.default(400, undefined, title);
        }
    }
    return new DeleteQuery_1.default({
        type,
        idOrIds: bulkDelete
            ? request.primary.resources.map((it) => it.id)
            : request.idOrIds
    });
}
exports.default = default_1;
