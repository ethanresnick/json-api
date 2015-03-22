"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Resource = _interopRequire(require("../types/Resource"));

var Collection = _interopRequire(require("../types/Collection"));

/**
 * @param toTransform Could be a single resource, a collection, a link object, or null.
 */

module.exports = function (toTransform, mode, registry, frameworkReq, frameworkRes) {
  if (toTransform instanceof Resource) {
    return transform(toTransform, frameworkReq, frameworkRes, mode, registry);
  } else if (toTransform instanceof Collection) {
    // below, allow the user to return undefined to remove a vlaue.
    var newResources = toTransform.resources.map(function (it) {
      return transform(it, frameworkReq, frameworkRes, mode, registry);
    }).filter(function (it) {
      return it !== undefined;
    });

    return new Collection(newResources);
  }

  // We only transform resources or collections.
  else {
    return toTransform;
  }
};

function transform(resource, req, res, transformMode, registry) {
  var transformFn = registry[transformMode](resource.type);

  // SuperFn is a function that the first transformer can invoke.
  // It'll return the resource passed in (i.e. do nothing) if there
  // is no parentType or the parentType doesn't define an appropriate
  // transformer. Otherwise, it'll return the result of calling
  // the parentType's transformer with the provided arguments.
  var superFn = function (resource, req, res) {
    var parentType = registry.parentType(resource.type);

    if (!parentType || !registry[transformMode](parentType)) {
      return resource;
    } else {
      return registry[transformMode](parentType)(resource, req, res, superFn);
    }
  };

  return transformFn ? transformFn(resource, req, res, superFn) : resource;
}