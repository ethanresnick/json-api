import logger from "../util/logger";
import ResourceTypeRegistry from "../ResourceTypeRegistry";
import {
  FinalizedRequest, ServerReq, ServerRes,
  Transformable, BeforeRenderTransformable
} from "../types/";
import Resource, { ResourceWithId } from "../types/Resource";
import ResourceIdentifier from "../types/ResourceIdentifier";
import { TransformMeta } from "../types/Document";

export type Extras<U extends ServerReq = ServerReq, V extends ServerRes = ServerRes> = {
  request: FinalizedRequest,
  serverReq: U,
  serverRes: V,
  registry: ResourceTypeRegistry
};

export type TransformMode = 'beforeSave' | 'beforeRender';
export type TransformResult<T> = T | undefined | Promise<T | undefined>;
export type TransformFn<T, U extends ServerReq = ServerReq, V extends ServerRes = ServerRes> = (
  resourceOrIdentifier: T,
  meta: TransformMeta,
  extras: Extras<U, V>,
  superFn: (it: T, meta: TransformMeta) => TransformResult<T>
) => TransformResult<T>;

export type ResourceTransformFn = TransformFn<Resource>;
export type FullTransformFn = TransformFn<Transformable>;

export type BeforeRenderResourceTransformFn = TransformFn<ResourceWithId>;
export type BeforeRenderFullTransformFn = TransformFn<BeforeRenderTransformable>;

/**
 * Makes a transform function for use with Document.prototype.transform.
 * Integrates with the registry to use the registered beforeSave/beforeRender
 * functions of the appropriate types to actually do the transformation.
 * Also, acceps a bunch of extras as an argument, which it makes available to
 * the user's beforeSave/beforeRender functions when it calls them.
 *
 * @param {TransformMode} mode Whether the resulting function should transform
 *   its input using the registry's beforeSave functions or its beforeRender ones.
 * @param {Extras} extras A number of extra objects that are either needed to
 *   make the returned function (e.g. the resource type registry) or are passed
 *   by that function to the user's beforeSave/beforeRender for convenience.                                  [description]
 */
export default function makeTransformFn(mode: TransformMode, extras: Extras) {
  const { registry } = extras;

  // A function that can create the super function, which has to happen
  // recursively. The super function is a function that the first transformer
  // can invoke. It'll return the resource passed in (i.e. do nothing) if there
  // is no parentType or the parentType doesn't define an appropriate transformer.
  // Otherwise, it'll return the result of calling the parentType's transformer
  // with the provided arguments.
  // tslint:disable-next-line no-shadowed-variable
  const makeSuperFunction = (remainingTypes: string[], extras: Extras) => {
    return (it, meta: TransformMeta) => {
      const parentType = remainingTypes[0];
      const parentTransform = parentType && registry[mode](parentType);

      if(!parentType || !parentTransform) {
        return it;
      }

      const nextSuper = makeSuperFunction(remainingTypes.slice(1), extras);
      return (parentTransform as TransformFn<Transformable>)(
        it,
        meta,
        extras,
        nextSuper,
      );
    };
  };

  return async function(it: Transformable, meta: TransformMeta) {
    // If this is linkage that we should not be transforming), skip it.
    // For linkage, we always look at its `type` key, which'll be a root type.
    // TODO: We could skip the instanceof check if we had an argument to the
    // outer function telling us that this function will never receive resource
    // identifiers (as when no type has transformLinkage enabled). That seems
    // like a micro optimization though.
    if(it instanceof ResourceIdentifier && !registry.transformLinkage(it.type)) {
      return it;
    }

    // Look up the transform function and apply it if it exists.
    // As mentioned above, for linkage we simply use `.type` to find the
    // right function -- even if we sometimes do have a typePath with subtypes,
    // as always populating a typePath would be way too expensive.
    // For resources, though, we consider the full type path.
    if(it instanceof Resource && !it.typePath) {
      logger.warn(
        "Tried to apply transform to resource with no type path. " +
        "Fell back to type key. This is potentially unsafe. " +
        "You should investigate why your resource object had no type path."
      );
    }

    const applicableTypes =
      it instanceof Resource && it.typePath ? it.typePath : [it.type];
    const transformFn = registry[mode](applicableTypes[0]);

    if (!transformFn) {
      return it;
    }

    return (transformFn as TransformFn<Transformable>)(
      it,
      meta,
      extras,
      makeSuperFunction(applicableTypes.slice(1), extras),
    );
  };
}
