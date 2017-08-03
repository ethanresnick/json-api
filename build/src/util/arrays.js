"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function arrayUnique(array) {
    return Array.from(new Set(array).values());
}
exports.arrayUnique = arrayUnique;
function arrayValuesMatch(array1, array2) {
    return array1.length === array2.length &&
        array1.sort().join() === array2.sort().join();
}
exports.arrayValuesMatch = arrayValuesMatch;
function arrayContains(arr, value) {
    return arr.includes(value);
}
exports.arrayContains = arrayContains;
