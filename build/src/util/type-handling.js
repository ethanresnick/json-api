"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Collection_1 = require("../types/Collection");
function ValueObject(ConstructorFn) {
    return function (initialValues) {
        const obj = new ConstructorFn();
        const hasOwnProp = Object.prototype.hasOwnProperty;
        if (initialValues) {
            for (const key in obj) {
                if (hasOwnProp.call(obj, key) && hasOwnProp.call(initialValues, key)) {
                    obj[key] = initialValues[key];
                }
            }
        }
        return Object.seal(obj);
    };
}
exports.ValueObject = ValueObject;
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
function mapResources(resourceOrCollection, mapFn) {
    if (resourceOrCollection instanceof Collection_1.default) {
        return resourceOrCollection.resources.map(mapFn);
    }
    else {
        return mapFn(resourceOrCollection);
    }
}
exports.mapResources = mapResources;
function forEachResources(resourceOrCollection, eachFn) {
    if (resourceOrCollection instanceof Collection_1.default) {
        resourceOrCollection.resources.forEach(eachFn);
    }
    else {
        return eachFn(resourceOrCollection);
    }
}
exports.forEachResources = forEachResources;
function groupResourcesByType(resourceOrCollection) {
    const resourcesByType = Object.create(null);
    if (resourceOrCollection instanceof Collection_1.default) {
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
