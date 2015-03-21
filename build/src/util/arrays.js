"use strict";

exports.arrayUnique = arrayUnique;
exports.arrayValuesMatch = arrayValuesMatch;
exports.arrayContains = arrayContains;
Object.defineProperty(exports, "__esModule", {
  value: true
});

function arrayUnique(array) {
  return array.filter(function (a, b, c) {
    return c.indexOf(a, b + 1) < 0;
  });
}

function arrayValuesMatch(array1, array2) {
  return array1.length === array2.length && array1.sort().join() === array2.sort().join();
}

function arrayContains(arr, value) {
  if (!Number.isNaN(value)) {
    return arr.indexOf(value) !== -1;
  } else {
    return arr.some(Number.isNaN) === true;
  }
}