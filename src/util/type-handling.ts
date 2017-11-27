import Collection from "../types/Collection";

/**
 * Takes in a constructor function that takes no arguments and returns a new one
 * that takes one argument representing initial values. These initial values
 * will be applied to the properties that exist on the object returned by the
 * input constructor function immediately post-creation. Then the object will be
 * sealed so that no properties can be added or deleted--a nice sanity check.
 */
export type Ugh<T> = {
  new (initial?: Partial<T>): T;
  (initial?: Partial<T>): T;
};

// This is just an identity mapped type, because ts support for sealed is shit.
//export type Sealed<T> = {
//  [P in keyof T]: T[P];
//}

export function ValueObject<T extends object>(ConstructorFn: { new (): T}): Ugh<T> {
  // Tell TS it's ok to call the returned function with new, even though
  // that use of new won't effect the return and the value the engine
  // allocates will just be discarded (which is why TS warning us about this
  // is very sensible). However, we override TS here because we want the
  // application of ValueObject to a constructor to be transparent (i.e., produce
  // a resulting function with the same API), and the original constructor could
  // be called with new so the new constructor should be called with new too.
  return <Ugh<T>>function(initialValues) {
    const obj = new ConstructorFn();
    const hasOwnProp = Object.prototype.hasOwnProperty;

    // Use initial values where possible.
    if(initialValues) {
      for(const key in obj) {
        if(hasOwnProp.call(obj, key) && hasOwnProp.call(initialValues, key)) {
          obj[key] = <T[keyof T]>initialValues[key];
        }
      }
    }

    // Object.seal prevents any other properties from being added to the object.
    // Every property an object needs should be set by the original constructor.
    return Object.seal(obj);
  };
}

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

/**
 * If `resourceOrCollection` is a collection, it applies `mapFn` to each of
 * its resources; otherwise, if `resourceOrCollection` is a single resource,
 * it applies `mapFn` just to that resource. This abstracts a common pattern.
 */
export function mapResources(resourceOrCollection, mapFn) {
  if(resourceOrCollection instanceof Collection) {
    return resourceOrCollection.resources.map(mapFn);
  }
  else {
    return mapFn(resourceOrCollection);
  }
}

export function forEachResources(resourceOrCollection, eachFn) {
  /*eslint-disable no-unused-expressions */
  if(resourceOrCollection instanceof Collection) {
    resourceOrCollection.resources.forEach(eachFn);
  }
  else {
    return eachFn(resourceOrCollection);
  }
  /*eslint-enable */
}

export function groupResourcesByType(resourceOrCollection) {
  const resourcesByType = Object.create(null);
  if(resourceOrCollection instanceof Collection) {
    resourceOrCollection.resources.forEach((it) => {
      resourcesByType[it.type] = resourcesByType[it.type] || [];
      resourcesByType[it.type].push(it);
    });
  }
  else {
    resourcesByType[resourceOrCollection.type] = [resourceOrCollection];
  }
  return resourcesByType;
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
