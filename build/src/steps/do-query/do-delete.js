"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var APIError = _interopRequire(require("../../types/APIError"));

var Collection = _interopRequire(require("../../types/Collection"));

var mapResources = require("../../util/type-handling").mapResources;

module.exports = function (request, response, registry) {
  var type = request.type;
  var adapter = registry.adapter(type);

  if (request.aboutLinkObject) {
    if (Array.isArray(request.idOrIds)) {
      throw new APIError(400, undefined, "You can only remove resources from the linkage of one resource at a time.");
    }
    return adapter.removeFromRelationship(type, request.idOrIds, request.relationship, request.primary).then(function () {
      response.status = 204;
    });
  } else if (!request.idOrIds && request.ext.indexOf("bulk") !== -1) {
    if (!(request.primary instanceof Collection)) {
      var title = "You must provide an array of objects to do a bulk delete.";
      throw new APIError(400, undefined, title);
    }

    if (!request.primary.resources.every(function (it) {
      return typeof it.id !== "undefined";
    })) {
      var title = "Every object provided for a bulk delete must contain a `type` and `id`.";
      throw new APIError(400, undefined, title);
    }

    var ids = request.primary.resources.map(function (it) {
      return it.id;
    });
    return adapter["delete"](request.type, ids).then(function () {
      response.status = 204;
    });
  } else {
    return adapter["delete"](type, request.idOrIds).then(function (resources) {
      response.status = 204;
    });
  }
};