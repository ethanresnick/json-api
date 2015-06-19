import Resource from "../types/Resource";
import Collection from "../types/Collection";
import { Promise } from "q";

/**
 * @param toTransform Could be a single resource, a collection, a link object, or null.
 */
export default function(toTransform, mode, registry, frameworkReq, frameworkRes) {
  if(toTransform instanceof Resource) {
    return transform(toTransform, frameworkReq, frameworkRes, mode, registry);
  }

  else if (toTransform instanceof Collection) {
    // below, allow the user to return undefined to remove a vlaue.
    return Promise.all(toTransform.resources.map((it) =>
      transform(it, frameworkReq, frameworkRes, mode, registry)
    ).filter((it) => it !== undefined)).then((newResources) => {
      return new Collection(newResources);
    });
  }

  // We only transform resources or collections.
  else {
    return Promise.resolve(toTransform);
  }
}

function transform(resource, req, res, transformMode, registry) {
  let transformFn = registry[transformMode](resource.type);

  // SuperFn is a function that the first transformer can invoke.
  // It'll return the resource passed in (i.e. do nothing) if there
  // is no parentType or the parentType doesn't define an appropriate
  // transformer. Otherwise, it'll return the result of calling
  // the parentType's transformer with the provided arguments.
  let superFn = (resource, req, res) => {
    let parentType = registry.parentType(resource.type);

    if(!parentType || !registry[transformMode](parentType)) {
      return resource;
    }
    else {
      return registry[transformMode](parentType)(resource, req, res, superFn);
    }
  };

  if (!transformFn) {
    return Promise.resolve(resource);
  }

  // Allow user to return a Promise or a value
  let transformed = transformFn(resource, req, res, superFn);
  return Promise.resolve(transformed);
}
