//import R = require("ramda");
import APIError from "../../types/APIError";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import { ValidatedRequest, Query } from "../../types";
import makePrimaryCreateQuery from "./make-primary-create-query";
import makePrimaryFindQuery from './make-primary-find-query';
import makePrimaryUpdateQuery from './make-primary-update-query';
import makePrimaryRemoveQuery from './make-primary-remove-query';

export default function(request: ValidatedRequest, registry: ResourceTypeRegistry): Promise<Query> {
  switch(request.method) {
    case 'get':
      return makePrimaryFindQuery(request, registry);

    case 'patch':
      return makePrimaryUpdateQuery(request);

    case 'post':
      return makePrimaryCreateQuery(request);

    case 'delete':
      return makePrimaryRemoveQuery(request);

    default:
      // By the time we're here, the request method should 
      // be gauranteed to be one of the above.
      throw new Error("Unexpected request method.");
  }
}

export const assertBodyAbsent = (request: ValidatedRequest) => 
  assert(typeof request.body !== 'undefined')
  (new APIError(400, undefined, "This request needs a body, but didn't have one."));

export const assertBodyPresent = (request: ValidatedRequest) => 
  assert(typeof request.body === 'undefined')
  (new APIError(400, undefined, "This request should not have a body, but does."));

function assert(condition: boolean) {
  return (error: Error) => { 
    if(!condition) throw error; 
  }
}