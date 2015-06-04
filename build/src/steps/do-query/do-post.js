"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

_Object$defineProperty(exports, "__esModule", {
  value: true
});

var _typesAPIError = require("../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

var _typesResource = require("../../types/Resource");

var _typesResource2 = _interopRequireDefault(_typesResource);

var _typesLinkage = require("../../types/Linkage");

var _typesLinkage2 = _interopRequireDefault(_typesLinkage);

var _urlTemplate = require("url-template");

var _urlTemplate2 = _interopRequireDefault(_urlTemplate);

var _utilTypeHandling = require("../../util/type-handling");

exports["default"] = function (requestContext, responseContext, registry) {
  var primary = requestContext.primary;
  var type = requestContext.type;
  var adapter = registry.dbAdapter(type);

  // We're going to do an adapter.create, below, EXCEPT if we're adding to
  // an existing toMany relationship, which uses a different adapter method.
  if (primary instanceof _typesLinkage2["default"]) {
    if (!Array.isArray(primary.value)) {
      throw new _typesAPIError2["default"](400, undefined, "To add to a to-many relationship, you must POST an array of linkage objects.");
    }

    return adapter.addToRelationship(type, requestContext.idOrIds, requestContext.relationship, primary).then(function () {
      responseContext.status = 204;
    });
  } else {
    var _ret = (function () {
      var noClientIds = "Client-generated ids are not supported.";
      (0, _utilTypeHandling.forEachResources)(primary, function (it) {
        if (it.id) throw new _typesAPIError2["default"](403, undefined, noClientIds);
      });

      return {
        v: adapter.create(type, primary).then(function (created) {
          responseContext.primary = created;
          responseContext.status = 201;

          // We can only generate a Location url for a single resource.
          if (created instanceof _typesResource2["default"]) {
            var templates = registry.urlTemplates(created.type);
            var template = templates && templates.self;
            if (template) {
              var templateData = _Object$assign({ "id": created.id }, created.attrs);
              responseContext.location = _urlTemplate2["default"].parse(template).expand(templateData);
            }
          }
        })
      };
    })();

    if (typeof _ret === "object") return _ret.v;
  }
};

module.exports = exports["default"];