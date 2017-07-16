import Resource from "../types/Resource";
import Collection from "../types/Collection";
import Linkage from "../types/Linkage";

/**
 * @param toTransform Could be a single resource, a collection, a link object, or null.
 */
// TODO: Think about the return value here for single resources that are to be
// ommitted from the response (and replaced with an error).
export type Transformable = Resource | Collection | Linkage | null | undefined;
export default function<T extends Transformable>(toTransform: T, mode, registry, frameworkReq, frameworkRes): Promise<T> {
  if(toTransform instanceof Resource) {
    // TODO: if transform returns undefined???
    return <Promise<T>>transform(toTransform, frameworkReq, frameworkRes, mode, registry);
  }

  else if (toTransform instanceof Collection) {
    // below, allow the user to return undefined to remove a vlaue.
    return <Promise<T>>Promise.all(toTransform.resources.map((it) =>
      transform(it, frameworkReq, frameworkRes, mode, registry)
    )).then((transformed) => {
      let resources = <Resource[]>transformed.filter((it) => it !== undefined);
      return new Collection(resources);
    });
  }

  // We only transform resources or collections.
  else {
    return Promise.resolve(toTransform);
  }
}

function transform(resource: Resource, req, res, transformMode, registry): Promise<Resource|undefined> {
  let transformFn = registry[transformMode](resource.type);

  // SuperFn is a function that the first transformer can invoke.
  // It'll return the resource passed in (i.e. do nothing) if there
  // is no parentType or the parentType doesn't define an appropriate
  // transformer. Otherwise, it'll return the result of calling
  // the parentType's transformer with the provided arguments.
  let superFn = (resource, req, res) => { // eslint-disable-line no-shadow
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
