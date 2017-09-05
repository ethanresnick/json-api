import APIError from "../../types/APIError";
import FindQuery from "../../types/Query/FindQuery";
import parseQueryParams from "./parse-query-params";

export default function(request, registry) {
  const type = request.type;
  // Handle fields, sorts, includes and filters.
  if(!request.aboutRelationship) {
    // Attempting to paginate a single resource request
    if(request.queryParams.page && typeof request.idOrIds === 'string') {
      throw new APIError(400, undefined, "Pagination is not supported on requests for a single resource.");
    }

    const {
      include = registry.defaultIncludes(type),
      page: {offset = undefined, limit = undefined} = {},
      fields,
      sort,
      filter
    } = parseQueryParams(request.queryParams);

    return new FindQuery({
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

  // the user's asking for linkage. In this case:
  // - fields don't apply because fields only pick out members of resource
  //   objects, and here we're not returning a resource object;
  // - includes don't apply because the path names for an includes must match
  //   those in the primary data's `links` key, and this primary data doesn't
  //   have a links key.
  // - sorts don't apply beacuse that's only for resource collections.
  else {
    if(request.queryParams.page) {
      throw new APIError(
        400, undefined,
        "Pagination is not supported on requests for resource linkage."
      );
    }

    if(Array.isArray(request.idOrIds)) {
      throw new APIError(
        400, undefined,
        "You can only request the linkage for one resource at a time."
      );
    }

    return new FindQuery({
      type,
      singular: true,
      populates: [],
      idOrIds: request.idOrIds
    });
  }

}
