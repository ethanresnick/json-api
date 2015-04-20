

/**
 * Takes in a constructor function that takes no arguments and returns a new one
 * that takes one argument representing initial values. These initial values
 * will be applied to the properties that exist on the object returned by the
 * input constructor function immediately post-creation. Then the object will be
 * sealed so that no properties can be added or deleted--a nice sanity check.
 */
"use strict";

var _core = require("babel-runtime/core-js")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

exports.ValueObject = ValueObject;
exports.objectIsEmpty = objectIsEmpty;
exports.mapObject = mapObject;

/**
 * If `resourceOrCollection` is a collection, it applies `mapFn` to each of
 * its resources; otherwise, if `resourceOrCollection` is a single resource,
 * it applies `mapFn` just to that resource. This abstracts a common pattern.
 */
exports.mapResources = mapResources;
exports.forEachResources = forEachResources;
exports.groupResourcesByType = groupResourcesByType;
exports.forEachArrayOrVal = forEachArrayOrVal;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var Collection = _interopRequire(require("../types/Collection"));

function ValueObject(ConstructorFn) {
  return function (initialValues) {
    var obj = new ConstructorFn();
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
    return _core.Object.seal(obj);
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

function mapObject(obj, mapFn) {
  var mappedObj = _core.Object.assign({}, obj);

  for (var key in mappedObj) {
    mappedObj[key] = mapFn(obj[key]);
  }

  return mappedObj;
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

function groupResourcesByType(resourceOrCollection) {
  var resourcesByType = {};
  if (resourceOrCollection instanceof Collection) {
    resourceOrCollection.resources.forEach(function (it) {
      resourcesByType[it.type] = resourcesByType[it.type] || [];
      resourcesByType[it.type].push(it);
    });
  } else {
    resourcesByType[resourceOrCollection.type] = [resourceOrCollection];
  }
  return resourcesByType;
}

function forEachArrayOrVal(arrayOrVal, eachFn) {
  /*eslint-disable no-unused-expressions */
  Array.isArray(arrayOrVal) ? arrayOrVal.forEach(eachFn) : eachFn(arrayOrVal);
  /*eslint-enable */
}