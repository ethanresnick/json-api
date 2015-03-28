"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var _interopRequireWildcard = require("babel-runtime/helpers/interop-require-wildcard")["default"];

var mocha = _interopRequire(require("mocha"));

var sinon = _interopRequire(require("sinon"));

var chai = _interopRequire(require("chai"));

var utils = _interopRequireWildcard(require("../../src/util/arrays"));

var Resource = _interopRequire(require("../../src/types/Resource"));

var Collection = _interopRequire(require("../../src/types/Collection"));

var expect = chai.expect;

describe("Utility methods", function () {
  describe("arrayUnique", function () {
    it("should remove duplicate primitive values", function () {
      var uniqueSorted = utils.arrayUnique(["2", true, "bob", "2"]).sort();
      expect(uniqueSorted).to.deep.equal(["2", true, "bob"].sort());
    });

    it("should not coerce types", function () {
      var uniqueSorted = utils.arrayUnique(["2", true, "true", 2]).sort();
      expect(uniqueSorted).to.deep.equal(["2", true, "true", 2].sort());
    });

    it("should compare objects by identity, not contents", function () {
      var arr1 = [];
      var arr2 = [];
      expect(utils.arrayUnique([arr1, arr2])).to.have.length(2);
    });

    it("should remove duplicate objects", function () {
      var r = {};
      expect(utils.arrayUnique([r, r])).to.have.length(1);
    });
  });

  describe("arrayValuesMatch", function () {
    it.skip("should work");
  });

  describe("arrayContains", function () {
    it.skip("should return whether an array contains the value", function () {});
  });
});