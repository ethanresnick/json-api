import Q from "q";
import jade from "jade";
import Negotiator from "negotiator";
import path from "path";
import dasherize from "dasherize";

import Response from "../types/HTTP/Response";
import Document from "../types/Document";
import Collection from "../types/Collection";
import Resource from "../types/Resource";

export default class DocumentationController {
  constructor(registry, apiInfo, templatePath) {
    const defaultTempPath = "../../../templates/documentation.jade";
    this.template = templatePath || path.resolve(__dirname, defaultTempPath);
    this.registry = registry;

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

  handle(request) {
    let response = new Response();
    let negotiator = new Negotiator({headers: {accept: request.accepts}});
    let contentType = negotiator.mediaType(["text/html", "application/vnd.api+json"]);

    // set content type as negotiated
    response.contentType = contentType;

    if(contentType === "text/html") {
      response.body = jade.renderFile(this.template, this.templateData);
    }

    else {
      // Create a collection of "jsonapi-descriptions" from the templateData
      let descriptionResources = new Collection();

      // Add a description resource for each resource type to the collection.
      for(let type in this.templateData.resourcesMap) {
        let typeInfo = this.templateData.resourcesMap[type];
        let typeDescription = new Resource("jsonapi-descriptions", type, dasherize(typeInfo));
        descriptionResources.add(typeDescription);
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

      for(let key in pathInfo) {
        // allow the user to override auto-generated friendlyName.
        if(key === "friendlyName") {
          field.friendlyName = pathInfo.friendlyName;
        }

        // note: this line is technically redundant given the next else if, but
        // it's included to emphasize that the description key has a special
        // meaning and is, e.g., given special treatment in the default template.
        else if(key === "description") {
          field.description = pathInfo.description;
        }

        // copy in any other info properties that don't conflict
        else if(!(key in field)) {
          field[key] = pathInfo[key];
        }

        // try to merge in info properties. if the key conflicts and doesn't
        // hold an object into which we can merge, we just give up (i.e. we
        // don't try anything else after the below).
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
}
