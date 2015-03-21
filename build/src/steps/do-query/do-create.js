"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var APIError = _interopRequire(require("../../types/APIError"));

var Resource = _interopRequire(require("../../types/Resource"));

var templating = _interopRequire(require("url-template"));

module.exports = function (requestContext, responseContext, registry) {
  var type = requestContext.type;
  var adapter = registry.adapter(type);

  return adapter.create(type, requestContext.primary).then(function (created) {
    responseContext.primary = created;
    responseContext.status = 201;

    // We can only generate a Location url for a single resource.
    if (created instanceof Resource) {
      var templates = registry.urlTemplates(created.type);
      var template = templates && templates.self;
      if (template) {
        var templateData = Object.assign({ id: created.id }, created.attrs);
        responseContext.location = templating.parse(template).expand(templateData);
      }
    }
  });
};