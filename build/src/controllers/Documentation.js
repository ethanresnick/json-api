"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

var _Object$setPrototypeOf = require("babel-runtime/core-js/object/set-prototype-of")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _jade = require("jade");

var _jade2 = _interopRequireDefault(_jade);

var _negotiator = require("negotiator");

var _negotiator2 = _interopRequireDefault(_negotiator);

var _dasherize = require("dasherize");

var _dasherize2 = _interopRequireDefault(_dasherize);

var _lodashObjectMapValues = require("lodash/object/mapValues");

var _lodashObjectMapValues2 = _interopRequireDefault(_lodashObjectMapValues);

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

    var dasherizeJSONKeys = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];

    _classCallCheck(this, DocumentationController);

    this.registry = registry;

    var defaultTempPath = "../../../templates/documentation.jade";
    this.template = templatePath || _path2["default"].resolve(__dirname, defaultTempPath);

    this.dasherizeJSONKeys = dasherizeJSONKeys;

    // compute template data on construction
    // (it never changes, so this makes more sense than doing it per request)
    var data = _Object$assign({}, apiInfo);
    data.resourcesMap = {};

    // Store in the resourcesMap the info object about each type,
    // as returned by @getTypeInfo.
    this.registry.typeNames().forEach(function (typeName) {
      data.resourcesMap[typeName] = _this.getTypeInfo(typeName);
    });

    this.templateData = data;
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

  _createClass(DocumentationController, [{
    key: "handle",
    value: function handle(request, frameworkReq, frameworkRes) {
      var _this2 = this;

      var response = new _typesHTTPResponse2["default"]();
      var negotiator = new _negotiator2["default"]({ headers: { accept: request.accepts } });
      var contentType = negotiator.mediaType(["text/html", "application/vnd.api+json"]);

      // set content type as negotiated & vary on accept.
      response.contentType = contentType;
      response.headers.vary = "Accept";

      // process templateData (just the type infos for now) for this particular request.
      var templateData = _lodash2["default"].cloneDeep(this.templateData, cloneCustomizer);
      templateData.resourcesMap = (0, _lodashObjectMapValues2["default"])(templateData.resourcesMap, function (typeInfo, typeName) {
        return _this2.transformTypeInfo(typeName, typeInfo, request, response, frameworkReq, frameworkRes);
      });

      if (contentType.toLowerCase() === "text/html") {
        response.body = _jade2["default"].renderFile(this.template, templateData);
      } else {
        // Create a collection of "jsonapi-descriptions" from the templateData
        var descriptionResources = new _typesCollection2["default"]();

        // Add a description resource for each resource type to the collection.
        for (var type in templateData.resourcesMap) {
          descriptionResources.add(new _typesResource2["default"]("jsonapi-descriptions", type, templateData.resourcesMap[type]));
        }

        response.body = new _typesDocument2["default"](descriptionResources).get(true);
      }

      return (0, _q2["default"])(response);
    }

    // Clients can extend this if, say, the adapter can't infer
    // as much info about the models' structure as they would like.
  }, {
    key: "getTypeInfo",
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

        // Keys that have a meaning in the default template.
        var overrideableKeys = ["friendlyName", "kind", "description"];

        for (var key in pathInfo) {
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

    /**
     * By extending this function, users have an opportunity to transform
     * the documentation info for each type based on the particulars of the
     * current request. This is useful, among other things, for showing
     * users documentation only for models they have access to, and it lays
     * the groundwork for true HATEOS intro pages in the future.
     */
  }, {
    key: "transformTypeInfo",
    value: function transformTypeInfo(typeName, info, request, response, frameworkReq, frameworkRes) {
      if (this.dasherizeJSONKeys && response.contentType === "application/vnd.api+json") {
        return (0, _dasherize2["default"])(info);
      }
      return info;
    }
  }]);

  return DocumentationController;
})();

exports["default"] = DocumentationController;
function cloneCustomizer(value) {
  if (isCustomObject(value)) {
    var state = _lodash2["default"].cloneDeep(value);
    _Object$setPrototypeOf(state, Object.getPrototypeOf(value));
    Object.defineProperty(state, "constructor", {
      "writable": true,
      "enumerable": false,
      "value": value.constructor
    });

    // handle the possibiliy that a key in state was itself a non-plain object
    for (var key in state) {
      if (isCustomObject(value[key])) {
        state[key] = _lodash2["default"].cloneDeep(value[key], cloneCustomizer);
      }
    }

    return state;
  }

  return undefined;
}

function isCustomObject(v) {
  return v && typeof v === "object" && v.constructor !== Object && !Array.isArray(v);
}
module.exports = exports["default"];