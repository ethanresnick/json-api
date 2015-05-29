/**
 * Takes an arbitrary path string e.g. "user.contact.phone" and locates the
 * corresponding property on an object `obj` and deletes it (ie. does
 * `delete obj.user.contact.phone`). It doesn't use eval, which makes it safer.
 */
export function deleteNested(path, object) {
  try {
    let pathParts = path.split(".");
    let lastPartIndex = pathParts.length - 1;
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
    return false;
  }
}

/**
 * Returns whether one array's items are a subset of those in the other.
 * Both array's elements are assumed to be unique.
 */
export function isSubsetOf(setArr, potentialSubsetArr) {
  const set = new Set(setArr);

  return potentialSubsetArr.every((it) => set.has(it) === true);
}

export function isPlainObject(obj) {
  return typeof obj === "object" && !(Array.isArray(obj) || obj === null);
}
