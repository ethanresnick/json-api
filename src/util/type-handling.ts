import Data from "../types/Generic/Data";
import Resource from "../types/Resource";

export function objectIsEmpty(obj) {
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }
  return true;
}

export function mapObject(obj, mapFn) {
  const mappedObj = {...obj};

  for(const key in mappedObj) {
    mappedObj[key] = mapFn(obj[key]);
  }

  return mappedObj;
}

export function groupResourcesByType(data: Data<Resource>) {
  return data.reduce((acc: { [type: string]: Resource[] }, it) => {
    acc[it.type] = [...(acc[it.type] || []), it];
    return acc;
  }, Object.create(null));
}

export function forEachArrayOrVal(arrayOrVal, eachFn) {
  /*eslint-disable no-unused-expressions */
  Array.isArray(arrayOrVal) ? arrayOrVal.forEach(eachFn) : eachFn(arrayOrVal);
  /*eslint-enable */
}
