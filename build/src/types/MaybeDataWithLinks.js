"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Data_1 = require("./Generic/Data");
const type_handling_1 = require("../util/type-handling");
class MaybeDataWithLinks {
    constructor({ data, links = {} }) {
        this.links = links;
        this._data = typeof data === 'undefined' || data instanceof Data_1.default
            ? data
            : Data_1.default.fromJSON(data);
    }
    get values() {
        return this._data ? [...this._data.values] : [];
    }
    map(fn) {
        return this.delegateDataTransformToParent("map", arguments);
    }
    flatMap(fn) {
        return this.delegateDataTransformToParent("flatMap", arguments);
    }
    filter(fn) {
        return this.delegateDataTransformToParent("filter", arguments);
    }
    mapAsync(fn) {
        return this.delegateDataTransformToParentAsync("mapAsync", arguments);
    }
    flatMapAsync(fn) {
        return this.delegateDataTransformToParentAsync("flatMapAsync", arguments);
    }
    unwrapWith(fn, linkTemplateData) {
        return {
            links: type_handling_1.mapObject(this.links, (template) => template(linkTemplateData)),
            data: this.unwrapDataWith(fn)
        };
    }
    unwrapDataWith(fn) {
        return this._data && this._data.map(fn).unwrap();
    }
    every(fn) {
        return this._data ? this._data.every(fn) : true;
    }
    some(fn) {
        return this._data ? this._data.some(fn) : false;
    }
    reduce(fn, initialValue) {
        return this._data ? this._data.reduce(fn, initialValue) : initialValue;
    }
    forEach(fn) {
        this._data && this._data.forEach(fn);
        return this;
    }
    clone() {
        const Ctor = this.constructor;
        return new Ctor({
            data: this._data,
            links: this.links
        });
    }
    delegateDataTransformToParent(methodName, args) {
        return this._data
            ? this.withNewData(this._data[methodName](...args))
            : this;
    }
    delegateDataTransformToParentAsync(methodName, args) {
        return this._data
            ? this._data[methodName](...args)
                .then(newData => this.withNewData(newData))
            : Promise.resolve(this);
    }
    withNewData(newData) {
        const res = this.clone();
        res._data = newData;
        return res;
    }
}
exports.default = MaybeDataWithLinks;
;
