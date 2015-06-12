"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

_Object$defineProperty(exports, "__esModule", {
  value: true
});

var _utilMisc = require("../util/misc");

var Resource = (function () {
  function Resource(type, id) {
    var attrs = arguments[2] === undefined ? {} : arguments[2];
    var relationships = arguments[3] === undefined ? {} : arguments[3];
    var meta = arguments[4] === undefined ? {} : arguments[4];

    _classCallCheck(this, Resource);

    var _ref = [type, id, attrs, relationships, meta];
    this.type = _ref[0];
    this.id = _ref[1];
    this.attrs = _ref[2];
    this.relationships = _ref[3];
    this.meta = _ref[4];
  }

  _createClass(Resource, [{
    key: "equals",
    value: function equals(otherResource) {
      return this.id === otherResource.id && this.type === otherResource.type;
    }
  }, {
    key: "removeAttr",
    value: function removeAttr(attrPath) {
      if (this._attrs) {
        (0, _utilMisc.deleteNested)(attrPath, this._attrs);
      }
    }
  }, {
    key: "removeRelationship",
    value: function removeRelationship(relationshipPath) {
      if (this._relationships) {
        (0, _utilMisc.deleteNested)(relationshipPath, this._relationships);
      }
    }
  }, {
    key: "id",
    get: function () {
      return this._id;
    },
    set: function (id) {
      // allow empty id for the case of a new resource POST.
      this._id = id ? String(id) : undefined;
    }
  }, {
    key: "type",
    get: function () {
      return this._type;
    },
    set: function (type) {
      if (!type) {
        throw new Error("type is required");
      }

      this._type = String(type);
    }
  }, {
    key: "attrs",
    get: function () {
      return this._attrs;
    },
    set: function (attrs) {
      validateFieldGroup(attrs, this._relationships, true);
      this._attrs = attrs;
    }
  }, {
    key: "relationships",
    get: function () {
      return this._relationships;
    },
    set: function (relationships) {
      validateFieldGroup(relationships, this._attrs);
      this._relationships = relationships;
    }
  }]);

  return Resource;
})();

exports["default"] = Resource;

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
function validateFieldGroup(group, otherFields, isAttributes) {
  if (!(0, _utilMisc.isPlainObject)(group)) {
    throw new Error("Attributes and relationships must be provided as an object.");
  }

  if (typeof group.id !== "undefined" || typeof group.type !== "undefined") {
    throw new Error("`type` and `id` cannot be used as attribute or relationship names.");
  }

  for (var field in group) {
    if (isAttributes) {
      validateComplexAttribute(group[field]);
    }

    if (otherFields !== undefined && typeof otherFields[field] !== "undefined") {
      throw new Error("A resource can't have an attribute and a relationship with the same name.");
    }
  }
}

function validateComplexAttribute(attrOrAttrPart) {
  if ((0, _utilMisc.isPlainObject)(attrOrAttrPart)) {
    if (typeof attrOrAttrPart.relationships !== "undefined" || typeof attrOrAttrPart.links !== "undefined") {
      throw new Error("Complex attributes may not have \"relationships\" or \"links\" keys.");
    }
    for (var key in attrOrAttrPart) {
      validateComplexAttribute(attrOrAttrPart[key]);
    }
  } else if (Array.isArray(attrOrAttrPart)) {
    attrOrAttrPart.forEach(validateComplexAttribute);
  }
}
module.exports = exports["default"];