"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/**
 * Takes in a constructor function that takes no arguments and returns a new one
 * that takes one argument representing initial values. These initial values
 * will be applied to the properties that exist on the object returned by the
 * input constructor function immediately post-creation. Then the object will be
 * sealed so that no properties can be added or deleted--a nice sanity check.
 */
exports.ValueObject = ValueObject;
exports.objectIsEmpty = objectIsEmpty;

/**
 * If `resourceOrCollection` is a collection, it applies `mapFn` to each of
 * its resources; otherwise, if `resourceOrCollection` is a single resource,
 * it applies `mapFn` just to that resource. This abstracts a common pattern.
 */
exports.mapResources = mapResources;
exports.forEachResources = forEachResources;
exports.mapArrayOrVal = mapArrayOrVal;
exports.forEachArrayOrVal = forEachArrayOrVal;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var Collection = _interopRequire(require("../types/Collection"));

function ValueObject(constructorFn) {
  return function (initialValues) {
    var obj = new constructorFn();
    var hasOwnProp = Object.prototype.hasOwnProperty;

    // Use initial values where possible.
    if (initialValues) {
      for (var key in obj) {
        if (hasOwnProp.call(obj, key) && hasOwnProp.call(initialValues, key)) {
          obj[key] = initialValues[key];
        }
      }
    }

    // Object.seal prevents any other properties from being added to the object.
    // Every property an object needs should be set by the original constructor.
    return Object.seal(obj);
  };
}

function objectIsEmpty(obj) {
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  for (var key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}

function mapResources(resourceOrCollection, mapFn) {
  if (resourceOrCollection instanceof Collection) {
    return resourceOrCollection.resources.map(mapFn);
  } else {
    return mapFn(resourceOrCollection);
  }
}

function forEachResources(resourceOrCollection, eachFn) {
  /*eslint-disable no-unused-expressions */
  if (resourceOrCollection instanceof Collection) {
    resourceOrCollection.resources.forEach(eachFn);
  } else {
    return eachFn(resourceOrCollection);
  }
  /*eslint-enable */
}

function mapArrayOrVal(arrayOrVal, mapFn) {
  return Array.isArray(arrayOrVal) ? arrayOrVal.map(mapFn) : mapFn(arrayOrVal);
}

function forEachArrayOrVal(arrayOrVal, eachFn) {
  /*eslint-disable no-unused-expressions */
  Array.isArray(arrayOrVal) ? arrayOrVal.forEach(eachFn) : eachFn(arrayOrVal);
  /*eslint-enable */
}