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
const templating = require("url-template");
const Linkage_1 = require("./Linkage");
const Resource_1 = require("./Resource");
const Collection_1 = require("./Collection");
const type_handling_1 = require("../util/type-handling");
const arrays_1 = require("../util/arrays");
class Document {
    constructor(data) {
        const { urlTemplates = {} } = data, restData = __rest(data, ["urlTemplates"]);
        Object.assign(this, restData);
        this.urlTemplates = type_handling_1.mapObject(urlTemplates, (templatesForType) => {
            return type_handling_1.mapObject(templatesForType, templating.parse.bind(templating));
        });
    }
    toJSON() {
        const res = {};
        const data = this.primary;
        if (this.meta) {
            res.meta = this.meta;
        }
        if (this.reqURI) {
            res.links = { "self": this.reqURI };
        }
        if (this.errors) {
            res.errors = this.errors.map(errorToJSON);
        }
        else {
            res.data = data instanceof Collection_1.default || data instanceof Resource_1.default
                ? type_handling_1.mapResources(data, (resource) => resourceToJSON(resource, this.urlTemplates))
                : (data instanceof Linkage_1.default
                    ? data.toJSON()
                    : data);
        }
        if (this.included && this.included instanceof Collection_1.default) {
            res.included = arrays_1.arrayUnique(this.included.resources).map((resource) => {
                return resourceToJSON(resource, this.urlTemplates);
            });
        }
        return res;
    }
    toString() {
        return JSON.stringify(this.toJSON());
    }
}
exports.default = Document;
function relationshipToJSON(relationship, urlTemplates, templateData) {
    const result = {};
    if (relationship.linkage) {
        result.data = relationship.linkage.toJSON();
    }
    if (urlTemplates[templateData.ownerType]) {
        const relatedUrlTemplate = relationship.relatedURITemplate
            ? templating.parse(relationship.relatedURITemplate)
            : urlTemplates[templateData.ownerType].related;
        const selfUrlTemplate = relationship.selfURITemplate
            ? templating.parse(relationship.selfURITemplate)
            : urlTemplates[templateData.ownerType].relationship;
        if (relatedUrlTemplate || selfUrlTemplate) {
            result.links = {};
        }
        if (relatedUrlTemplate) {
            result.links.related = relatedUrlTemplate.expand(templateData);
        }
        if (selfUrlTemplate) {
            result.links.self = selfUrlTemplate.expand(templateData);
        }
    }
    return result;
}
function resourceToJSON(resource, urlTemplates) {
    const json = {
        id: resource.id,
        type: resource.type,
        attributes: resource.attrs
    };
    if (resource.meta && !type_handling_1.objectIsEmpty(resource.meta)) {
        json.meta = resource.meta;
    }
    const templateData = Object.assign({}, json);
    const selfTemplate = urlTemplates[resource.type] && urlTemplates[resource.type].self;
    if (!type_handling_1.objectIsEmpty(resource.links) || selfTemplate) {
        json.links = {};
        if (selfTemplate) {
            json.links.self = selfTemplate.expand(templateData);
        }
    }
    if (!type_handling_1.objectIsEmpty(resource.relationships)) {
        json.relationships = {};
        for (const path in resource.relationships) {
            const linkTemplateData = { "ownerType": json.type, "ownerId": json.id, "path": path };
            json.relationships[path] = relationshipToJSON(resource.relationships[path], urlTemplates, linkTemplateData);
        }
    }
    return json;
}
function errorToJSON(error) {
    return error.toJSON();
}
