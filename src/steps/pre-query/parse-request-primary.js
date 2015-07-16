import Q from "q";
import APIError from "../../types/APIError";
import Resource from "../../types/Resource";
import RelationshipObject from "../../types/RelationshipObject";
import Linkage from "../../types/Linkage";
import Collection from "../../types/Collection";
import * as formatters from "../format-json";

export default function(data, registry, parseAsLinkage) {
  return Q.Promise(function(resolve, reject) {
    try {
      if(parseAsLinkage) {
        resolve(linkageFromJSON(data));
      }

      else if(Array.isArray(data)) {
        resolve(new Collection(data.map(it => resourceFromJSON(it, registry))));
      }

      else {
        resolve(resourceFromJSON(data, registry));
      }
    }

    catch (error) {
      const title = "The resources you provided could not be parsed.";
      const details = `The precise error was: "${error.message}".`;
      reject(new APIError(400, undefined, title, details));
    }
  });
}

function relationshipObjectFromJSON(json) {
  return new RelationshipObject(linkageFromJSON(json.data));
}

function linkageFromJSON(json) {
  return new Linkage(json);
}

function resourceFromJSON(json, registry) {
  let relationships = json.relationships || {};

  //build RelationshipObjects
  for(let key in relationships) {
    relationships[key] = relationshipObjectFromJSON(relationships[key]);
  }

  // Camelize incoming JSON
  let dasherizeOutput = json.type ? registry.behaviors(json.type).dasherizeOutput : {};
  if (dasherizeOutput.enabled) {
    formatters.camelizeKeys(json, dasherizeOutput._inverseExceptions);
  }

  return new Resource(json.type, json.id, json.attributes, relationships, json.meta);
}
