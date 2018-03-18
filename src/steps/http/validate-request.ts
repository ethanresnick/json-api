import APIError from "../../types/APIError";
import { Request } from "../../types";

export async function checkBodyExistence(request: Request) {
  const hasBody = typeof request.body !== "undefined";

  const needsBody =
    ["post", "patch"].indexOf(<string>request.method) !== -1 ||
    (request.method === "delete" && request.aboutRelationship) ||
    (request.method === "delete" && !request.id);

  if(hasBody === needsBody) {
    return;
  }

  const errorMsg = needsBody
    ? "This request needs a body, but didn't have one."
    : "This request should not have a body, but does.";

  throw new APIError(400, undefined, errorMsg);
}

export async function checkMethod({ method }: Request) {
  if(["patch", "post", "delete", "get"].indexOf(method) === -1) {
    const detail =
      `The method "${method}" is not supported.` +
      (method === "put" ? " See http://jsonapi.org/faq/#wheres-put" : "");

    throw new APIError(405, undefined, "Method not supported.", detail);
  }
}
