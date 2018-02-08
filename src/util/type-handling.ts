import Data from "../types/Generic/Data";
import Resource from "../types/Resource";

export function objectIsEmpty(obj: object) {
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }
  return true;
}

export function groupResourcesByType(data: Data<Resource>) {
  return data.reduce<{ [type: string]: Resource[] }>((acc, it) => {
    acc[it.type] = [...(acc[it.type] || []), it];
    return acc;
  }, Object.create(null));
}
