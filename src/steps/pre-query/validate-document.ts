import { isPlainObject } from "../../util/misc";
import * as Errors from "../../util/errors";

export default async function(body) {
  if(!isPlainObject(body) || !Object.prototype.hasOwnProperty.call(body, "data")) {
    throw Errors.missingDataKey();
  }
}
