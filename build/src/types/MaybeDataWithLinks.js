"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Data_1 = require("./Data");
const type_handling_1 = require("../util/type-handling");
class MaybeDataWithLinks {
    constructor({ data, links = {} }) {
        this.links = links;
        this.data = typeof data === 'undefined' || data instanceof Data_1.default
            ? data
            : Data_1.default.fromJSON(data);
    }
    get values() {
        return this.data ? [...this.data.values] : [];
    }
    map(fn) {
        const Ctor = this.constructor;
        return new Ctor({
            data: this.data && this.data.map(fn),
            links: this.links
        });
    }
    mapAsync(fn) {
        const Ctor = this.constructor;
        return this.data
            ? this.data.mapAsync(fn)
                .then(newData => new Ctor({ data: newData, links: this.links }))
            : Promise.resolve(this);
    }
    flatMap(fn) {
        const Ctor = this.constructor;
        return new Ctor({
            data: this.data && this.data.flatMap(fn),
            links: this.links
        });
    }
    flatMapAsync(fn) {
        const Ctor = this.constructor;
        return this.data
            ? this.data.flatMapAsync(fn)
                .then(newData => new Ctor({ data: newData, links: this.links }))
            : Promise.resolve(this);
    }
    unwrapWith(fn, linkTemplateData) {
        return {
            links: type_handling_1.mapObject(this.links, (template) => template(linkTemplateData)),
            data: this.data && this.data.map(fn).unwrap()
        };
    }
    every(fn) {
        return this.data ? this.data.every(fn) : true;
    }
    reduce(fn, initialValue) {
        return this.data ? this.data.reduce(fn, initialValue) : initialValue;
    }
    forEach(fn) {
        this.data && this.data.forEach(fn);
    }
}
exports.default = MaybeDataWithLinks;
;
