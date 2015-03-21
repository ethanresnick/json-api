// This file contains utility functions used by the Mongoose adapter that
// aren't part of the class's public interface. Don't use them in your own
// code, as their APIs are subject to change.
import Collection from "../../types/Collection";
import APIError from "../../types/APIError";
import {isSubsetOf} from "../../util/misc";

/**
 * Takes any error that resulted from the above operations throws an array of
 * errors that can be sent back to the caller as the Promise's rejection value.
 */
export function errorHandler(err) {
    const errors = [];
    //Convert validation errors collection to something reasonable
    if(err.errors) {
      for(let errKey in err.errors) {
        let thisError = err.errors[errKey];
        errors.push(
          new APIError(
            (err.name === "ValidationError") ? 400 : (thisError.status || 500),
            undefined,
            thisError.message,
            undefined,
            undefined,
            (thisError.path) ? [thisError.path] : undefined
          )
        );
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

export function groupResourcesByType(resourceOrCollection) {
  const resourcesByType = {};
  if(resourceOrCollection instanceof Collection) {
    resourceOrCollection.resources.forEach((it) => {
      resourcesByType[it.type] = resourcesByType[it.type] || [];
      resourcesByType[it.type].push(it);
    });
  }
  else {
    resourcesByType[resourceOrCollection.type] = [resourceOrCollection];
  }
  return resourcesByType;
}

/**
 * Returns an APIError that the caller can throw if the resource types
 * provided aren't all valid. Just removes a bit of boilerplate.
 */
export function getResourceTypeError(allowedTypes, resourceTypes) {
  if(!isSubsetOf(allowedTypes, resourceTypes)) {
    let title = "Some of the resources you provided are of a type that " +
                "doesn't belong in this collection.";
    let detail = `Valid types for this collection are: ${allowedTypes.join(', ')}.`;

    return new APIError(400, undefined, title, detail);
  }
}

export function getReferencePaths(model) {
  let paths = [];
  model.schema.eachPath((name, type) => {
    if(isReferencePath(type)) paths.push(name);
  });
  return paths;
}

export function isReferencePath(schemaType) {
  let options = (schemaType.caster || schemaType).options;
  return options && options.ref !== undefined;
}

export function getReferencedModelName(model, path) {
  let schemaType = model.schema.path(path);
  let schemaOptions = (schemaType.caster || schemaType).options;
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
export function resourceToDocObject(resource) {
  let res = Object.assign({}, resource.attrs);
  for(let key in resource.links) {
    let linkage = resource.links[key].linkage;
    res[key] = Array.isArray(linkage) ? linkage.map(it => it.id) : linkage.id;
  }
  return res;
}
