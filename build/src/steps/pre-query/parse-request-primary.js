"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _typesAPIError = require("../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

var _typesResource = require("../../types/Resource");

var _typesResource2 = _interopRequireDefault(_typesResource);

var _typesRelationship = require("../../types/Relationship");

var _typesRelationship2 = _interopRequireDefault(_typesRelationship);

var _typesLinkage = require("../../types/Linkage");

var _typesLinkage2 = _interopRequireDefault(_typesLinkage);

var _typesCollection = require("../../types/Collection");

var _typesCollection2 = _interopRequireDefault(_typesCollection);

exports["default"] = function (data, parseAsLinkage) {
  return _q2["default"].Promise(function (resolve, reject) {
    try {
      if (parseAsLinkage) {
        resolve(linkageFromJSON(data));
      } else if (Array.isArray(data)) {
        resolve(new _typesCollection2["default"](data.map(resourceFromJSON)));
      } else {
        resolve(resourceFromJSON(data));
      }
    } catch (error) {
      if (error instanceof _typesAPIError2["default"]) {
        reject(error);
      } else {
        var title = "The resources you provided could not be parsed.";
        var details = "The precise error was: \"" + error.message + "\".";
        reject(new _typesAPIError2["default"](400, undefined, title, details));
      }
    }
  });
};

function relationshipFromJSON(json) {
  if (typeof json.data === "undefined") {
    throw new _typesAPIError2["default"](400, undefined, "Missing relationship linkage.");
  }

  return new _typesRelationship2["default"](linkageFromJSON(json.data));
}

function linkageFromJSON(json) {
  return new _typesLinkage2["default"](json);
}

function resourceFromJSON(json) {
  var relationships = json.relationships || {};

  //build Relationships
  var key = undefined;
  try {
    for (key in relationships) {
      relationships[key] = relationshipFromJSON(relationships[key], key);
    }
  } catch (e) {
    e.details = "No data was found for the " + key + " relationship.";
    throw e;
  }

  return new _typesResource2["default"](json.type, json.id, json.attributes, relationships, json.meta);
}
module.exports = exports["default"];