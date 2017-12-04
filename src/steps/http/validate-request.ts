import APIError from "../../types/APIError";
import { Request } from "../../types/HTTP/Request";

export function checkBodyExistence(request: Request) {
  return new Promise(function(resolve, reject) {
    const needsBody =
      ["post", "patch"].indexOf(<string>request.method) !== -1 ||
      (request.method === "delete" && request.aboutRelationship) ||
      (request.method === "delete" && !request.id && request.ext.indexOf("bulk") !== -1);

    if(request.hasBody === needsBody) {
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
    const detail = `The method "${method}" is not supported.` + (method === "put" ? " See http://jsonapi.org/faq/#wheres-put" : "");

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
