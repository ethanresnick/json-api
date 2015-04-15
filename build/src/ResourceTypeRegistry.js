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
"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var ResourceTypeRegistry = (function () {
  function ResourceTypeRegistry() {
    var _this = this;

    var typeDescriptions = arguments[0] === undefined ? [] : arguments[0];

    _classCallCheck(this, ResourceTypeRegistry);

    this._resourceTypes = {};
    typeDescriptions.forEach(function (it) {
      _this.type(it);
    });
  }

  _createClass(ResourceTypeRegistry, {
    type: {
      value: (function (_type) {
        var _typeWrapper = function type(_x, _x2) {
          return _type.apply(this, arguments);
        };

        _typeWrapper.toString = function () {
          return _type.toString();
        };

        return _typeWrapper;
      })(function (type, description) {
        var _this = this;

        // create a one-argument version that takes the
        // type as a key on the description object.
        if (typeof type === "object" && typeof description === "undefined") {
          description = type;
          type = type.type;
          delete description.type;
        }

        if (description) {
          this._resourceTypes[type] = {};

          // Set all the properties for the type that the description provides.
          ["adapter", "beforeSave", "beforeRender", "labelMappers", "urlTemplates", "defaultIncludes", "info", "parentType"].forEach(function (k) {
            if (Object.prototype.hasOwnProperty.call(description, k)) {
              _this[k](type, description[k]);
            }
          });
        } else if (this._resourceTypes[type]) {
          return _core.Object.assign({}, this._resourceTypes[type]);
        }
      })
    },
    types: {
      value: function types() {
        return _core.Object.keys(this._resourceTypes);
      }
    },
    urlTemplates: {

      //calling the arg "templatesToSet" to avoid conflict with templates var below

      value: function urlTemplates(type, templatesToSet) {
        this._resourceTypes[type] = this._resourceTypes[type] || {};

        switch (arguments.length) {
          case 1:
            return this._resourceTypes[type].urlTemplates;

          case 0:
            var templates = {};
            for (var _type2 in this._resourceTypes) {
              templates[_type2] = _core.Object.assign({}, this._resourceTypes[_type2].urlTemplates || {});
            }
            return templates;

          default:
            this._resourceTypes[type].urlTemplates = templatesToSet;
        }
      }
    }
  });

  return ResourceTypeRegistry;
})();

module.exports = ResourceTypeRegistry;

ResourceTypeRegistry.prototype.adapter = makeGetterSetter("adapter");
ResourceTypeRegistry.prototype.beforeSave = makeGetterSetter("beforeSave");
ResourceTypeRegistry.prototype.beforeRender = makeGetterSetter("beforeRender");
ResourceTypeRegistry.prototype.labelMappers = makeGetterSetter("labelMappers");
ResourceTypeRegistry.prototype.defaultIncludes = makeGetterSetter("defaultIncludes");
ResourceTypeRegistry.prototype.info = makeGetterSetter("info");
ResourceTypeRegistry.prototype.parentType = makeGetterSetter("parentType");

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