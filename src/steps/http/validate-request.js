import Q from "q";
import APIError from "../../types/APIError";

export function checkBodyExistence(requestContext) {
  return Q.Promise(function(resolve, reject) {
    let needsBody =
      ["post", "patch"].indexOf(requestContext.method) !== -1 ||
      (requestContext.method === "delete" && requestContext.aboutRelationship) ||
      (requestContext.method === "delete" && !requestContext.idOrIds && requestContext.ext.indexOf("bulk") !== -1);

    if(requestContext.hasBody === needsBody) {
      resolve();
    }
    else if(needsBody) {
      reject(
        new APIError(400, undefined, "This request needs a body, but didn't have one.")
      );
    }
    else {
      reject(
        new APIError(400, undefined, "This request should not have a body, but does.")
      );
    }
  });
}

export function checkMethod({method}) {
  if(["patch", "post", "delete", "get"].indexOf(method) === -1) {
    let detail = `The method "${method}" is not supported.` + (method === "put" ? " See http://jsonapi.org/faq/#wheres-put" : "");

    return Promise.reject(new APIError(
      405,
      undefined,
      "Method not supported.",
      detail
    ));
  }
  else {
    return Promise.resolve();
  }
}
