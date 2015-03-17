"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Q = _interopRequire(require("q"));

var mongoose = _interopRequire(require("mongoose"));

var Document = _interopRequire(require("./types/Document"));

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
    _classCallCheck(this, ResourceTypeRegistry);

    this._resourceTypes = {};
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

        if (description) {
          this._resourceTypes[type] = {};

          // Set all the properties for the type that the description provides.
          ["adapter", "beforeSave", "afterQuery", "labelToIdOrIds", "urlTemplates", "defaultIncludes", "info", "parentType"].forEach(function (k) {
            if (Object.prototype.hasOwnProperty.call(description, k)) {
              _this[k](type, description[k]);
            }
          });
        } else if (this._resourceTypes[type]) {
          return import$({}, this._resourceTypes[type]);
        }
      })
    },
    types: {
      value: function types() {
        return Object.keys(this._resourceTypes);
      }
    },
    urlTemplates: {
      value: function urlTemplates(type, templates) {
        this._resourceTypes[type] = this._resourceTypes[type] || {};

        switch (arguments.length) {
          case 1:
            return this._resourceTypes[type].urlTemplates;

          case 0:
            var templates = {};
            for (var _type2 in this._resourceTypes) {
              templates[_type2] = import$({}, this._resourceTypes[_type2].urlTemplates || {});
            }
            return templates;

          default:
            this._resourceTypes[type].urlTemplates = templates;
        }
      }
    }
  });

  return ResourceTypeRegistry;
})();

module.exports = ResourceTypeRegistry;

ResourceTypeRegistry.prototype.adapter = makeGetterSetter("adapter");
ResourceTypeRegistry.prototype.beforeSave = makeGetterSetter("beforeSave");
ResourceTypeRegistry.prototype.afterQuery = makeGetterSetter("afterQuery");
ResourceTypeRegistry.prototype.labelToIdOrIds = makeGetterSetter("labelToIdOrIds");
ResourceTypeRegistry.prototype.defaultIncludes = makeGetterSetter("defaultIncludes");
ResourceTypeRegistry.prototype.info = makeGetterSetter("info");
ResourceTypeRegistry.prototype.parentType = makeGetterSetter("parentType");

function import$(obj, src) {
  var own = ({}).hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}

function makeGetterSetter(attrName) {
  return function (type, optValue) {
    this._resourceTypes[type] = this._resourceTypes[type] || {};

    if (optValue) {
      return this._resourceTypes[type][attrName] = optValue;
    } else {
      return this._resourceTypes[type][attrName];
    }
  };
}