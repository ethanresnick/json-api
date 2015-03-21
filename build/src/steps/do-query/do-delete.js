"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var APIError = _interopRequire(require("../../types/APIError"));

module.exports = function (requestContext, responseContext, registry) {
  var type = requestContext.type;
  var adapter = registry.adapter(type);

  return adapter["delete"](type, requestContext.idOrIds).then(function (resources) {
    responseContext.status = 204;
  });
};