import APIError from "../../types/APIError";

export default function(request, response, registry, query) {
  const type = request.type;
  const adapter = registry.dbAdapter(type);

  if(!request.aboutRelationship) {
    return adapter.doQuery(query).then(([primary, included, collectionSizeOrNull]) => {
      response.primary = primary;
      response.included = included;
      if(collectionSizeOrNull != null) {
        response.meta.total = collectionSizeOrNull;
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
        resource.relationships[request.relationship];

      if(!relationship) {
        const title = "Invalid relationship name.";
        const detail = `${request.relationship} is not a valid ` +
                     `relationship name on resources of type '${type}'`;

        throw new APIError(404, undefined, title, detail);
      }

      response.primary = relationship.linkage;
    });
  }

}
