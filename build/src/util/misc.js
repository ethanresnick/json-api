/**
 * Takes an arbitrary path string e.g. "user.contact.phone" and locates the
 * corresponding property on an object `obj` and deletes it (ie. does
 * `delete obj.user.contact.phone`). It doesn't use eval, which makes it safer.
 */
"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

var _Set = require("babel-runtime/core-js/set")["default"];

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.deleteNested = deleteNested;
exports.isSubsetOf = isSubsetOf;
exports.isPlainObject = isPlainObject;

function deleteNested(path, object) {
  try {
    var pathParts = path.split(".");
    var lastPartIndex = pathParts.length - 1;
    var lastPart = pathParts[lastPartIndex];
    var containingParts = pathParts.slice(0, lastPartIndex);
    var container = containingParts.reduce(function (obj, part) {
      return obj[part];
    }, object);

    if (container.hasOwnProperty(lastPart)) {
      delete container[lastPart];
      return true;
    } else {
      throw new Error("The last property in the path didn't exist on the object.");
    }
  } catch (error) {
    return false;
  }
}

/**
 * Returns whether one array's items are a subset of those in the other.
 * Both array's elements are assumed to be unique.
 */

function isSubsetOf(setArr, potentialSubsetArr) {
  var set = new _Set(setArr);

  return potentialSubsetArr.every(function (it) {
    return set.has(it) === true;
  });
}

function isPlainObject(obj) {
  return typeof obj === "object" && !(Array.isArray(obj) || obj === null);
}