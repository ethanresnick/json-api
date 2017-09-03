"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("./Query");
class WithCriteriaQuery extends Query_1.default {
    constructor(opts) {
        super(opts);
        this.query = Object.assign({}, this.query, { criteria: Object.assign({}, this.query.criteria, { where: {
                    operator: "and",
                    value: [...(opts.filters || [])],
                    field: undefined
                }, singular: opts.singular || false, limit: opts.limit, offset: opts.offset }) });
        if ('idOrIds' in opts) {
            this.query = this.matchingIdOrIds(opts.idOrIds).query;
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
            res.query = Object.assign({}, res.query, { criteria: Object.assign({}, res.query.criteria, { singular: false }) });
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
            res = this.clone();
            res.query = Object.assign({}, res.query, { criteria: Object.assign({}, res.query.criteria, { singular: false }) });
        }
        return res;
    }
    getIdOrIds() {
        const idRestrictions = this.query.criteria.where.value.filter(it => it.field === 'id');
        if (idRestrictions.length > 1) {
            throw new Error("Expected only one id criterion to be present.");
        }
        return idRestrictions[0]
            ? idRestrictions[0].value
            : undefined;
    }
    getFilters(excludeIdFilters = false) {
        const rootFilterPredicate = this.query.criteria.where;
        return Object.assign({}, rootFilterPredicate, { value: excludeIdFilters
                ? rootFilterPredicate.value.filter(it => it.field !== 'id')
                : rootFilterPredicate.value });
    }
    get offset() {
        return this.query.criteria.offset;
    }
    get limit() {
        return this.query.criteria.limit;
    }
}
exports.default = WithCriteriaQuery;
