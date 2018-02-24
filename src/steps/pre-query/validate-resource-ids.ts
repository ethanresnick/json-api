import APIError from "../../types/APIError";
import Resource from '../../types/Resource';
import ResourceSet from "../../types/ResourceSet";
import ResourceIdentifier from "../../types/ResourceIdentifier";
import ResourceIdentifierSet from "../../types/ResourceIdentifierSet";

export const hasId = (it: Resource | ResourceIdentifier) =>
  typeof it.id !== 'undefined'

export default async function(data: ResourceSet | ResourceIdentifierSet) {
  if(!(data as ResourceSet).every(hasId)) {
    throw new APIError({
      status: 400,
      title: "Missing an `id` on one or more of the resources/identifiers provided."
    });
  }
}
