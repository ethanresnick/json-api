"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const CreateQuery_1 = require("../../types/Query/CreateQuery");
const AddToRelationshipQuery_1 = require("../../types/Query/AddToRelationshipQuery");
const ResourceSet_1 = require("../../types/ResourceSet");
const templating = require("url-template");
function default_1(request, registry, makeDoc) {
    const primary = request.primary;
    const type = request.type;
    if (request.aboutRelationship) {
        if (request.primary.isSingular) {
            throw new APIError_1.default(400, undefined, "To add to a to-many relationship, you must POST an array of linkage objects.");
        }
        if (!request.id || !request.relationship) {
            throw new APIError_1.default(400, undefined, "To add linkage to a relationship, you must POST to a relationship endpoint.");
        }
        return new AddToRelationshipQuery_1.default({
            type,
            id: request.id,
            relationshipName: request.relationship,
            linkage: primary,
            returning: () => ({ status: 204 })
        });
    }
    else {
        if (primary.some(it => !!it.id)) {
            throw new APIError_1.default(403, undefined, "Client-generated ids are not supported.");
        }
        return new CreateQuery_1.default({
            type,
            records: primary,
            returning: (created) => {
                const res = {
                    status: 201,
                    document: makeDoc({ primary: ResourceSet_1.default.of({ data: created }) })
                };
                if (created.isSingular) {
                    const createdResource = created.unwrap();
                    const { self: selfTemplate = undefined } = (registry.urlTemplates(createdResource.type) || {});
                    if (selfTemplate) {
                        res.headers = {
                            Location: templating.parse(selfTemplate).expand(Object.assign({ "id": createdResource.id }, createdResource.attrs))
                        };
                    }
                }
                return res;
            }
        });
    }
}
exports.default = default_1;
