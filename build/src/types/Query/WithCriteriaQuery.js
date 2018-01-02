"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("./Query");
const R = require("ramda");
class WithCriteriaQuery extends Query_1.default {
    constructor(opts) {
        super(opts);
        if (opts.id && opts.ids) {
            throw new Error("Can't provide both the id and the ids options. Pick one.");
        }
        this.query = Object.assign({}, this.query, { criteria: Object.assign({}, this.query.criteria, { where: {
                    operator: "and",
                    value: [...(opts.filters || [])],
                    field: undefined
                }, singular: opts.singular || opts.id !== undefined, limit: opts.limit, offset: opts.offset }) });
        if (opts.ids || opts.id) {
            this.query = this.matchingIdOrIds(opts.ids || opts.id).query;
        }
    }
    andWhere(constraint) {
        if (this.query.criteria.where.operator !== 'and') {
            throw new Error("Where criteria is always an and predicate");
        }
        const res = this.clone();
        res.query = Object.assign({}, res.query, { criteria: Object.assign({}, res.query.criteria, { where: Object.assign({}, res.query.criteria.where, { value: [
                        ...res.query.criteria.where.value,
                        constraint
                    ] }) }) });
        return res;
    }
    matchingIdOrIds(idOrIds = undefined) {
        let res;
        if (Array.isArray(idOrIds)) {
            res = this.andWhere({
                field: "id",
                operator: "in",
                value: idOrIds.map(String)
            });
        }
        else if (typeof idOrIds === "string" && idOrIds) {
            res = this.andWhere({
                field: "id",
                operator: "eq",
                value: String(idOrIds)
            });
            res.query = Object.assign({}, res.query, { criteria: Object.assign({}, res.query.criteria, { singular: true }) });
        }
        else {
            res = this;
        }
        return res;
    }
    getFilters() {
        return R.clone(this.query.criteria.where);
    }
    removeFilter(filter) {
        const res = this.clone();
        res.query.criteria.where.value =
            res.query.criteria.where.value.filter(it => !R.equals(it, filter));
        return res;
    }
    get offset() {
        return this.query.criteria.offset;
    }
    get limit() {
        return this.query.criteria.limit;
    }
    get singular() {
        return this.query.criteria.singular;
    }
}
exports.default = WithCriteriaQuery;
