import Q from "q";
import {groupResourcesByType} from "../../util/type-handling";
import {arrayContains} from "../../util/arrays";
import {isSubsetOf} from "../../util/misc";
import APIError from "../../types/APIError";

export default function(body) {
  return Q.Promise(function(resolve, reject) {
    let ownProp = Object.prototype.hasOwnProperty;
    let errMessage = "Request body is not a valid JSON API document.";

    if(typeof body !== "object" || !ownProp.call(body, "data")) {
      reject(new APIError(400, null, errMessage));
    }

    else {
      resolve();
    }
  });
}
