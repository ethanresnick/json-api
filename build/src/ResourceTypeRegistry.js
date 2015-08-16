/**
 * A private array of properties that will be used by the class below to
 * automatically generate simple getter setters for each property, all
 * following same format. Those getters/setters will take the resource type
 * whose property is being retrieved/set, and the value to set it to, if any.
 */
"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

var _Object$keys = require("babel-runtime/core-js/object/keys")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});
var autoGetterSetterProps = ["dbAdapter", "beforeSave", "beforeRender", "labelMappers", "defaultIncludes", "info", "parentType"];

/**
 * To fulfill a JSON API request, you often need to know about all the resources
 * in the system--not just the primary resource associated with the type being
 * requested. For example, if the request is for a User, you might need to
 * include related Projects, so the code handling the users request needs access
 * to the Project resource's beforeSave and afterQuery methods. Similarly, it
 * would need access to url templates that point at relationships on the Project
 * resources. Etc. So we handle this by introducing a ResourceTypeRegistry that
 * the Dispatcher can have access to. Each resource type is registered by its
 * JSON api type and has a number of properties defining it.
 */

var ResourceTypeRegistry = (function () {
  function ResourceTypeRegistry() {
    var _this = this;

    var typeDescriptions = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

    _classCallCheck(this, ResourceTypeRegistry);

    this._resourceTypes = {};
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

        // Set all the properties for the type that the description provides.
        autoGetterSetterProps.concat(["urlTemplates"]).forEach(function (k) {
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