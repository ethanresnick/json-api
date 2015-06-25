// This file contains utility functions used by the Mongoose adapter that
// aren't part of the class's public interface. Don't use them in your own
// code, as their APIs are subject to change.
"use strict";

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errorHandler = errorHandler;
exports.getReferencePaths = getReferencePaths;
exports.isReferencePath = isReferencePath;
exports.getReferencedModelName = getReferencedModelName;
exports.resourceToDocObject = resourceToDocObject;

var _typesAPIError = require("../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

/**
 * Takes any error that resulted from the above operations throws an array of
 * errors that can be sent back to the caller as the Promise's rejection value.
 */

function errorHandler(err) {
  var errors = [];
  //Convert validation errors collection to something reasonable
  if (err.errors) {
    for (var errKey in err.errors) {
      var thisError = err.errors[errKey];
      errors.push(new _typesAPIError2["default"](err.name === "ValidationError" ? 400 : thisError.status || 500, undefined, thisError.message, undefined, undefined, thisError.path ? [thisError.path] : undefined));
    }
  }

  // Send the raw error.
  // Don't worry about revealing internal concerns, as the pipeline maps
  // all unhandled errors to generic json-api APIError objects pre responding.
  else {
    errors.push(err);
  }

  throw errors;
}

function getReferencePaths(model) {
  var paths = [];
  model.schema.eachPath(function (name, type) {
    if (isReferencePath(type)) paths.push(name);
  });
  return paths;
}

function isReferencePath(schemaType) {
  var options = (schemaType.caster || schemaType).options;
  return options && options.ref !== undefined;
}

function getReferencedModelName(model, path) {
  var schemaType = model.schema.path(path);
  var schemaOptions = (schemaType.caster || schemaType).options;
  return schemaOptions && schemaOptions.ref;
}

/**
 * Takes a Resource object and returns JSON that could be passed to Mongoose
 * to create a document for that resource. The returned JSON doesn't include
 * the id (as the input resources are coming from a client, and we're
 * ignoring client-provided ids) or the type (as that is set by mongoose
 * outside of the document) or the meta (as storing that like a field may not
 * be what we want to do).
 */

function resourceToDocObject(resource) {
  var res = _Object$assign({}, resource.attrs);
  var getId = function getId(it) {
    return it.id;
  };
  for (var key in resource.relationships) {
    var linkage = resource.relationships[key].linkage.value;

    // handle linkage when set explicitly for empty relationships
    if (linkage === null || Array.isArray(linkage) && linkage.length === 0) {
      res[key] = linkage;
    } else {
      res[key] = Array.isArray(linkage) ? linkage.map(getId) : linkage.id;
    }
  }
  return res;
}