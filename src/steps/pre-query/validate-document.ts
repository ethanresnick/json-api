import APIError from "../../types/APIError";

export default function(body) {
  return new Promise(function(resolve, reject) {
    const ownProp = Object.prototype.hasOwnProperty;
    const errMessage = "Request body is not a valid JSON API document.";

    if(typeof body !== "object" || !ownProp.call(body, "data")) {
      reject(new APIError(400, undefined, errMessage));
    }

    else {
      resolve(undefined);
    }
  });
}
