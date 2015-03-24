"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var LinkObject = _interopRequire(require("./LinkObject"));

var Linkage = _interopRequire(require("./Linkage"));

var Resource = _interopRequire(require("./Resource"));

var Collection = _interopRequire(require("./Collection"));

var APIError = _interopRequire(require("./APIError"));

var _utilTypeHandling = require("../util/type-handling");

var objectIsEmpty = _utilTypeHandling.objectIsEmpty;
var mapResources = _utilTypeHandling.mapResources;
var mapObject = _utilTypeHandling.mapObject;

var arrayUnique = require("../util/arrays").arrayUnique;

var templating = _interopRequire(require("url-template"));

var Document = (function () {
  /*eslint-disable no-unused-vars */

  function Document(primaryOrErrors, _x, meta, urlTemplates, reqURI) {
    var included = arguments[1] === undefined ? [] : arguments[1];

    _classCallCheck(this, Document);

    var _ref = Array.from(arguments).slice(0, 3);

    var _ref2 = _slicedToArray(_ref, 3);

    this.primaryOrErrors = _ref2[0];
    this.included = _ref2[1];
    this.meta = _ref2[2];

    // parse all the templates once on construction.
    this.urlTemplates = mapObject(urlTemplates || {}, function (templatesForType) {
      return mapObject(templatesForType, templating.parse.bind(templating));
    });

    this.reqURI = reqURI;
  }

  _createClass(Document, {
    get: {
      /*eslint-enable */

      value: function get() {
        var _this = this;

        var doc = {};

        if (this.meta && !objectIsEmpty(this.meta)) doc.meta = this.meta;

        // TODO: top-level related link.
        if (this.reqURI) {
          doc.links = { self: this.reqURI };
        }

        if (this.included && Array.isArray(this.included)) {
          doc.included = arrayUnique(this.included).map(function (resource) {
            return resourceToJSON(resource, _this.urlTemplates);
          });
        }

        if (this.primaryOrErrors instanceof Collection || this.primaryOrErrors instanceof Resource) {
          doc.data = mapResources(this.primaryOrErrors, function (resource) {
            return resourceToJSON(resource, _this.urlTemplates);
          });
        } else if (this.primaryOrErrors instanceof Linkage) {
          doc.data = linkageToJSON(this.primaryOrErrors);
        }

        // it's either resource, a collection, linkage or errors...
        else {
          doc.errors = this.primaryOrErrors.map(errorToJSON);
        }

        return doc;
      }
    }
  });

  return Document;
})();

module.exports = Document;

function linkageToJSON(linkage) {
  return linkage.value;
}

function linkObjectToJSON(linkObject, urlTemplates) {
  return {
    linkage: linkageToJSON(linkObject.linkage)
  };
}

function resourceToJSON(resource, urlTemplates) {
  var json = resource.attrs;
  var selfTemplate = urlTemplates[resource.type] && urlTemplates[resource.type].self;
  json.id = resource.id;
  json.type = resource.type;

  if (!objectIsEmpty(resource.links) || selfTemplate) {
    json.links = {};
    if (selfTemplate) {
      var templateData = Object.assign({ id: resource.id }, resource.attrs);
      json.links.self = urlTemplates[resource.type].self.expand(templateData);
    }
    for (var path in resource.links) {
      json.links[path] = linkObjectToJSON(resource.links[path], urlTemplates);
    }
  }

  if (resource.meta && !objectIsEmpty(resource.meta)) {
    json.meta = resource.meta;
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

/*
  (@primaryResources, extraResources, @meta, @urlTemplates)->
    # urlTemplate stuff
    @links = {}
    @_urlTemplatesParsed = {[k, templating.parse(template)] for k, template of @urlTemplates}

  # renders a non-stub resource
  renderResource: (resource) ->
    urlTempParams = do -> ({} <<< res)
    res.links = {}
    res.links[config.resourceUrlKey] = @urlFor(res.type, config.resourceUrlKey, res.id, urlTempParams)

  urlFor: (type, path, referencedIdOrIds, extraParams) ->
    if not @_urlTemplatesParsed[type + "." + path]
      throw new Error("Missing url template for " + type + "." + path);

    params = flat.flatten({[(type + "." + k), v] for k, v of extraParams}, {safe:true})
    params[type + "." + path] = referencedIdOrIds;

    @_urlTemplatesParsed[type + "." + path].expand(params)
*/