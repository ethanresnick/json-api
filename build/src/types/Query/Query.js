"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Query {
    constructor(opts) {
        if (!opts.using) {
            throw new Error("`using` option is required.");
        }
        this.query = {
            using: opts.using
        };
    }
    clone() {
        const clone = Object.create(this.constructor.prototype);
        clone.query = this.query;
        return clone;
    }
    get using() {
        return this.query.using;
    }
}
exports.default = Query;
