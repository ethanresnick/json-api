"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typesAPIError = require("../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

var _typesCollection = require("../../types/Collection");

var _typesCollection2 = _interopRequireDefault(_typesCollection);

exports["default"] = function (request, response, registry) {
  var type = request.type;
  var adapter = registry.dbAdapter(type);

  if (request.aboutRelationship) {
    if (Array.isArray(request.idOrIds)) {
      throw new _typesAPIError2["default"](400, undefined, "You can only remove resources from the linkage of one resource at a time.");
    }
    return adapter.removeFromRelationship(type, request.idOrIds, request.relationship, request.primary).then(function () {
      response.status = 204;
    });
  } else if (!request.idOrIds && request.ext.indexOf("bulk") !== -1) {
    if (!(request.primary instanceof _typesCollection2["default"])) {
      var title = "You must provide an array of objects to do a bulk delete.";
      throw new _typesAPIError2["default"](400, undefined, title);
    }

    if (!request.primary.resources.every(function (it) {
      return typeof it.id !== "undefined";
    })) {
      var title = "Every object provided for a bulk delete must contain a `type` and `id`.";
      throw new _typesAPIError2["default"](400, undefined, title);
    }

    var ids = request.primary.resources.map(function (it) {
      return it.id;
    });
    return adapter["delete"](request.type, ids).then(function () {
      response.status = 204;
    });
  } else {
    return adapter["delete"](type, request.idOrIds).then(function () {
      response.status = 204;
    });
  }
};

module.exports = exports["default"];