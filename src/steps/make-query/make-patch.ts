import APIError from "../../types/APIError";
import Collection from "../../types/Collection";
import Resource from "../../types/Resource";
import Relationship from "../../types/Relationship";
import Linkage from "../../types/Linkage";
import UpdateQuery from '../../types/Query/UpdateQuery';

export default function(request, registry) {
  const primary = request.primary;
  const type    = request.type;
  let changedResourceOrCollection;

  if(primary instanceof Collection) {
    if(request.idOrIds && !Array.isArray(request.idOrIds)) {
      const title = "You can't replace a single resource with a collection.";
      throw new APIError(400, undefined, title);
    }

    changedResourceOrCollection = primary;
  }

  else if(primary instanceof Resource) {
    if(!request.idOrIds) {
      const title = "You must provide an array of resources to do a bulk update.";
      throw new APIError(400, undefined, title);
    }
    else if(request.idOrIds !== primary.id) {
      const title = "The id of the resource you provided doesn't match that in the URL.";
      throw new APIError(400, undefined, title);
    }
    changedResourceOrCollection = primary;
  }

  else if(primary instanceof Linkage) {
    changedResourceOrCollection = new Resource(
      request.type,
      request.idOrIds,
      undefined,
      {[request.relationship]: new Relationship(request.primary) }
    );
  }

  return new UpdateQuery({
    using: type,
    patch: changedResourceOrCollection
  });
}
