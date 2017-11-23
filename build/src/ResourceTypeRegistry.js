"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Immutable = require("immutable");
const misc_1 = require("./util/misc");
const type_handling_1 = require("./util/type-handling");
const globalResourceDefaults = Immutable.fromJS({
    behaviors: {
        dasherizeOutput: { enabled: true }
    }
});
const typesKey = Symbol();
class ResourceTypeRegistry {
    constructor(typeDescriptions = Object.create(null), descriptionDefaults = {}) {
        this[typesKey] = {};
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
            this[typesKey][typeName] = (parentType) ?
                this[typesKey][parentType].mergeDeep(thisDescriptionRaw)
                    .set("labelMappers", thisDescriptionRaw.get("labelMappers")) :
                thisDescriptionMerged;
        });
    }
    type(typeName) {
        return type_handling_1.Maybe(this[typesKey][typeName]).bind(it => it.toJS()).unwrap();
    }
    hasType(typeName) {
        return typeName in this[typesKey];
    }
    typeNames() {
        return Object.keys(this[typesKey]);
    }
    urlTemplates(type) {
        if (type) {
            return type_handling_1.Maybe(this[typesKey][type])
                .bind(it => it.get("urlTemplates"))
                .bind(it => it.toJS())
                .unwrap();
        }
        return Object.keys(this[typesKey]).reduce((prev, typeName) => {
            prev[typeName] = this.urlTemplates(typeName);
            return prev;
        }, {});
    }
    dbAdapter(type) {
        return doGet(this, "dbAdapter", type);
    }
    beforeSave(type) {
        return doGet(this, "beforeSave", type);
    }
    beforeRender(type) {
        return doGet(this, "beforeRender", type);
    }
    behaviors(type) {
        return doGet(this, "behaviors", type);
    }
    labelMappers(type) {
        return doGet(this, "labelMappers", type);
    }
    defaultIncludes(type) {
        return doGet(this, "defaultIncludes", type);
    }
    info(type) {
        return doGet(this, "info", type);
    }
    parentType(type) {
        return doGet(this, "parentType", type);
    }
}
exports.default = ResourceTypeRegistry;
function doGet(inst, attrName, type) {
    return type_handling_1.Maybe(inst[typesKey][type])
        .bind(it => it.get(attrName))
        .bind(it => it instanceof Immutable.Map || it instanceof Immutable.List ? it.toJS() : it)
        .unwrap();
}
;
