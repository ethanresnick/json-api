import APIError from "../../types/APIError";
import {arrayContains} from "../../util/arrays";
import camelize from "../../util/camelize";

export default function(requestContext, responseContext, registry) {
  let type    = requestContext.type;
  let adapter = registry.dbAdapter(type);
  let fields, sorts, includes, filters;

  // Handle fields, sorts, includes and filters.
  if(!requestContext.aboutRelationship) {
    fields = parseFields(requestContext.queryParams.fields, registry);
    sorts  = parseCommaSeparatedParam(requestContext.queryParams.sort, type, registry);
    // just support a "simple" filtering strategy for now.
    filters = requestContext.queryParams.filter &&
              transformFilters(requestContext.queryParams.filter.simple, type, registry);
    includes = parseCommaSeparatedParam(requestContext.queryParams.include, type, registry);

    if(!includes) {
      includes = registry.defaultIncludes(type);
    }

    return adapter
      .find(type, requestContext.idOrIds, fields, sorts, filters, includes)
      .then((resources) => {
        [responseContext.primary, responseContext.included] = resources;
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
      let relationship = resource.relationships &&
        resource.relationships[requestContext.relationship];

      if(!relationship) {
        let title = "Invalid relationship name.";
        let detail = `${requestContext.relationship} is not a valid ` +
                     `relationship name on resources of type '${type}'`;

        throw new APIError(404, undefined, title, detail);
      }

      responseContext.primary = relationship.linkage;
    });
  }

}

function parseFields(fieldsParam, registry) {
  let fields;
  if(typeof fieldsParam === "object") {
    fields = {};
    let isField = (it) => !arrayContains(["id", "type"], it);

    for(let type in fieldsParam) {
      let provided = parseCommaSeparatedParam(fieldsParam[type], type, registry) || [];
      fields[type] = provided.filter(isField);
    }
  }
  return fields;
}

function parseCommaSeparatedParam(it, type, registry) {
  return it ? it.split(",").map(f => {
    return transformDotSeparatedPath(f, type, registry);
  }) : undefined;
}

function transformDotSeparatedPath(it, type, registry) {
  let parts = it.split(".");
  let types = [type];
  parts.forEach((p, index) => {
    if (index < parts.length - 1) {
      types.push(registry.dbAdapter(types[index]).constructor.getReferencedType(types[index], p));
    }
  });

  return parts.map((part, index) => {
    if (shouldCamelizeType(types[index], registry)) {
      return camelize(decodeURIComponent(part));
    }
    return decodeURIComponent(part);
  }).join(".");
}

function transformFilters(it, type, registry) {
  if (shouldCamelizeType(type, registry)) {
    for (let key in it) {
      let camelizedKey = camelize(key);
      if (camelizedKey !== key) {
        it[camelizedKey] = it[key];
        delete it[key];
      }
    }
  }
  return it;
}

function shouldCamelizeType(type, registry) {
  return registry.behaviors(type).dasherizeOutput.enabled;
}
