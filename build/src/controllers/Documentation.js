"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const path = require("path");
const jade = require("jade");
const Negotiator = require("negotiator");
const dasherize = require("dasherize");
const mapValues = require("lodash/object/mapValues");
const Response_1 = require("../types/HTTP/Response");
exports.UnsealedResponse = Response_1.Response;
const Document_1 = require("../types/Document");
const Collection_1 = require("../types/Collection");
const Resource_1 = require("../types/Resource");
class DocumentationController {
    constructor(registry, apiInfo, templatePath, dasherizeJSONKeys = true) {
        this.registry = registry;
        const defaultTempPath = "../../templates/documentation.jade";
        this.template = templatePath || path.resolve(__dirname, defaultTempPath);
        this.dasherizeJSONKeys = dasherizeJSONKeys;
        let data = Object.assign({}, apiInfo, { resourcesMap: {} });
        this.registry.typeNames().forEach((typeName) => {
            data.resourcesMap[typeName] = this.getTypeInfo(typeName);
        });
        this.templateData = data;
    }
    handle(request, frameworkReq, frameworkRes) {
        let response = new Response_1.default();
        let negotiator = new Negotiator({ headers: { accept: request.accepts } });
        let contentType = negotiator.mediaType(["text/html", "application/vnd.api+json"]);
        response.contentType = contentType;
        response.headers.vary = "Accept";
        let templateData = _.cloneDeep(this.templateData, cloneCustomizer);
        templateData.resourcesMap = mapValues(templateData.resourcesMap, (typeInfo, typeName) => {
            return this.transformTypeInfo(typeName, typeInfo, request, response, frameworkReq, frameworkRes);
        });
        if (contentType.toLowerCase() === "text/html") {
            response.body = jade.renderFile(this.template, templateData);
        }
        else {
            let descriptionResources = new Collection_1.default();
            for (let type in templateData.resourcesMap) {
                descriptionResources.add(new Resource_1.default("jsonapi-descriptions", type, templateData.resourcesMap[type]));
            }
            response.body = (new Document_1.default(descriptionResources)).get(true);
        }
        return Promise.resolve(response);
    }
    getTypeInfo(type) {
        const adapter = this.registry.dbAdapter(type);
        const modelName = adapter.constructor.getModelName(type);
        const model = adapter.getModel(modelName);
        const info = this.registry.info(type);
        const schema = adapter.constructor.getStandardizedSchema(model);
        const ucFirst = (v) => v.charAt(0).toUpperCase() + v.slice(1);
        schema.forEach((field) => {
            let pathInfo = (info && info.fields && info.fields[field.name]) || {};
            let overrideableKeys = ["friendlyName", "kind", "description"];
            for (let key in pathInfo) {
                if (overrideableKeys.indexOf(key) > -1 || !(key in field)) {
                    field[key] = pathInfo[key];
                }
                else if (typeof field[key] === "object" && !Array.isArray(field[key])) {
                    Object.assign(field[key], pathInfo[key]);
                }
            }
        });
        let result = {
            name: {
                "model": modelName,
                "singular": adapter.constructor.toFriendlyName(modelName),
                "plural": type.split("-").map(ucFirst).join(" ")
            },
            fields: schema,
            parentType: this.registry.parentType(type),
            childTypes: adapter.constructor.getChildTypes(model)
        };
        let defaultIncludes = this.registry.defaultIncludes(type);
        if (defaultIncludes)
            result.defaultIncludes = defaultIncludes;
        if (info && info.example)
            result.example = info.example;
        if (info && info.description)
            result.description = info.description;
        return result;
    }
    transformTypeInfo(typeName, info, request, response, frameworkReq, frameworkRes) {
        if (this.dasherizeJSONKeys && response.contentType === "application/vnd.api+json") {
            return dasherize(info);
        }
        return info;
    }
}
exports.default = DocumentationController;
function cloneCustomizer(value) {
    if (isCustomObject(value)) {
        let state = _.cloneDeep(value);
        Object.setPrototypeOf(state, Object.getPrototypeOf(value));
        Object.defineProperty(state, "constructor", {
            "writable": true,
            "enumerable": false,
            "value": value.constructor
        });
        for (let key in state) {
            if (isCustomObject(value[key])) {
                state[key] = _.cloneDeep(value[key], cloneCustomizer);
            }
        }
        return state;
    }
    return undefined;
}
function isCustomObject(v) {
    return v && typeof v === "object" && v.constructor !== Object && !Array.isArray(v);
}
