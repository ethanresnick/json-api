import * as Errors from '../../util/errors';
import Resource, { ResourceWithId } from "../../types/Resource";
import Relationship from "../../types/Relationship";
import UpdateQuery from "../../types/Query/UpdateQuery";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import Data from "../../types/Generic/Data";
import ResourceSet from "../../types/ResourceSet";
import ResourceIdentifier from "../../types/ResourceIdentifier";
import { FinalizedRequest, makeDocument } from "../../types";
import { UpdateReturning } from '../../db-adapters/AdapterInterface';
import setTypePaths from "../set-type-paths";

export default async function(request: FinalizedRequest, registry: ResourceTypeRegistry, makeDoc: makeDocument) {
  const type = request.type;
  // Note: we verify presence of id in steps/pre-query/validate-resource-ids.ts.
  // tslint:disable-next-line no-non-null-assertion
  const primary = <Data<ResourceWithId> | Data<ResourceIdentifier>>(request.document!.primary as any)._data;
  let changedResourceData;

  if(!request.aboutRelationship) {
    if(request.id) {
      if(!primary.isSingular) {
        throw Errors.expectedDataObject({
          detail: "You can't replace a single resource with a collection."
        });
      }

      // B/c of the isSingular check above, we know this'll be a single Resource.
      const providedResource = (<Data<Resource>>primary).unwrap() as Resource | null;

      if(request.id !== (providedResource && providedResource.id)) {
        throw Errors.invalidId({
          detail: "The id of the resource you provided must match that in the URL."
        });
      }
    }

    // No request.id
    else if(primary.isSingular) {
      throw Errors.expectedDataArray({
        detail: "You must provide an array of resources to do a bulk update."
      });
    }

    changedResourceData = primary;
  }

  else {
    if(!request.relationship || !request.id) {
      throw new Error(
        "Somehow, this request was 'about a relationship' and yet didn't " +
        "include a resource id and a relationship name. This shouldn't happen." +
        "Check that your routes are passing params into the library correctly."
      );
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
    returning: ({ updated: resources }: UpdateReturning) => ({
      document: makeDoc({
        primary: request.aboutRelationship
          ? (resources.unwrap() as Resource).relationships[<string>request.relationship]
          : ResourceSet.of({ data: resources })
      })
    })
  });
}
