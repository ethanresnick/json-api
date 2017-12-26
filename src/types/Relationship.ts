import { LinkageJSON, UrlTemplateFns, Mapper, AsyncMapper } from "./index";
import Data from "./Data";
import MaybeDataWithLinks, { MaybeDataWithLinksArgs } from "./MaybeDataWithLinks";
import ResourceIdentifier from "./ResourceIdentifier";
import { objectIsEmpty } from '../util/type-handling';

export type RelationshipJSON = {
  data?: LinkageJSON
  links?: RelationshipLinksJSON
}

export type RelationshipLinksJSON = {
  self?: string,
  related?: string
};

export type RelationshipOwner = { type: string, id: string, path: string };
export type RelationshipArgs =
  MaybeDataWithLinksArgs<ResourceIdentifier> & { owner: RelationshipOwner };

export default class Relationship extends MaybeDataWithLinks<ResourceIdentifier> {
  public owner: RelationshipOwner;

  protected constructor(it: RelationshipArgs) {
    super(it);
    this.owner = it.owner;
  }

  static of(it: RelationshipArgs) {
    return new this(it);
  }

  map(fn: Mapper<ResourceIdentifier, ResourceIdentifier>) {
    const res = super.map(fn) as Relationship;
    res.owner = this.owner;
    return res;
  }

  mapAsync(fn: AsyncMapper<ResourceIdentifier, ResourceIdentifier>) {
    return (super.mapAsync(fn) as Promise<Relationship>).then((res) => {
      res.owner = this.owner;
      return res;
    });
  }

  flatMap(fn: (it: ResourceIdentifier) => Data<ResourceIdentifier>) {
    const res = super.flatMap(fn) as Relationship;
    res.owner = this.owner;
    return res;
  }

  flatMapAsync(fn: (it: ResourceIdentifier) => Data<ResourceIdentifier> | Promise<Data<ResourceIdentifier>>) {
    return (super.flatMapAsync(fn) as Promise<Relationship>).then((res) => {
      res.owner = this.owner;
      return res;
    });
  }

  toJSON(fallbackTemplates: UrlTemplateFns): RelationshipJSON {
    const templateData = {
      "ownerType": this.owner.type,
      "ownerId": this.owner.id,
      "path": this.owner.path
    };

    const { data, links } = this.unwrapWith(it => it.toJSON(), templateData);

    // Add any links that didn't have templates set on this instance.
    const fallbackSelfTemplate = !links.self && fallbackTemplates.self;
    const fallbackRelatedTemplate = !links.related && fallbackTemplates.related;
    const finalLinks = {
      ...links,
      ...(fallbackSelfTemplate ? { self: fallbackSelfTemplate(templateData) } : {}),
      ...(fallbackRelatedTemplate ? { related: fallbackRelatedTemplate(templateData) } : {})
    };

    return {
      ...(typeof data !== 'undefined' ? { data } : {}),
      ...(objectIsEmpty(finalLinks) ? {} : { links: finalLinks })
    };
  }
}
