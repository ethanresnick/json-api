"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function inherit(child, parent) {
    const __hasProp = {}.hasOwnProperty;
    for (const key in parent) {
        if (__hasProp.call(parent, key))
            child[key] = parent[key];
    }
    function Ctor() { this.constructor = child; }
    Ctor.prototype = parent.prototype;
    child.prototype = new Ctor();
    return child;
}
exports.inherit = inherit;
;
