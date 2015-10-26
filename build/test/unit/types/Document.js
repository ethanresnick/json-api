"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _chai2 = _interopRequireDefault(_chai);

var _chaiSubset = require("chai-subset");

var _chaiSubset2 = _interopRequireDefault(_chaiSubset);

var _srcTypesCollection = require("../../../src/types/Collection");

var _srcTypesCollection2 = _interopRequireDefault(_srcTypesCollection);

var _srcTypesResource = require("../../../src/types/Resource");

var _srcTypesResource2 = _interopRequireDefault(_srcTypesResource);

var _srcTypesRelationship = require("../../../src/types/Relationship");

var _srcTypesRelationship2 = _interopRequireDefault(_srcTypesRelationship);

var _srcTypesLinkage = require("../../../src/types/Linkage");

var _srcTypesLinkage2 = _interopRequireDefault(_srcTypesLinkage);

var _srcTypesDocument = require("../../../src/types/Document");

var _srcTypesDocument2 = _interopRequireDefault(_srcTypesDocument);

var expect = _chai2["default"].expect;
_chai2["default"].use(_chaiSubset2["default"]);

describe("Document class", function () {
  describe("Rendering a document", function () {
    var orgRelation = new _srcTypesRelationship2["default"](new _srcTypesLinkage2["default"](null));
    var orgRelationCustom = new _srcTypesRelationship2["default"](undefined, undefined, "http://localhost/a?filter={ownerId}");
    var person = new _srcTypesResource2["default"]("people", "31", { "name": "mark" }, { "organization": orgRelation });
    var person2 = new _srcTypesResource2["default"]("people", "32", { "name": "ethan" }, { "organization": orgRelationCustom });
    var people = new _srcTypesCollection2["default"]([person, person2]);
    var topLevelMeta = { "mcawesome": true };
    var urlTemplates = { "people": { "relationship": "RELATIONSHIP{ownerId}{path}" } };

    var singleResourceDocJSON = new _srcTypesDocument2["default"](person, undefined, topLevelMeta, urlTemplates).get();
    var collectionDocJSON = new _srcTypesDocument2["default"](people, undefined, topLevelMeta, urlTemplates).get();

    it("should key primary data under data, with each resource's type, id", function () {
      expect(singleResourceDocJSON.data).to.containSubset({ "id": "31", "type": "people" });
    });

    it("resource collections should be represented as arrays", function () {
      expect(collectionDocJSON.data).to.be.an("array");
    });

    it("should represent includes as an array under `included`", function () {
      expect(new _srcTypesDocument2["default"](people, new _srcTypesCollection2["default"]([person2])).get().included).to.containSubset([{ "id": "32", "type": "people", "attributes": { "name": "ethan" } }]);
    });

    it("Should include a top-level self links", function () {
      var reqURI = "http://bob";
      var doc = new _srcTypesDocument2["default"](people, [person2], undefined, undefined, reqURI);
      var docJSON = doc.get();

      expect(docJSON.links).to.be.an("object");
      expect(docJSON.links.self).to.equal(reqURI);
    });

    it("should output top-level meta information, iff provided", function () {
      var docWithoutMeta = new _srcTypesDocument2["default"](people, [person2], undefined);
      expect(collectionDocJSON.meta).to.deep.equal(topLevelMeta);
      expect(docWithoutMeta.get().meta).to.be.undefined;
    });

    it("should reject non-object meta information", function () {
      expect(function () {
        return new _srcTypesDocument2["default"](people, new _srcTypesCollection2["default"]([person2]), ["bob"]);
      }).to["throw"](/meta.*object/i);
    });

    it("should output relationship linkage iff provided", function () {
      expect(collectionDocJSON.data[0].relationships.organization).to.have.property("data");
      expect(collectionDocJSON.data[0].relationships.organization.data).to.equal(null);
      expect(collectionDocJSON.data[1].relationships.organization).to.not.have.property("data");
    });

    it("should output relationship links iff provided, preferring relationship-specific templates", function () {
      expect(collectionDocJSON.data[0].relationships.organization.links).to.be.an("object");
      expect(collectionDocJSON.data[0].relationships.organization.links.self).to.equal("RELATIONSHIP31organization");
      expect(collectionDocJSON.data[0].relationships.organization.links).to.not.have.property("related");

      expect(collectionDocJSON.data[1].relationships.organization.links).to.be.an("object");
      expect(collectionDocJSON.data[1].relationships.organization.links.self).to.equal("http://localhost/a?filter=32");
    });
  });
});