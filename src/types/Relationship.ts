import { default as Linkage, LinkageJSON } from "./Linkage";

export type RelationshipJSON = {
  data: LinkageJSON
  links?: RelationshipLinksJSON
} | {
  data: undefined,
  links: RelationshipLinksJSON
}

export type RelationshipLinksJSON = {
  self?: string,
  related?: string
};

// TODO: do relationships even need overridable link templates?
// Could the override be a resolved string, not a template?
// (So that a relationship could define its own toJSON() method without
// needing to take a template resolver as an argument). If we got
// rid of the relationship-level overrides altogether, would relationship
// even be a type separate from linkage? Should relationship store its
// source (i.e., what resource it's a relationship from), since it already
// stores the "to" in the form of the linkage. Should it store its own name?
// That might be useful if JSON:API goes further down RFC 5988, which I hope
// happens. But, holding aside what representation makes sense semantically,
// what would be more perfomant?
export default class Relationship {
  public linkage: Linkage | undefined;
  public relatedURITemplate: string | undefined;
  public selfURITemplate: string | undefined;

  constructor(linkage, relatedURITemplate: string | undefined = undefined, selfURITemplate: string | undefined = undefined) {
    Object.assign(this, {linkage, relatedURITemplate, selfURITemplate});
  }

  empty() {
    // TODO: figure out if we even want to allow relationships constructed
    // without linkage [i think we do], and what empty() should mean for them
    // [should the method exist at all?].
    if(!this.linkage) {
      throw new Error("Relationship has no linkage");
    }

    this.linkage.empty();
  }
}
