"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const FindQuery_1 = require("../../types/Query/FindQuery");
const parse_query_params_1 = require("./parse-query-params");
function default_1(request, registry) {
    const type = request.type;
    if (!request.aboutRelationship) {
        if (request.queryParams.page && typeof request.idOrIds === 'string') {
            throw new APIError_1.default(400, undefined, "Pagination is not supported on requests for a single resource.");
        }
        const { include = registry.defaultIncludes(type), page: { offset = undefined, limit = undefined } = {}, fields, sort, filter } = parse_query_params_1.default(request.queryParams);
        return new FindQuery_1.default({
            type,
            idOrIds: request.idOrIds,
            populates: include,
            select: fields,
            sort,
            filters: filter,
            offset,
            limit
        });
    }
    else {
        if (request.queryParams.page) {
            throw new APIError_1.default(400, undefined, "Pagination is not supported on requests for resource linkage.");
        }
        if (Array.isArray(request.idOrIds)) {
            throw new APIError_1.default(400, undefined, "You can only request the linkage for one resource at a time.");
        }
        return new FindQuery_1.default({
            type,
            singular: true,
            populates: [],
            idOrIds: request.idOrIds
        });
    }
}
exports.default = default_1;
