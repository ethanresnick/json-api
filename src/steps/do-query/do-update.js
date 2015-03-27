import APIError from "../../types/APIError";
import Collection from "../../types/Collection";
import Resource from "../../types/Resource";
import Linkage from "../../types/Linkage";
import {arrayValuesMatch} from "../../util/arrays";
import {mapResources} from "../../util/type-handling";

export default function(requestContext, responseContext, registry) {
  const primary = requestContext.primary;
  const type    = requestContext.type;
  const adapter = registry.adapter(type);
  let changedResourceOrCollection;

  if(primary instanceof Collection) {
    if(requestContext.idOrIds && !Array.isArray(requestContext.idOrIds)) {
      let title = "You can't replace a single resource with a collection.";
      throw new APIError(400, undefined, title);
    }

    changedResourceOrCollection = primary;
  }

  else if(primary instanceof Resource) {
    if(!requestContext.idOrIds) {
      let title = "You must provide an array of resources to do a bulk update.";
      throw new APIError(400, undefined, title);
    }
    else if(requestContext.idOrIds !== primary.id) {
      let title = "The id of the resource you provided doesn't match that in the URL.";
      throw new APIError(400, undefined, title);
    }
    changedResourceOrCollection = primary;
  }

  else if(primary instanceof Linkage) {
    changedResourceOrCollection = new Resource(
      requestContext.type,
      requestContext.idOrIds,
      {[requestContext.relationship]: requestContext.primary}
    );
  }

  return adapter.update(type, changedResourceOrCollection).then((resources) => {
    responseContext.primary = resources;
  });
}
