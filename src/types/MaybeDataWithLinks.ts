import Data from './Data';
import Resource from './Resource';
import ResourceIdentifier from './ResourceIdentifier';
import {
  Reducer, PredicateFn, UrlTemplateFns, Mapper, AsyncMapper, Links
} from "./index";
import { mapObject } from '../util/type-handling';

/**
 * A parent class used by the Relationship and ResourceSet classes
 * to describe two class fields of { data?: Data<T> and links: object }.
 * I wish this could be a mixin (and I've not given it a public constructor
 * to preserve that option for later), but doing that now seems to cause TS
 * to choke on the type parameter.
 */
export type MaybeDataWithLinksArgs<T> =
  { data: T | T[] | null | undefined | Data<T>, links?: UrlTemplateFns };

export type DataSyncMethods = "flatMap" | "map" | "filter";
export type DataAsyncMethods = "flatMapAsync" | "mapAsync";

export default class MaybeDataWithLinks<T extends (Resource | ResourceIdentifier)> {
  protected data: Data<T> | undefined;
  public links: UrlTemplateFns;

  protected constructor({ data, links = {} }: MaybeDataWithLinksArgs<T>) {
    this.links = links;

    this.data = typeof data === 'undefined' || data instanceof Data
      ? data
      : Data.fromJSON(data);
  }

  get values() {
    return this.data ? [...this.data.values] : [];
  }

  map(fn: Mapper<T, T>) {
    return this.delegateDataTransformToParent("map", arguments);
  }

  flatMap(fn: (it: T) => Data<T>) {
    return this.delegateDataTransformToParent("flatMap", arguments);
  }

  filter(fn: PredicateFn<T>) {
    return this.delegateDataTransformToParent("filter", arguments);
  }

  mapAsync(fn: AsyncMapper<T, T>) {
    return this.delegateDataTransformToParentAsync("mapAsync", arguments);
  }

  flatMapAsync(fn: (it: T) => Data<T> | Promise<Data<T>>) {
    return this.delegateDataTransformToParentAsync("flatMapAsync", arguments);
  }

  /**
   * map, flatMap, and their async variants are all from T => T,  where
   * T extends Resource | ResourceIdentifier. That T => T restriction is b/c
   * it doesn't make sense, in our domain, for the data to change from a
   * Resource to a ResourceIdentifier or vice-versa. The exception is when we
   * want to do final output/serialization-like things, where we need to convert
   * the underlying Resource | ResourceIdentifier to plain objects or strings
   * or whatever. `unwrapWith` is designed for that final transformation, and
   * it lifts the T => T restriction by taking an unconstrained T => U transform.
   * In that same spirit, it also serializes the links, by passing the data
   * provided as the second argument to the stored template functions.
   */
  unwrapWith<U>(fn: (it: T) => U, linkTemplateData: any) {
    return {
      links: mapObject(this.links, (template) => template(linkTemplateData)) as Links,
      data: this.data && this.data.map(fn).unwrap()
    };
  }

  every(fn: PredicateFn<T>): boolean {
    return this.data ? this.data.every(fn) : true;
  }

  some(fn: PredicateFn<T>): boolean {
    return this.data ? this.data.some(fn) : false;
  }

  reduce<U>(fn: Reducer<T, U>, initialValue?: U) {
    return this.data ? this.data.reduce(fn, initialValue) : initialValue;
  }

  forEach(fn: (it: T) => void) {
    this.data && this.data.forEach(fn);
    return this; // for chaining
  }

  protected clone(): this {
    const Ctor = this.constructor as any;
    return new Ctor({
      data: this.data,
      links: this.links
    });
  }

  protected delegateDataTransformToParent(methodName: DataSyncMethods, args) {
    return this.data
      ? this.withNewData((this.data[methodName] as any)(...args))
      : this
  }

  protected delegateDataTransformToParentAsync(methodName: DataAsyncMethods, args) {
    return this.data
      ? (this.data[methodName] as (...args: any[]) => Promise<Data<T>>)(...args)
          .then(newData => this.withNewData(newData))
      : Promise.resolve(this)
  }

  protected withNewData(newData): this {
    const res = this.clone();
    res.data = newData;
    return res;
  }
};
