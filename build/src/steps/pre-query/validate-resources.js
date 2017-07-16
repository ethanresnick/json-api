"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_handling_1 = require("../../util/type-handling");
const misc_1 = require("../../util/misc");
const APIError_1 = require("../../types/APIError");
function default_1(endpointParentType, resourceOrCollection, registry) {
    return new Promise(function (resolve, reject) {
        const adapter = registry.dbAdapter(endpointParentType);
        const allowedTypes = adapter.getTypesAllowedInCollection(endpointParentType);
        const resourcesByType = type_handling_1.groupResourcesByType(resourceOrCollection);
        if (!misc_1.isSubsetOf(allowedTypes, Object.keys(resourcesByType))) {
            let title = "Some of the resources you provided are of a type that " +
                "doesn't belong in this collection.";
            let detail = `Valid types for this collection are: ${allowedTypes.join(", ")}.`;
            reject(new APIError_1.default(400, undefined, title, detail));
        }
        else {
            for (let type in resourcesByType) {
                let resources = resourcesByType[type];
                let relationshipNames = adapter.getRelationshipNames(type);
                let invalid = resources.some((resource) => {
                    return relationshipNames.some((relationshipName) => {
                        return typeof resource.attrs[relationshipName] !== "undefined";
                    });
                });
                if (invalid) {
                    let title = "Relationship fields must be specified under the `relationships` key.";
                    return reject(new APIError_1.default(400, undefined, title));
                }
            }
            return resolve(undefined);
        }
    });
}
exports.default = default_1;
