"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Query {
    constructor(opts) {
        if (!opts.type) {
            throw new Error("`type` option is required.");
        }
        this.query = {
            type: opts.type,
            returning: opts.returning,
            catch: opts.catch
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
    get returning() {
        return this.query.returning;
    }
    get catch() {
        return this.query.catch;
    }
    resultsIn(success, fail) {
        const res = this.clone();
        if (success) {
            res.query.returning = success;
        }
        if (fail) {
            res.query.catch = fail;
        }
        return res;
    }
    forType(type) {
        const res = this.clone();
        res.query = Object.assign({}, res.query, { type });
        return res;
    }
}
exports.default = Query;
