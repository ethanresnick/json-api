import Collection from "../types/Collection"

/**
 * Takes an arbitrary path string e.g. "user.contact.phone" and locates the
 * corresponding property on an object `obj` and deletes it (ie. does
 * `delete obj.user.contact.phone`). It doesn't use eval, which makes it safer.
 */
export function deleteNested(path, object) {
  try {
    let pathParts = path.split(".");
    let lastPartIndex = pathParts.length-1;
    let lastPart = pathParts[lastPartIndex];
    let containingParts = pathParts.slice(0, lastPartIndex);
    let container = containingParts.reduce(((obj, part) => obj[part]), object);

    if(container.hasOwnProperty(lastPart)) {
      delete container[lastPart];
      return true;
    }
    else {
      throw new Error("The last property in the path didn't exist on the object.");
    }
  }

  catch(error) {
    console.log("deleteNested failed with path: " + path + ", on object: " + JSON.stringify(object));
    return false;
  }
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

export function mapArrayOrVal(arrayOrVal, mapFn) {
  return Array.isArray(arrayOrVal) ? arrayOrVal.map(mapFn) : mapFn(arrayOrVal);
}

export function forEachArrayOrVal(arrayOrVal, eachFn) {
  /*eslint-disable no-unused-expressions */
  Array.isArray(arrayOrVal) ? arrayOrVal.forEach(eachFn) : eachFn(arrayOrVal);
  /*eslint-enable */
}

export function arrayUnique(array) {
  return array.filter((a, b, c) => c.indexOf(a, b+1) < 0);
}

export function arrayValuesMatch(array1, array2) {
  return array1.length === array2.length &&
    array1.sort().join() === array2.sort().join();
}

export function objectIsEmpty(obj) {
  let hasOwnProperty = Object.prototype.hasOwnProperty;
  for (let key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }
  return true;
}
