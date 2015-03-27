"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/**
 * Takes any error that resulted from the above operations throws an array of
 * errors that can be sent back to the caller as the Promise's rejection value.
 */
exports.errorHandler = errorHandler;
exports.groupResourcesByType = groupResourcesByType;

/**
 * Returns an APIError that the caller can throw if the resource types
 * provided aren't all valid. Just removes a bit of boilerplate.
 */
exports.getResourceTypeError = getResourceTypeError;
exports.getReferencePaths = getReferencePaths;
exports.isReferencePath = isReferencePath;
exports.getReferencedModelName = getReferencedModelName;

/**
 * Takes a Resource object and returns JSON that could be passed to Mongoose
 * to create a document for that resource. The returned JSON doesn't include
 * the id (as the input resources are coming from a client, and we're
 * ignoring client-provided ids) or the type (as that is set by mongoose
 * outside of the document) or the meta (as storing that like a field may not
 * be what we want to do).
 */
exports.resourceToDocObject = resourceToDocObject;
Object.defineProperty(exports, "__esModule", {
  value: true
});
// This file contains utility functions used by the Mongoose adapter that
// aren't part of the class's public interface. Don't use them in your own
// code, as their APIs are subject to change.

var Collection = _interopRequire(require("../../types/Collection"));

var APIError = _interopRequire(require("../../types/APIError"));

var isSubsetOf = require("../../util/misc").isSubsetOf;

function errorHandler(err) {
  var errors = [];
  //Convert validation errors collection to something reasonable
  if (err.errors) {
    for (var errKey in err.errors) {
      var thisError = err.errors[errKey];
      errors.push(new APIError(err.name === "ValidationError" ? 400 : thisError.status || 500, undefined, thisError.message, undefined, undefined, thisError.path ? [thisError.path] : undefined));
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

function groupResourcesByType(resourceOrCollection) {
  var resourcesByType = {};
  if (resourceOrCollection instanceof Collection) {
    resourceOrCollection.resources.forEach(function (it) {
      resourcesByType[it.type] = resourcesByType[it.type] || [];
      resourcesByType[it.type].push(it);
    });
  } else {
    resourcesByType[resourceOrCollection.type] = [resourceOrCollection];
  }
  return resourcesByType;
}

function getResourceTypeError(allowedTypes, resourceTypes) {
  if (!isSubsetOf(allowedTypes, resourceTypes)) {
    var title = "Some of the resources you provided are of a type that " + "doesn't belong in this collection.";
    var detail = "Valid types for this collection are: " + allowedTypes.join(", ") + ".";

    return new APIError(400, undefined, title, detail);
  }
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

function resourceToDocObject(resource) {
  var res = Object.assign({}, resource.attrs);
  var getId = function (it) {
    return it.id;
  };
  for (var key in resource.links) {
    var linkage = resource.links[key].linkage.value;
    res[key] = Array.isArray(linkage) ? linkage.map(getId) : linkage.id;
  }
  return res;
}