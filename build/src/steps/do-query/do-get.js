"use strict";

var _slicedToArray = require("babel-runtime/helpers/sliced-to-array")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typesAPIError = require("../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

var _utilArrays = require("../../util/arrays");

exports["default"] = function (requestContext, responseContext, registry) {
  var type = requestContext.type;
  var adapter = registry.dbAdapter(type);
  var fields = undefined,
      sorts = undefined,
      includes = undefined,
      filters = undefined;

  // Handle fields, sorts, includes and filters.
  if (!requestContext.aboutRelationship) {
    fields = parseFields(requestContext.queryParams.fields);
    sorts = parseCommaSeparatedParam(requestContext.queryParams.sort);
    // just support a "simple" filtering strategy for now.
    filters = requestContext.queryParams.filter && requestContext.queryParams.filter.simple;
    includes = parseCommaSeparatedParam(requestContext.queryParams.include);

    if (!includes) {
      includes = registry.defaultIncludes(type);
    }

    return adapter.find(type, requestContext.idOrIds, fields, sorts, filters, includes).then(function (resources) {
      var _resources = _slicedToArray(resources, 2);

      responseContext.primary = _resources[0];
      responseContext.included = _resources[1];
    });
  }

  // the user's asking for linkage. In this case:
  // - fields don't apply because fields only pick out members of resource
  //   objects, and here we're not returning a resource object;
  // - includes don't apply because the path names for an includes must match
  //   those in the primary data's `links` key, and this primary data doesn't
  //   have a links key.
  // - sorts don't apply beacuse that's only for resource collections.
  else {
      if (Array.isArray(requestContext.idOrIds)) {
        throw new _typesAPIError2["default"](400, undefined, "You can only request the linkage for one resource at a time.");
      }

      return adapter.find(type, requestContext.idOrIds).spread(function (resource) {
        // 404 if the requested relationship is not a relationship path. Doing
        // it here is more accurate than using adapter.getRelationshipNames,
        // since we're allowing for paths that can optionally hold linkage,
        // which getRelationshipNames doesn't return.
        var relationship = resource.relationships && resource.relationships[requestContext.relationship];

        if (!relationship) {
          var title = "Invalid relationship name.";
          var detail = requestContext.relationship + " is not a valid " + ("relationship name on resources of type '" + type + "'");

          throw new _typesAPIError2["default"](404, undefined, title, detail);
        }

        responseContext.primary = relationship.linkage;
      });
    }
};

function parseFields(fieldsParam) {
  var fields = undefined;
  if (typeof fieldsParam === "object") {
    fields = {};
    var isField = function isField(it) {
      return !(0, _utilArrays.arrayContains)(["id", "type"], it);
    };

    for (var type in fieldsParam) {
      var provided = parseCommaSeparatedParam(fieldsParam[type]) || [];
      fields[type] = provided.filter(isField);
    }
  }
  return fields;
}

function parseCommaSeparatedParam(it) {
  return it ? it.split(",").map(decodeURIComponent) : undefined;
}
module.exports = exports["default"];