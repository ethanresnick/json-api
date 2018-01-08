"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Immutable = require("immutable");
const misc_1 = require("./util/misc");
const Maybe_1 = require("./types/Generic/Maybe");
const Resource_1 = require("./types/Resource");
exports.Resource = Resource_1.default;
const ResourceIdentifier_1 = require("./types/ResourceIdentifier");
exports.ResourceIdentifier = ResourceIdentifier_1.default;
const globalResourceDefaults = Immutable.fromJS({
    transformLinkage: false
});
class ResourceTypeRegistry {
    constructor(typeDescs = Object.create(null), descDefaults = {}) {
        this._types = {};
        const finalDefaults = globalResourceDefaults.mergeDeep(descDefaults);
        const nodes = [], roots = [], edges = {};
        for (const typeName in typeDescs) {
            const nodeParentType = typeDescs[typeName].parentType;
            nodes.push(typeName);
            if (nodeParentType) {
                edges[nodeParentType] = edges[nodeParentType] || {};
                edges[nodeParentType][typeName] = true;
            }
            else {
                roots.push(typeName);
            }
        }
        const typeRegistrationOrder = misc_1.pseudoTopSort(nodes, edges, roots);
        typeRegistrationOrder.forEach((typeName) => {
            const parentType = typeDescs[typeName].parentType;
            const thisDescriptionRaw = Immutable.fromJS(typeDescs[typeName]);
            const thisDescriptionMerged = finalDefaults.mergeDeep(thisDescriptionRaw);
            this._types[typeName] = (parentType)
                ? this._types[parentType]
                    .mergeDeep(thisDescriptionRaw)
                : thisDescriptionMerged;
        });
    }
    type(typeName) {
        return Maybe_1.default(this._types[typeName])
            .map(it => it.toJS())
            .getOrDefault(undefined);
    }
    hasType(typeName) {
        return typeName in this._types;
    }
    typeNames() {
        return Object.keys(this._types);
    }
    urlTemplates(type) {
        if (type) {
            return Maybe_1.default(this._types[type])
                .map(it => it.get("urlTemplates"))
                .map(it => it.toJS())
                .getOrDefault(undefined);
        }
        return Object.keys(this._types).reduce((prev, typeName) => {
            prev[typeName] = this.urlTemplates(typeName);
            return prev;
        }, {});
    }
    dbAdapter(type) {
        const adapter = this.doGet("dbAdapter", type);
        if (typeof adapter === 'undefined') {
            throw new Error("Tried to get db adapter for a type registered without one. " +
                "Every type must be registered with an adapter!");
        }
        return adapter;
    }
    beforeSave(type) {
        return this.doGet("beforeSave", type);
    }
    beforeRender(type) {
        return this.doGet("beforeRender", type);
    }
    behaviors(type) {
        return this.doGet("behaviors", type);
    }
    defaultIncludes(type) {
        return this.doGet("defaultIncludes", type);
    }
    info(type) {
        return this.doGet("info", type);
    }
    parentType(type) {
        return this.doGet("parentType", type);
    }
    transformLinkage(type) {
        return this.doGet("transformLinkage", type);
    }
    doGet(attrName, type) {
        return Maybe_1.default(this._types[type])
            .map(it => it.get(attrName))
            .map(it => it instanceof Immutable.Map || it instanceof Immutable.List
            ? it.toJS()
            : it)
            .getOrDefault(undefined);
    }
}
exports.default = ResourceTypeRegistry;
