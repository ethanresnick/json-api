import contentTypeParser = require("content-type");
import APIError from "../../../types/APIError";
import { objectIsEmpty } from "../../../util/misc";

export default function validateContentType(request, supportedExt?) {
  return new Promise(function(resolve, reject) {
    const contentType = contentTypeParser.parse(request.contentType);

    // Removed due to issues with Firefox automatically adding charset parameter
    // See: https://github.com/ethanresnick/json-api/issues/78
    delete contentType.parameters.charset;

    // In the future, we might delegate back to the framework if the client
    // provides a base content type other than json-api's. But, for now, we 415.
    if(contentType.type !== "application/vnd.api+json") {
      const detail = "The request's Content-Type must be application/vnd.api+json, " +
                   "but you provided " + contentType.type + ".";

      reject(new APIError(415, undefined, "Invalid Media Type", detail));
    }

    else if(!objectIsEmpty(contentType.parameters)) {
      const detail =
        "The request's Content-Type must be application/vnd.api+json, with " +
        "no parameters. But the Content-Type you provided contained the " +
        `parameters: ${Object.keys(contentType.parameters).join(", ")}.`;

      reject(new APIError(415, undefined, "Invalid Media Type Parameter(s)", detail));
    }

    else {
      resolve();
    }
  });
}
