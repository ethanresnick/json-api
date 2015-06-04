"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _chai2 = _interopRequireDefault(_chai);

var _srcStepsPreQueryParseRequestPrimary = require("../../../../src/steps/pre-query/parse-request-primary");

var _srcStepsPreQueryParseRequestPrimary2 = _interopRequireDefault(_srcStepsPreQueryParseRequestPrimary);

var _srcTypesResource = require("../../../../src/types/Resource");

var _srcTypesResource2 = _interopRequireDefault(_srcTypesResource);

var _srcTypesCollection = require("../../../../src/types/Collection");

var _srcTypesCollection2 = _interopRequireDefault(_srcTypesCollection);

var _srcTypesLinkage = require("../../../../src/types/Linkage");

var _srcTypesLinkage2 = _interopRequireDefault(_srcTypesLinkage);

var _srcTypesRelationshipObject = require("../../../../src/types/RelationshipObject");

var _srcTypesRelationshipObject2 = _interopRequireDefault(_srcTypesRelationshipObject);

var expect = _chai2["default"].expect;

describe("Resource Parser", function () {
  describe.skip("Parsing Linkage", function () {
    it.skip("should read in the incoming json correctly", function () {});

    it.skip("should reject invalid linkage", function () {});
  });

  describe("Parsing a Collection", function () {
    it("should resolve with a Collection object", function (done) {
      (0, _srcStepsPreQueryParseRequestPrimary2["default"])([]).then(function (collection) {
        expect(collection).to.be["instanceof"](_srcTypesCollection2["default"]);
        done();
      }, done);
    });
  });

  describe("Parsing a single Resource", function () {
    it("should resolve with a resource object", function (done) {
      (0, _srcStepsPreQueryParseRequestPrimary2["default"])({ "type": "tests", "id": "1" }).then(function (resource) {
        expect(resource).to.be["instanceof"](_srcTypesResource2["default"]);
        done();
      }, done);
    });

    it("should load up the id, type, and attributes", function (done) {
      var json = {
        "id": "21", "type": "people",
        "attributes": { "name": "bob", "isBob": true }
      };

      (0, _srcStepsPreQueryParseRequestPrimary2["default"])(json).then(function (resource) {
        expect(resource.id).to.equal("21");
        expect(resource.type).to.equal("people");
        expect(resource.attrs).to.deep.equal({ "name": "bob", "isBob": true });
        done();
      }, done);
    });

    it("should reject invalid resources", function (done) {
      (0, _srcStepsPreQueryParseRequestPrimary2["default"])({ "id": "1" }).then(function () {}, function (err) {
        expect(err.detail).to.match(/type.*required/);
        done();
      });
    });

    it("should create RelationshipObjects/Linkage for each link", function (done) {
      var parents = [{ "type": "people", "id": "1" }, { "type": "people", "id": "2" }];
      var json = {
        "id": "3", "type": "people",
        "relationships": {
          "parents": { "data": parents }
        }
      };

      (0, _srcStepsPreQueryParseRequestPrimary2["default"])(json).then(function (resource) {
        expect(resource.relationships.parents).to.be["instanceof"](_srcTypesRelationshipObject2["default"]);
        expect(resource.relationships.parents.linkage).to.be["instanceof"](_srcTypesLinkage2["default"]);
        expect(resource.relationships.parents.linkage.value).to.deep.equal(parents);
        done();
      }, done);
    });
  });
});

//linkage who's value is true, or {"id": ""}