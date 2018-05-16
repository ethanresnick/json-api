import { partition } from "../../util/misc";
import * as Errors from "../../util/errors";
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
  // tslint:disable-next-line forin
  for(const type in resourcesByChildMostType) {
    // `.type()` can't return undefined if the type is registered, and the
    // type path has already been validated to ensure that (if it came from
    // user input), and is assumed to satisfy that if it came from the adapter.
    // tslint:disable-next-line no-non-null-assertion
    const { dbAdapter } = registry.type(type)!;
    const resources = resourcesByChildMostType[type];
    const relationshipNames = dbAdapter.getRelationshipNames(type);

    const invalid = resources.some((resource) => {
      return relationshipNames.some((relationshipName) => {
        return typeof resource.attrs[relationshipName] !== "undefined";
      });
    });

    if(invalid) {
      throw Errors.invalidAttributeName({
        detail: "Relationship fields must be specified under the `relationships` key."
      });
    }
  }
}
