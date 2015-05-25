import {deleteNested} from "../util/misc";

export default class Resource {
  constructor(type, id, attrs = {}, relationships = {}, meta = {}) {
    [this.type, this.id, this.attrs, this.relationships, this.meta] =
      [type, id, attrs, relationships, meta];
  }

  get id() {
    return this._id;
  }

  set id(id) {
    // allow empty id for the case of a new resource POST.
    this._id = (id) ? String(id) : undefined;
  }

  get type() {
    return this._type;
  }

  set type(type) {
    if(!type) {
      throw new Error("type is required");
    }

    this._type = String(type);
  }

  equals(otherResource) {
    return this.id === otherResource.id && this.type == otherResource.type;
  }

  get attrs() {
    return this._attrs;
  }

  set attrs(attrs) {
    validateFieldGroup(attrs);
    this._attrs = attrs;
  }

  get relationships() {
    return this._relationships;
  }

  set relationships(relationships) {
    validateFieldGroup(relationships);
    this._relationships = relationships;
  }

  removeAttr(attrPath) {
    if(this._attrs) {
      deleteNested(attrPath, this._attrs);
    }
  }

  removeRelationship(relationshipPath) {
    if(this._relationships) {
      deleteNested(relationshipPath, this._relationships);
    }
  }
}

/**
 * Checks that a group of fields (i.e. the attributes or the relationships
 * objects) are provided as objects and that they don't contain `type` and `id`
 * members. Note: this doesn't check that attributes and relationships don't
 * contain the same keys as one another, since it only operates on one group
 * at a time.
 *
 * @throws {Error} If the group isn't an object or it has `type` or `id` keys.
 * @returns void
 */
function validateFieldGroup(group) {
  if(typeof group !== "object" || Array.isArray(group)) {
    throw new Error("Attributes and relationships must be provided as an object.");
  }

  if(typeof group.id !== "undefined" || typeof group.type !== "undefined") {
    throw new Error("`type` and `id` cannot be used as attribute or relationship names.");
  }
}
