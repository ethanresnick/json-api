import APIError from "../../types/APIError";
import {arrayContains} from "../../util/arrays";

export default function(requestContext, responseContext, registry) {
  const type    = requestContext.type;
  const adapter = registry.dbAdapter(type);
  let fields, sorts, includes, filters, offset, limit;

  // Handle fields, sorts, includes and filters.
  if(!requestContext.aboutRelationship) {
    fields = parseFields(requestContext.queryParams.fields);
    sorts  = parseCommaSeparatedParam(requestContext.queryParams.sort);
    // just support a "simple" filtering strategy for now.
    filters = requestContext.queryParams.filter &&
                requestContext.queryParams.filter.simple;
    includes = parseCommaSeparatedParam(requestContext.queryParams.include);

    if(!includes) {
      includes = registry.defaultIncludes(type);
    }

    // Attempting to paginate a single resource request
    if(requestContext.queryParams.page && typeof requestContext.idOrIds === 'string') {
      throw new APIError(400, undefined, "Pagination is not supported on requests for a single resource.");
    }

    else if(requestContext.queryParams.page) {
      offset = parseIntegerParam(requestContext.queryParams.page.offset);
      limit = parseIntegerParam(requestContext.queryParams.page.limit);
    }

    return adapter
      .find(type, requestContext.idOrIds, fields, sorts, filters, includes, offset, limit)
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

function parseFields(fieldsParam) {
  let fields;
  if(typeof fieldsParam === "object") {
    fields = {};
    const isField = (it) => !arrayContains(["id", "type"], it);

    for(const type in fieldsParam) {
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
