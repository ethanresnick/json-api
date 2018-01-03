import ResourceTypeRegistry from "../ResourceTypeRegistry";
import { Request } from '../types/';
import Data from "../types/Generic/Data";
import Resource from "../types/Resource";
import ResourceIdentifier from "../types/ResourceIdentifier";

export type Extras = {
  frameworkReq: any,
  frameworkRes: any,
  request: Request,
  registry: ResourceTypeRegistry
};

export type Transformable = Resource | ResourceIdentifier;
export type TransformMode = 'beforeSave' | 'beforeRender';
export type TransformFn<T> = (
  resourceOrIdentifier: T,
  frameworkReq: Extras['frameworkReq'],
  frameworkRes: Extras['frameworkRes'],
  superFn: TransformFn<T>,
  extras: Extras
) => T | undefined | Promise<T | undefined>;

export type ResourceTransformFn = TransformFn<Resource>;
export type FullTransformFn = TransformFn<Transformable>;

export default function transform<T extends Transformable>(
  toTransform: Data<T>,
  mode: TransformMode,
  extras: Extras
): Promise<Data<T>> {
  const { registry } = extras;

  // Whether to skip transforming a given item.
  const skipTransform = (it: Transformable, typeForTransform: string) =>
    it instanceof ResourceIdentifier && !registry.transformLinkage(typeForTransform);

  // Whether it's the case that some resource types transform their linkage.
  // If no linkage transforms are in effect, we can save a lot of time.
  const linkageTransformEnabled =
    registry.typeNames().some(it => registry.transformLinkage(it))

  // SuperFn is a function that the first transformer can invoke.
  // It'll return the resource passed in (i.e. do nothing) if there
  // is no parentType or the parentType doesn't define an appropriate
  // transformer. Otherwise, it'll return the result of calling
  // the parentType's transformer with the provided arguments.
  const superFn = (it, req, res, extras) => { // eslint-disable-line no-shadow
    const parentType = registry.parentType(it.type);
    const parentTransform = parentType && registry[mode](parentType);

    if(!parentType || !parentTransform || skipTransform(it, parentType)) {
      return it;
    }

    return (<TransformFn<T>>parentTransform)(it, req, res, superFn, extras);
  };

  return toTransform.flatMapAsync(async function(it) {
    if(skipTransform(it, it.type)) {
      return Data.pure(it);
    }

    // If this is a resource, and we're transforming linkage, transform all of
    // its relationships before running the main transform on the whole thing.
    if(linkageTransformEnabled && it instanceof Resource) {
      for(let relationshipName in it.relationships) {
        const relationship = it.relationships[relationshipName];
        it.relationships[relationshipName] = await relationship.flatMapAsync(linkage => {
          return transform(Data.pure(linkage), mode, extras);
        });
      }
    }

    // Type cast below is ok because of skipTransform check above
    const transformFn = <TransformFn<T>>registry[mode](it.type);

    if (!transformFn) {
      return Data.pure(it);
    }

    const transformed = await transformFn(
      it,
      extras.frameworkReq,
      extras.frameworkRes,
      superFn,
      extras
    );

    // Allow removal of resources by returning undefined.
    // Removing a single resource results in a null response per monad's logic.
    return transformed === undefined
      ? Data.empty as Data<T>
      : Data.pure(transformed);
  });
}
