import APIError from "../../types/APIError";
import Collection from "../../types/Collection";
import {mapResources} from "../../util/type-handling";

export default function(request, response, registry) {
  let type    = request.type;
  let adapter = registry.dbAdapter(type);

  if(request.aboutRelationship) {
    if(Array.isArray(request.idOrIds)) {
      throw new APIError(
        400, undefined,
        "You can only remove resources from the linkage of one resource at a time."
      );
    }
    return adapter.removeFromRelationship(
      type, request.idOrIds, request.relationship, request.primary
    ).then(() => {
      response.status = 204;
    });
  }

  else if(!request.idOrIds && request.ext.indexOf("bulk") !== -1) {
    if(!(request.primary instanceof Collection)) {
      let title = "You must provide an array of objects to do a bulk delete.";
      throw new APIError(400, undefined, title);
    }

    if(!request.primary.resources.every((it) => typeof it.id !== "undefined")) {
      let title = "Every object provided for a bulk delete must contain a `type` and `id`.";
      throw new APIError(400, undefined, title);
    }

    let ids = request.primary.resources.map((it) => it.id);
    return adapter.delete(request.type, ids).then(() => {
      response.status = 204;
    });
  }

  else {
    return adapter.delete(type, request.idOrIds).then((resources) => {
      response.status = 204;
    });
  }
}
