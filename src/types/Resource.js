import {deleteNested} from "../util/misc";

export default class Resource {
  constructor(type, id, attrs = {}, relationships = {}, meta = {}) {
    [this.type, this.id, this.attrs, this.relationships, this.meta] =
      [type, id, attrs, relationships, meta];
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
    if(typeof attrs !== "object" || Array.isArray(attrs)) {
      throw new Error("Attributes must be an object.");
    }

    for(let name in attrs) {
      if(this._isValidField(name)) {
        this._attrs[name] = attrs[name];
      }
      else {
        throw new Error(`${name} is an invalid or duplicate attribute name.`);
      }
    }
  }

  get relationships() {
    return this._relationships;
  }

  set relationships(relationships) {
    if(typeof relationships !== "object" || Array.isArray(relationships)) {
      throw new Error("Relationships must be an object.");
    }

    for(let name in relationships) {
      if(this._isValidField(name)) {
        this._relationships[name] = relationships[name];
      }
      else {
        throw new Error(`${name} is an invalid or duplicate relationship name.`);
      }
    }
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

  _isValidField(name) {
    return name !== "id" && name !== "type" &&
      typeof this._relationships[name] !== "undefined" &&
      typeof this._attrs[name] !== "undefined";
  }
}

function validateType(type) {
  if(!type) throw new Error("type is required");
}
