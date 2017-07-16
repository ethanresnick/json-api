"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
const concat = Function.bind.call(Function.call, Array.prototype.concat);
const keys = Reflect.ownKeys;
function entries(o) {
    return reduce(keys(o), (e, k) => {
        return concat(e, typeof k === 'string' && isEnumerable(o, k) ? [[k, o[k]]] : []);
    }, []);
}
exports.entries = entries;
;
function values(o) {
    return reduce(keys(o), (v, k) => {
        return concat(v, typeof k === 'string' && isEnumerable(o, k) ? [o[k]] : []);
    }, []);
}
exports.values = values;
;
