import APIError from "../../types/APIError";
import Resource from "../../types/Resource";
import ResourceIdentifier from "../../types/ResourceIdentifier";
import Relationship from "../../types/Relationship";
import Data from '../../types/Data';

export default async function(jsonData, parseAsLinkage = false) {
  try {
    // Mapping step below does validation, because the constructors do,
    // while leveraging the uniform map ui for iteration.
    return parseAsLinkage
      ? Data.fromJSON(jsonData).map(toResourceIdentifier)
      : Data.fromJSON(jsonData).map(toResource);
  }

  catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    else {
      const title = "The resources you provided could not be parsed.";
      const details = `The precise error was: "${error.message}".`;
      throw new APIError(400, undefined, title, details);
    }
  }
}

function toResourceIdentifier(json) {
  return new ResourceIdentifier(json);
}

function toResource(json) {
  const relationships = json.relationships || {};

  //build Relationships
  for(let key in relationships) {
    if(typeof relationships[key].data === 'undefined') {
      throw new APIError(
        400,
        undefined,
        `Missing relationship linkage.`,
        `No data was found for the ${key} relationship.`
      );
    }

    relationships[key] = Relationship.of({
      data: relationships[key].data,
      owner: { type: json.type, id: json.id, path: key }
    }).map(toResourceIdentifier);
  }

  // resource data validated by resource constructor.
  return new Resource(json.type, json.id, json.attributes, relationships, json.meta);
}
