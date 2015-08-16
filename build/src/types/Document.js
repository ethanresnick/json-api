"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Linkage = require("./Linkage");

var _Linkage2 = _interopRequireDefault(_Linkage);

var _Resource = require("./Resource");

var _Resource2 = _interopRequireDefault(_Resource);

var _Collection = require("./Collection");

var _Collection2 = _interopRequireDefault(_Collection);

var _utilTypeHandling = require("../util/type-handling");

var _utilArrays = require("../util/arrays");

var _urlTemplate = require("url-template");

var _urlTemplate2 = _interopRequireDefault(_urlTemplate);

var Document = (function () {
  function Document(primaryOrErrors, included, meta, urlTemplates, reqURI) {
    _classCallCheck(this, Document);

    // validate meta
    var _ref = [primaryOrErrors, included, reqURI];
    this.primaryOrErrors = _ref[0];
    this.included = _ref[1];
    this.reqURI = _ref[2];
    if (meta !== undefined) {
      if (typeof meta === "object" && !Array.isArray(meta)) {
        this.meta = meta;
      } else {
        throw new Error("Meta information must be an object");
      }
    }

    // parse all the templates once on construction.
    this.urlTemplates = (0, _utilTypeHandling.mapObject)(urlTemplates || {}, function (templatesForType) {
      return (0, _utilTypeHandling.mapObject)(templatesForType, _urlTemplate2["default"].parse.bind(_urlTemplate2["default"]));
    });

    this.reqURI = reqURI;
  }

  _createClass(Document, [{
    key: "get",
    value: function get(stringify) {
      var _this = this;

      var doc = {};

      if (this.meta) doc.meta = this.meta;

      // TODO: top-level related link.
      if (this.reqURI) {
        doc.links = { "self": this.reqURI };
      }

      if (this.primaryOrErrors instanceof _Collection2["default"] || this.primaryOrErrors instanceof _Resource2["default"]) {
        doc.data = (0, _utilTypeHandling.mapResources)(this.primaryOrErrors, function (resource) {
          return resourceToJSON(resource, _this.urlTemplates);
        });
      } else if (this.primaryOrErrors instanceof _Linkage2["default"]) {
        doc.data = linkageToJSON(this.primaryOrErrors);
      } else if (this.primaryOrErrors === null) {
        doc.data = this.primaryOrErrors;
      }

      // it's either resource, a collection, linkage, null, or errors...
      else {
          doc.errors = this.primaryOrErrors.map(errorToJSON);
        }

      if (this.included && this.included instanceof _Collection2["default"]) {
        doc.included = (0, _utilArrays.arrayUnique)(this.included.resources).map(function (resource) {
          return resourceToJSON(resource, _this.urlTemplates);
        });
      }

      return stringify ? JSON.stringify(doc) : doc;
    }
  }]);

  return Document;
})();

exports["default"] = Document;

function linkageToJSON(linkage) {
  return linkage.value;
}

function relationshipObjectToJSON(linkObject, urlTemplates, templateData) {
  var result = {
    "data": linkageToJSON(linkObject.linkage)
  };

  // Add urls that we can.
  if (urlTemplates[templateData.ownerType]) {
    var relatedUrlTemplate = urlTemplates[templateData.ownerType].related;
    var selfUrlTemplate = urlTemplates[templateData.ownerType].relationship;

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
  var json = {};
  json.id = resource.id;
  json.type = resource.type;
  json.attributes = resource.attrs;

  if (resource.meta && !(0, _utilTypeHandling.objectIsEmpty)(resource.meta)) {
    json.meta = resource.meta;
  }

  // use type, id, meta and attrs for template data, even though building
  // links from attr values is usually stupid (but there are cases for it).
  var templateData = _Object$assign({}, json);
  var selfTemplate = urlTemplates[resource.type] && urlTemplates[resource.type].self;

  if (!(0, _utilTypeHandling.objectIsEmpty)(resource.links) || selfTemplate) {
    json.links = {};
    if (selfTemplate) {
      json.links.self = selfTemplate.expand(templateData);
    }
  }

  if (!(0, _utilTypeHandling.objectIsEmpty)(resource.relationships)) {
    json.relationships = {};

    for (var path in resource.relationships) {
      var linkTemplateData = { "ownerType": json.type, "ownerId": json.id, "path": path };
      json.relationships[path] = relationshipObjectToJSON(resource.relationships[path], urlTemplates, linkTemplateData);
    }
  }

  return json;
}

function errorToJSON(error) {
  var res = {};
  for (var key in error) {
    if (error.hasOwnProperty(key)) {
      res[key] = error[key];
    }
  }
  return res;
}
module.exports = exports["default"];