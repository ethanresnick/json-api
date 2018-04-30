import * as Errors from "../../util/errors";
import ResourceSet from "../../types/ResourceSet";
import ResourceIdentifierSet from "../../types/ResourceIdentifierSet";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";

export default async function(
  endpointParentType: string,
  data: ResourceSet | ResourceIdentifierSet,
  registry: ResourceTypeRegistry
) {
  // validate that all resources are of types appropriate for the endpoint.
  // If the user's submitting resources, their JSON:API `type` key must be
  // the parent-most type of the type that this endpoint filters/queries on
  // (since we always serialize JSON:API resources with their parent-most type
  // in type, and expect them to be created that way).
  const rootType = registry.rootTypeNameOf(endpointParentType);
  if(!(data as ResourceSet).every(it => it.type === rootType)) {
    throw Errors.invalidResourceType({
      detail: `Resources at this endpoint must all have a \`type\` of "${rootType}".`
    });
  }
}
