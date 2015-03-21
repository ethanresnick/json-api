"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Collection = _interopRequire(require("../../types/Collection"));

var Q = _interopRequire(require("q"));

module.exports = function (registry, frameworkReq, requestContext, responseContext) {
  return Q.Promise(function (resolve, reject) {
    if (!requestContext.allowLabel) {
      resolve();
    } else {
      var type = requestContext.type;
      var adapter = registry.adapter(type);
      var model = adapter.getModel(adapter.constructor.getModelName(type));
      var idMappers = registry.labelMappers(type);
      var idMapper = idMappers && idMappers[requestContext.idOrIds];

      if (typeof idMapper === "function") {
        Q(idMapper(model, frameworkReq)).then(function (newId) {
          var newIdIsEmptyArray = Array.isArray(newId) && newId.length === 0;

          requestContext.idOrIds = newId;

          if (newId === null || newId === undefined || newIdIsEmptyArray) {
            responseContext.primary = newId ? new Collection() : null;
          }

          resolve();
        });
      } else {
        resolve();
      }
    }
  });
};