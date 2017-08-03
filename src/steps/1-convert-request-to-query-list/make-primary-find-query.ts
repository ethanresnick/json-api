import parseQueryParams from "./parse-query-params";
import constructIdCriteria from "./construct-id-criteria";
import { assertBodyAbsent } from "./index";
import APIError from "../../types/APIError";
import { arrayContains } from "../../util/arrays";
import { ValidatedRequest, Query, QueryFindResult, Constraint, ForbiddenCriteria } from "../../types";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";

export default async function(request: ValidatedRequest, registry: ResourceTypeRegistry): Promise<Query> {
  assertBodyAbsent(request);
  const type = request.frameworkParams.type;
  const adapter = registry.dbAdapter(type);
  const model = adapter.getModel(type);
  const schema = .constructor.getStandardizedSchema()
  
  const { fields, sort, include /* filter */ } = await parseQueryParams(request);
  const { criteria: idCriteria, resultIsSingular } = await constructIdCriteria(request, registry);

  const fieldsQuery = fields && fields[type] 
    ? { select: fields[type], omit: [] }
    : { select: ['*'], omit: [] };

  const populates = (include || []).reduce((acc, includePath) => {
  }, {});

  // TODO: support filters, but with a separate step, 
  // and probably make some helper methods for operating on criteria. 
  // filters = requestContext.queryParams.filter && requestContext.queryParams.filter.simple
  return {
    method: "find",
    using: type,
    criteria: {
      ...idCriteria,
      ...fieldsQuery,
      ...<ForbiddenCriteria>{}, // fix ts being annoying.
      sort: sort
    },
    populates: {

    },
    returning: ({ primary, included }: QueryFindResult) => {
      return <any>{};
    }
  };
}

  // Handle fields, sorts, includes and filters.
  if(!requestContext.aboutRelationship) {
    sorts  = parseCommaSeparatedParam(requestContext.queryParams.sort);
    includes = parseCommaSeparatedParam(requestContext.queryParams.include);

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

