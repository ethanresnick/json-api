"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); };

var APIError = _interopRequire(require("../../types/APIError"));

var Collection = _interopRequire(require("../../types/Collection"));

var Resource = _interopRequire(require("../../types/Resource"));

var arrayValuesMatch = require("../../util/arrays").arrayValuesMatch;

var mapResources = require("../../util/type-handling").mapResources;

module.exports = function (requestContext, responseContext, registry) {
  var primary = requestContext.primary;
  var type = requestContext.type;
  var adapter = registry.adapter(type);
  var changedResourceOrCollection = undefined;

  if (primary instanceof Collection) {
    if (!Array.isArray(requestContext.idOrIds)) {
      var title = "You can't replace a single resource with a collection.";
      throw new APIError(400, undefined, title);
    }
    changedResourceOrCollection = primary;
  } else if (primary instanceof Resource) {
    if (requestContext.idOrIds !== primary.id) {
      var title = "The id of the resource you provided doesn't match that in the URL.";
      throw new APIError(400, undefined, title);
    }
    changedResourceOrCollection = primary;
  } else if (primary instanceof LinkObject) {
    changedResourceOrCollection = new Resource(requestContext.type, requestContext.idOrIds, _defineProperty({}, requestContext.relationship, requestContext.primary));
  }

  return adapter.update(type, changedResourceOrCollection).then(function (resources) {
    responseContext.primary = resources;
  });
};