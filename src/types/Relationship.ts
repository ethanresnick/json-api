import { LinkageJSON, UrlTemplateFns } from "./index";
import MaybeDataWithLinks, { MaybeDataWithLinksArgs } from "./MaybeDataWithLinks";
import ResourceIdentifier from "./ResourceIdentifier";
import { objectIsEmpty } from '../util/misc';

export type RelationshipJSON = {
  data?: LinkageJSON
  links?: RelationshipLinksJSON
}

export type RelationshipLinksJSON = {
  self?: string,
  related?: string
};

export type RelationshipOwner = {
  type: string,
  // id will be undefined in the Relationships on Resources that have
  // yet to be assigned an id. Luckily, links are never rendered for those,
  // so templates don't worry about that case.
  id: string | undefined,
  path: string
};
export type RelationshipArgs =
  MaybeDataWithLinksArgs<ResourceIdentifier> & { owner: RelationshipOwner };

export default class Relationship extends MaybeDataWithLinks<ResourceIdentifier> {
  public owner: RelationshipOwner;

  protected constructor(it: RelationshipArgs) {
    super(it);
    this.owner = it.owner;
  }

  protected clone(): this {
    return (this.constructor as any).of({
      data: this._data,
      links: this.links,
      owner: this.owner
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

  static of(it: RelationshipArgs) {
    return new this(it);
  }
}
