"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var APIError = _interopRequire(require("../../types/APIError"));

var polyfill = _interopRequire(require("babel/polyfill"));

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
  }

  return adapter.find(type, requestContext.idOrIds, fields, sorts, filters, includes).then(function (resources) {
    var _ref = resources;

    var _ref2 = _slicedToArray(_ref, 2);

    responseContext.primary = _ref2[0];
    responseContext.included = _ref2[1];
  });
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