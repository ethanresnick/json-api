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

export function checkContentType(requestContext, supportedExt) {
  // From the spec: The value of the ext media type parameter... MUST
  // be limited to a subset of the extensions supported by the server.
  let invalidExt = requestContext.ext.filter((v) => supportedExt.indexOf(v) === -1);

  return Q.Promise(function(resolve, reject) {
    if(requestContext.contentType !== "application/vnd.api+json") {
      let message =
        "The request's Content-Type must be application/vnd.api+json, " +
        "optionally including an ext parameter whose value is a comma-separated " +
        `list of supported extensions, which include: ${supportedExt.join(",")}.`;

      reject(new APIError(415, null, message));
    }
    else if(invalidExt.length) {
      let message =
        "You're requesting the following unsupported extensions: " +
        `${invalidExt.join(",")}. The server supports only the extensions: ` +
        `${supportedExt.join(",")}.`;

      reject(new APIError(415, null, message));
    }
    else {
      resolve();
    }
  });
}
