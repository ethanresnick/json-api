"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const Collection_1 = require("../../types/Collection");
function default_1(request, response, registry) {
    let type = request.type;
    let adapter = registry.dbAdapter(type);
    if (request.aboutRelationship) {
        if (Array.isArray(request.idOrIds)) {
            throw new APIError_1.default(400, undefined, "You can only remove resources from the linkage of one resource at a time.");
        }
        return adapter.removeFromRelationship(type, request.idOrIds, request.relationship, request.primary).then(() => {
            response.status = 204;
        });
    }
    else if (!request.idOrIds && request.ext.indexOf("bulk") !== -1) {
        if (!(request.primary instanceof Collection_1.default)) {
            let title = "You must provide an array of objects to do a bulk delete.";
            throw new APIError_1.default(400, undefined, title);
        }
        if (!request.primary.resources.every((it) => typeof it.id !== "undefined")) {
            let title = "Every object provided for a bulk delete must contain a `type` and `id`.";
            throw new APIError_1.default(400, undefined, title);
        }
        let ids = request.primary.resources.map((it) => it.id);
        return adapter.delete(request.type, ids).then(() => {
            response.status = 204;
        });
    }
    else {
        return adapter.delete(type, request.idOrIds).then(() => {
            response.status = 204;
        });
    }
}
exports.default = default_1;
