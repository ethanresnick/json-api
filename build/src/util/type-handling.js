"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function objectIsEmpty(obj) {
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    for (const key in obj) {
        if (hasOwnProperty.call(obj, key))
            return false;
    }
    return true;
}
exports.objectIsEmpty = objectIsEmpty;
function mapObject(obj, mapFn) {
    const mappedObj = Object.assign({}, obj);
    for (const key in mappedObj) {
        mappedObj[key] = mapFn(obj[key]);
    }
    return mappedObj;
}
exports.mapObject = mapObject;
function groupResourcesByType(data) {
    return data.reduce((acc, it) => {
        acc[it.type] = [...(acc[it.type] || []), it];
        return acc;
    }, Object.create(null));
}
exports.groupResourcesByType = groupResourcesByType;
function forEachArrayOrVal(arrayOrVal, eachFn) {
    Array.isArray(arrayOrVal) ? arrayOrVal.forEach(eachFn) : eachFn(arrayOrVal);
}
exports.forEachArrayOrVal = forEachArrayOrVal;
