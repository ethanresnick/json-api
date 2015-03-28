"use strict";

var _core = require("babel-runtime/core-js")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var APIError = _interopRequire(require("../../types/APIError"));

var Resource = _interopRequire(require("../../types/Resource"));

var Linkage = _interopRequire(require("../../types/Linkage"));

var templating = _interopRequire(require("url-template"));

module.exports = function (requestContext, responseContext, registry) {
  var primary = requestContext.primary;
  var type = requestContext.type;
  var adapter = registry.adapter(type);

  // We're going to do an adapter.create, below, EXCEPT if we're adding to
  // an existing toMany relationship, which uses a different adapter method.
  if (primary instanceof Linkage) {
    if (!Array.isArray(primary.value)) {
      throw new APIError(400, undefined, "To add to a to-many relationship, you must POST an array of linkage objects.");
    }

    return adapter.addToRelationship(type, requestContext.idOrIds, requestContext.relationship, primary).then(function () {
      responseContext.status = 204;
    });
  }

  return adapter.create(type, primary).then(function (created) {
    responseContext.primary = created;
    responseContext.status = 201;

    // We can only generate a Location url for a single resource.
    if (created instanceof Resource) {
      var templates = registry.urlTemplates(created.type);
      var template = templates && templates.self;
      if (template) {
        var templateData = _core.Object.assign({ id: created.id }, created.attrs);
        responseContext.location = templating.parse(template).expand(templateData);
      }
    }
  });
};