"use strict";

var _defineProperty = require("babel-runtime/helpers/define-property")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var APIError = _interopRequire(require("../../types/APIError"));

var Collection = _interopRequire(require("../../types/Collection"));

var Resource = _interopRequire(require("../../types/Resource"));

var Linkage = _interopRequire(require("../../types/Linkage"));

var arrayValuesMatch = require("../../util/arrays").arrayValuesMatch;

var mapResources = require("../../util/type-handling").mapResources;

module.exports = function (requestContext, responseContext, registry) {
  var primary = requestContext.primary;
  var type = requestContext.type;
  var adapter = registry.adapter(type);
  var changedResourceOrCollection = undefined;

  if (primary instanceof Collection) {
    if (requestContext.idOrIds && !Array.isArray(requestContext.idOrIds)) {
      var title = "You can't replace a single resource with a collection.";
      throw new APIError(400, undefined, title);
    }

    changedResourceOrCollection = primary;
  } else if (primary instanceof Resource) {
    if (!requestContext.idOrIds) {
      var title = "You must provide an array of resources to do a bulk update.";
      throw new APIError(400, undefined, title);
    } else if (requestContext.idOrIds !== primary.id) {
      var title = "The id of the resource you provided doesn't match that in the URL.";
      throw new APIError(400, undefined, title);
    }
    changedResourceOrCollection = primary;
  } else if (primary instanceof Linkage) {
    changedResourceOrCollection = new Resource(requestContext.type, requestContext.idOrIds, _defineProperty({}, requestContext.relationship, requestContext.primary));
  }

  return adapter.update(type, changedResourceOrCollection).then(function (resources) {
    responseContext.primary = resources;
  });
};