"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Collection {
    constructor(resources = []) {
        this.resources = resources;
    }
    get ids() {
        return this.resources.map(it => it.id);
    }
    get types() {
        return this.resources.map(it => it.type);
    }
    add(resource) {
        this.resources.push(resource);
    }
}
exports.default = Collection;
