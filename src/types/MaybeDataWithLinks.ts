import mapObject = require("lodash/mapValues"); // tslint:disable-line no-submodule-imports
import Data from "./Generic/Data";
import Resource from "./Resource";
import ResourceIdentifier from "./ResourceIdentifier";
import {
  Reducer, PredicateFn, UrlTemplates, Mapper, AsyncMapper, Links
} from "./index";

/**
 * A parent class used by the Relationship and ResourceSet classes
 * to describe two class fields of { data?: Data<T> and links: object }.
 * I wish this could be a mixin (and I've not given it a public constructor
 * to preserve that option for later), but doing that now seems to cause TS
 * to choke on the type parameter.
 */
export type MaybeDataWithLinksArgs<T> = {
  data: T | T[] | null | undefined | Data<T>;
  links?: UrlTemplates;
};

export type DataSyncMethods = "flatMap" | "map" | "filter";
export type DataAsyncMethods = "flatMapAsync" | "mapAsync";

export default class MaybeDataWithLinks<T extends (Resource | ResourceIdentifier)> {
  protected _data: Data<T> | undefined;
  public links: UrlTemplates;

  protected constructor({ data, links = {} }: MaybeDataWithLinksArgs<T>) {
    this.links = links;

    this._data =
      typeof data === "undefined" || data instanceof Data
        ? data
        : Data.fromJSON(data);
  }

  get values() {
    return this._data ? [...this._data.values] : [];
  }

  get isSingular() {
    return this._data ? this._data.isSingular : undefined;
  }

  map(fn: Mapper<T, T>) {
    return this.delegateTransformToData("map", arguments);
  }

  flatMap(fn: (it: T) => Data<T>) {
    return this.delegateTransformToData("flatMap", arguments);
  }

  filter(fn: PredicateFn<T>) {
    return this.delegateTransformToData("filter", arguments);
  }

  async mapAsync(fn: AsyncMapper<T, T>) {
    return this.delegateTransformToDataAsync("mapAsync", arguments);
  }

  async flatMapAsync(fn: (it: T) => Data<T> | Promise<Data<T>>) {
    return this.delegateTransformToDataAsync("flatMapAsync", arguments);
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
      links: mapObject(
        this.links || {},
        (template) => template && template(linkTemplateData)
      ) as Links,
      data: this.unwrapDataWith(fn)
    };
  }

  /**
   * Like {@see unwrapWith}, but only gives you the data back.
   */
  unwrapDataWith<U>(fn: (it: T) => U) {
    return this._data && this._data.map(fn).unwrap();
  }


  every(fn: PredicateFn<T>): boolean {
    return this._data ? this._data.every(fn) : true;
  }

  some(fn: PredicateFn<T>): boolean {
    return this._data ? this._data.some(fn) : false;
  }

  reduce(fn: Reducer<T, T>): T | undefined;
  reduce<U>(fn: Reducer<T, U>, initialValue: U): U;
  reduce<U>(fn: Reducer<T, U>, initialValue?: U): U | T | undefined {
    if(!this._data) {
      return initialValue;
    }

    return arguments.length > 1
      ? this._data.reduce(fn, initialValue as U)
      : this._data.reduce(fn as any as Reducer<T, T>);
  }

  forEach(fn: (it: T) => void) {
    this._data && this._data.forEach(fn);
    return this; // for chaining
  }

  protected clone(): this {
    const Ctor = this.constructor as any;
    return new Ctor({
      data: this._data,
      links: this.links
    });
  }

  protected delegateTransformToData(methodName: DataSyncMethods, args) {
    return this._data
      ? this.withNewData((this._data[methodName] as any)(...args))
      : this;
  }

  protected async delegateTransformToDataAsync(methodName: DataAsyncMethods, args) {
    return this._data
      ? (this._data[methodName] as (...args: any[]) => Promise<Data<T>>)(...args)
          .then(newData => this.withNewData(newData))
      : this;
  }

  protected withNewData(newData): this {
    const res = this.clone();
    res._data = newData;
    return res;
  }
}
