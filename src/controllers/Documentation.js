import Q from "q";
import templating from "url-template";
import jade from "jade";
import path from "path";

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

  index(req, res) {
    res.send(jade.renderFile(this.template, this.templateData));
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

    if(info && info.fields) {
      for(let path in schema) {
        if(info.fields[path] && info.fields[path].description) {
          schema[path].description = info.fields[path].description;
        }
      }
    }
    // Other info
    let result = {
      name: modelName,
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



