"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Q = _interopRequire(require("q"));

var APIError = _interopRequire(require("../../types/APIError"));

var Resource = _interopRequire(require("../../types/Resource"));

var LinkObject = _interopRequire(require("../../types/LinkObject"));

var Linkage = _interopRequire(require("../../types/Linkage"));

var Collection = _interopRequire(require("../../types/Collection"));

module.exports = function (requestContext) {
  return Q.Promise(function (resolve, reject) {
    var bodyJSON = requestContext.body;

    // Below, detect if no primary data was provided.
    if (requestContext.needsBody && !(bodyJSON && bodyJSON.data !== undefined)) {
      var expected = requestContext.aboutLinkObject ? "linkage" : "a resource or array of resources";
      var message = "The request must contain " + expected + " at the document's top-level \"data\" key.";
      reject(new APIError(400, null, message));
    } else if (requestContext.hasBody) {
      try {
        if (requestContext.aboutLinkObject) {
          requestContext.primary = linkageFromJSON(bodyJSON.data);
        } else if (Array.isArray(bodyJSON.data)) {
          requestContext.primary = new Collection(bodyJSON.data.map(resourceFromJSON));
        } else {
          requestContext.primary = resourceFromJSON(bodyJSON.data);
        }
        resolve();
      } catch (error) {
        var title = "The resources you provided could not be parsed.";
        var details = "The precise error was: \"" + error.message + "\".";
        reject(new APIError(400, undefined, title, details));
      }
    } else {
      resolve();
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