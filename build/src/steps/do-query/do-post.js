"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const templating = require("url-template");
const Resource_1 = require("../../types/Resource");
const AddToRelationshipQuery_1 = require("../../types/Query/AddToRelationshipQuery");
function default_1(request, response, registry, query) {
    const type = request.type;
    const adapter = registry.dbAdapter(type);
    if (query instanceof AddToRelationshipQuery_1.default) {
        return adapter.doQuery(query).then(() => {
            response.status = 204;
        });
    }
    return adapter.doQuery(query).then((created) => {
        response.primary = created;
        response.status = 201;
        if (created instanceof Resource_1.default) {
            const templates = registry.urlTemplates(created.type);
            const template = templates && templates.self;
            if (template) {
                const templateData = Object.assign({ "id": created.id }, created.attrs);
                response.headers.location = templating.parse(template).expand(templateData);
            }
        }
    });
}
exports.default = default_1;
