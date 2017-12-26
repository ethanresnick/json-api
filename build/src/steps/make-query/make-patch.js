"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const Resource_1 = require("../../types/Resource");
const Relationship_1 = require("../../types/Relationship");
const UpdateQuery_1 = require("../../types/Query/UpdateQuery");
const Data_1 = require("../../types/Data");
const ResourceSet_1 = require("../../types/ResourceSet");
function default_1(request, registry, makeDoc) {
    const primary = request.primary;
    const type = request.type;
    let changedResourceData;
    if (!request.aboutRelationship) {
        if (request.id) {
            if (!primary.isSingular) {
                const title = "You can't replace a single resource with a collection.";
                throw new APIError_1.default(400, undefined, title);
            }
            const providedResource = primary.unwrap();
            if (request.id !== (providedResource && providedResource.id)) {
                const title = "The id of the resource you provided doesn't match that in the URL.";
                throw new APIError_1.default(400, undefined, title);
            }
        }
        else if (primary.isSingular) {
            const title = "You must provide an array of resources to do a bulk update.";
            throw new APIError_1.default(400, undefined, title);
        }
        changedResourceData = primary;
    }
    else {
        if (!request.relationship || !request.id) {
            const title = "You must PATCH a relationship endpoint to update relationship's linkage.";
            throw new APIError_1.default(400, undefined, title);
        }
        changedResourceData = Data_1.default.pure(new Resource_1.default(request.type, request.id, undefined, {
            [request.relationship]: Relationship_1.default.of({
                data: request.primary,
                owner: { type: request.type, id: request.id, path: request.relationship }
            })
        }));
    }
    return new UpdateQuery_1.default({
        type,
        patch: changedResourceData,
        returning: (resources) => ({
            document: makeDoc({
                primary: request.aboutRelationship
                    ? resources.unwrap().relationships[request.relationship]
                    : ResourceSet_1.default.of({ data: resources })
            })
        })
    });
}
exports.default = default_1;
