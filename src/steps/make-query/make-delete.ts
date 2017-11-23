import APIError from "../../types/APIError";
import Collection from "../../types/Collection";
import DeleteQuery from "../../types/Query/DeleteQuery";
import RemoveFromRelationshipQuery from "../../types/Query/RemoveFromRelationshipQuery";

export default function(request, registry, makeDoc) {
  const type = request.type;

  if(request.aboutRelationship) {
    if(Array.isArray(request.idOrIds)) {
      throw new APIError(
        400, undefined,
        "You can only remove resources from the linkage of one resource at a time."
      );
    }
    return new RemoveFromRelationshipQuery({
      type: type,
      id: request.idOrIds,
      relationshipName: request.relationship,
      linkage: request.primary,
      returning: () => ({ status: 204 })
    });
  }

  // Bulk delete
  const bulkDelete = !request.idOrIds;
  if(bulkDelete) {
    if(!(request.primary instanceof Collection)) {
      const title = "You must provide an array of objects to do a bulk delete.";
      throw new APIError(400, undefined, title);
    }

    if(!request.primary.resources.every((it) => typeof it.id !== "undefined")) {
      const title = "Every object provided for a bulk delete must contain a `type` and `id`.";
      throw new APIError(400, undefined, title);
    }
  }

  return new DeleteQuery({
    type,
    idOrIds: bulkDelete
      ? request.primary.resources.map((it) => it.id)
      : request.idOrIds,
    returning: () => ({ status: 204 })
  });
}
