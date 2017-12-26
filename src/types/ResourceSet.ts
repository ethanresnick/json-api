import Resource from './Resource';
import Data from './Data';
import { UrlTemplateFns, UrlTemplateFnsByType } from "./index";
import MaybeDataWithLinks from "./MaybeDataWithLinks";

export type DataWithLinksArgs<T> =
  { data: T | T[] | null | Data<T>, links?: UrlTemplateFns };

export default class ResourceSet extends MaybeDataWithLinks<Resource> {
  protected data: Data<Resource>;

  protected constructor(it: DataWithLinksArgs<Resource>) {
    if(typeof it.data === 'undefined') {
      throw new Error("Cannot construct a ResourceSet with missing data.");
    }

    super(it);
  }

  get ids() {
    return this.data.map(it => it.id);
  }

  get types() {
    return this.data.map(it => it.type);
  }

  toJSON(urlTemplates: UrlTemplateFnsByType) {
    return this.unwrapWith((it) => it.toJSON(urlTemplates[it.type] || {}), {});
  }

  static of(it: DataWithLinksArgs<Resource>) {
    return new this(it);
  }
}
