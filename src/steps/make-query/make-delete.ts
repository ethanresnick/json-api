import APIError from "../../types/APIError";
import { FinalizedRequest, makeDocument } from "../../types";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import Data from "../../types/Generic/Data";
import ResourceIdentifier from "../../types/ResourceIdentifier";
import DeleteQuery from "../../types/Query/DeleteQuery";
import RemoveFromRelationshipQuery from "../../types/Query/RemoveFromRelationshipQuery";

export default function(request: FinalizedRequest, registry: ResourceTypeRegistry, makeDoc: makeDocument) {
  const type = request.type;
  // There may not be a document, but if there is it'll have primary data.
  const primary = request.document && (request.document.primary as any)._data;

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
      linkage: (<Data<ResourceIdentifier>>primary).values,
      returning: () => ({ status: 204 })
    });
  }

  // Bulk delete of resources
  const bulkDelete = !request.id;
  if(bulkDelete) {
    if(!primary) {
      throw new Error("Bulk delete without a body is not possible.")
    }

    if(primary.isSingular) {
      const title = "You must provide an array of resource identifier objects to do a bulk delete.";
      throw new APIError(400, undefined, title);
    }
  }

  return new DeleteQuery({
    type,
    returning: () => ({ status: 204 }),
    [bulkDelete ? 'ids' : 'id']:
      bulkDelete
        ? (<Data<ResourceIdentifier>>primary).map((it) => it.id).values
        : request.id
  });
}
