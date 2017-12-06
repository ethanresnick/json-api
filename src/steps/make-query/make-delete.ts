import APIError from "../../types/APIError";
import Collection from "../../types/Collection";
import { Request } from "../../types";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import DeleteQuery from "../../types/Query/DeleteQuery";
import RemoveFromRelationshipQuery from "../../types/Query/RemoveFromRelationshipQuery";

export default function(request: Request, registry: ResourceTypeRegistry, makeDoc) {
  const type = request.type;

  if(request.aboutRelationship) {
    if(!request.id || !request.relationship) {
      throw new APIError(
        400,
        undefined,
        "To remove linkage from a relationship, you must send your request to a relationship endpoint."
      );
    }
    return new RemoveFromRelationshipQuery({
      type: type,
      id: request.id,
      relationshipName: request.relationship,
      linkage: request.primary,
      returning: () => ({ status: 204 })
    });
  }

  // Bulk delete of resources
  const bulkDelete = !request.id;
  if(bulkDelete) {
    if(!(request.primary instanceof Collection)) {
      const title = "You must provide an array of resource objects to do a bulk delete.";
      throw new APIError(400, undefined, title);
    }

    if(!request.primary.resources.every((it) => typeof it.id !== "undefined")) {
      const title = "Every object provided for a bulk delete must contain a `type` and `id`.";
      throw new APIError(400, undefined, title);
    }
  }

  return new DeleteQuery({
    type,
    returning: () => ({ status: 204 }),
    [bulkDelete ? 'ids' : 'id']:
      bulkDelete
        ? request.primary.resources.map((it) => it.id)
        : request.id
  });
}
