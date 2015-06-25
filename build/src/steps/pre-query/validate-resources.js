"use strict";

var _Object$keys = require("babel-runtime/core-js/object/keys")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _utilTypeHandling = require("../../util/type-handling");

var _utilMisc = require("../../util/misc");

var _typesAPIError = require("../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

exports["default"] = function (endpointParentType, resourceOrCollection, registry) {
  return _q2["default"].Promise(function (resolve, reject) {
    // validate that all resources are of types appropriate for the endpoint.
    var adapter = registry.dbAdapter(endpointParentType);
    var allowedTypes = adapter.getTypesAllowedInCollection(endpointParentType);
    var resourcesByType = (0, _utilTypeHandling.groupResourcesByType)(resourceOrCollection);

    if (!(0, _utilMisc.isSubsetOf)(allowedTypes, _Object$keys(resourcesByType))) {
      var title = "Some of the resources you provided are of a type that " + "doesn't belong in this collection.";
      var detail = "Valid types for this collection are: " + allowedTypes.join(", ") + ".";

      reject(new _typesAPIError2["default"](400, undefined, title, detail));
    } else {
      var _loop = function (type) {
        var resources = resourcesByType[type];
        var relationshipNames = adapter.getRelationshipNames(type);

        /*eslint-disable no-loop-func */
        var invalid = resources.some(function (resource) {
          return relationshipNames.some(function (relationshipName) {
            return typeof resource.attrs[relationshipName] !== "undefined";
          });
        });
        /*eslint-enable no-loop-func */

        if (invalid) {
          var title = "Relationship fields must be specified under the links key.";
          return {
            v: reject(new _typesAPIError2["default"](400, undefined, title))
          };
        }
      };

      // If there are extra attributes or missing attributes, we want the
      // adapter to decide how to handle that, depending on the model. But,
      // if there are paths that must be relationship names listed under the
      // attributes, that's a case that we can identify here and throw for.
      for (var type in resourcesByType) {
        var _ret = _loop(type);

        if (typeof _ret === "object") return _ret.v;
      }

      return resolve();
    }
  });
};

module.exports = exports["default"];