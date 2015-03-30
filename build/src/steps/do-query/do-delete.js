"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var APIError = _interopRequire(require("../../types/APIError"));

module.exports = function (requestContext, responseContext, registry) {
  var type = requestContext.type;
  var adapter = registry.adapter(type);

  if (requestContext.aboutLinkObject) {
    if (Array.isArray(requestContext.idOrIds)) {
      throw new APIError(400, undefined, "You can only remove resources from the linkage of one resource at a time.");
    }
    return adapter.removeFromRelationship(type, requestContext.idOrIds, requestContext.relationship, requestContext.primary).then(function () {
      responseContext.status = 204;
    });
  } else {
    return adapter["delete"](type, requestContext.idOrIds).then(function (resources) {
      responseContext.status = 204;
    });
  }
};