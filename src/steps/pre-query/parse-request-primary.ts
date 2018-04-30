import * as Errors from "../../util/errors";
import Resource from "../../types/Resource";
import ResourceIdentifier from "../../types/ResourceIdentifier";
import Relationship from "../../types/Relationship";
import Data from "../../types/Generic/Data";

export default async function(jsonData, parseAsLinkage = false) {
  // Mapping step below does validation, because the constructors do,
  // while leveraging the uniform map ui for iteration.
  return parseAsLinkage
    ? Data.fromJSON(jsonData).map(toResourceIdentifier)
    : Data.fromJSON(jsonData).map(toResource);
}

function toResourceIdentifier(json) {
  return ResourceIdentifier.fromJSON(json);
}

function toResource(json) {
  const { id, type, attributes, meta, relationships = {} } = json;

  //build Relationships
  Object.keys(relationships).forEach(key => {
    if(typeof relationships[key].data === 'undefined') {
      throw Errors.relationshipMissingLinkage({
        detail: `No data was found for the ${key} relationship.`
      });
    }

    relationships[key] = Relationship.of({
      data: relationships[key].data,
      owner: { type, id, path: key }
    }).map(toResourceIdentifier);
  });

  try {
    // resource data validated by resource constructor. May throw.
    return new Resource(type, id, attributes, relationships, meta);
  } catch(e) {
    switch (e.code) {
      case 1:
        throw Errors.resourceMissingTypeKey();

      case 2:
        throw Errors.resourceMetaNonObject();

      case 3:
        throw Errors.resourceFieldsContainerNonObject();

      case 4:
        throw Errors.resourceIdentifierKeyAsField();

      case 5:
        throw Errors.resourceDuplicateField({
          detail: `${e.field} appears in both places.`
        });

      // In case 6 (complex attr with relationships or links), APIs should
      // really ignore the reserved key and not error at all, to maxime
      // forward compatibility. We error because we know our adapters wouldn't
      // support complex attr links/relationships, even if JSON:API did.
      // But, we send a generic error because I'm not going to make up a custom
      // code for an error type that arguably shouldn't exist.
      case 6:
        throw Errors.genericValidation({
          detail: e.message
        })

      default:
        throw e;
    }
  }
}
