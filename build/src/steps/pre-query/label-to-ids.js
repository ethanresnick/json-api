"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Collection = _interopRequire(require("../../types/Collection"));

var Q = _interopRequire(require("q"));

module.exports = function (type, labelOrId, registry, frameworkReq) {
  return Q.Promise(function (resolve, reject) {
    var adapter = registry.adapter(type);
    var model = adapter.getModel(adapter.constructor.getModelName(type));
    var labelMappers = registry.labelMappers(type);
    var labelMapper = labelMappers && labelMappers[labelOrId];

    // reolve with the mapped label
    if (typeof labelMapper === "function") {
      Q(labelMapper(model, frameworkReq)).then(resolve);
    }

    // or, if we couldn't find a label mapper, that means
    // we were given an id, so we just resolve with that id.
    else {
      resolve(labelOrId);
    }
  });
};