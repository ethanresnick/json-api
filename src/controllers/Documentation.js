import Q from "q";
import _ from "lodash";
import path from "path";
import jade from "jade";
import Negotiator from "negotiator";
import dasherize from "dasherize";
import mapValues from "lodash/object/mapValues";

import Response from "../types/HTTP/Response";
import Document from "../types/Document";
import Collection from "../types/Collection";
import Resource from "../types/Resource";

export default class DocumentationController {
  constructor(registry, apiInfo, templatePath, dasherizeJSONKeys = true) {
    this.registry = registry;

    const defaultTempPath = "../../../templates/documentation.jade";
    this.template = templatePath || path.resolve(__dirname, defaultTempPath);

    this.dasherizeJSONKeys = dasherizeJSONKeys;

    // compute template data on construction
    // (it never changes, so this makes more sense than doing it per request)
    let data = Object.assign({}, apiInfo);
    data.resourcesMap = {};

    // Store in the resourcesMap the info object about each type,
    // as returned by @getTypeInfo.
    this.registry.types().forEach((type) => {
      data.resourcesMap[type] = this.getTypeInfo(type);
    });

    this.templateData = data;
  }

  handle(request, frameworkReq, frameworkRes) {
    let response = new Response();
    let negotiator = new Negotiator({headers: {accept: request.accepts}});
    let contentType = negotiator.mediaType(["text/html", "application/vnd.api+json"]);

    // set content type as negotiated & vary on accept.
    response.contentType = contentType;
    response.headers.vary = "Accept";

    // process templateData (just the type infos for now) for this particular request.
    let templateData = _.cloneDeep(this.templateData);
    templateData.resourcesMap = mapValues(templateData.resourcesMap, (typeInfo, typeName) => {
      return this.transformTypeInfo(typeName, typeInfo, request, response, frameworkReq, frameworkRes);
    });

    if(contentType.toLowerCase() === "text/html") {
      response.body = jade.renderFile(this.template, this.templateData);
    }

    else {
      // Create a collection of "jsonapi-descriptions" from the templateData
      let descriptionResources = new Collection();

      // Add a description resource for each resource type to the collection.
      for(let type in templateData.resourcesMap) {
        descriptionResources.add(
          new Resource("jsonapi-descriptions", type, templateData.resourcesMap[type])
        );
      }

      response.body = (new Document(descriptionResources)).get(true);
    }

    return Q(response);
  }

  // Clients can extend this if, say, the adapter can't infer
  // as much info about the models' structure as they would like.
  getTypeInfo(type) {
    const adapter   = this.registry.dbAdapter(type);
    const modelName = adapter.constructor.getModelName(type);
    const model     = adapter.getModel(modelName);

    // Combine the docs in the Resource description with the standardized schema
    // from the adapter in order to build the final schema for the template.
    const info = this.registry.info(type);
    const schema = adapter.constructor.getStandardizedSchema(model);
    const ucFirst = (v) => v.charAt(0).toUpperCase() + v.slice(1);

    schema.forEach((field) => {
      // look up user defined field info on info.fields.
      let pathInfo = (info && info.fields && info.fields[field.name]) || {};

      // Keys that have a meaning in the default template.
      let overrideableKeys = ["friendlyName",  "kind", "description"];

      for(let key in pathInfo) {
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
    if(this.dasherizeJSONKeys && response.contentType === "application/vnd.api+json") {
      return dasherize(info);
    }
    return info;
  }
}
