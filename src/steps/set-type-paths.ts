import APIError from "../types/APIError";
import Resource, { ResourceWithId } from "../types/Resource";
import ResourceIdentifier from "../types/ResourceIdentifier";
import ResourceTypeRegistry from "../ResourceTypeRegistry";

/**
 * When we get incoming resource objects in a request, we have to determine
 * the full set of types that the apply to them (because their `type` key will
 * only contain the parent-most type). Sometimes, that full set of types is
 * provided by the user (namely, on create). Other times, namely on update,
 * we ask the adapter to look up these types, and throw if the user has provided
 * a set of types themselves, as the client is not allowed to change the types
 * of resources that already exist (for now).
 *
 * The list of types provided by the user, if any, which may or may not be valid,
 * is called the typesList. The valid set of types ultimately determined by
 * this function is called the typePath. See the Resource class for more deatils.
 *
 * **This funtion mutates the Resources it's given to set their typePath.**
 *
 * Note: if the type path is being looked up with the adapter, you must verify
 * beforehand that all provided resource objects have ids.
 *
 * Finally, this function can also work on resource identifier objects, for
 * consistency. However, it's not/rarely used on them.
 *
 * It accepts an array of resources/identifier objects, rather than just one,
 * so that, if it has to go to the adapter to look their full type paths, it
 * can have the adapter look up all the type paths at once/as a bulk lookup.
 *
 * @param {(Resource|ResourceIdentifier)[]} resourcesAndIds
 *   The resources/identifiers we're setting the types list for.
 * @param {boolean} useInputTypesList Whether to read + use the types list from
 *   the (user-provided) resources/identifiers as the basis for the type path;
 *   else we use the adapter to look the type path up.
 * @param {string?} requiredThroughType An optional type that the types list
 *   is required to contain. Useful for endpoints limited to specific types.
 * @param {ResourceTypeRegistry} registry The central registry
 */
export default async function(
  resourcesAndIds: (Resource | ResourceIdentifier)[],
  useInputTypesList: boolean,
  requiredThroughType: string | undefined,
  registry: ResourceTypeRegistry
) {
  if(useInputTypesList) {
    const asTypePath = registry.asTypePath.bind(registry);
    resourcesAndIds.forEach((resourceOrId) => {
      resourceOrId.typePath =
        getTypePathFromUserInput(resourceOrId, asTypePath, requiredThroughType);
    });
  }

  else {
    // Since the user can't provide a typesList in a PATCH to update a
    // resource's types (the semantics of that are undefined), any typesList
    // present on requests where we have existing resources is an error.
    if(resourcesAndIds.some(it => it.typesList !== undefined)) {
      throw new APIError({
        status: 400,
        title: "You cannot provide a list of (sub)-types on this request. "
          + "Trying to mutate the types of an existing resource is not allowed."
      });
    }

    const adaptersToTypeNames = registry.uniqueAdapters();

    // 95% of the time we'll only have one adapter and we can simplify stuff.
    if(adaptersToTypeNames.size === 1) {
      const adapter = adaptersToTypeNames.keys().next().value;
      const typePathResults = await adapter.getTypePaths(
        resourcesAndIds.map(it => ({
          id: (it as ResourceWithId | ResourceIdentifier).id,
          type: it.type
        }))
      );

      resourcesAndIds.forEach((resourceOrId) => {
        const id = (resourceOrId as ResourceIdentifier | ResourceWithId).id;
        const adapterResultsForType = typePathResults[resourceOrId.type];
        const adapterResult = adapterResultsForType && adapterResultsForType[id];

        if(!adapterResult) {
          throw new APIError({
            status: 404,
            title: "One or more of the resources provided could not be found.",
            detail: `First missing resource was (${resourceOrId.type}, ${resourceOrId.id}).`
          });
        }

        if(requiredThroughType && !adapterResult.typePath.includes(requiredThroughType)) {
          throw new APIError({
            status: 400,
            title: "Resource of invalid type provided.",
            detail: `The resource (${resourceOrId.type}, ${resourceOrId.id}) is of an invalid type.`
          });
        }

        resourceOrId.typePath = adapterResult.typePath;
        resourceOrId.adapterExtra = adapterResult.extra;
      });
    }

    else {
      throw new Error(
        "Using subtypes with multiple adapters is not supported yet. " +
        "It's not hard, exactly, just low priority. If you want this, open an issue."
      );
    }
  }
};

/**
 * Takes a resource or resource identifier object constructed from client input
 * (and therefore possibly with an invalid/maliciously-crafted `meta.types`) and
 * returns a valid types list from it, or throws an error. `requiredThroughType`
 * can be provided to require that the types list contain a given type.
 */
function getTypePathFromUserInput(
  resourceOrId: ResourceIdentifier | Resource,
  asTypePath: (typesList: string[], requiredThroughType?: string) => false | string[],
  requiredThroughType?: string,
) {
  // Get the typelist straight from the user provided input.
  const provisionalTypePath = resourceOrId.typesList || [resourceOrId.type];

  // typesList was set straight from the user's json, so might not be an array.
  if(!Array.isArray(provisionalTypePath)) {
    throw new APIError({
      status: 400,
      title: "Invalid types list.",
      detail: `Needed an array, but got ${JSON.stringify(provisionalTypePath)}.`
    });
  }

  const typePath = asTypePath(provisionalTypePath, requiredThroughType);
  if(!typePath) {
    throw new APIError({
      status: 400,
      title: "Invalid types list.",
      detail: `Got ${JSON.stringify(provisionalTypePath)}.`
    });
  }

  return typePath;
}
