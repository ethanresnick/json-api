"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(requestContext, responseContext, registry, query) {
    const type = requestContext.type;
    const adapter = registry.dbAdapter(type);
    return adapter.doQuery(query).then((resources) => {
        responseContext.primary = (requestContext.relationship)
            ? resources.relationships[requestContext.relationship].linkage
            : resources;
    });
}
exports.default = default_1;
