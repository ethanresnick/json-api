import APIError from "../../types/APIError";
import { Request, requestValidMethods } from "../../types/index";

export default function hasValidMethod({ method }: Request): Promise<void> {
  if(requestValidMethods.indexOf(method) === -1) {
    const detail = `The method "${method}" is not supported.` + 
      (method === "put" ? " See http://jsonapi.org/faq/#wheres-put" : "");

    return Promise.reject(
      new APIError(
        405,
        undefined,
        "Method not supported.",
        detail
      )
    );
  }

  return Promise.resolve();
}
