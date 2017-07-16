"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const templating = require("url-template");
const Linkage_1 = require("./Linkage");
const Resource_1 = require("./Resource");
const Collection_1 = require("./Collection");
const type_handling_1 = require("../util/type-handling");
const arrays_1 = require("../util/arrays");
class Document {
    constructor(primaryOrErrors, included = undefined, meta = undefined, urlTemplates = {}, reqURI = undefined) {
        [this.primaryOrErrors, this.included, this.reqURI] = [primaryOrErrors, included, reqURI];
        if (meta !== undefined) {
            if (typeof meta === "object" && !Array.isArray(meta)) {
                this.meta = meta;
            }
            else {
                throw new Error("Meta information must be an object");
            }
        }
        this.urlTemplates = type_handling_1.mapObject(urlTemplates, (templatesForType) => {
            return type_handling_1.mapObject(templatesForType, templating.parse.bind(templating));
        });
        this.reqURI = reqURI;
    }
    get(stringify = false) {
        let doc = {};
        if (this.meta)
            doc.meta = this.meta;
        if (this.reqURI) {
            doc.links = { "self": this.reqURI };
        }
        if (this.primaryOrErrors instanceof Collection_1.default || this.primaryOrErrors instanceof Resource_1.default) {
            doc.data = type_handling_1.mapResources(this.primaryOrErrors, (resource) => {
                return resourceToJSON(resource, this.urlTemplates);
            });
        }
        else if (this.primaryOrErrors instanceof Linkage_1.default) {
            doc.data = this.primaryOrErrors.toJSON();
        }
        else if (this.primaryOrErrors === null) {
            doc.data = this.primaryOrErrors;
        }
        else {
            doc.errors = this.primaryOrErrors.map(errorToJSON);
        }
        if (this.included && this.included instanceof Collection_1.default) {
            doc.included = arrays_1.arrayUnique(this.included.resources).map((resource) => {
                return resourceToJSON(resource, this.urlTemplates);
            });
        }
        return stringify ? JSON.stringify(doc) : doc;
    }
}
exports.default = Document;
function relationshipToJSON(relationship, urlTemplates, templateData) {
    let result = {};
    if (relationship.linkage) {
        result.data = relationship.linkage.toJSON();
    }
    if (urlTemplates[templateData.ownerType]) {
        const relatedUrlTemplate = relationship.relatedURITemplate ?
            templating.parse(relationship.relatedURITemplate) :
            urlTemplates[templateData.ownerType].related;
        const selfUrlTemplate = relationship.selfURITemplate ?
            templating.parse(relationship.selfURITemplate) :
            urlTemplates[templateData.ownerType].relationship;
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
    let json = {
        id: resource.id,
        type: resource.type,
        attributes: resource.attrs
    };
    if (resource.meta && !type_handling_1.objectIsEmpty(resource.meta)) {
        json.meta = resource.meta;
    }
    let templateData = Object.assign({}, json);
    let selfTemplate = urlTemplates[resource.type] && urlTemplates[resource.type].self;
    if (!type_handling_1.objectIsEmpty(resource.links) || selfTemplate) {
        json.links = {};
        if (selfTemplate) {
            json.links.self = selfTemplate.expand(templateData);
        }
    }
    if (!type_handling_1.objectIsEmpty(resource.relationships)) {
        json.relationships = {};
        for (let path in resource.relationships) {
            let linkTemplateData = { "ownerType": json.type, "ownerId": json.id, "path": path };
            json.relationships[path] = relationshipToJSON(resource.relationships[path], urlTemplates, linkTemplateData);
        }
    }
    return json;
}
function errorToJSON(error) {
    return error.toJSON();
}
