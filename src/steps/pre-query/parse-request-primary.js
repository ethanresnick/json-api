import Q from "q";
import APIError from "../../types/APIError";
import Resource from "../../types/Resource";
import RelationshipObject from "../../types/RelationshipObject";
import Linkage from "../../types/Linkage";
import Collection from "../../types/Collection";

export default function(data, parseAsLinkage) {
  return Q.Promise(function(resolve, reject) {
    try {
      if(parseAsLinkage) {
        resolve(linkageFromJSON(data));
      }

      else if(Array.isArray(data)) {
        resolve(new Collection(data.map(resourceFromJSON)));
      }

      else {
        resolve(resourceFromJSON(data));
      }
    }

    catch (error) {
      if (error instanceof APIError) {
        reject(error);
      }

      else {
        const title = "The resources you provided could not be parsed.";
        const details = `The precise error was: "${error.message}".`;
        reject(new APIError(400, undefined, title, details));
      }
    }
  });
}

function relationshipObjectFromJSON(json) {
  if (typeof json.data === "undefined") {
    throw new APIError(400, undefined, `Missing relationship linkage.`);
  }

  return new RelationshipObject(linkageFromJSON(json.data));
}

function linkageFromJSON(json) {
  return new Linkage(json);
}

function resourceFromJSON(json) {
  let relationships = json.relationships || {};

  //build RelationshipObjects
  let key;
  try {
    for(key in relationships) {
      relationships[key] = relationshipObjectFromJSON(relationships[key], key);
    }
  }
  catch (e) {
    e.details = `No data was found for the ${key} relationship.`;
    throw e;
  }

  return new Resource(json.type, json.id, json.attributes, relationships, json.meta);
}
