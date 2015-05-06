"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _slicedToArray = require("babel-runtime/helpers/sliced-to-array")["default"];

var _core = require("babel-runtime/core-js")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var Linkage = _interopRequire(require("./Linkage"));

var Resource = _interopRequire(require("./Resource"));

var Collection = _interopRequire(require("./Collection"));

var _utilTypeHandling = require("../util/type-handling");

var objectIsEmpty = _utilTypeHandling.objectIsEmpty;
var mapResources = _utilTypeHandling.mapResources;
var mapObject = _utilTypeHandling.mapObject;

var arrayUnique = require("../util/arrays").arrayUnique;

var templating = _interopRequire(require("url-template"));

var Document = (function () {
  function Document(primaryOrErrors, included, meta, urlTemplates, reqURI) {
    _classCallCheck(this, Document);

    var _ref = [primaryOrErrors, included, reqURI];

    var _ref2 = _slicedToArray(_ref, 3);

    this.primaryOrErrors = _ref2[0];
    this.included = _ref2[1];
    this.reqURI = _ref2[2];

    // validate meta
    if (meta !== undefined) {
      if (typeof meta === "object" && !Array.isArray(meta)) {
        this.meta = meta;
      } else {
        throw new Error("Meta information must be an object");
      }
    }

    // parse all the templates once on construction.
    this.urlTemplates = mapObject(urlTemplates || {}, function (templatesForType) {
      return mapObject(templatesForType, templating.parse.bind(templating));
    });

    this.reqURI = reqURI;
  }

  _createClass(Document, {
    get: {
      value: function get(stringify) {
        var _this = this;

        var doc = {};

        if (this.meta) doc.meta = this.meta;

        // TODO: top-level related link.
        if (this.reqURI) {
          doc.links = { self: this.reqURI };
        }

        if (this.primaryOrErrors instanceof Collection || this.primaryOrErrors instanceof Resource) {
          doc.data = mapResources(this.primaryOrErrors, function (resource) {
            return resourceToJSON(resource, _this.urlTemplates);
          });
        } else if (this.primaryOrErrors instanceof Linkage) {
          doc.data = linkageToJSON(this.primaryOrErrors);
        } else if (this.primaryOrErrors === null) {
          doc.data = this.primaryOrErrors;
        }

        // it's either resource, a collection, linkage, null, or errors...
        else {
          doc.errors = this.primaryOrErrors.map(errorToJSON);
        }

        if (this.included && this.included instanceof Collection) {
          doc.included = arrayUnique(this.included.resources).map(function (resource) {
            return resourceToJSON(resource, _this.urlTemplates);
          });
        }

        return stringify ? JSON.stringify(doc) : doc;
      }
    }
  });

  return Document;
})();

module.exports = Document;

function linkageToJSON(linkage) {
  return linkage.value;
}

function linkObjectToJSON(linkObject, urlTemplates, templateData) {
  var result = {
    linkage: linkageToJSON(linkObject.linkage)
  };

  // Add urls that we can.
  if (urlTemplates[templateData.ownerType]) {
    var relatedUrlTemplate = urlTemplates[templateData.ownerType].related;

    if (relatedUrlTemplate) {
      result.related = relatedUrlTemplate.expand(templateData);
    }

    var selfUrlTemplate = urlTemplates[templateData.ownerType].relationship;

    if (selfUrlTemplate) {
      result.self = selfUrlTemplate.expand(templateData);
    }
  }

  return result;
}

function resourceToJSON(resource, urlTemplates) {
  var json = {};
  json.id = resource.id;
  json.type = resource.type;
  json.attributes = resource.attrs;

  if (resource.meta && !objectIsEmpty(resource.meta)) {
    json.meta = resource.meta;
  }

  // use type, id, meta and attrs for template data, even though building
  // links from attr values is usually stupid (but there are cases for it).
  var templateData = _core.Object.assign({}, json);
  var selfTemplate = urlTemplates[resource.type] && urlTemplates[resource.type].self;

  if (!objectIsEmpty(resource.links) || selfTemplate) {
    json.links = {};
    if (selfTemplate) {
      json.links.self = selfTemplate.expand(templateData);
    }
    for (var path in resource.links) {
      var linkTemplateData = { ownerType: json.type, ownerId: json.id, path: path };
      json.links[path] = linkObjectToJSON(resource.links[path], urlTemplates, linkTemplateData);
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