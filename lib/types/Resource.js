import deleteNested from "../util/utils"

export default class Resource {
  constructor(type, id, attrs, links, meta) {
    [this.type, this.id, this.attrs, this.links, this.meta] = 
      [type, id, attrs, links, meta];
  }

  removeAttr(attrPath) {
    if(this.attrs) {
      deleteNested(attrPath, this._attrs)
    }
  }

  get attrs() {
    return this._attrs;
  }

  set attrs(attrs) {
    validateAttrs(attrs)
    this._attrs = attrs
  }

  get type() {
    return this._type;
  }

  set type(type) {
    validateType(type);
    this._type = String(type).toString();
  }

  get id() {
    return this._id;
  }

  set id(id) {
    // allow empty id, e.g. for the case of a new resource
    // posted from the client and not yet saved.
    this._id = (id) ? String(id).toString() : undefined;
  }
}

function validateAttrs(attrs) {
  if(attrs !== undefined && attrs !== null) {
    if(typeof attrs !== "object" || Array.isArray(attrs)) {
      throw new Error("If present, attrs must be an object.") 
    }

    ["id", "type", "meta", "links"].forEach((it) => {
      if(attrs[it]) throw new Error(it + " is an invalid attribute name")
    });
  }
}

function validateType(type) {
  if(!type) throw new Error("type is required")
}