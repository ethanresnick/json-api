import APIError from "../../types/APIError";
import ResourceSet from "../../types/ResourceSet";
import ResourceIdentifierSet from "../../types/ResourceIdentifierSet";

export default async function(data: ResourceSet | ResourceIdentifierSet) {
  if(!(data as ResourceSet).every(it => typeof it.id !== 'undefined')) {
    throw new APIError({
      status: 400,
      title: "Missing an `id` on one or more of the resources/identifiers provided."
    });
  }
}
