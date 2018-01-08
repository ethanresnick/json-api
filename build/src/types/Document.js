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
const type_handling_1 = require("../util/type-handling");
const misc_1 = require("../util/misc");
const Relationship_1 = require("./Relationship");
const ResourceSet_1 = require("./ResourceSet");
class Document {
    constructor(data) {
        const { urlTemplates = {} } = data, restData = __rest(data, ["urlTemplates"]);
        if (typeof data.meta !== 'undefined' && !misc_1.isPlainObject(data.meta)) {
            throw new Error("Document `meta` must be an object.");
        }
        Object.assign(this, restData, { urlTemplates });
    }
    toJSON() {
        const res = {};
        const serializeResource = (it) => it.toJSON(this.urlTemplates[it.type] || {});
        const templatesForRelationship = (templatesForOwnerType) => {
            const { related = undefined, relationship = undefined } = templatesForOwnerType;
            return { related, self: relationship };
        };
        const { data = undefined, links = {} } = (() => {
            if (this.primary instanceof ResourceSet_1.default) {
                return this.primary.toJSON(this.urlTemplates);
            }
            else if (this.primary instanceof Relationship_1.default) {
                return this.primary.toJSON(templatesForRelationship(this.urlTemplates[this.primary.owner.type] || {}));
            }
            else if (this.primary) {
                return this.primary.toJSON();
            }
            return {};
        })();
        if (this.meta) {
            res.meta = this.meta;
        }
        if (!type_handling_1.objectIsEmpty(links)) {
            res.links = links;
        }
        if (this.errors) {
            res.errors = this.errors.map(it => it.toJSON());
        }
        else {
            res.data = data;
            if (this.included) {
                res.included = this.included.map(serializeResource);
            }
        }
        return res;
    }
    toString() {
        return JSON.stringify(this.toJSON());
    }
    clone() {
        const Ctor = (this.constructor || Document);
        return new Ctor(this);
    }
}
exports.default = Document;
