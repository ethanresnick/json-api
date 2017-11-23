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
const utils_1 = require("./utils");
class RemoveFromRelationshipQuery extends Query_1.default {
    constructor(opts) {
        const { id, relationshipName, linkage } = opts, baseOpts = __rest(opts, ["id", "relationshipName", "linkage"]);
        super(baseOpts);
        utils_1.assertKeysTruthy(["id", "relationshipName"], opts);
        this.query = Object.assign({}, this.query, { id: opts.id, relationshipName: opts.relationshipName, linkage: opts.linkage });
    }
    get id() {
        return this.query.id;
    }
    get relationshipName() {
        return this.query.relationshipName;
    }
    get linkage() {
        return this.query.linkage;
    }
}
exports.default = RemoveFromRelationshipQuery;
