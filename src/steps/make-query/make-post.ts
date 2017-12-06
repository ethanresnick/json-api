import APIError from "../../types/APIError";
import Linkage from "../../types/Linkage";
import Resource from "../../types/Resource";
import {forEachResources} from "../../util/type-handling";
import CreateQuery from "../../types/Query/CreateQuery";
import AddToRelationshipQuery from '../../types/Query/AddToRelationshipQuery';
import { Request } from "../../types";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import { Result } from "../../types";
import templating = require("url-template");

export default function(request: Request, registry: ResourceTypeRegistry, makeDoc) {
  const primary = request.primary;
  const type    = request.type;

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

    if(!request.id || !request.relationship) {
      throw new APIError(
        400,
        undefined,
        "To add linkage to a relationship, you must POST to a relationship endpoint."
      );
    }

    return new AddToRelationshipQuery({
      type,
      id: request.id,
      relationshipName: request.relationship,
      linkage: primary,
      returning: () => ({status: 204})
    });
  }

  else {
    const noClientIds = "Client-generated ids are not supported.";
    forEachResources(primary, (it) => {
      if(it.id) throw new APIError(403, undefined, noClientIds);
    });

    return new CreateQuery({
      type,
      records: primary,
      returning: (created) => {
        const res: Result = {
          status: 201,
          document: makeDoc({ primary: created })
        };

        // We can only generate a Location url for a single resource.
        if(created instanceof Resource) {
          const templates = registry.urlTemplates(created.type);
          const template = templates && templates.self;
          if(template) {
            const templateData = {"id": created.id, ...created.attrs};
            res.headers = {
              Location: templating.parse(template).expand(templateData)
            };
          }
        }

        return res;
      }
    });
  }
}
