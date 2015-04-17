import Collection from "../types/Collection";

/**
 * Takes in a constructor function that takes no arguments and returns a new one
 * that takes one argument representing initial values. These initial values
 * will be applied to the properties that exist on the object returned by the
 * input constructor function immediately post-creation. Then the object will be
 * sealed so that no properties can be added or deleted--a nice sanity check.
 */
export function ValueObject(ConstructorFn) {
  return function(initialValues) {
    let obj = new ConstructorFn();
    let hasOwnProp = Object.prototype.hasOwnProperty;

    // Use initial values where possible.
    if(initialValues) {
      for(let key in obj) {
        if(hasOwnProp.call(obj, key) && hasOwnProp.call(initialValues, key)) {
          obj[key] = initialValues[key];
        }
      }
    }

    // Object.seal prevents any other properties from being added to the object.
    // Every property an object needs should be set by the original constructor.
    return Object.seal(obj);
  };
}

export function objectIsEmpty(obj) {
  let hasOwnProperty = Object.prototype.hasOwnProperty;
  for (let key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }
  return true;
}

export function mapObject(obj, mapFn) {
  let mappedObj = Object.assign({}, obj);

  for(let key in mappedObj) {
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
  const resourcesByType = {};
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
