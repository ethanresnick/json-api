"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Immutable = require("immutable");
const misc_1 = require("./util/misc");
const type_handling_1 = require("./util/type-handling");
const autoGetterProps = ["dbAdapter", "beforeSave", "beforeRender", "behaviors",
    "labelMappers", "defaultIncludes", "info", "parentType"];
const globalResourceDefaults = Immutable.fromJS({
    behaviors: {
        dasherizeOutput: { enabled: true }
    }
});
const typesKey = Symbol();
class ResourceTypeRegistry {
    constructor(typeDescriptions = {}, descriptionDefaults = {}) {
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
        return doGet("dbAdapter", type);
    }
    beforeSave(type) {
        return doGet("beforeSave", type);
    }
    beforeRender(type) {
        return doGet("beforeRender", type);
    }
    behaviors(type) {
        return doGet("behavior", type);
    }
    labelMappers(type) {
        return doGet("labelMappers", type);
    }
    defaultIncludes(type) {
        return doGet("defaultIncludes", type);
    }
    info(type) {
        return doGet("info", type);
    }
    parentType(type) {
        return doGet("parentType", type);
    }
}
exports.default = ResourceTypeRegistry;
autoGetterProps.forEach((propName) => {
    ResourceTypeRegistry.prototype[propName] = makeGetter(propName);
});
function makeGetter(attrName) {
    return function (type) {
        return type_handling_1.Maybe(this[typesKey][type])
            .bind(it => it.get(attrName))
            .bind(it => it instanceof Immutable.Map || it instanceof Immutable.List ? it.toJS() : it)
            .unwrap();
    };
}
function doGet(attrName, type) {
    return type_handling_1.Maybe(this[typesKey][type])
        .bind(it => it.get(attrName))
        .bind(it => it instanceof Immutable.Map || it instanceof Immutable.List ? it.toJS() : it)
        .unwrap();
}
;
