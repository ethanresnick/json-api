"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typesResource = require("../types/Resource");

var _typesResource2 = _interopRequireDefault(_typesResource);

var _typesCollection = require("../types/Collection");

var _typesCollection2 = _interopRequireDefault(_typesCollection);

var _q = require("q");

/**
 * @param toTransform Could be a single resource, a collection, a link object, or null.
 */

exports["default"] = function (toTransform, mode, registry, frameworkReq, frameworkRes) {
  if (toTransform instanceof _typesResource2["default"]) {
    return transform(toTransform, frameworkReq, frameworkRes, mode, registry);
  } else if (toTransform instanceof _typesCollection2["default"]) {
    // below, allow the user to return undefined to remove a vlaue.
    return _q.Promise.all(toTransform.resources.map(function (it) {
      return transform(it, frameworkReq, frameworkRes, mode, registry);
    })).then(function (transformed) {
      return new _typesCollection2["default"](transformed.filter(function (it) {
        return it !== undefined;
      }));
    });
  }

  // We only transform resources or collections.
  else {
      return _q.Promise.resolve(toTransform);
    }
};

function transform(resource, req, res, transformMode, registry) {
  var transformFn = registry[transformMode](resource.type);

  // SuperFn is a function that the first transformer can invoke.
  // It'll return the resource passed in (i.e. do nothing) if there
  // is no parentType or the parentType doesn't define an appropriate
  // transformer. Otherwise, it'll return the result of calling
  // the parentType's transformer with the provided arguments.
  var superFn = function superFn(resource, req, res) {
    var parentType = registry.parentType(resource.type);

    if (!parentType || !registry[transformMode](parentType)) {
      return resource;
    } else {
      return registry[transformMode](parentType)(resource, req, res, superFn);
    }
  };

  if (!transformFn) {
    return _q.Promise.resolve(resource);
  }

  // Allow user to return a Promise or a value
  var transformed = transformFn(resource, req, res, superFn);
  return _q.Promise.resolve(transformed);
}
module.exports = exports["default"];