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
class Nothing {
    getOrDefault(defaultVal) {
        return defaultVal;
    }
    bind(transform) {
        return this;
    }
    map(transform) {
        return this;
    }
}
exports.Nothing = Nothing;
;
class Just {
    constructor(x) {
        this.val = x;
    }
    getOrDefault(defaultVal) {
        return this.val;
    }
    map(transform) {
        return Maybe(transform(this.val));
    }
    bind(transform) {
        const transformed = transform(this.val);
        if (transformed instanceof Just || transformed instanceof Nothing) {
            return transformed;
        }
        else {
            return Maybe(transformed);
        }
    }
}
exports.Just = Just;
function Maybe(x) {
    return x !== undefined ? new Just(x) : new Nothing();
}
exports.Maybe = Maybe;
