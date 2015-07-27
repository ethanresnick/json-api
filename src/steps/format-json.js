import dasherize from "dasherize";
import camelize from "../util/camelize";

export function dasherizeKeys(json, exceptions) {
  return transformKeys(json, dasherize, exceptions);
}

export function camelizeKeys(json, exceptions) {
  return transformKeys(json, camelize, exceptions);
}

function transformKeys(json, transformFn, exceptions) {
  for (let key in json.attributes) {
    let transformedKey = exceptions.hasOwnProperty(key) ? exceptions[key] : transformFn(key);
    if (transformedKey !== key) {
      json.attributes[transformedKey] = json.attributes[key];
      delete json.attributes[key];
    }
  }

  return json;
}
