"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var Q = _interopRequire(require("q"));

var APIError = _interopRequire(require("../../types/APIError"));

var Document = _interopRequire(require("../../types/Document"));

var Collection = _interopRequire(require("../../types/Collection"));

module.exports = function (requestContext) {
  return Q.Promise(function (resolve, reject) {
    var bodyJSON = requestContext.body;

    // Below, detect if no primary data was provided.
    if (requestContext.needsBody && !(bodyJSON && bodyJSON.data !== undefined)) {
      var expected = requestContext.aboutLinkObject ? "link object" : "resource or array of resources";
      var message = "The request must contain a " + expected + " at the document's top-level \"data\" key.";
      reject(new APIError(400, null, message));
    } else if (requestContext.hasBody) {
      try {
        if (requestContext.aboutLinkObject) {
          requestContext.primary = Document.linkObjectFromJSON(bodyJSON.data);
        } else if (Array.isArray(bodyJSON.data)) {
          requestContext.primary = new Collection(bodyJSON.data.map(Document.resourceFromJSON));
        } else {
          requestContext.primary = Document.resourceFromJSON(bodyJSON.data);
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