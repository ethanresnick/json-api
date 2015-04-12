import APIError from "../../types/APIError";

export default function(request, response, registry) {
  let type    = request.type;
  let adapter = registry.adapter(type);

  if(request.aboutLinkObject) {
    if(Array.isArray(request.idOrIds)) {
      throw new APIError(
        400, undefined,
        "You can only remove resources from the linkage of one resource at a time."
      );
    }
    return adapter.removeFromRelationship(
      type, request.idOrIds, request.relationship, request.primary
    ).then(() => {
      response.status = 204;
    });
  }

  else {
    return adapter.delete(type, request.idOrIds).then((resources) => {
      response.status = 204;
    });
  }
}
