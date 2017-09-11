"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(request, response, registry, query) {
    const type = request.type;
    const adapter = registry.dbAdapter(type);
    return adapter.doQuery(query).then((resources) => {
        response.primary = (request.relationship)
            ? resources.relationships[request.relationship].linkage
            : resources;
    });
}
exports.default = default_1;
