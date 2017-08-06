"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const arrays_1 = require("../../util/arrays");
function default_1(requestContext, responseContext, registry) {
    const type = requestContext.type;
    const adapter = registry.dbAdapter(type);
    let fields, sorts, includes, filters, offset, limit;
    if (!requestContext.aboutRelationship) {
        fields = parseFields(requestContext.queryParams.fields);
        sorts = parseCommaSeparatedParam(requestContext.queryParams.sort);
        filters = requestContext.queryParams.filter &&
            requestContext.queryParams.filter.simple;
        includes = parseCommaSeparatedParam(requestContext.queryParams.include);
        if (!includes) {
            includes = registry.defaultIncludes(type);
        }
        if (requestContext.queryParams.page && typeof requestContext.idOrIds === 'string') {
            throw new APIError_1.default(400, undefined, "Pagination is not supported on requests for a single resource.");
        }
        else if (requestContext.queryParams.page) {
            offset = parseIntegerParam(requestContext.queryParams.page.offset);
            limit = parseIntegerParam(requestContext.queryParams.page.limit);
        }
        return adapter
            .find(type, requestContext.idOrIds, fields, sorts, filters, includes, offset, limit)
            .then(([primary, included, collectionSizeOrNull]) => {
            responseContext.primary = primary;
            responseContext.included = included;
            if (collectionSizeOrNull != null) {
                responseContext.meta.total = collectionSizeOrNull;
            }
        });
    }
    else {
        if (requestContext.queryParams.page) {
            throw new APIError_1.default(400, undefined, "Pagination is not supported on requests for resource linkage.");
        }
        if (Array.isArray(requestContext.idOrIds)) {
            throw new APIError_1.default(400, undefined, "You can only request the linkage for one resource at a time.");
        }
        return adapter.find(type, requestContext.idOrIds).spread((resource) => {
            const relationship = resource.relationships &&
                resource.relationships[requestContext.relationship];
            if (!relationship) {
                const title = "Invalid relationship name.";
                const detail = `${requestContext.relationship} is not a valid ` +
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
        const isField = (it) => !arrays_1.arrayContains(["id", "type"], it);
        for (const type in fieldsParam) {
            const provided = parseCommaSeparatedParam(fieldsParam[type]) || [];
            fields[type] = provided.filter(isField);
        }
    }
    return fields;
}
function parseCommaSeparatedParam(it) {
    return it ? it.split(",").map(decodeURIComponent) : undefined;
}
function parseIntegerParam(it) {
    return it ? parseInt(it, 10) : undefined;
}
