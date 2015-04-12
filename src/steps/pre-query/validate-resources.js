import Q from "q";
import {groupResourcesByType} from "../../util/type-handling";
import {arrayContains} from "../../util/arrays";
import {isSubsetOf} from "../../util/misc";
import APIError from "../../types/APIError";

export default function(endpointParentType, resourceOrCollection, registry) {
  return Q.Promise(function(resolve, reject) {
    // validate that all resources are of types appropriate for the endpoint.
    const adapter = registry.adapter(endpointParentType);
    const allowedTypes = adapter.getTypesAllowedInCollection(endpointParentType);
    const resourcesByType = groupResourcesByType(resourceOrCollection);

    if(!isSubsetOf(allowedTypes, Object.keys(resourcesByType))) {
      let title = "Some of the resources you provided are of a type that " +
                  "doesn't belong in this collection.";
      let detail = `Valid types for this collection are: ${allowedTypes.join(", ")}.`;

      reject(new APIError(400, undefined, title, detail));
    }

    else {
      // If there are extra attributes or missing attributes, we want the
      // adapter to decide how to handle that, depending on the model. But,
      // if there are paths that must be relationship names listed under the
      // attributes, that's a case that we can identify here and throw for.
      for(let type in resourcesByType) {
        let resources = resourcesByType[type];
        let relationshipNames = adapter.getRelationshipNames(type);
        let invalid = resources.some((resource) => {
          let attrNames = Object.keys(resource.attrs);
          return relationshipNames.some((relationshipName) => {
            return arrayContains(attrNames, relationshipName);
          });
        });

        if(invalid) {
          let title = "Relationship fields must be specified under the links key.";
          return reject(new APIError(400, undefined, title));
        }
      }

      return resolve();
    }
  });
}
