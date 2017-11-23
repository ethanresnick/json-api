"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const FindQuery_1 = require("../../types/Query/FindQuery");
function default_1(request, registry, makeDoc) {
    const type = request.type;
    if (!request.aboutRelationship) {
        if (request.queryParams.page && typeof request.idOrIds === 'string') {
            throw new APIError_1.default(400, undefined, "Pagination is not supported on requests for a single resource.");
        }
        const { include = registry.defaultIncludes(type), page: { offset = undefined, limit = undefined } = {}, fields, sort, filter } = request.queryParams;
        return new FindQuery_1.default({
            type,
            idOrIds: request.idOrIds,
            populates: include,
            select: fields,
            sort,
            filters: filter,
            offset,
            limit,
            returning: ([primary, included, collectionSizeOrNull]) => ({
                document: makeDoc(Object.assign({ primary,
                    included }, (collectionSizeOrNull != null
                    ? { meta: { total: collectionSizeOrNull } }
                    : {})))
            })
        });
    }
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
        idOrIds: request.idOrIds,
        returning([resource]) {
            const relationship = resource.relationships &&
                resource.relationships[request.relationship];
            if (!relationship) {
                const title = "Invalid relationship name.";
                const detail = `${request.relationship} is not a valid ` +
                    `relationship name on resources of type '${type}'`;
                return {
                    status: 404,
                    document: makeDoc({
                        primary: [new APIError_1.default(404, undefined, title, detail)]
                    })
                };
            }
            return {
                document: makeDoc({ primary: relationship.linkage })
            };
        }
    });
}
exports.default = default_1;
