"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const DeleteQuery_1 = require("../../types/Query/DeleteQuery");
const RemoveFromRelationshipQuery_1 = require("../../types/Query/RemoveFromRelationshipQuery");
function default_1(request, registry, makeDoc) {
    const type = request.type;
    const primary = request.document && request.document.primary._data;
    if (request.aboutRelationship) {
        if (!request.id || !request.relationship) {
            throw new APIError_1.default(400, undefined, "To remove linkage from a relationship, you must send your request to a relationship endpoint.");
        }
        return new RemoveFromRelationshipQuery_1.default({
            type: type,
            id: request.id,
            relationshipName: request.relationship,
            linkage: primary.values,
            returning: () => ({ status: 204 })
        });
    }
    const bulkDelete = !request.id;
    if (bulkDelete) {
        if (!primary) {
            throw new Error("Bulk delete without a body is not possible.");
        }
        if (primary.isSingular) {
            const title = "You must provide an array of resource identifier objects to do a bulk delete.";
            throw new APIError_1.default(400, undefined, title);
        }
    }
    return new DeleteQuery_1.default({
        type,
        returning: () => ({ status: 204 }),
        [bulkDelete ? 'ids' : 'id']: bulkDelete
            ? primary.map((it) => it.id).values
            : request.id
    });
}
exports.default = default_1;
