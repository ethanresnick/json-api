"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const misc_1 = require("../util/misc");
const type_handling_1 = require("../util/type-handling");
class Resource {
    constructor(type, id, attrs = {}, relationships = {}, meta = {}) {
        [this.type, this.id, this.attrs, this.relationships, this.meta] =
            [type, id, attrs, relationships, meta];
    }
    get id() {
        return this._id;
    }
    set id(id) {
        this._id = (id) ? String(id) : undefined;
    }
    get type() {
        return this._type;
    }
    set type(type) {
        if (!type) {
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
    get attributes() {
        return this.attrs;
    }
    set attributes(attrs) {
        this.attrs = attrs;
    }
    get relationships() {
        return this._relationships;
    }
    set relationships(relationships) {
        validateFieldGroup(relationships, this._attrs);
        this._relationships = relationships;
    }
    set meta(meta) {
        if (typeof meta !== 'object' || meta === null) {
            throw new Error("meta must be an object.");
        }
        this._meta = meta;
    }
    get meta() {
        return this._meta;
    }
    removeAttr(attrPath) {
        if (this._attrs) {
            misc_1.deleteNested(attrPath, this._attrs);
        }
    }
    removeRelationship(relationshipPath) {
        if (this._relationships) {
            misc_1.deleteNested(relationshipPath, this._relationships);
        }
    }
    toJSON(urlTemplates) {
        const json = Object.assign({ id: this.id, type: this.type, attributes: this.attrs }, (!type_handling_1.objectIsEmpty(this.meta) ? { meta: this.meta } : {}));
        const templateData = Object.assign({}, json);
        const selfTemplate = urlTemplates.self;
        if (selfTemplate) {
            json.links = {
                self: selfTemplate(templateData)
            };
        }
        if (!type_handling_1.objectIsEmpty(this.relationships)) {
            json.relationships = {};
            for (const path in this.relationships) {
                const { related = undefined, relationship = undefined } = urlTemplates;
                const finalTemplates = { related, self: relationship };
                json.relationships[path] =
                    this.relationships[path].toJSON(finalTemplates);
            }
        }
        return json;
    }
}
exports.default = Resource;
function validateFieldGroup(group, otherFields, isAttributes = false) {
    if (!misc_1.isPlainObject(group)) {
        throw new Error("Attributes and relationships must be provided as an object.");
    }
    if ("id" in group || "type" in group) {
        throw new Error("`type` and `id` cannot be used as attribute or relationship names.");
    }
    for (const field in group) {
        if (isAttributes) {
            validateComplexAttribute(group[field]);
        }
        if (otherFields !== undefined && typeof otherFields[field] !== "undefined") {
            throw new Error("A resource can't have an attribute and a relationship with the same name.");
        }
    }
}
function validateComplexAttribute(attrOrAttrPart) {
    if (misc_1.isPlainObject(attrOrAttrPart)) {
        if (typeof attrOrAttrPart.relationships !== "undefined" || typeof attrOrAttrPart.links !== "undefined") {
            throw new Error('Complex attributes may not have "relationships" or "links" keys.');
        }
        for (const key in attrOrAttrPart) {
            validateComplexAttribute(attrOrAttrPart[key]);
        }
    }
    else if (Array.isArray(attrOrAttrPart)) {
        attrOrAttrPart.forEach(validateComplexAttribute);
    }
}
