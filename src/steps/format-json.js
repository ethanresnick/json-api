import dasherize from "dasherize";
import camelize from "../util/camelize";

export function dasherizeResource(resource) {
  return transformResourceKeys(resource, dasherize);
}

export function camelizeResource(resource) {
  return transformResourceKeys(resource, camelize);
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
