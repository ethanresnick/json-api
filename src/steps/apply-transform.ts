import Resource from "../types/Resource";
import Collection from "../types/Collection";
import Linkage from "../types/Linkage";
import ResourceTypeRegistry from "../ResourceTypeRegistry";


/**
 * @param toTransform Could be a single resource, a collection, a link object, or null.
 */
// TODO: Think about the return value here for single resources that are to be
// ommitted from the response (and replaced with an error).
export type Transformable = Resource | Collection | Linkage | null | undefined;
export type Extras = { frameworkReq: any, frameworkRes: any, request: any };
export type TransformMode = 'beforeSave' | 'beforeRender';
export type TransformFn = (
  resource: Resource,
  frameworkReq: Extras['frameworkReq'],
  frameworkRes: Extras['frameworkRes'],
  superFn: (
    resource: Resource,
    req: Extras['frameworkReq'],
    res: Extras['frameworkRes'],
    extras: Extras) => Resource | undefined | Promise<Resource|undefined>,
  extras: Extras
) => Resource | undefined | Promise<Resource|undefined>

export default function<T extends Transformable>(
  toTransform: T,
  mode: TransformMode,
  registry: ResourceTypeRegistry,
  extras: Extras
): Promise<T> {
  if(toTransform instanceof Resource) {
    // TODO: if transform returns undefined???
    return <Promise<T>>transform(toTransform, mode, registry, extras);
  }

  else if (toTransform instanceof Collection) {
    // below, allow the user to return undefined to remove a vlaue.
    return <Promise<T>>Promise.all(toTransform.resources.map((it) =>
      transform(it, mode, registry, extras)
    )).then((transformed) => {
      const resources = <Resource[]>transformed.filter((it) => it !== undefined);
      return new Collection(resources);
    });
  }

  // We only transform resources or collections.
  else {
    return Promise.resolve(toTransform);
  }
}

function transform(
  resource: Resource,
  transformMode: TransformMode,
  registry: ResourceTypeRegistry,
  extras: Extras): Promise<Resource|undefined> {
  const transformFn = registry[transformMode](resource.type);

  // SuperFn is a function that the first transformer can invoke.
  // It'll return the resource passed in (i.e. do nothing) if there
  // is no parentType or the parentType doesn't define an appropriate
  // transformer. Otherwise, it'll return the result of calling
  // the parentType's transformer with the provided arguments.
  const superFn = (resource, req, res, extras) => { // eslint-disable-line no-shadow
    const parentType = registry.parentType(resource.type);

    if(!parentType || !registry[transformMode](parentType)) {
      return resource;
    }
    else {
      return (<TransformFn>registry[transformMode](parentType))(
        resource,
        req,
        res,
        superFn,
        extras
      );
    }
  };

  if (!transformFn) {
    return Promise.resolve(resource);
  }

  // Allow user to return a Promise or a value
  const transformed = transformFn(
    resource,
    extras.frameworkReq,
    extras.frameworkRes,
    superFn,
    extras
  );
  return Promise.resolve(transformed);
}
