import APIError from "../../types/APIError";
import { Request, makeDoc } from "../../types";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import Data from "../../types/Data";
import ResourceIdentifier from "../../types/ResourceIdentifier";
import DeleteQuery from "../../types/Query/DeleteQuery";
import RemoveFromRelationshipQuery from "../../types/Query/RemoveFromRelationshipQuery";

export default function(request: Request, registry: ResourceTypeRegistry, makeDoc: makeDoc) {
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
      linkage: <Data<ResourceIdentifier>>request.primary,
      returning: () => ({ status: 204 })
    });
  }

  // Bulk delete of resources
  const bulkDelete = !request.id;
  if(bulkDelete) {
    if(!request.primary) {
      throw new Error("Bulk delete without a body is not possible.")
    }

    if(request.primary.isSingular) {
      const title = "You must provide an array of resource identifier objects to do a bulk delete.";
      throw new APIError(400, undefined, title);
    }
  }

  return new DeleteQuery({
    type,
    returning: () => ({ status: 204 }),
    [bulkDelete ? 'ids' : 'id']:
      bulkDelete
        ? (<Data<ResourceIdentifier>>request.primary).map((it) => it.id).values
        : request.id
  });
}
