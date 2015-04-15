"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var chai = _interopRequire(require("chai"));

var parsePrimary = _interopRequire(require("../../../src/steps/pre-query/parse-request-primary"));

var Resource = _interopRequire(require("../../../src/types/Resource"));

var Collection = _interopRequire(require("../../../src/types/Collection"));

var Linkage = _interopRequire(require("../../../src/types/Linkage"));

var LinkObject = _interopRequire(require("../../../src/types/LinkObject"));

var expect = chai.expect;

describe("Resource Parser", function () {
  describe.skip("Parsing Linkage", function () {
    it.skip("should read in the incoming json correctly", function () {});

    it.skip("should reject invalid linkage", function () {});
  });

  describe("Parsing a Collection", function () {
    it("should resolve with a Collection object", function (done) {
      parsePrimary([]).then(function (collection) {
        expect(collection).to.be["instanceof"](Collection);
        done();
      }, done);
    });
  });

  describe("Parsing a single Resource", function () {
    it("should resolve with a resource object", function (done) {
      parsePrimary({ type: "tests", id: "1" }).then(function (resource) {
        expect(resource).to.be["instanceof"](Resource);
        done();
      }, done);
    });

    it("should load up the id, type, and attributes", function (done) {
      var json = { id: "21", type: "people", name: "bob", isBob: true };

      parsePrimary(json).then(function (resource) {
        expect(resource.id).to.equal("21");
        expect(resource.type).to.equal("people");
        expect(resource.attrs).to.deep.equal({ name: "bob", isBob: true });
        done();
      }, done);
    });

    it("should reject invalid resources", function (done) {
      parsePrimary({ id: "1" }).then(function () {}, function (err) {
        expect(err.detail).to.match(/type.*required/);
        done();
      });
    });

    it("should create LinkObjects/Linkage for each link", function (done) {
      var parents = [{ type: "people", id: "1" }, { type: "people", id: "2" }];
      var json = {
        id: "3", type: "people", name: "Ethan",
        links: {
          parents: { linkage: parents }
        }
      };

      parsePrimary(json).then(function (resource) {
        expect(resource.links.parents).to.be["instanceof"](LinkObject);
        expect(resource.links.parents.linkage).to.be["instanceof"](Linkage);
        expect(resource.links.parents.linkage.value).to.deep.equal(parents);
        done();
      }, done);
    });
  });
});

//linkage who's value is true, or {"id": ""}