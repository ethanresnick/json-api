import APIError from "../../types/APIError";
import { Request } from "../../types/index";
import {objectIsEmpty} from "../../util/type-handling";

export default function hasValidContentType({headers, body}: Request): Promise<void> {
  return Promise.resolve().then(() => {
    if(typeof body === "undefined") {
      return;
    }

    if(typeof headers.contentType === "undefined") {
      throw new APIError(400, undefined, "Missing Content Type");
    }

    // In the future, we might delegate back to the framework if the client
    // provides a base content type other than json-api's. But, for now, we 415.
    if(headers.contentType.type !== "application/vnd.api+json") {
      const detail = 
        "The request's Content-Type must be application/vnd.api+json, " +
        `but you provided got ${headers.contentType.type}.`;

      throw new APIError(415, undefined, "Invalid Media Type", detail);
    }

    // Remove charset before validating params due to issue w/ Firefox automatically 
    // adding charset param. See: https://github.com/ethanresnick/json-api/issues/78
    const typeParams = {...headers.contentType.parameters};
    delete (<any>typeParams).charset;

    if(!objectIsEmpty(headers.contentType.parameters)) {
      const detail =
        "The request's Content-Type must be application/vnd.api+json, with " +
        "no parameters. But the Content-Type you provided contained the " +
        `parameters: ${Object.keys(typeParams).join(", ")}.`;

      throw new APIError(415, undefined, "Invalid Media Type Parameter(s)", detail);
    }

    return;
  });
}
