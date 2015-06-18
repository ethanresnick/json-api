import APIError from "../../types/APIError";
import Resource from "../../types/Resource";
import Linkage from "../../types/Linkage";
import templating from "url-template";
import {forEachResources} from "../../util/type-handling";

export default function(requestContext, responseContext, registry) {
  let primary = requestContext.primary;
  let type    = requestContext.type;
  let adapter = registry.dbAdapter(type);

  // We're going to do an adapter.create, below, EXCEPT if we're adding to
  // an existing toMany relationship, which uses a different adapter method.
  if(primary instanceof Linkage) {
    if(!Array.isArray(primary.value)) {
      throw new APIError(
        400,
        undefined,
        "To add to a to-many relationship, you must POST an array of linkage objects."
      );
    }

    return adapter.addToRelationship(
      type, requestContext.idOrIds, requestContext.relationship, primary
    ).then(() => {
      responseContext.status = 204;
    });
  }

  else {
    let noClientIds = "Client-generated ids are not supported.";
    forEachResources(primary, (it) => {
      if(it.id) throw new APIError(403, undefined, noClientIds);
    });

    return adapter.create(type, primary).then((created) => {
      responseContext.primary = created;
      responseContext.status = 201;

      // We can only generate a Location url for a single resource.
      if(created instanceof Resource) {
        let templates = registry.urlTemplates(created.type);
        let template = templates && templates.self;
        if(template) {
          let templateData = Object.assign({"id": created.id}, created.attrs);
          responseContext.headers.location = templating.parse(template).expand(templateData);
        }
      }
    });
  }
}
