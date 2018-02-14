import { partition } from "../../util/misc";
import APIError from "../../types/APIError";
import { ResourceWithTypePath } from "../../types/Resource";
import ResourceSet from "../../types/ResourceSet";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";

export default function(data: ResourceSet, registry: ResourceTypeRegistry) {
  const resourcesByChildMostType = partition(
    (it) => (it as ResourceWithTypePath).typePath[0],
    data
  );

  // If there are extra attributes or missing attributes, we want the
  // adapter to decide how to handle that, depending on the model. But,
  // if there are paths that must be relationship names listed under the
  // attributes, that's a case that we can identify here and throw for.
  for(const type in resourcesByChildMostType) {
    const adapter = registry.dbAdapter(type);
    const resources = resourcesByChildMostType[type];
    const relationshipNames = adapter.getRelationshipNames(type);

    /*eslint-disable no-loop-func */
    const invalid = resources.some((resource) => {
      return relationshipNames.some((relationshipName) => {
        return typeof resource.attrs[relationshipName] !== "undefined";
      });
    });
    /*eslint-enable no-loop-func */

    if(invalid) {
      throw new APIError({
        status: 400,
        title: "Relationship fields must be specified under the `relationships` key."
      });
    }
  }
}
