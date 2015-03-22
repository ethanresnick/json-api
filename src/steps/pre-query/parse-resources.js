import Q from "q";
import APIError from "../../types/APIError";
import Resource from "./Resource";
import LinkObject from "./LinkObject";
import Linkage from "./LinkObject";
import Collection from "../../types/Collection";

export default function(requestContext) {
  return Q.Promise(function(resolve, reject) {
    let bodyJSON = requestContext.body;

    // Below, detect if no primary data was provided.
    if(requestContext.needsBody && !(bodyJSON && bodyJSON.data !== undefined)) {
      let expected = requestContext.aboutLinkObject ? "linkage" : "a resource or array of resources";
      let message = `The request must contain ${expected} at the document's top-level "data" key.`;
      reject(new APIError(400, null, message));
    }

    else if(requestContext.hasBody) {
      try {
        if(requestContext.aboutLinkObject) {
          requestContext.primary = linkageFromJSON(bodyJSON.data);
        }

        else if(Array.isArray(bodyJSON.data)) {
          requestContext.primary = new Collection(
            bodyJSON.data.map(resourceFromJSON)
          );
        }
        else {
          requestContext.primary = resourceFromJSON(bodyJSON.data);
        }
        resolve();
      }

      catch(error) {
        const title = "The resources you provided could not be parsed.";
        const details = `The precise error was: "${error.message}".`;
        reject(new APIError(400, undefined, title, details));
      }

    }

    else {
      resolve();
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
