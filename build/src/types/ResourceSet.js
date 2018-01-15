"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MaybeDataWithLinks_1 = require("./MaybeDataWithLinks");
class ResourceSet extends MaybeDataWithLinks_1.default {
    constructor(it) {
        if (typeof it.data === 'undefined') {
            throw new Error("Cannot construct a ResourceSet with missing data.");
        }
        super(it);
    }
    get ids() {
        return this._data.map(it => it.id);
    }
    get types() {
        return this._data.map(it => it.type);
    }
    toJSON(urlTemplates) {
        return this.unwrapWith((it) => it.toJSON(urlTemplates[it.type] || {}), {});
    }
    static of(it) {
        return new this(it);
    }
}
exports.default = ResourceSet;
