import APIError from "../../types/APIError";
import Collection from "../../types/Collection";
import Resource from "../../types/Resource";
import Relationship from "../../types/Relationship";
import Linkage from "../../types/Linkage";

export default function(requestContext, responseContext, registry) {
  const primary = requestContext.primary;
  const type    = requestContext.type;
  const adapter = registry.dbAdapter(type);
  let changedResourceOrCollection;

  if(primary instanceof Collection) {
    if(requestContext.idOrIds && !Array.isArray(requestContext.idOrIds)) {
      const title = "You can't replace a single resource with a collection.";
      throw new APIError(400, undefined, title);
    }

    changedResourceOrCollection = primary;
  }

  else if(primary instanceof Resource) {
    if(!requestContext.idOrIds) {
      const title = "You must provide an array of resources to do a bulk update.";
      throw new APIError(400, undefined, title);
    }
    else if(requestContext.idOrIds !== primary.id) {
      const title = "The id of the resource you provided doesn't match that in the URL.";
      throw new APIError(400, undefined, title);
    }
    changedResourceOrCollection = primary;
  }

  else if(primary instanceof Linkage) {
    changedResourceOrCollection = new Resource(
      requestContext.type,
      requestContext.idOrIds,
      undefined,
      {[requestContext.relationship]: new Relationship(requestContext.primary) }
    );
  }

  return adapter.update(type, changedResourceOrCollection).then((resources) => {

    responseContext.primary = (primary instanceof Linkage) ?
      resources.relationships[requestContext.relationship].linkage :
      resources;
  });
}
