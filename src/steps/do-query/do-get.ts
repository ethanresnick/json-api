import APIError from "../../types/APIError";

export default function(requestContext, responseContext, registry, query) {
  const type = requestContext.type;
  const adapter = registry.dbAdapter(type);

  if(!requestContext.aboutRelationship) {
    return adapter.doQuery(query).then(([primary, included, collectionSizeOrNull]) => {
      responseContext.primary = primary;
      responseContext.included = included;
      if(collectionSizeOrNull != null) {
        responseContext.meta.total = collectionSizeOrNull;
      }
    });
  }

  else {
    return adapter.doQuery(query).then(([resource]) => {
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
