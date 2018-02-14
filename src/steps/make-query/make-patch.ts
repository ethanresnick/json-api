import APIError from "../../types/APIError";
import Resource, { ResourceWithId } from "../../types/Resource";
import Relationship from "../../types/Relationship";
import UpdateQuery from '../../types/Query/UpdateQuery';
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import Data from "../../types/Generic/Data";
import ResourceSet from "../../types/ResourceSet";
import ResourceIdentifier from "../../types/ResourceIdentifier";
import { FinalizedRequest, makeDocument } from "../../types";
import setTypePaths from '../set-type-paths';

export default async function(request: FinalizedRequest, registry: ResourceTypeRegistry, makeDoc: makeDocument) {
  const type = request.type;
  // Note: we verify presence of id in steps/pre-query/validate-resource-ids.ts.
  const primary = <Data<ResourceWithId> | Data<ResourceIdentifier>>(request.document!.primary as any)._data;
  let changedResourceData;

  if(!request.aboutRelationship) {
    if(request.id) {
      if(!primary.isSingular) {
        const title = "You can't replace a single resource with a collection.";
        throw new APIError(400, undefined, title);
      }

      // B/c of the isSingular check above, we know this'll be a single Resource.
      const providedResource = (<Data<Resource>>primary).unwrap() as Resource | null;

      if(request.id !== (providedResource && providedResource.id)) {
        const title = "The id of the resource you provided doesn't match that in the URL.";
        throw new APIError(400, undefined, title);
      }
    }

    // No request.id
    else if(primary.isSingular) {
      const title = "You must provide an array of resources to do a bulk update.";
      throw new APIError(400, undefined, title);
    }

    changedResourceData = primary;
  }

  else {
    if(!request.relationship || !request.id) {
      const title = "You must PATCH a relationship endpoint to update relationship's linkage.";
      throw new APIError(400, undefined, title);
    }

    const resourceType = registry.rootTypeNameOf(request.type);
    const dummyResource = new Resource(
      resourceType,
      request.id,
      undefined,
      {
        [request.relationship]: Relationship.of({
          data: <Data<ResourceIdentifier>>primary, // the patch.
          owner: { type: resourceType, id: request.id, path: request.relationship }
        })
      }
    );

    await setTypePaths([dummyResource], false, request.type, registry);

    changedResourceData = Data.pure(dummyResource);
  }

  return new UpdateQuery({
    type,
    patch: changedResourceData,
    returning: (resources: Data<Resource>) => ({
      document: makeDoc({
        primary: request.aboutRelationship
          ? (resources.unwrap() as Resource).relationships[<string>request.relationship]
          : ResourceSet.of({ data: resources })
      })
    })
  });
}
