import dasherize from "dasherize";
import camelize from "../util/camelize";
import Resource from "../types/Resource";
import Collection from "../types/Collection";

export function dasherizeResource(resource, registry) {
  let exceptions = registry.behaviors(resource.type).dasherizeOutput.exceptions;
  return transformResourceKeys(resource, dasherize, exceptions);
}

export function dasherizeResourceOrCollection(toDasherize, registry) {
  return transformResourceOrCollection(toDasherize, dasherizeResource, registry);
}

export function camelizeResource(resource, registry) {
  let exceptions = registry.behaviors(resource.type).dasherizeOutput._inverseExceptions;
  return transformResourceKeys(resource, camelize, exceptions);
}

export function camelizeResourceOrCollection(toCamelize, registry) {
  return transformResourceOrCollection(toCamelize, camelizeResource, registry);
}

function transformResourceKeys(resource, transformFn, exceptions) {
  for (let key in resource.attrs) {
    let transformedKey = exceptions.hasOwnProperty(key) ? exceptions[key] : transformFn(key);
    if (transformedKey !== key) {
      resource.attrs[transformedKey] = resource.attrs[key];
      delete resource.attrs[key];
    }
  }

  return resource;
}

function transformResourceOrCollection(toTransform, transformFn, registry) {
  if (toTransform instanceof Collection) {
    toTransform.resources = toTransform.resources.map(r => {
      if (registry.behaviors(r.type).dasherizeOutput.enabled) {
        return transformFn(r, registry);
      }
      return r;
    });
    return toTransform;
  }
  else if (toTransform instanceof Resource) {
    if (registry.behaviors(toTransform.type).dasherizeOutput.enabled) {
      return transformFn(toTransform, registry);
    }
  }

  throw new TypeError("Input must be a Resource or a Collection");
}
