import APIError from "../../types/APIError";
import Collection from "../../types/Collection";
import Resource from "../../types/Resource";
import Relationship from "../../types/Relationship";
import Linkage from "../../types/Linkage";
import UpdateQuery from '../../types/Query/UpdateQuery';
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import { Request } from "../../types/HTTP/Request";

export default function(request: Request, registry: ResourceTypeRegistry, makeDoc) {
  const primary = request.primary;
  const type    = request.type;
  let changedResourceOrCollection;

  if(primary instanceof Collection) {
    if(request.id) {
      const title = "You can't replace a single resource with a collection.";
      throw new APIError(400, undefined, title);
    }

    changedResourceOrCollection = primary;
  }

  else if(primary instanceof Resource) {
    if(!request.id) {
      const title = "You must provide an array of resources to do a bulk update.";
      throw new APIError(400, undefined, title);
    }

    else if(request.id !== primary.id) {
      const title = "The id of the resource you provided doesn't match that in the URL.";
      throw new APIError(400, undefined, title);
    }

    changedResourceOrCollection = primary;
  }

  else if(primary instanceof Linkage) {
    if(!request.relationship) {
      const title = "You must PATCH a relationship endpoint to update relationship's linkage.";
      throw new APIError(400, undefined, title);
    }

    changedResourceOrCollection = new Resource(
      request.type,
      request.id,
      undefined,
      {[request.relationship]: new Relationship(request.primary) }
    );
  }

  return new UpdateQuery({
    type,
    patch: changedResourceOrCollection,
    returning: (resources) => ({
      document: makeDoc({
        primary: request.relationship
          ? resources.relationships[request.relationship].linkage
          : resources
      })
    })
  });
}
