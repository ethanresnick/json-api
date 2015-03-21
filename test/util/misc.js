import mocha from "mocha"
import sinon from "sinon"
import chai from "chai"
import * as utils from "../../src/util/misc"
import Resource from "../../src/types/Resource"
import Collection from "../../src/types/Collection";

let expect = chai.expect;

describe("Utility methods", () => {
  describe("deleteNested", () => {
    let obj = {"contact": {"phone": "310"}, "top-level":true};
    let deletion = utils.deleteNested("contact.phone", obj);

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
      expect(utils.isSubsetOf([1,2,3], [1,2,3])).to.be.true;
    });

    it("should return true for strict subsets", () => {
      expect(utils.isSubsetOf(["test", "bob", 3], ["test", 3])).to.be.true;
    });

    it("should return false for non-subsets", () => {
      expect(utils.isSubsetOf(["myprop", "bob"], ["john", "mary"])).to.be.false;
    })

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
  })
});
