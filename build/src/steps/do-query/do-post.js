"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const templating = require("url-template");
const APIError_1 = require("../../types/APIError");
const Resource_1 = require("../../types/Resource");
const Linkage_1 = require("../../types/Linkage");
const type_handling_1 = require("../../util/type-handling");
function default_1(requestContext, responseContext, registry) {
    const primary = requestContext.primary;
    const type = requestContext.type;
    const adapter = registry.dbAdapter(type);
    if (primary instanceof Linkage_1.default) {
        if (!Array.isArray(primary.value)) {
            throw new APIError_1.default(400, undefined, "To add to a to-many relationship, you must POST an array of linkage objects.");
        }
        return adapter.addToRelationship(type, requestContext.idOrIds, requestContext.relationship, primary).then(() => {
            responseContext.status = 204;
        });
    }
    else {
        const noClientIds = "Client-generated ids are not supported.";
        type_handling_1.forEachResources(primary, (it) => {
            if (it.id)
                throw new APIError_1.default(403, undefined, noClientIds);
        });
        return adapter.create(type, primary).then((created) => {
            responseContext.primary = created;
            responseContext.status = 201;
            if (created instanceof Resource_1.default) {
                const templates = registry.urlTemplates(created.type);
                const template = templates && templates.self;
                if (template) {
                    const templateData = Object.assign({ "id": created.id }, created.attrs);
                    responseContext.headers.location = templating.parse(template).expand(templateData);
                }
            }
        });
    }
}
exports.default = default_1;
