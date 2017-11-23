"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const Linkage_1 = require("../../types/Linkage");
const Resource_1 = require("../../types/Resource");
const type_handling_1 = require("../../util/type-handling");
const CreateQuery_1 = require("../../types/Query/CreateQuery");
const AddToRelationshipQuery_1 = require("../../types/Query/AddToRelationshipQuery");
const templating = require("url-template");
function default_1(request, registry, makeDoc) {
    const primary = request.primary;
    const type = request.type;
    if (primary instanceof Linkage_1.default) {
        if (!Array.isArray(primary.value)) {
            throw new APIError_1.default(400, undefined, "To add to a to-many relationship, you must POST an array of linkage objects.");
        }
        return new AddToRelationshipQuery_1.default({
            type,
            id: request.idOrIds,
            relationshipName: request.relationship,
            linkage: primary,
            returning: () => ({ status: 204 })
        });
    }
    else {
        const noClientIds = "Client-generated ids are not supported.";
        type_handling_1.forEachResources(primary, (it) => {
            if (it.id)
                throw new APIError_1.default(403, undefined, noClientIds);
        });
        return new CreateQuery_1.default({
            type,
            records: primary,
            returning: (created) => {
                const res = {
                    status: 201,
                    document: makeDoc({ primary: created })
                };
                if (created instanceof Resource_1.default) {
                    const templates = registry.urlTemplates(created.type);
                    const template = templates && templates.self;
                    if (template) {
                        const templateData = Object.assign({ "id": created.id }, created.attrs);
                        res.headers = {
                            Location: templating.parse(template).expand(templateData)
                        };
                    }
                }
                return res;
            }
        });
    }
}
exports.default = default_1;
