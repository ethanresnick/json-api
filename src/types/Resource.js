import {deleteNested} from "../util/misc"

export default class Resource {
  constructor(type, id, attrs = {}, links = {}, meta = {}) {
    [this.type, this.id, this.attrs, this.links, this.meta] =
      [type, id, attrs, links, meta];
  }

  removeAttr(attrPath) {
    if(this._attrs) {
      deleteNested(attrPath, this._attrs);
    }
  }

  get attrs() {
    return this._attrs;
  }

  set attrs(attrs) {
    validateAttrs(attrs);
    this._attrs = attrs;
  }

  get type() {
    return this._type;
  }

  set type(type) {
    validateType(type);
    this._type = String(type);
  }

  get id() {
    return this._id;
  }

  set id(id) {
    // allow empty id, e.g. for the case of a new resource
    // posted from the client and not yet saved.
    this._id = (id) ? String(id) : undefined;
  }
}

function validateAttrs(attrs) {
  if(typeof attrs !== "object" || Array.isArray(attrs)) {
    throw new Error("Attrs must be an object.");
  }

  ["id", "type", "meta", "links"].forEach((it) => {
    if(attrs[it]) throw new Error(it + " is an invalid attribute name");
  });
}

function validateType(type) {
  if(!type) throw new Error("type is required");
}
