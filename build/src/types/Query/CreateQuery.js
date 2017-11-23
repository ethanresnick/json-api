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
const Query_1 = require("./Query");
class CreateQuery extends Query_1.default {
    constructor(_a) {
        var { records } = _a, baseOpts = __rest(_a, ["records"]);
        super(baseOpts);
        this.query = Object.assign({}, this.query, { records: records });
    }
    get records() {
        return this.query.records;
    }
}
exports.default = CreateQuery;
