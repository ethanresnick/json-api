"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

var _Object$keys = require("babel-runtime/core-js/object/keys")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashObjectMerge = require("lodash/object/merge");

var _lodashObjectMerge2 = _interopRequireDefault(_lodashObjectMerge);

/**
 * A private array of properties that will be used by the class below to
 * automatically generate simple getter setters for each property, all
 * following same format. Those getters/setters will take the resource type
 * whose property is being retrieved/set, and the value to set it to, if any.
 */
var autoGetterSetterProps = ["dbAdapter", "beforeSave", "beforeRender", "beforeDelete", "labelMappers", "defaultIncludes", "info", "parentType"];

/**
 * Global defaults for resource descriptions, to be merged into defaults
 * provided to the ResourceTypeRegistry, which are in turn merged into defaults
 * provided in each resource type descriptions.
 */
var globalResourceDefaults = {
  behaviors: {
    dasherizeOutput: { enabled: true }
  }
};

/**
 * To fulfill a JSON API request, you often need to know about all the resources
 * in the system--not just the primary resource associated with the type being
 * requested. For example, if the request is for a User, you might need to
 * include related Projects, so the code handling the users request needs access
 * to the Project resource's beforeSave and beforeRender methods. Similarly, it
 * would need access to url templates that point at relationships on the Project
 * resources. Etc. So we handle this by introducing a ResourceTypeRegistry that
 * the Controller can have access to. Each resource type is registered by its
 * JSON API type and has a number of properties defining it.
 */

var ResourceTypeRegistry = (function () {
  function ResourceTypeRegistry() {
    var _this = this;

    var typeDescriptions = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
    var descriptionDefaults = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, ResourceTypeRegistry);

    this._resourceTypes = {};
    this._descriptionDefaults = (0, _lodashObjectMerge2["default"])({}, globalResourceDefaults, descriptionDefaults);
    typeDescriptions.forEach(function (it) {
      _this.type(it);
    });
  }

  _createClass(ResourceTypeRegistry, [{
    key: "type",
    value: function type(_type, description) {
      var _this2 = this;

      // create a one-argument version that takes the
      // type as a key on the description object.
      if (typeof _type === "object" && typeof description === "undefined") {
        description = _type;
        _type = _type.type;
        delete description.type;
      }

      if (description) {
        this._resourceTypes[_type] = {};

        // Merge description defaults into provided description
        description = (0, _lodashObjectMerge2["default"])({}, this._descriptionDefaults, description);

        // Set all the properties for the type that the description provides.
        autoGetterSetterProps.concat(["urlTemplates", "behaviors"]).forEach(function (k) {
          if (Object.prototype.hasOwnProperty.call(description, k)) {
            _this2[k](_type, description[k]);
          }
        });
      } else if (this._resourceTypes[_type]) {
        return _Object$assign({}, this._resourceTypes[_type]);
      }
    }
  }, {
    key: "types",
    value: function types() {
      return _Object$keys(this._resourceTypes);
    }

    //calling the arg "templatesToSet" to avoid conflict with templates var below
  }, {
    key: "urlTemplates",
    value: function urlTemplates(type, templatesToSet) {
      this._resourceTypes[type] = this._resourceTypes[type] || {};

      switch (arguments.length) {
        case 1:
          return this._resourceTypes[type].urlTemplates ? _Object$assign({}, this._resourceTypes[type].urlTemplates) : this._resourceTypes[type].urlTemplates;

        case 0:
          var templates = {};
          for (var currType in this._resourceTypes) {
            templates[currType] = this.urlTemplates(currType);
          }
          return templates;

        default:
          this._resourceTypes[type].urlTemplates = templatesToSet;
      }
    }
  }, {
    key: "behaviors",
    value: function behaviors(type, behaviorsToSet) {
      this._resourceTypes[type] = this._resourceTypes[type] || {};
      if (behaviorsToSet) {
        this._resourceTypes[type].behaviors = (0, _lodashObjectMerge2["default"])({}, this._descriptionDefaults.behaviors, behaviorsToSet);
      } else {
        return this._resourceTypes[type].behaviors;
      }
    }
  }]);

  return ResourceTypeRegistry;
})();

exports["default"] = ResourceTypeRegistry;

autoGetterSetterProps.forEach(function (propName) {
  ResourceTypeRegistry.prototype[propName] = makeGetterSetter(propName);
});

function makeGetterSetter(attrName) {
  return function (type, optValue) {
    this._resourceTypes[type] = this._resourceTypes[type] || {};

    if (optValue) {
      this._resourceTypes[type][attrName] = optValue;
    } else {
      return this._resourceTypes[type][attrName];
    }
  };
}
module.exports = exports["default"];