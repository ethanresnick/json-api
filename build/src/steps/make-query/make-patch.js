"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const Collection_1 = require("../../types/Collection");
const Resource_1 = require("../../types/Resource");
const Relationship_1 = require("../../types/Relationship");
const Linkage_1 = require("../../types/Linkage");
const UpdateQuery_1 = require("../../types/Query/UpdateQuery");
function default_1(request, registry, makeDoc) {
    const primary = request.primary;
    const type = request.type;
    let changedResourceOrCollection;
    if (primary instanceof Collection_1.default) {
        if (request.idOrIds && !Array.isArray(request.idOrIds)) {
            const title = "You can't replace a single resource with a collection.";
            throw new APIError_1.default(400, undefined, title);
        }
        changedResourceOrCollection = primary;
    }
    else if (primary instanceof Resource_1.default) {
        if (!request.idOrIds) {
            const title = "You must provide an array of resources to do a bulk update.";
            throw new APIError_1.default(400, undefined, title);
        }
        else if (request.idOrIds !== primary.id) {
            const title = "The id of the resource you provided doesn't match that in the URL.";
            throw new APIError_1.default(400, undefined, title);
        }
        changedResourceOrCollection = primary;
    }
    else if (primary instanceof Linkage_1.default) {
        changedResourceOrCollection = new Resource_1.default(request.type, request.idOrIds, undefined, { [request.relationship]: new Relationship_1.default(request.primary) });
    }
    return new UpdateQuery_1.default({
        type,
        patch: changedResourceOrCollection,
        returning: (resources) => ({
            document: makeDoc({
                primary: request.relationship
                    ? resources.relationships[request.relationship].linkage
                    : resources
            })
        })
    });
}
exports.default = default_1;
