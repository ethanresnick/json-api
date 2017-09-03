"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const templating = require("url-template");
const Resource_1 = require("../../types/Resource");
const AddToRelationshipQuery_1 = require("../../types/Query/AddToRelationshipQuery");
function default_1(requestContext, responseContext, registry, query) {
    const type = requestContext.type;
    const adapter = registry.dbAdapter(type);
    if (query instanceof AddToRelationshipQuery_1.default) {
        return adapter.doQuery(query).then(() => {
            responseContext.status = 204;
        });
    }
    return adapter.doQuery(query).then((created) => {
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
exports.default = default_1;
