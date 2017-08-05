import {groupResourcesByType} from "../../util/type-handling";
import {isSubsetOf} from "../../util/misc";
import APIError from "../../types/APIError";

export default function(endpointParentType, resourceOrCollection, registry) {
  return new Promise(function(resolve, reject) {
    // validate that all resources are of types appropriate for the endpoint.
    const adapter = registry.dbAdapter(endpointParentType);
    const allowedTypes = adapter.getTypesAllowedInCollection(endpointParentType);
    const resourcesByType = groupResourcesByType(resourceOrCollection);

    if(!isSubsetOf(allowedTypes, Object.keys(resourcesByType))) {
      const title = "Some of the resources you provided are of a type that " +
                  "doesn't belong in this collection.";
      const detail = `Valid types for this collection are: ${allowedTypes.join(", ")}.`;

      reject(new APIError(400, undefined, title, detail));
    }

    else {
      // If there are extra attributes or missing attributes, we want the
      // adapter to decide how to handle that, depending on the model. But,
      // if there are paths that must be relationship names listed under the
      // attributes, that's a case that we can identify here and throw for.
      for(const type in resourcesByType) {
        const resources = resourcesByType[type];
        const relationshipNames = adapter.getRelationshipNames(type);

        /*eslint-disable no-loop-func */
        const invalid = resources.some((resource) => {
          return relationshipNames.some((relationshipName) => {
            return typeof resource.attrs[relationshipName] !== "undefined";
          });
        });
        /*eslint-enable no-loop-func */

        if(invalid) {
          const title = "Relationship fields must be specified under the `relationships` key.";
          return reject(new APIError(400, undefined, title));
        }
      }

      return resolve(undefined);
    }
  });
}
