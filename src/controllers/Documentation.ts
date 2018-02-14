import _ = require("lodash");
import path = require("path");
import pug = require("pug");
import Negotiator = require("negotiator");
import dasherize = require("dasherize");

import ResourceTypeRegistry, { ResourceTypeDescription, ResourceTypeInfo } from "../ResourceTypeRegistry";
import { HTTPResponse, ServerReq, ServerRes, Request } from "../types";
import ResourceSet from "../types/ResourceSet";
import Document from "../types/Document";
import Resource from "../types/Resource";
import { IncomingMessage, ServerResponse } from 'http';
export { IncomingMessage, ServerResponse };

export default class DocumentationController {
  private registry: ResourceTypeRegistry;
  private template: string;
  private dasherizeJSONKeys: boolean;
  private templateData: object;

  constructor(registry, apiInfo, templatePath = undefined, dasherizeJSONKeys = true) {
    this.registry = registry;

    const defaultTempPath = "../../templates/documentation.pug";
    this.template = templatePath || path.resolve(__dirname, defaultTempPath);

    this.dasherizeJSONKeys = dasherizeJSONKeys;

    // compute template data on construction
    // (it never changes, so this makes more sense than doing it per request)
    const data = {
      ...apiInfo,
      resourcesMap: {}
    };

    // Store in the resourcesMap the info object about each type,
    // as returned by @getTypeInfo.
    this.registry.typeNames().forEach((typeName) => {
      data.resourcesMap[typeName] = this.getTypeInfo(typeName);
    });

    this.templateData = data;
  }

  handle = async (request: Request, serverReq: ServerReq, serverRes: ServerRes) => {
    const response: HTTPResponse = { headers: {}, body: undefined, status: 200 };
    const negotiator = new Negotiator({headers: {accept: request.accepts}});
    const contentType = negotiator.mediaType(["text/html", "application/vnd.api+json"]);

    // set content type as negotiated & vary on accept.
    response.headers['content-type'] = contentType;
    response.headers.vary = "Accept";

    // process templateData (just the type infos for now) for this particular request.
    const templateData = _.cloneDeepWith(this.templateData, cloneCustomizer);
    templateData.resourcesMap = _.mapValues(templateData.resourcesMap, (typeInfo, typeName) => {
      return this.transformTypeInfo(typeName, typeInfo, request, response, serverReq, serverRes);
    });

    if(contentType && contentType.toLowerCase() === "text/html") {
      response.body = pug.renderFile(this.template, templateData);
    }

    else {
      // Create a collection of "jsonapi-descriptions" from the templateData
      const descriptionResources: Resource[] = [];

      // Add a description resource for each resource type to the collection.
      for(const type in templateData.resourcesMap) {
        descriptionResources.push(
          new Resource("jsonapi-descriptions", type, templateData.resourcesMap[type])
        );
      }

      response.body = new Document({
        primary: ResourceSet.of({ data: descriptionResources })
      }).toString();
    }

    return response;
  }

  // Clients can extend this if, say, the adapter can't infer
  // as much info about the models' structure as they would like.
  getTypeInfo(type) {
    const adapter   = this.registry.dbAdapter(type);
    const modelName = adapter.getModelName(type);
    const model     = adapter.getModel(modelName);

    // Combine the docs in the Resource description with the standardized schema
    // from the adapter in order to build the final schema for the template.
    const info = this.registry.info(type);
    const schema = adapter.constructor.getStandardizedSchema(model);
    const ucFirst = (v) => v.charAt(0).toUpperCase() + v.slice(1);

    schema.forEach((field) => {
      // look up user defined field info on info.fields.
      const pathInfo = (info && info.fields && info.fields[field.name]) || {};

      // Keys that have a meaning in the default template.
      const overrideableKeys = ["friendlyName",  "kind", "description"];

      for(const key in pathInfo) {
        // allow the user to override auto-generated friendlyName and the
        // auto-generated type info, which is undefined for virtuals. Also,
        // allow them to set the description, which is always user-provided.
        // And, finally, copy in any other info properties that don't
        // conflict with ones defined by this library.
        if (overrideableKeys.indexOf(key) > -1 || !(key in field)) {
          field[key] = pathInfo[key];
        }

        // If the current info key does conflict (i.e. `key in field`), but
        // the user-provided value is an object, try to merge in the object's
        // properties. If the key conflicts and doesn't hold an object into
        // which we can merge, we just give up (i.e. we don't try anything
        // else after the below).
        else if(typeof field[key] === "object" && !Array.isArray(field[key])) {
          Object.assign(field[key], pathInfo[key]);
        }
      }
    });
    // Other info
    type TypeInfo = {
      name: {
        model: string,
        singular: string,
        plural: string
      },
      defaultIncludes?: ResourceTypeDescription['defaultIncludes'],
      example?: ResourceTypeInfo['example'],
      description?: ResourceTypeInfo['description'],
      parentType: string,
      childTypes: string[]
    };

    const result = <TypeInfo>{
      name: {
        "model": modelName,
        "singular": adapter.constructor.toFriendlyName(modelName),
        "plural": type.split("-").map(ucFirst).join(" ")
      },
      fields: schema,
      parentType: this.registry.parentTypeName(type),
      childTypes: this.registry.childTypeNames(type)
    };

    const defaultIncludes = this.registry.defaultIncludes(type);
    if(defaultIncludes) result.defaultIncludes = defaultIncludes;

    if(info && info.example) result.example = info.example;
    if(info && info.description) result.description = info.description;

    return result;
  }

  /**
   * By extending this function, users have an opportunity to transform
   * the documentation info for each type based on the particulars of the
   * current request. This is useful, among other things, for showing
   * users documentation only for models they have access to, and it lays
   * the groundwork for true HATEOS intro pages in the future.
   */
  transformTypeInfo(typeName, info, request, response, frameworkReq, frameworkRes) {
    if(this.dasherizeJSONKeys && response.headers['content-type'] === "application/vnd.api+json") {
      return dasherize(info);
    }
    return info;
  }
}

/**
 * A function to pass to _.cloneDeep to customize the result.
 * Basically, it "pseudo-constructs" new instances of any objects
 * that were instantiated with custom classes/constructor functions
 * before. It does this by making a plain object version of the
 * instance (i.e. it's local state as captured by it's enumerable
 * own properties) and setting the `.constructor` and [[Prototype]]
 * on that plain object. This isn't identical to constructing a new
 * instance of course, which could have other side-effects (and also
 * effects super() binding on real ES6 classes), but it's better than
 * just using a plain object.
 */
function cloneCustomizer(value) {
  if(isCustomObject(value)) {
    const state = _.cloneDeep(value);
    Object.setPrototypeOf(state, Object.getPrototypeOf(value));
    Object.defineProperty(state, "constructor", {
      "writable": true,
      "enumerable": false,
      "value": value.constructor
    });

    // handle the possibiliy that a key in state was itself a non-plain object
    for(const key in state) {
      if(isCustomObject(value[key])) {
        state[key] = _.cloneDeepWith(value[key], cloneCustomizer);
      }
    }

    return state;
  }

  return undefined;
}

function isCustomObject(v) {
  return v && typeof v === "object" && v.constructor !== Object && !Array.isArray(v);
}
