import dasherize from "dasherize";
import camelize from "../util/camelize";
import Resource from "../types/Resource";
import Collection from "../types/Collection";

export function dasherizeResource(resource) {
  return transformResourceKeys(resource, dasherize);
}

export function dasherizeResourceOrCollection(toDasherize, registry) {
  return transformResourceOrCollection(toDasherize, dasherizeResource, registry);
}

export function camelizeResource(resource) {
  return transformResourceKeys(resource, camelize);
}

export function camelizeResourceOrCollection(toCamelize, registry) {
  return transformResourceOrCollection(toCamelize, camelizeResource, registry);
}

function transformResourceKeys(resource, transformFn) {
  for (let key in resource.attrs) {
    let transformedKey = transformFn(key);
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
        return transformFn(r);
      }
      return r;
    });
    return toTransform;
  }
  else if (toTransform instanceof Resource) {
    if (registry.behaviors(toTransform.type).dasherizeOutput.enabled) {
      return transformFn(toTransform);
    }
  }

  throw new TypeError("Input must be a Resource or a Collection");
}
