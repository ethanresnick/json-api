"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Query {
    constructor(opts) {
        if (!opts.type) {
            throw new Error("`using` option is required.");
        }
        this.query = {
            type: opts.type
        };
    }
    clone() {
        const clone = Object.create(this.constructor.prototype);
        clone.query = this.query;
        return clone;
    }
    get type() {
        return this.query.type;
    }
    forType(type) {
        const res = this.clone();
        res.query = Object.assign({}, res.query, { using: type });
        return res;
    }
}
exports.default = Query;
