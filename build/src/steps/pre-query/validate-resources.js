"use strict";

var _core = require("babel-runtime/core-js")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var Q = _interopRequire(require("q"));

var groupResourcesByType = require("../../util/type-handling").groupResourcesByType;

var arrayContains = require("../../util/arrays").arrayContains;

var isSubsetOf = require("../../util/misc").isSubsetOf;

var Collection = _interopRequire(require("../../types/Collection"));

var APIError = _interopRequire(require("../../types/APIError"));

module.exports = function (endpointParentType, resourceOrCollection, registry) {
  return Q.Promise(function (resolve, reject) {
    // validate that all resources are of types appropriate for the endpoint.
    var adapter = registry.adapter(endpointParentType);
    var allowedTypes = adapter.getTypesAllowedInCollection(endpointParentType);
    var resourcesByType = groupResourcesByType(resourceOrCollection);

    if (!isSubsetOf(allowedTypes, _core.Object.keys(resourcesByType))) {
      var title = "Some of the resources you provided are of a type that " + "doesn't belong in this collection.";
      var detail = "Valid types for this collection are: " + allowedTypes.join(", ") + ".";

      reject(new APIError(400, undefined, title, detail));
    } else {
      // If there are extra attributes or missing attributes, we want the
      // adapter to decide how to handle that, depending on the model. But,
      // if there are paths that must be relationship names listed under the
      // attributes, that's a case that we can identify here and throw for.
      for (var type in resourcesByType) {
        var _ret = (function (type) {
          var resources = resourcesByType[type];
          var relationshipNames = adapter.getRelationshipNames(type);
          var invalid = resources.some(function (resource) {
            var attrNames = _core.Object.keys(resource.attrs);
            return relationshipNames.some(function (relationshipName) {
              return arrayContains(attrNames, relationshipName);
            });
          });

          if (invalid) {
            var title = "Relationship fields must be specified under the links key.";
            return {
              v: reject(new APIError(400, undefined, title))
            };
          }
        })(type);

        if (typeof _ret === "object") return _ret.v;
      }

      return resolve();
    }
  });
};