import {expect} from "chai";
import * as utils from "../../../src/util/misc";

describe("Utility methods", () => {
  describe("objectIsEmpty", () => {
    it("should return false on an object with direct properties", () => {
      expect(utils.objectIsEmpty({ test: true })).to.be.false;
    });

    it("should return true if the object only has prototype properties", () => {
      expect(utils.objectIsEmpty({})).to.be.true;
      expect(utils.objectIsEmpty(Object.create({ test: true }))).to.be.true;
    });
  });

  describe("deleteNested", () => {
    const obj = {"contact": {"phone": "310"}, "top-level": true};
    const deletion = utils.deleteNested("contact.phone", obj);

    it("should delete a nested property when present", () => {
      expect(obj.contact.phone).to.equal(undefined);
    });

    it("should work on non-nested properties too", () => {
      utils.deleteNested("top-level", obj);
      expect(obj["top-level"]).to.be.undefined;
    });

    it("should return true if deletion succeeds", () => {
      expect(deletion).to.be.true;
    });

    it("should return false if deletion fails", () => {
      expect(utils.deleteNested("contact.twitter", obj)).to.be.false;
    });
  });

  describe("isSubsetOf", () => {
    it("should return true for two equal arrays", () => {
      expect(utils.isSubsetOf([1, 2, 3], [1, 2, 3])).to.be.true;
    });

    it("should return true for strict subsets", () => {
      expect(utils.isSubsetOf(["test", "bob", 3], ["test", 3])).to.be.true;
    });

    it("should return false for non-subsets", () => {
      expect(utils.isSubsetOf(["myprop", "bob"], ["john", "mary"])).to.be.false;
    });

    it("should handle duplicate elements in either argument", () => {
      expect(utils.isSubsetOf(["test", 3, 3], ["test", 3])).to.be.true;
      expect(utils.isSubsetOf(["test", 3], [3, 3])).to.be.true;
      expect(utils.isSubsetOf(["test", 3], ["test", 3, 3])).to.be.true;
    });

    it("should treat values differently even if they have equal string representations", () => {
      expect(utils.isSubsetOf(["test", "3"], ["test", 3])).to.be.false;
      expect(utils.isSubsetOf(["false"], [false])).to.be.false;
      expect(utils.isSubsetOf(["false"], [0])).to.be.false;
    });
  });

  describe("pseudoTopSort", function () {
    it("should sort the items correctly", function () {
      const nodes = ["c", "b", "f", "a", "d", "e"];
      const roots = ["a", "d", "f"];
      const edges = { "a": { "b": <true>true }, "b": { "c": <true>true }, "d": { "e": <true>true } };
      const sorted = utils.pseudoTopSort(nodes, edges, roots);

      // check that all the nodes were returned exactly once.
      expect(sorted.length).to.equal(6);
      expect(nodes.every(function (node) {
        return sorted.indexOf(node) > -1;
      })).to.be.true;

      expect(sorted.indexOf("b")).to.be.gt(sorted.indexOf("a"));
      expect(sorted.indexOf("c")).to.be.gt(sorted.indexOf("b"));
      expect(sorted.indexOf("e")).to.be.gt(sorted.indexOf("d"));
    });
  });
});
