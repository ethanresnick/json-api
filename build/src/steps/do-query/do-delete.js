"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(request, response, registry, query) {
    const type = request.type;
    const adapter = registry.dbAdapter(type);
    return adapter.doQuery(query).then(() => {
        response.status = 204;
    });
}
exports.default = default_1;
