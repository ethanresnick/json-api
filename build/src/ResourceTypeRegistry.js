"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Immutable = require("immutable");
const misc_1 = require("./util/misc");
const type_handling_1 = require("./util/type-handling");
const globalResourceDefaults = Immutable.fromJS({});
class ResourceTypeRegistry {
    constructor(typeDescriptions = Object.create(null), descriptionDefaults = {}) {
        this._types = {};
        descriptionDefaults = globalResourceDefaults.mergeDeep(descriptionDefaults);
        const nodes = [], roots = [], edges = {};
        for (const typeName in typeDescriptions) {
            const nodeParentType = typeDescriptions[typeName].parentType;
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
            const parentType = typeDescriptions[typeName].parentType;
            const thisDescriptionRaw = Immutable.fromJS(typeDescriptions[typeName]);
            const thisDescriptionMerged = descriptionDefaults.mergeDeep(thisDescriptionRaw);
            this._types[typeName] = (parentType) ?
                this._types[parentType].mergeDeep(thisDescriptionRaw)
                    .set("labelMappers", thisDescriptionRaw.get("labelMappers")) :
                thisDescriptionMerged;
        });
    }
    type(typeName) {
        return type_handling_1.Maybe(this._types[typeName])
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
            return type_handling_1.Maybe(this._types[type])
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
        return this.doGet("dbAdapter", type);
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
    labelMappers(type) {
        return this.doGet("labelMappers", type);
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
    doGet(attrName, type) {
        return type_handling_1.Maybe(this._types[type])
            .map(it => it.get(attrName))
            .map(it => it instanceof Immutable.Map || it instanceof Immutable.List
            ? it.toJS()
            : it)
            .getOrDefault(undefined);
    }
}
exports.default = ResourceTypeRegistry;
