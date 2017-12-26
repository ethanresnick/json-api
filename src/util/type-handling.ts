import Data from "../types/Data";
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


/**
 * The Maybe monad, except that pure(undefined) returns Nothing, rather than
 * Just undefined. Also, we match js's convention from Promise of not requiring
 * the user's bind() argument to always return the monad (i.e., we merge bind
 * and map); if a raw value x is returned, it's converted to Maybe(x).
 * Note: normally Nothing would be a single value not a class, but making it
 * a class helps Typescript.
 */
export type Maybe<U> = Just<U> | Nothing<U>;

export class Nothing<T> {
  getOrDefault(defaultVal?: T): T | undefined {
    return defaultVal;
  }

  bind<U>(transform: (v: T) => Maybe<U> | U | undefined): Maybe<U> {
    return this as any as Nothing<U>;
  }

  map<U>(transform: (v: T) => U | undefined): Maybe<U> {
    return this as any as Nothing<U>;
  }
};

export class Just<T> {
  private val: T;

  constructor(x: T) {
    this.val = x;
  }

  getOrDefault(defaultVal?: T): T | undefined {
    return this.val;
  }

  map<U>(transform: (v: T) => U | undefined): Maybe<U> {
    return Maybe(transform(this.val));
  }

  bind<U>(transform: (v: T) => Maybe<U> | U | undefined): Maybe<U> {
    const transformed = transform(this.val);

    if(transformed instanceof Just || transformed instanceof Nothing) {
      return transformed;
    }

    else {
      return Maybe(transformed);
    }
  }
}

export function Maybe<T>(x: T | undefined): Maybe<T> {
  // Sometimes, null is a valid value, so we only make undefined into Nothing.
  return x !== undefined ? new Just(x) : new Nothing<T>();
}
