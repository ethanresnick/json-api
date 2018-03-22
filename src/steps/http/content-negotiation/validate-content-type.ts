import contentTypeParser = require("content-type");
import { Request } from "../../../types";
import * as Errors from "../../../util/errors";
import { objectIsEmpty } from "../../../util/misc";

export default async function validateContentType(
  request: Pick<Request, "contentType">,
  supportedExt?
) {
  // note: contentTypeParser correctly handles undefined.
  const contentType = contentTypeParser.parse(request.contentType);

  // Removed due to issues with Firefox automatically adding charset parameter
  // See: https://github.com/ethanresnick/json-api/issues/78
  delete contentType.parameters.charset;

  // In the future, we might delegate back to the framework if the client
  // provides a base content type other than json-api's. But, for now, we 415.
  if(contentType.type !== "application/vnd.api+json") {
    throw Errors.generic415({
      detail:
        "The request's Content-Type must be application/vnd.api+json, " +
        `but you provided ${contentType.type}.`
    });
  }

  else if(!objectIsEmpty(contentType.parameters)) {
    throw Errors.invalidMediaTypeParam({
      detail:
        "The request's Content-Type must be application/vnd.api+json, " +
        "with no parameters. But the Content-Type you provided contained the " +
        `parameters: ${Object.keys(contentType.parameters).join(", ")}.`
    });
  }
}
