import { Request, ValidatedRequest } from "../../types/index";
import hasValidMethod from "./has-valid-method";
import hasValidContentType from "./has-valid-content-type";
import hasValidJSONAPIDocAsBody from "./has-valid-jsonapi-doc-body";

export default function(extraRequestValidators = []) {
  return function (request: Request) {
    return Promise.all([
      hasValidMethod(request), 
      hasValidContentType(request), 
      hasValidJSONAPIDocAsBody(request),
      ...extraRequestValidators.map(f => f(request))
    ]).then(() => request as ValidatedRequest);
  }
}