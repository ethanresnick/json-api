"use strict";

var _interopRequireWildcard = require("babel-runtime/helpers/interop-require-wildcard")["default"];

var _chai = require("chai");

var _srcUtilArrays = require("../../../src/util/arrays");

var utils = _interopRequireWildcard(_srcUtilArrays);

describe("Utility methods", function () {
  describe("arrayUnique", function () {
    it("should remove duplicate primitive values", function () {
      var uniqueSorted = utils.arrayUnique(["2", true, "bob", "2"]).sort();
      (0, _chai.expect)(uniqueSorted).to.deep.equal(["2", true, "bob"].sort());
    });

    it("should not coerce types", function () {
      var uniqueSorted = utils.arrayUnique(["2", true, "true", 2]).sort();
      (0, _chai.expect)(uniqueSorted).to.deep.equal(["2", true, "true", 2].sort());
    });

    it("should compare objects by identity, not contents", function () {
      var arr1 = [];
      var arr2 = [];
      (0, _chai.expect)(utils.arrayUnique([arr1, arr2])).to.have.length(2);
    });

    it("should remove duplicate objects", function () {
      var r = {};
      (0, _chai.expect)(utils.arrayUnique([r, r])).to.have.length(1);
    });
  });

  describe("arrayValuesMatch", function () {
    it.skip("should work");
  });

  describe("arrayContains", function () {
    it.skip("should return whether an array contains the value", function () {});
  });
});