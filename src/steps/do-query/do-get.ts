import APIError from "../../types/APIError";
import parseQueryParams from "../../util/parse-query-params";

export default function(requestContext, responseContext, registry) {
  const type    = requestContext.type;
  const adapter = registry.dbAdapter(type);

  // Handle fields, sorts, includes and filters.
  if(!requestContext.aboutRelationship) {
    // Attempting to paginate a single resource request
    if(requestContext.queryParams.page && typeof requestContext.idOrIds === 'string') {
      throw new APIError(400, undefined, "Pagination is not supported on requests for a single resource.");
    }

    const {
      include = registry.defaultIncludes(type),
      page: {offset = undefined, limit = undefined} = {},
      fields,
      sort
    } = parseQueryParams(requestContext.queryParams);

    // just support a "simple" filtering strategy for now.
    const filters = requestContext.queryParams.filter &&
      requestContext.queryParams.filter.simple;

    return adapter
      .find(type, requestContext.idOrIds, fields, sort, filters, include, offset, limit)
      .then(([primary, included, collectionSizeOrNull]) => {
        responseContext.primary = primary;
        responseContext.included = included;
        if(collectionSizeOrNull != null) {
          responseContext.meta.total = collectionSizeOrNull;
        }
      });
  }

  // the user's asking for linkage. In this case:
  // - fields don't apply because fields only pick out members of resource
  //   objects, and here we're not returning a resource object;
  // - includes don't apply because the path names for an includes must match
  //   those in the primary data's `links` key, and this primary data doesn't
  //   have a links key.
  // - sorts don't apply beacuse that's only for resource collections.
  else {
    if(requestContext.queryParams.page) {
      throw new APIError(400, undefined, "Pagination is not supported on requests for resource linkage.");
    }

    if(Array.isArray(requestContext.idOrIds)) {
      throw new APIError(
        400, undefined,
        "You can only request the linkage for one resource at a time."
      );
    }

    return adapter.find(type, requestContext.idOrIds).spread((resource) => {
      // 404 if the requested relationship is not a relationship path. Doing
      // it here is more accurate than using adapter.getRelationshipNames,
      // since we're allowing for paths that can optionally hold linkage,
      // which getRelationshipNames doesn't return.
      const relationship = resource.relationships &&
        resource.relationships[requestContext.relationship];

      if(!relationship) {
        const title = "Invalid relationship name.";
        const detail = `${requestContext.relationship} is not a valid ` +
                     `relationship name on resources of type '${type}'`;

        throw new APIError(404, undefined, title, detail);
      }

      responseContext.primary = relationship.linkage;
    });
  }

}
