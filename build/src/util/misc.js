/**
 * Takes an arbitrary path string e.g. "user.contact.phone" and locates the
 * corresponding property on an object `obj` and deletes it (ie. does
 * `delete obj.user.contact.phone`). It doesn't use eval, which makes it safer.
 */
"use strict";

var _Set = require("babel-runtime/core-js/set")["default"];

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deleteNested = deleteNested;
exports.isSubsetOf = isSubsetOf;
exports.isPlainObject = isPlainObject;
exports.pseudoTopSort = pseudoTopSort;

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

/**
 * Perform a pseudo-topological sort on the provided graph. Pseudo because it
 * assumes that each node only has 0 or 1 incoming edges, as is the case with
 * graphs for parent-child inheritance hierarchies (w/o multiple inheritance).
 * Uses https://en.wikipedia.org/wiki/Topological_sorting#Kahn.27s_algorithm
 *
 * @param  {string[]} nodes A list of nodes, where each node is just a string.
 *
 * @param {string[]} roots The subset of nodes that have no incoming edges.
 *
 * @param  {object} edges The edges, expressed such that each key is a starting
 * node A, and the value is a set of nodes (as an object literal like
 * {nodeName: true}) for each of which there is an edge from A to that node.
 *
 * @return {string[]} The nodes, sorted.
 */

function pseudoTopSort(nodes, edges, roots) {
  // Do some defensive copying, in case the caller didn't.
  roots = roots.slice();
  nodes = nodes.slice();
  edges = _Object$assign({}, edges);
  for (var key in edges) {
    edges[key] = _Object$assign({}, edges[key]);
  }

  // "L = Empty list that will contain the sorted elements"
  var sortResult = [];

  // "while S is non-empty do"
  while (roots.length) {
    // "remove a node n from S"
    // We shift() instead of pop() to we preserve more of the
    // original order, in case it was significant to the user.
    var thisRoot = roots.shift();
    var thisRootChildren = edges[thisRoot] || {};

    // "add n to tail of L"
    sortResult.push(thisRoot);

    // "for each node m with an edge e from n to m do"
    for (var child in thisRootChildren) {
      // "remove edge e from the graph"
      delete thisRootChildren[child];

      // SKIP: "if m has no other incoming edges..."
      // we don't need this check because we assumed max 1 incoming edge.
      // But: "then insert m into S".
      roots.push(child);
    }
  }

  return sortResult;
}