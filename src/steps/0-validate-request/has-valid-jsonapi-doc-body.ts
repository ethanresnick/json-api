import APIError from "../../types/APIError";
import { Request } from "../../types/";

export default function(request: Request) {
  return new Promise(function(resolve, reject) {
    const errMessage = "Request body is not a valid JSON API document.";
    const missingBoddyError = new APIError(400, null, errMessage);

    switch(typeof request.body) {
      // If there's no body we skip this check.
      case 'undefined':
        resolve();
        break;

      case 'object': {
        !Object.prototype.hasOwnProperty.call(request.body, "data") 
          ? reject(missingBoddyError)
          : resolve();
        break; 
      }

      default: 
        reject(missingBoddyError);
    }
  });
}
