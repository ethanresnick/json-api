import * as Errors from "../../util/errors";
import Resource from "../../types/Resource";
import ResourceSet from "../../types/ResourceSet";
import ResourceIdentifier from "../../types/ResourceIdentifier";
import ResourceIdentifierSet from "../../types/ResourceIdentifierSet";

export const hasId = (it: Resource | ResourceIdentifier) =>
  typeof it.id !== "undefined";

export default async function(data: ResourceSet | ResourceIdentifierSet) {
  if(!(data as ResourceSet).every(hasId)) {
    if(data instanceof ResourceIdentifierSet) {
      throw Errors.invalidLinkageStructure({
        detail: "Missing an `id` key on one or more of the identifier objects provided."
      })
    }

    throw Errors.resourceMissingIdKey();
  }
}
