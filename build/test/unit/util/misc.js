"use strict";

var _interopRequireWildcard = require("babel-runtime/helpers/interop-require-wildcard")["default"];

var _chai = require("chai");

var _srcUtilMisc = require("../../../src/util/misc");

var utils = _interopRequireWildcard(_srcUtilMisc);

describe("Utility methods", function () {
  describe("deleteNested", function () {
    var obj = { "contact": { "phone": "310" }, "top-level": true };
    var deletion = utils.deleteNested("contact.phone", obj);

    it("should delete a nested property when present", function () {
      (0, _chai.expect)(obj.contact.phone).to.equal(undefined);
    });

    it("should work on non-nested properties too", function () {
      utils.deleteNested("top-level", obj);
      (0, _chai.expect)(obj["top-level"]).to.be.undefined;
    });

    it("should return true if deletion succeeds", function () {
      (0, _chai.expect)(deletion).to.be["true"];
    });

    it("should return false if deletion fails", function () {
      (0, _chai.expect)(utils.deleteNested("contact.twitter", obj)).to.be["false"];
    });
  });

  describe("isSubsetOf", function () {
    it("should return true for two equal arrays", function () {
      (0, _chai.expect)(utils.isSubsetOf([1, 2, 3], [1, 2, 3])).to.be["true"];
    });

    it("should return true for strict subsets", function () {
      (0, _chai.expect)(utils.isSubsetOf(["test", "bob", 3], ["test", 3])).to.be["true"];
    });

    it("should return false for non-subsets", function () {
      (0, _chai.expect)(utils.isSubsetOf(["myprop", "bob"], ["john", "mary"])).to.be["false"];
    });

    it("should handle duplicate elements in either argument", function () {
      (0, _chai.expect)(utils.isSubsetOf(["test", 3, 3], ["test", 3])).to.be["true"];
      (0, _chai.expect)(utils.isSubsetOf(["test", 3], [3, 3])).to.be["true"];
      (0, _chai.expect)(utils.isSubsetOf(["test", 3], ["test", 3, 3])).to.be["true"];
    });

    it("should treat values differently even if they have equal string representations", function () {
      (0, _chai.expect)(utils.isSubsetOf(["test", "3"], ["test", 3])).to.be["false"];
      (0, _chai.expect)(utils.isSubsetOf(["false"], [false])).to.be["false"];
      (0, _chai.expect)(utils.isSubsetOf(["false"], [0])).to.be["false"];
    });
  });

  describe("pseudoTopSort", function () {
    it("should sort the items correctly", function () {
      var nodes = ["c", "b", "f", "a", "d", "e"];
      var roots = ["a", "d", "f"];
      var edges = { "a": { "b": true }, "b": { "c": true }, "d": { "e": true } };
      var sorted = utils.pseudoTopSort(nodes, edges, roots);

      // check that all the nodes were returned exactly once.
      (0, _chai.expect)(sorted.length).to.equal(6);
      (0, _chai.expect)(nodes.every(function (node) {
        return sorted.indexOf(node) > -1;
      })).to.be["true"];

      (0, _chai.expect)(sorted.indexOf("b")).to.be.gt(sorted.indexOf("a"));
      (0, _chai.expect)(sorted.indexOf("c")).to.be.gt(sorted.indexOf("b"));
      (0, _chai.expect)(sorted.indexOf("e")).to.be.gt(sorted.indexOf("d"));
    });
  });
});