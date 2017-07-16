import {deleteNested, isPlainObject} from "../util/misc";
import Relationship, { RelationshipJSON } from './Relationship';

export type ResourceJSON = {
  id: string,
  type: string,
  attributes?: object,
  relationships?: { [name: string]: RelationshipJSON },
  meta?: object,
  links?: { self?: string }
}

// Used after an id has been assigned by the server.
export type ResourceWithId = Resource & { id: string };

export default class Resource {
  private _id: string | undefined;
  private _type: string;
  private _relationships: {[name: string]: Relationship};
  private _attrs: {[name: string]: any};
  public meta: object;

  constructor(type: string, id?: string, attrs = {}, relationships = {}, meta: object = {}) {
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
    return this.id === otherResource.id && this.type === otherResource.type;
  }

  get attrs() {
    return this._attrs;
  }

  set attrs(attrs) {
    validateFieldGroup(attrs, this._relationships, true);
    this._attrs = attrs;
  }

  get relationships() {
    return this._relationships;
  }

  set relationships(relationships) {
    validateFieldGroup(relationships, this._attrs);
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
 * objects) are provided as objects and that they don't contain `type` and
 * `id` members. Also checks that attributes and relationships don't contain
 * the same keys as one another, and it checks that complex attributes don't
 * contain "relationships" or "links" members.
 *
 * @param {Object} group The an object of fields (attributes or relationships)
 *    that the user is trying to add to the Resource.
 * @param {Object} otherFields The other fields that will still exist on the
 *    Resource. The new fields are checked against these other fields for
 *    naming conflicts.
 * @param {Boolean} isAttributes Whether the `group` points to the attributes
 *    of the resource. Triggers complex attribute validation.
 * @return {undefined}
 * @throws {Error} If the field group is invalid given the other fields.
 */
function validateFieldGroup(group, otherFields, isAttributes = false) {
  if(!isPlainObject(group)) {
    throw new Error("Attributes and relationships must be provided as an object.");
  }

  if(typeof group.id !== "undefined" || typeof group.type !== "undefined") {
    throw new Error("`type` and `id` cannot be used as attribute or relationship names.");
  }

  for(let field in group) {
    if(isAttributes) {
      validateComplexAttribute(group[field]);
    }

    if(otherFields !== undefined && typeof otherFields[field] !== "undefined") {
      throw new Error("A resource can't have an attribute and a relationship with the same name.");
    }
  }
}

function validateComplexAttribute(attrOrAttrPart) {
  if(isPlainObject(attrOrAttrPart)) {
    if(typeof attrOrAttrPart.relationships !== "undefined" || typeof attrOrAttrPart.links !== "undefined") {
      throw new Error('Complex attributes may not have "relationships" or "links" keys.');
    }
    for(let key in attrOrAttrPart) {
      validateComplexAttribute(attrOrAttrPart[key]);
    }
  }
  else if(Array.isArray(attrOrAttrPart)) {
    attrOrAttrPart.forEach(validateComplexAttribute);
  }
}
