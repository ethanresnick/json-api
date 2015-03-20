import Q from "q";
import APIError from "../../types/APIError";
import Document from "../../types/Document";
import Collection from "../../types/Collection";

export default function(requestContext) {
  return Q.Promise(function(resolve, reject) {
    let bodyJSON = requestContext.body;

    // Below, detect if no primary data was provided.
    if(requestContext.needsBody && !(bodyJSON && bodyJSON.data !== undefined)) {
      let expected = requestContext.aboutLinkObject ? "link object" : "resource or array of resources";
      let message = `The request must contain a ${expected} at the document's top-level "data" key.`;
      reject(new APIError(400, null, message));
    }

    else if(requestContext.hasBody) {
      try {
        if(requestContext.aboutLinkObject) {
          requestContext.primary = Document.linkObjectFromJSON(bodyJSON.data);
        }
        else if(Array.isArray(bodyJSON.data)) {
          requestContext.primary = new Collection(
            bodyJSON.data.map(Document.resourceFromJSON)
          );
        }
        else {
          requestContext.primary = Document.resourceFromJSON(bodyJSON.data);
        }
        resolve();
      }

      catch(error) {
        const title = "The resources you provided could not be parsed."
        const details = `The precise error was: "${error.message}".`;
        reject(new APIError(400, undefined, title, details));
      }

    }

    else {
      resolve();
    }
  });
}
