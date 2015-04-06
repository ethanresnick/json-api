import Q from "q";
import {groupResourcesByType} from "../../util/type-handling";
import {isSubsetOf} from "../../util/misc";
import Collection from "../../types/Collection";
import APIError from "../../types/APIError"

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
      resolve();
    }
  });
}
