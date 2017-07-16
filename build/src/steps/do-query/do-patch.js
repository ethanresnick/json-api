"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const Collection_1 = require("../../types/Collection");
const Resource_1 = require("../../types/Resource");
const Relationship_1 = require("../../types/Relationship");
const Linkage_1 = require("../../types/Linkage");
function default_1(requestContext, responseContext, registry) {
    const primary = requestContext.primary;
    const type = requestContext.type;
    const adapter = registry.dbAdapter(type);
    let changedResourceOrCollection;
    if (primary instanceof Collection_1.default) {
        if (requestContext.idOrIds && !Array.isArray(requestContext.idOrIds)) {
            let title = "You can't replace a single resource with a collection.";
            throw new APIError_1.default(400, undefined, title);
        }
        changedResourceOrCollection = primary;
    }
    else if (primary instanceof Resource_1.default) {
        if (!requestContext.idOrIds) {
            let title = "You must provide an array of resources to do a bulk update.";
            throw new APIError_1.default(400, undefined, title);
        }
        else if (requestContext.idOrIds !== primary.id) {
            let title = "The id of the resource you provided doesn't match that in the URL.";
            throw new APIError_1.default(400, undefined, title);
        }
        changedResourceOrCollection = primary;
    }
    else if (primary instanceof Linkage_1.default) {
        changedResourceOrCollection = new Resource_1.default(requestContext.type, requestContext.idOrIds, undefined, { [requestContext.relationship]: new Relationship_1.default(requestContext.primary) });
    }
    return adapter.update(type, changedResourceOrCollection).then((resources) => {
        responseContext.primary = (primary instanceof Linkage_1.default) ?
            resources.relationships[requestContext.relationship].linkage :
            resources;
    });
}
exports.default = default_1;
