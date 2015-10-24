export default class Relationship {
  constructor(linkage, relatedURITemplate, selfURITemplate) {
    Object.assign(this, {linkage, relatedURITemplate, selfURITemplate});
  }

  empty() {
    this.linkage.empty();
  }
}
