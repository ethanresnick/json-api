"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const Linkage_1 = require("../../types/Linkage");
const type_handling_1 = require("../../util/type-handling");
const CreateQuery_1 = require("../../types/Query/CreateQuery");
const AddToRelationshipQuery_1 = require("../../types/Query/AddToRelationshipQuery");
function default_1(request, registry) {
    const primary = request.primary;
    const type = request.type;
    if (primary instanceof Linkage_1.default) {
        if (!Array.isArray(primary.value)) {
            throw new APIError_1.default(400, undefined, "To add to a to-many relationship, you must POST an array of linkage objects.");
        }
        return new AddToRelationshipQuery_1.default({
            using: type,
            resourceId: request.idOrIds,
            relationshipName: request.relationship,
            linkage: primary
        });
    }
    else {
        const noClientIds = "Client-generated ids are not supported.";
        type_handling_1.forEachResources(primary, (it) => {
            if (it.id)
                throw new APIError_1.default(403, undefined, noClientIds);
        });
        return new CreateQuery_1.default({
            using: type,
            records: primary
        });
    }
}
exports.default = default_1;
