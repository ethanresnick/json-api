import { isPlainObject } from "../../util/misc";
import APIError from "../../types/APIError";

export default async function(body) {
  if(!isPlainObject(body) || !Object.prototype.hasOwnProperty.call(body, "data")) {
    throw new APIError({
      status: 400,
      title: "Request body is not a valid JSON API document."
    });
  }
}
