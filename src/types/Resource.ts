import { deleteNested, isPlainObject, objectIsEmpty } from "../util/misc";
import Relationship, { RelationshipJSON } from "./Relationship";
import { UrlTemplateFns } from "./index";

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

// Used after the typePath has been set.
export type ResourceWithTypePath = Resource & { typePath: string[] };

export default class Resource {
  private _id: string | undefined;
  private _type!: string;
  private _relationships!: { [name: string]: Relationship };
  private _attrs!: {[name: string]: any};
  private _meta!: object;

  /**
   * A key that can hold arbitrary extra data that the adapter has asked to be
   * associated with this resource. Used by the MongooseAdapter for updates.
   */
  public adapterExtra: any;

  /**
   * The type path is an array of all the type names that apply to this
   * resource, ordered with the smallest sub type first and parent types later.
   * It is set after confirming the resource's types from the adapter or
   * validating the user's `meta.types` input. By contrast, the typesList
   * (see below) represents a provisional, unvalidated typePath as provided by
   * the user, if any. Having this list, in this order, is important for the
   * beforeSave/beforeRender transforms, which use it to lookup the transform
   * functions from the right resource type descriptions.
   */
  public typePath: string[] | undefined;

  constructor(
    type: string,
    id?: string,
    attrs = Object.create(null),
    relationships = Object.create(null),
    meta: { types?: string[] } = Object.create(null)
  ) {
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

  /**
   * The typesList is intended to represent a list of type names provided by
   * the end-user. It should only be defined on resources that are created from
   * end-user data, and it may not be a valid typePath. Resources instantiated
   * by the server should never have a typesList, but should instead have a
   * typePath. See Resource.typePath.
   */
  get typesList() {
    return (this.meta as any).types;
  }

  equals(otherResource: Resource) {
    return this.id === otherResource.id && this.type === otherResource.type;
  }

  get attrs() {
    return this._attrs;
  }

  set attrs(attrs) {
    validateFieldGroup(attrs, this._relationships, true);
    this._attrs = attrs;
  }

  get attributes() {
    return this.attrs;
  }

  set attributes(attrs) {
    this.attrs = attrs;
  }

  get relationships() {
    return this._relationships;
  }

  set relationships(relationships: { [name: string]: Relationship }) {
    validateFieldGroup(relationships, this._attrs);
    this._relationships = relationships;
  }

  set meta(meta) {
    if(typeof meta !== 'object' || meta === null) {
      throw new Error("meta must be an object.");
    }

    this._meta = meta;
  }

  get meta() {
    return this._meta;
  }

  removeAttr(attrPath: string) {
    if(this._attrs) {
      deleteNested(attrPath, this._attrs);
    }
  }

  removeRelationship(relationshipPath: string) {
    if(this._relationships) {
      deleteNested(relationshipPath, this._relationships);
    }
  }

  toJSON(urlTemplates: UrlTemplateFns): ResourceJSON {
    const hasMeta = !objectIsEmpty(this.meta);
    const showTypePath = this.typePath && this.typePath.length > 1;
    const meta = showTypePath
      ? { ...this.meta, types: this.typePath }
      : this.meta;

    const json = <ResourceJSON>{
      id: this.id,
      type: this.type,
      attributes: this.attrs,
      ...(showTypePath || hasMeta ? { meta } : {}),
    };

    // use type, id, meta and attrs for template data, even though building
    // links from attr values is usually stupid (but there are cases for it).
    const templateData = { ...json };
    const selfTemplate = urlTemplates.self;

    if(selfTemplate) {
      json.links = {
        self: selfTemplate(templateData)
      }
    }

    if(!objectIsEmpty(this.relationships)) {
      json.relationships = {};

      for(const path in this.relationships) {
        const { related = undefined, relationship = undefined } = urlTemplates;
        const finalTemplates = { related, self: relationship };

        json.relationships[path] =
          this.relationships[path].toJSON(finalTemplates);
      }
    }

    return json;
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
function validateFieldGroup(group: object, otherFields: object, isAttributes = false) {
  if(!isPlainObject(group)) {
    throw new Error("Attributes and relationships must be provided as an object.");
  }

  if("id" in group || "type" in group) {
    throw new Error("`type` and `id` cannot be used as attribute or relationship names.");
  }

  for(const field in group) {
    if(isAttributes) {
      validateComplexAttribute((group as any)[field]);
    }

    if(otherFields !== undefined && typeof (otherFields as any)[field] !== "undefined") {
      throw new Error("A resource can't have an attribute and a relationship with the same name.");
    }
  }
}

function validateComplexAttribute(attrOrAttrPart: any) {
  if(isPlainObject(attrOrAttrPart)) {
    if(typeof attrOrAttrPart.relationships !== "undefined" || typeof attrOrAttrPart.links !== "undefined") {
      throw new Error('Complex attributes may not have "relationships" or "links" keys.');
    }
    for(const key in attrOrAttrPart) {
      validateComplexAttribute(attrOrAttrPart[key]);
    }
  }
  else if(Array.isArray(attrOrAttrPart)) {
    attrOrAttrPart.forEach(validateComplexAttribute);
  }
}
