"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const WithCriteriaQuery_1 = require("./WithCriteriaQuery");
class FindQuery extends WithCriteriaQuery_1.default {
    constructor(opts) {
        const { populates, select, sort } = opts, baseOpts = __rest(opts, ["populates", "select", "sort"]);
        super(baseOpts);
        this.query = Object.assign({}, this.query, { populates: populates || [], select,
            sort });
    }
    onlyPopulates(paths) {
        const res = this.clone();
        res.query.populates = paths.slice();
        return res;
    }
    withPopulates(paths) {
        const res = this.clone();
        res.query.populates = res.query.populates.concat(paths);
        return res;
    }
    withoutPopulates(paths) {
        const res = this.clone();
        res.query.populates = res.query.populates.filter(it => paths.indexOf(it) === -1);
        return res;
    }
    get populates() {
        return this.query.populates;
    }
    get select() {
        return this.query.select;
    }
    get sort() {
        return this.query.sort;
    }
}
exports.default = FindQuery;
