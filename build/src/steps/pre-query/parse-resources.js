"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Q = _interopRequire(require("q"));

var APIError = _interopRequire(require("../../types/APIError"));

var Resource = _interopRequire(require("../../types/Resource"));

var LinkObject = _interopRequire(require("../../types/LinkObject"));

var Linkage = _interopRequire(require("../../types/Linkage"));

var Collection = _interopRequire(require("../../types/Collection"));

module.exports = function (data, parseAsLinkage) {
  return Q.Promise(function (resolve, reject) {
    try {
      if (parseAsLinkage) {
        resolve(linkageFromJSON(data));
      } else if (Array.isArray(data)) {
        resolve(new Collection(data.map(resourceFromJSON)));
      } else {
        resolve(resourceFromJSON(data));
      }
    } catch (error) {
      var title = "The resources you provided could not be parsed.";
      var details = "The precise error was: \"" + error.message + "\".";
      reject(new APIError(400, undefined, title, details));
    }
  });
};

function linkObjectFromJSON(json) {
  return new LinkObject(linkageFromJSON(json.linkage));
}

function linkageFromJSON(json) {
  return new Linkage(json);
}

function resourceFromJSON(json) {
  // save and then remove the non-attrs
  var id = json.id;delete json.id;
  var type = json.type;delete json.type;
  var links = json.links || {};delete json.links;
  var meta = json.meta;delete json.meta;

  // attrs are all the fields that are left.
  var attrs = json;

  //build LinkObjects
  for (var key in links) {
    links[key] = linkObjectFromJSON(links[key]);
  }

  return new Resource(type, id, attrs, links, meta);
}