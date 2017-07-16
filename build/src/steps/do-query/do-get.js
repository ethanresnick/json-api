"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const arrays_1 = require("../../util/arrays");
function default_1(requestContext, responseContext, registry) {
    let type = requestContext.type;
    let adapter = registry.dbAdapter(type);
    let fields, sorts, includes, filters;
    if (!requestContext.aboutRelationship) {
        fields = parseFields(requestContext.queryParams.fields);
        sorts = parseCommaSeparatedParam(requestContext.queryParams.sort);
        filters = requestContext.queryParams.filter &&
            requestContext.queryParams.filter.simple;
        includes = parseCommaSeparatedParam(requestContext.queryParams.include);
        if (!includes) {
            includes = registry.defaultIncludes(type);
        }
        return adapter
            .find(type, requestContext.idOrIds, fields, sorts, filters, includes)
            .then((resources) => {
            [responseContext.primary, responseContext.included] = resources;
        });
    }
    else {
        if (Array.isArray(requestContext.idOrIds)) {
            throw new APIError_1.default(400, undefined, "You can only request the linkage for one resource at a time.");
        }
        return adapter.find(type, requestContext.idOrIds).spread((resource) => {
            let relationship = resource.relationships &&
                resource.relationships[requestContext.relationship];
            if (!relationship) {
                let title = "Invalid relationship name.";
                let detail = `${requestContext.relationship} is not a valid ` +
                    `relationship name on resources of type '${type}'`;
                throw new APIError_1.default(404, undefined, title, detail);
            }
            responseContext.primary = relationship.linkage;
        });
    }
}
exports.default = default_1;
function parseFields(fieldsParam) {
    let fields;
    if (typeof fieldsParam === "object") {
        fields = {};
        let isField = (it) => !arrays_1.arrayContains(["id", "type"], it);
        for (let type in fieldsParam) {
            let provided = parseCommaSeparatedParam(fieldsParam[type]) || [];
            fields[type] = provided.filter(isField);
        }
    }
    return fields;
}
function parseCommaSeparatedParam(it) {
    return it ? it.split(",").map(decodeURIComponent) : undefined;
}
