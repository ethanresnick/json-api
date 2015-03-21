"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/**
 * Takes an arbitrary path string e.g. "user.contact.phone" and locates the
 * corresponding property on an object `obj` and deletes it (ie. does
 * `delete obj.user.contact.phone`). It doesn't use eval, which makes it safer.
 */
exports.deleteNested = deleteNested;

/**
 * Returns whether one array's items are a subset of those in the other.
 * Both array's elements are assumed to be unique.
 */
exports.isSubsetOf = isSubsetOf;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var polyfill = _interopRequire(require("babel/polyfill"));

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
    console.log("deleteNested failed with path: " + path + ", on object: " + JSON.stringify(object));
    return false;
  }
}

function isSubsetOf(setArr, potentialSubsetArr) {
  var set = new Set(setArr);

  return potentialSubsetArr.every(function (it) {
    return set.has(it) === true;
  });
}