"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _Symbol = require("babel-runtime/core-js/symbol")["default"];

var _Object$keys = require("babel-runtime/core-js/object/keys")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

var _utilMisc = require("./util/misc");

/**
 * A private array of properties that will be used by the class below to
 * automatically generate simple getters for each property, all following the
 * same format. Those getters will take the name of the resource type whose
 * property is being retrieved.
 */
var autoGetterProps = ["dbAdapter", "beforeSave", "beforeRender", "behaviors", "labelMappers", "defaultIncludes", "info", "parentType"];

/**
 * Global defaults for all resource descriptions, to be merged into the
 * defaults provided to the ResourceTypeRegistry, which are in turn merged
 * into the values provided in each resource type description.
 */
var globalResourceDefaults = _immutable2["default"].fromJS({
  behaviors: {
    dasherizeOutput: { enabled: true }
  }
});

var typesKey = _Symbol();

/**
 * To fulfill a JSON API request, you often need to know about all the resources
 * types in the system--not just the type that is the primary target of the
 * request. For example, if the request is for a User (or Users), you might need
 * to include related Projects, so the code handling the users request needs
 * access to the Project resource's beforeSave and beforeRender methods; its
 * url templates; etc. So we handle this by introducing a ResourceTypeRegistry
 * that the Controller can have access to. Each resource type is registered by
 * its JSON API type and has a number of properties defining it.
 */

var ResourceTypeRegistry = (function () {
  function ResourceTypeRegistry() {
    var _this = this;

    var typeDescriptions = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var descriptionDefaults = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, ResourceTypeRegistry);

    this[typesKey] = {};
    descriptionDefaults = globalResourceDefaults.mergeDeep(descriptionDefaults);

    // Sort the types so we can register them in an order that respects their
    // parentType. First, we pre-process the typeDescriptions to create edges
    // pointing to each node's children (rather than the links we have by
    // default, which point to the parent). Then we do an abridged topological
    // sort that works in this case. Below, nodes is a list of type names.
    // Roots are nodes with no parents. Edges is a map, with each key being the
    // name of a starting node A, and the value being a set of node names for
    // which there is an edge from A to that node.
    var nodes = [],
        roots = [],
        edges = {};

    for (var typeName in typeDescriptions) {
      var nodeParentType = typeDescriptions[typeName].parentType;
      nodes.push(typeName);

      if (nodeParentType) {
        edges[nodeParentType] = edges[nodeParentType] || {};
        edges[nodeParentType][typeName] = true;
      } else {
        roots.push(typeName);
      }
    }

    var typeRegistrationOrder = (0, _utilMisc.pseudoTopSort)(nodes, edges, roots);

    // register the types, in order
    typeRegistrationOrder.forEach(function (typeName) {
      var parentType = typeDescriptions[typeName].parentType;

      // defaultIncludes need to be made into an object if they came as an array.
      // TODO: Remove support for array format before v3. It's inconsistent.
      var thisDescriptionRaw = _immutable2["default"].fromJS(typeDescriptions[typeName]);
      var thisDescriptionMerged = descriptionDefaults.mergeDeep(thisDescriptionRaw);

      _this[typesKey][typeName] = parentType ?
      // If we have a parentType, we merge in all the parent's fields,
      // BUT we then overwrite labelMappers with just the ones directly
      // from this description. We don't inherit labelMappers because a
      // labelMapper is a kind of filter, and the results of a filter
      // on the parent type may not be instances of the subtype.
      _this[typesKey][parentType].mergeDeep(thisDescriptionRaw).set("labelMappers", thisDescriptionRaw.get("labelMappers")) :

      // If we don't have a parentType, just register
      // the description merged with the universal defaults
      thisDescriptionMerged;
    });
  }

  _createClass(ResourceTypeRegistry, [{
    key: "type",
    value: function type(typeName) {
      return this.hasType(typeName) ? this[typesKey][typeName].toJS() : undefined;
    }
  }, {
    key: "hasType",
    value: function hasType(typeName) {
      return typeName in this[typesKey];
    }
  }, {
    key: "typeNames",
    value: function typeNames() {
      return _Object$keys(this[typesKey]);
    }
  }, {
    key: "urlTemplates",
    value: function urlTemplates(type) {
      var _this2 = this;

      if (type) {
        var maybeDesc = this[typesKey][type];
        var maybeTemplates = maybeDesc ? maybeDesc.get("urlTemplates") : maybeDesc;
        return maybeTemplates ? maybeTemplates.toJS() : maybeTemplates;
      }

      return _Object$keys(this[typesKey]).reduce(function (prev, typeName) {
        prev[typeName] = _this2.urlTemplates(typeName);
        return prev;
      }, {});
    }
  }]);

  return ResourceTypeRegistry;
})();

exports["default"] = ResourceTypeRegistry;

autoGetterProps.forEach(function (propName) {
  ResourceTypeRegistry.prototype[propName] = makeGetter(propName);
});

function makeGetter(attrName) {
  return function (type) {
    var maybeDesc = this[typesKey][type];
    var maybeVal = maybeDesc ? maybeDesc.get(attrName) : maybeDesc;

    if (maybeVal instanceof _immutable2["default"].Map || maybeVal instanceof _immutable2["default"].List) {
      return maybeVal.toJS();
    }

    return maybeVal;
  };
}
module.exports = exports["default"];