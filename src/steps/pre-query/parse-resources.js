import Q from "q";
import APIError from "../../types/APIError";
import Resource from "../../types/Resource";
import LinkObject from "../../types/LinkObject";
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
      const title = "The resources you provided could not be parsed.";
      const details = `The precise error was: "${error.message}".`;
      reject(new APIError(400, undefined, title, details));
    }
  });
}

function linkObjectFromJSON(json) {
  return new LinkObject(linkageFromJSON(json.linkage));
}

function linkageFromJSON(json) {
  return new Linkage(json);
}

function resourceFromJSON(json) {
  // save and then remove the non-attrs
  let id    = json.id; delete json.id;
  let type  = json.type; delete json.type;
  let links = json.links || {}; delete json.links;
  let meta  = json.meta; delete json.meta;

  // attrs are all the fields that are left.
  let attrs = json;

  //build LinkObjects
  for(let key in links) {
    links[key] = linkObjectFromJSON(links[key]);
  }

  return new Resource(type, id, attrs, links, meta);
}
