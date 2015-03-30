"use strict";

var _slicedToArray = require("babel-runtime/helpers/sliced-to-array")["default"];

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var APIError = _interopRequire(require("../../types/APIError"));

var arrayContains = require("../../util/arrays").arrayContains;

module.exports = function (requestContext, responseContext, registry) {
  var type = requestContext.type;
  var adapter = registry.adapter(type);
  var fields = undefined,
      sorts = undefined,
      includes = undefined,
      filters = undefined;

  // Handle fields, sorts, includes and filters.
  if (!requestContext.aboutLinkObject) {
    fields = parseFields(requestContext.queryParams.fields);
    sorts = parseSorts(requestContext.queryParams.sort);
    includes = parseCommaSeparatedParam(requestContext.queryParams.include);
    if (!includes) {
      includes = registry.defaultIncludes(type);
    }

    return adapter.find(type, requestContext.idOrIds, fields, sorts, filters, includes).then(function (resources) {
      var _ref = resources;

      var _ref2 = _slicedToArray(_ref, 2);

      responseContext.primary = _ref2[0];
      responseContext.included = _ref2[1];
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
      throw new APIError(400, undefined, "You can only request the linkage for one resource at a time.");
    }

    return adapter.find(type, requestContext.idOrIds).spread(function (resource) {
      if (resource.links && !resource.links[requestContext.relationship]) {
        // 404. doing it here is later than necessary, but more convenient than
        // loding in a schema.
        var title = "Invalid relationship name.";
        var detail = "" + requestContext.relationship + " is not a valid " + ("relationship name on resources of type \"" + type + "\"");

        throw new APIError(404, undefined, title, detail);
      }

      responseContext.primary = resource.links[requestContext.relationship].linkage;
    });
  }
};

function parseSorts(sortParam) {
  if (!sortParam) {
    return undefined;
  } else {
    var sorts = parseCommaSeparatedParam(sortParam);
    var invalidSorts = sorts.filter(function (it) {
      return !(it.startsWith("+") || it.startsWith("-"));
    });
    if (invalidSorts.length) {
      throw new APIError(400, null, "All sort parameters must start with a + or a -.", "The following sort parameters were invalid: " + invalidSorts.join(", ") + ".");
    }
    return sorts;
  }
}

function parseFields(fieldsParam) {
  var fields = undefined;
  if (typeof fieldsParam === "object") {
    fields = {};
    var isField = function (it) {
      return !arrayContains(["id", "type", "meta"], it);
    };

    for (var type in fieldsParam) {
      var provided = parseCommaSeparatedParam(fieldsParam[type]);
      //this check handles query strings like fields[people]=
      if (provided) {
        fields[type] = provided.filter(isField);
      }
    }
  }
  return fields;
}

function parseCommaSeparatedParam(it) {
  return it ? it.split(",").map(decodeURIComponent) : undefined;
}