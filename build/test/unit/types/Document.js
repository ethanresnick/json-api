"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _srcTypesResource = require("../../../src/types/Resource");

var _srcTypesResource2 = _interopRequireDefault(_srcTypesResource);

var _srcTypesCollection = require("../../../src/types/Collection");

var _srcTypesCollection2 = _interopRequireDefault(_srcTypesCollection);

var _srcTypesDocument = require("../../../src/types/Document");

var _srcTypesDocument2 = _interopRequireDefault(_srcTypesDocument);

describe("Document class", function () {
  describe("Rendering a document", function () {
    var person = new _srcTypesResource2["default"]("people", "31", { "name": "mark" });
    var person2 = new _srcTypesResource2["default"]("people", "32", { "name": "ethan" });
    var people = new _srcTypesCollection2["default"]([person]);
    var topLevelMeta = { "mcawesome": true };

    var singleResourceDocJSON = new _srcTypesDocument2["default"](person, undefined, topLevelMeta).get();
    var collectionDocJSON = new _srcTypesDocument2["default"](people, undefined, topLevelMeta).get();

    it("should key primary data under data, with each resource's type, id", function () {
      (0, _chai.expect)(singleResourceDocJSON.data).to.deep.equal({
        "id": "31", "type": "people", "attributes": { "name": "mark" }
      });
    });

    it("resource collections should be represented as arrays", function () {
      (0, _chai.expect)(collectionDocJSON.data).to.be.an("array");
    });

    it("should represent includes as an array under `included`", function () {
      (0, _chai.expect)(new _srcTypesDocument2["default"](people, new _srcTypesCollection2["default"]([person2])).get().included).to.deep.equal([{ "id": "32", "type": "people", "attributes": { "name": "ethan" } }]);
    });

    it("Should include a top-level self links", function () {
      var reqURI = "http://bob";
      var doc = new _srcTypesDocument2["default"](people, [person2], undefined, undefined, reqURI);
      var docJSON = doc.get();

      (0, _chai.expect)(docJSON.links).to.be.an("object");
      (0, _chai.expect)(docJSON.links.self).to.equal(reqURI);
    });

    it("should output top-level meta information, iff provided", function () {
      var docWithoutMeta = new _srcTypesDocument2["default"](people, [person2], undefined);
      (0, _chai.expect)(collectionDocJSON.meta).to.deep.equal(topLevelMeta);
      (0, _chai.expect)(docWithoutMeta.get().meta).to.be.undefined;
    });

    it("should reject non-object meta information", function () {
      (0, _chai.expect)(function () {
        return new _srcTypesDocument2["default"](people, new _srcTypesCollection2["default"]([person2]), ["bob"]);
      }).to["throw"](/meta.*object/i);
    });
  });
});