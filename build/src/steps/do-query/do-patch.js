"use strict";

var _defineProperty = require("babel-runtime/helpers/define-property")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typesAPIError = require("../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

var _typesCollection = require("../../types/Collection");

var _typesCollection2 = _interopRequireDefault(_typesCollection);

var _typesResource = require("../../types/Resource");

var _typesResource2 = _interopRequireDefault(_typesResource);

var _typesLinkage = require("../../types/Linkage");

var _typesLinkage2 = _interopRequireDefault(_typesLinkage);

exports["default"] = function (requestContext, responseContext, registry) {
  var primary = requestContext.primary;
  var type = requestContext.type;
  var adapter = registry.dbAdapter(type);
  var changedResourceOrCollection = undefined;

  if (primary instanceof _typesCollection2["default"]) {
    if (requestContext.idOrIds && !Array.isArray(requestContext.idOrIds)) {
      var title = "You can't replace a single resource with a collection.";
      throw new _typesAPIError2["default"](400, undefined, title);
    }

    changedResourceOrCollection = primary;
  } else if (primary instanceof _typesResource2["default"]) {
    if (!requestContext.idOrIds) {
      var title = "You must provide an array of resources to do a bulk update.";
      throw new _typesAPIError2["default"](400, undefined, title);
    } else if (requestContext.idOrIds !== primary.id) {
      var title = "The id of the resource you provided doesn't match that in the URL.";
      throw new _typesAPIError2["default"](400, undefined, title);
    }
    changedResourceOrCollection = primary;
  } else if (primary instanceof _typesLinkage2["default"]) {
    changedResourceOrCollection = new _typesResource2["default"](requestContext.type, requestContext.idOrIds, _defineProperty({}, requestContext.relationship, requestContext.primary));
  }

  return adapter.update(type, changedResourceOrCollection).then(function (resources) {
    responseContext.primary = resources;
  });
};

module.exports = exports["default"];