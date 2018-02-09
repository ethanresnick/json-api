import Data from "../types/Generic/Data";
import Resource from "../types/Resource";
import { Reduceable } from '../types';

export function objectIsEmpty(obj: object) {
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }
  return true;
}

export function groupResourcesByType(data: Data<Resource> | Resource[]) {
  return partition('type', data);
}

/**
 * Takes a reducable set of items and partitions those items based on the
 * return value of a function run over each item or, for convenience, a string
 * property name. Returns an object where the keys are (the stringified version
 * of) the value that each object in the partition matched on. The value at
 * each key is an array of items.
 */
export function partition<T>(
  fnOrKey: ((it: T) => string) | string,
  items: Reduceable<T, { [partitionName: string]: T[] }>
) {
  const partitionFn = typeof fnOrKey === 'function'
    ? fnOrKey
    : (it: T) => it[fnOrKey] as string;

  return items.reduce((acc, item) => {
    const partitionName = partitionFn(item);
    acc[partitionName] = [...(acc[partitionName] || []), item];
    return acc;
  }, Object.create(null));
}
