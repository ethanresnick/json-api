"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Q = _interopRequire(require("q"));

var templating = _interopRequire(require("url-template"));

var jade = _interopRequire(require("jade"));

var path = _interopRequire(require("path"));

var DocumentationController = (function () {
  function DocumentationController(registry, apiInfo, templatePath) {
    var _this = this;

    _classCallCheck(this, DocumentationController);

    var defaultTempPath = "../../../templates/documentation.jade";
    this.template = templatePath || path.resolve(__dirname, defaultTempPath);
    this.registry = registry;

    // compute template data on construction
    // (it never changes, so this makes more sense than doing it per request)
    var data = Object.assign({}, apiInfo);
    data.resourcesMap = {};

    // Store in the resourcesMap the info object about each type,
    // as returned by @getTypeInfo.
    this.registry.types().forEach(function (type) {
      data.resourcesMap[type] = _this.getTypeInfo(type);
    });

    this.templateData = data;
  }

  _createClass(DocumentationController, {
    index: {
      value: function index(req, res) {
        res.send(jade.renderFile(this.template, this.templateData));
      }
    },
    getTypeInfo: {

      // Clients can extend this if, say, the adapter can't infer
      // as much info about the models' structure as they would like.

      value: function getTypeInfo(type) {
        var adapter = this.registry.adapter(type);
        var modelName = adapter.constructor.getModelName(type);
        var model = adapter.getModel(modelName);

        // Combine the docs in the Resource description with the standardized schema
        // from the adapter in order to build the final schema for the template.
        var info = this.registry.info(type);
        var schema = adapter.constructor.getStandardizedSchema(model);

        if (info && info.fields) {
          for (var _path in schema) {
            if (info.fields[_path] && info.fields[_path].description) {
              schema[_path].description = info.fields[_path].description;
            }
          }
        }
        // Other info
        var result = {
          name: modelName,
          schema: schema,
          parentType: this.registry.parentType(type),
          childTypes: adapter.constructor.getChildTypes(model)
        };

        var defaultIncludes = this.registry.defaultIncludes(type);
        if (defaultIncludes) result.defaultIncludes = defaultIncludes;

        if (info && info.example) result.example = info.example;
        if (info && info.description) result.description = info.description;

        return result;
      }
    }
  });

  return DocumentationController;
})();

module.exports = DocumentationController;