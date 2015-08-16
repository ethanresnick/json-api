"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

exports["default"] = function (type, labelOrId, registry, frameworkReq) {
  return _q2["default"].Promise(function (resolve, reject) {
    var adapter = registry.dbAdapter(type);
    var model = adapter.getModel(adapter.constructor.getModelName(type));
    var labelMappers = registry.labelMappers(type);
    var labelMapper = labelMappers && labelMappers[labelOrId];

    // reolve with the mapped label
    if (typeof labelMapper === "function") {
      (0, _q2["default"])(labelMapper(model, frameworkReq)).then(resolve);
    }

    // or, if we couldn't find a label mapper, that means
    // we were given an id, so we just resolve with that id.
    else {
        resolve(labelOrId);
      }
  });
};

module.exports = exports["default"];