import APIError from "../../types/APIError";

export default function(requestContext, responseContext, registry) {
  let type    = requestContext.type;
  let adapter = registry.adapter(type);

  if(requestContext.aboutLinkObject) {
    if(Array.isArray(requestContext.idOrIds)) {
      throw new APIError(
        400, undefined,
        "You can only remove resources from the linkage of one resource at a time."
      );
    }
    return adapter.removeFromRelationship(
      type, requestContext.idOrIds, requestContext.relationship, requestContext.primary
    ).then(() => {
      responseContext.status = 204;
    });
  }

  else {
    return adapter.delete(type, requestContext.idOrIds).then((resources) => {
      responseContext.status = 204;
    });
  }
}
