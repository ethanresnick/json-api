import { hasId } from "../pre-query/validate-resource-ids";
import * as Errors from "../../util/errors";
import Resource, { ResourceWithTypePath } from "../../types/Resource";
import CreateQuery from "../../types/Query/CreateQuery";
import AddToRelationshipQuery from "../../types/Query/AddToRelationshipQuery";
import { FinalizedRequest, Result } from "../../types";
import Data from "../../types/Generic/Data";
import ResourceSet from "../../types/ResourceSet";
import ResourceIdentifier from "../../types/ResourceIdentifier";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import { CreationReturning } from '../../db-adapters/AdapterInterface';

export default function(request: FinalizedRequest, registry: ResourceTypeRegistry, makeDoc) {
  // tslint:disable-next-line no-non-null-assertion
  const primary = (request.document!.primary as any)._data;
  const type = request.type;

  // We're going to do an adapter.create, below, EXCEPT if we're adding to
  // an existing toMany relationship, which uses a different adapter method.
  if(request.aboutRelationship) {
    if((primary as Data<ResourceIdentifier>).isSingular) {
      throw Errors.expectedDataArray({
        detail: "To add to a to-many relationship, you must POST an array of linkage objects."
      });
    }

    if(!request.id || !request.relationship) {
      throw new Error(
        "Somehow, this request was 'about a relationship' and yet didn't " +
        "include a resource id and a relationship name. This shouldn't happen." +
        "Check that your routes are passing params into the library correctly."
      );
    }

    return new AddToRelationshipQuery({
      type,
      id: request.id,
      relationshipName: request.relationship,
      linkage: (<Data<ResourceIdentifier>>primary).values,
      returning: () => ({ status: 204 })
    });
  }

  else {
    if((<Data<Resource>>primary).some(hasId)) {
      throw Errors.unsupportedClientId();
    }

    return new CreateQuery({
      type,
      records: <Data<ResourceWithTypePath>>primary,
      returning: ({ created }: CreationReturning) => {
        const res: Result = {
          status: 201,
          document: makeDoc({ primary: ResourceSet.of({ data: created }) })
        };

        // We can only generate a Location url for a single resource.
        if(created.isSingular) {
          const createdResource = created.unwrap() as Resource;
          const { self: selfTemplate } =
            (registry.urlTemplates(createdResource.type) || { self: undefined });

          if(selfTemplate) {
            res.headers = {
              Location: selfTemplate({
                id: createdResource.id,
                ...createdResource.attrs
              })
            };
          }
        }

        return res;
      }
    });
  }
}
