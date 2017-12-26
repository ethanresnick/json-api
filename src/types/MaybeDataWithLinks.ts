import Data from './Data';
import Resource from './Resource';
import ResourceIdentifier from './ResourceIdentifier';
import { Reducer, PredicateFn, UrlTemplateFns, Mapper, AsyncMapper } from "./index";
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
    const Ctor = this.constructor as typeof MaybeDataWithLinks;
    return new Ctor<T>({
      data: this.data && this.data.map(fn),
      links: this.links
    });
  }

  mapAsync(fn: AsyncMapper<T, T>) {
    const Ctor = this.constructor as typeof MaybeDataWithLinks;
    return this.data
      ? this.data.mapAsync(fn)
          .then(newData => new Ctor<T>({ data: newData, links: this.links }))
      : Promise.resolve(this);
  }

  flatMap(fn: (it: T) => Data<T>) {
    const Ctor = this.constructor as typeof MaybeDataWithLinks;
    return new Ctor<T>({
      data: this.data && this.data.flatMap(fn),
      links: this.links
    });
  }

  flatMapAsync(fn: (it: T) => Data<T> | Promise<Data<T>>) {
    const Ctor = this.constructor as typeof MaybeDataWithLinks;
    return this.data
      ? this.data.flatMapAsync(fn)
          .then(newData => new Ctor<T>({ data: newData, links: this.links }))
      : Promise.resolve(this);
  }

  unwrapWith<U>(fn: (it: T) => U, linkTemplateData: any) {
    return {
      links: mapObject(this.links, (template) => template(linkTemplateData)) as { [linkName: string]: string },
      data: this.data && this.data.map(fn).unwrap()
    };
  }

  every(fn: PredicateFn<T>): boolean {
    return this.data ? this.data.every(fn) : true;
  }

  reduce<U, V>(fn: Reducer<T, U>, initialValue?: V) {
    return this.data ? this.data.reduce(fn, initialValue) : initialValue;
  }

  forEach(fn: (it: T) => void) {
    this.data && this.data.forEach(fn);
  }
};
