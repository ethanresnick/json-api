import Q from "q";
import templating from "url-template";
import jade from "jade";
import Negotiator from "negotiator";
import path from "path";

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
      for(let type in this.templateData.resourcesMap) {
        let typeSchema = this.templateData.resourcesMap[type].schema;

        for(let path in typeSchema) {
          let typeObject = typeSchema[path].type;
          let targetModel = typeObject.targetModel;

          let typeString = typeObject.isArray ? "Array[" : "";
          typeString += targetModel ? (targetModel + "Id") : typeObject.name;
          typeString += typeObject.isArray ? "]" : "";

          typeSchema[path].type = typeString;
        }
      }

      response.body = jade.renderFile(this.template, this.templateData);
    }

    else {
      // Create a collection of "jsonapi-descriptions" from the templateData
      let descriptionResources = new Collection();
      for(let type in this.templateData.resourcesMap) {
        let typeInfo = this.templateData.resourcesMap[type];

        // Build attributes for this description resource.
        let attrs = Object.assign({}, typeInfo);
        attrs.fields = [];
        attrs.name = {
          "singular": attrs.singularName,
          "plural": attrs.pluralName,
          "model": attrs.name
        };

        delete attrs.schema;
        delete attrs.childTypes;
        delete attrs.singularName;
        delete attrs.pluralName;

        for(let path in typeInfo.schema) {
          let fieldDesc = {
            name: path,
            friendlyName: typeInfo.schema[path].friendlyName,
            kind: typeInfo.schema[path].type,
            description: typeInfo.schema[path].description,
            requirements: {
              required: !!typeInfo.schema[path].required
            }
          };

          if(fieldDesc.kind) delete fieldDesc.kind.targetModel;

          if(typeInfo.schema[path].enumValues) {
            fieldDesc.oneOf = typeInfo.schema[path].enumValues;
          }

          let fieldDefault = typeInfo.schema[path].default;
          fieldDesc.default = fieldDefault === "(auto generated)" ? "__AUTO__" : fieldDefault;

          attrs.fields.push(fieldDesc);
        }

        let typeDescription = new Resource("jsonapi-descriptions", type, attrs);
        descriptionResources.add(typeDescription);
      }

      response.body = (new Document(descriptionResources)).get(true);
    }

    return Q(response);
  }

  // Clients can extend this if, say, the adapter can't infer
  // as much info about the models' structure as they would like.
  getTypeInfo(type) {
    const adapter   = this.registry.adapter(type);
    const modelName = adapter.constructor.getModelName(type);
    const model     = adapter.getModel(modelName);

    // Combine the docs in the Resource description with the standardized schema
    // from the adapter in order to build the final schema for the template.
    const info = this.registry.info(type);
    const schema = adapter.constructor.getStandardizedSchema(model);
    const toTitleCase = (v) => v.charAt(0).toUpperCase() + v.slice(1);
    const toFriendlyName = (v) => toTitleCase(v).split(/(?=[A-Z])/).join(" ");

    for(let path in schema) {
      // look up user defined field info on info.fields.
      if(info && info.fields && info.fields[path]) {
        if(info.fields[path].description) {
          schema[path].description = info.fields[path].description;
        }

        if(info.fields[path].friendlyName) {
          schema[path].friendlyName = info.fields[path].friendlyName;
        }
      }

      // fill in default field info.
      else {
        schema[path].friendlyName = toFriendlyName(path);
      }

      // specifically generate targetType from targetModel on relationship fields.
      if(schema[path].type.targetModel) {
        schema[path].type.targetType =
          adapter.constructor.getType(schema[path].type.targetModel);
      }
    }

    // Other info
    let result = {
      name: modelName,
      singularName: toFriendlyName(modelName),
      pluralName: type.split("-").map(toTitleCase).join(" "),
      schema: schema,
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



