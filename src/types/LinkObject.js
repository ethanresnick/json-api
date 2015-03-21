export default class LinkObject {
  constructor(linkage, relatedURI, selfURI) {
    [this.linkage, this.relatedURI, this.selfURI] = [linkage, relatedURI, selfURI];
  }

  empty() {
    this.linkage = (Array.isArray(this.linkage)) ? [] : null;
  }
}
