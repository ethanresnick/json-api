"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

_Object$defineProperty(exports, "__esModule", {
  value: true
});

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _jade = require("jade");

var _jade2 = _interopRequireDefault(_jade);

var _negotiator = require("negotiator");

var _negotiator2 = _interopRequireDefault(_negotiator);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _dasherize = require("dasherize");

var _dasherize2 = _interopRequireDefault(_dasherize);

var _typesHTTPResponse = require("../types/HTTP/Response");

var _typesHTTPResponse2 = _interopRequireDefault(_typesHTTPResponse);

var _typesDocument = require("../types/Document");

var _typesDocument2 = _interopRequireDefault(_typesDocument);

var _typesCollection = require("../types/Collection");

var _typesCollection2 = _interopRequireDefault(_typesCollection);

var _typesResource = require("../types/Resource");

var _typesResource2 = _interopRequireDefault(_typesResource);

var DocumentationController = (function () {
  function DocumentationController(registry, apiInfo, templatePath) {
    var _this = this;

    _classCallCheck(this, DocumentationController);

    var defaultTempPath = "../../../templates/documentation.jade";
    this.template = templatePath || _path2["default"].resolve(__dirname, defaultTempPath);
    this.registry = registry;

    // compute template data on construction
    // (it never changes, so this makes more sense than doing it per request)
    var data = _Object$assign({}, apiInfo);
    data.resourcesMap = {};

    // Store in the resourcesMap the info object about each type,
    // as returned by @getTypeInfo.
    this.registry.types().forEach(function (type) {
      data.resourcesMap[type] = _this.getTypeInfo(type);
    });

    this.templateData = data;
  }

  _createClass(DocumentationController, [{
    key: "handle",
    value: function handle(request) {
      var response = new _typesHTTPResponse2["default"]();
      var negotiator = new _negotiator2["default"]({ headers: { accept: request.accepts } });
      var contentType = negotiator.mediaType(["text/html", "application/vnd.api+json"]);

      // set content type as negotiated & vary on accept.
      response.contentType = contentType;
      response.headers.vary = "Accept";

      if (contentType.toLowerCase() === "text/html") {
        response.body = _jade2["default"].renderFile(this.template, this.templateData);
      } else {
        // Create a collection of "jsonapi-descriptions" from the templateData
        var descriptionResources = new _typesCollection2["default"]();

        // Add a description resource for each resource type to the collection.
        for (var type in this.templateData.resourcesMap) {
          var typeInfo = this.templateData.resourcesMap[type];
          var typeDescription = new _typesResource2["default"]("jsonapi-descriptions", type, (0, _dasherize2["default"])(typeInfo));
          descriptionResources.add(typeDescription);
        }

        response.body = new _typesDocument2["default"](descriptionResources).get(true);
      }

      return (0, _q2["default"])(response);
    }
  }, {
    key: "getTypeInfo",

    // Clients can extend this if, say, the adapter can't infer
    // as much info about the models' structure as they would like.
    value: function getTypeInfo(type) {
      var adapter = this.registry.dbAdapter(type);
      var modelName = adapter.constructor.getModelName(type);
      var model = adapter.getModel(modelName);

      // Combine the docs in the Resource description with the standardized schema
      // from the adapter in order to build the final schema for the template.
      var info = this.registry.info(type);
      var schema = adapter.constructor.getStandardizedSchema(model);
      var ucFirst = function ucFirst(v) {
        return v.charAt(0).toUpperCase() + v.slice(1);
      };

      schema.forEach(function (field) {
        // look up user defined field info on info.fields.
        var pathInfo = info && info.fields && info.fields[field.name] || {};

        for (var key in pathInfo) {
          // allow the user to override auto-generated friendlyName.
          if (key === "friendlyName") {
            field.friendlyName = pathInfo.friendlyName;
          }

          // note: this line is technically redundant given the next else if, but
          // it's included to emphasize that the description key has a special
          // meaning and is, e.g., given special treatment in the default template.
          else if (key === "description") {
            field.description = pathInfo.description;
          }

          // copy in any other info properties that don't conflict
          else if (!(key in field)) {
            field[key] = pathInfo[key];
          }

          // try to merge in info properties. if the key conflicts and doesn't
          // hold an object into which we can merge, we just give up (i.e. we
          // don't try anything else after the below).
          else if (typeof field[key] === "object" && !Array.isArray(field[key])) {
            _Object$assign(field[key], pathInfo[key]);
          }
        }
      });
      // Other info
      var result = {
        name: {
          "model": modelName,
          "singular": adapter.constructor.toFriendlyName(modelName),
          "plural": type.split("-").map(ucFirst).join(" ")
        },
        fields: schema,
        parentType: this.registry.parentType(type),
        childTypes: adapter.constructor.getChildTypes(model)
      };

      var defaultIncludes = this.registry.defaultIncludes(type);
      if (defaultIncludes) result.defaultIncludes = defaultIncludes;

      if (info && info.example) result.example = info.example;
      if (info && info.description) result.description = info.description;

      return result;
    }
  }]);

  return DocumentationController;
})();

exports["default"] = DocumentationController;
module.exports = exports["default"];