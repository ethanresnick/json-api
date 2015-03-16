import mocha from "mocha"
import sinon from "sinon"
import chai from "chai"
import * as utils from "../../lib/util/utils"
import Resource from "../../lib/types/Resource"
import Collection from "../../lib/types/Collection"

var expect = chai.expect

describe("Utility methods", () => {
  describe("deleteNested", () => {
    var obj = {"contact": {"phone": "310"}};
    var deletion = utils.deleteNested("contact.phone", obj);

    it("should delete a nested property when present", () => {
      expect(obj.contact.phone).to.equal(undefined);
    });

    it("should return true if deletion succeeds", () => {
      expect(deletion).to.be.true;
    });

    it("should return false if deletion fails", () => {
      expect(utils.deleteNested("contact.twitter", obj)).to.be.false;
    });
  });

  describe("mapResources", () => {
    it("should call the map function on a single resource", () => {
      var mapper = sinon.spy((it) => it)
      var resource = new Resource("tests", "43");
      utils.mapResources(resource, mapper);
      expect(mapper.calledOnce).to.be.true
      expect(mapper.calledWith(resource)).to.be.true;
    });

    it("should call the map function on each resource in a collection", () => {
      var mapper = sinon.spy((it) => it)
      var resources = [new Resource("tests", "43"), new Resource("tests", "44")];
      var collection = new Collection(resources);

      utils.mapResources(collection, mapper);
      expect(mapper.callCount).to.equal(2);
      expect(mapper.calledWith(resources[0])).to.be.true;
      expect(mapper.calledWith(resources[1])).to.be.true;
    });

    it("should return the mapped output", () => {
      var mapper = sinon.spy((it) => it.id)
      var resources = [new Resource("tests", "43"), new Resource("tests", "44")];
      var collection = new Collection(resources);

      expect(utils.mapResources(collection, mapper)).to.deep.equal(["43", "44"]);
      expect(utils.mapResources(resources[0], mapper)).to.equal("43");
    });
  });
  
  describe.skip("mapArrayOrVal", () => {
    it("should call the map function on a single value");
    it("should call the map function on each value in an array");
    it("should return the mapped value");
  });

  describe.skip("forEachArrayOrVal", () => {
    it("should call the each function on a single value");
    it("should call the each function on each value in an array");
    it("should return void");    
  });

  describe("arrayUnique", () => {
    it("should remove duplicate primitive values", () => {
      var uniqueSorted = utils.arrayUnique(["2", true, "bob", "2"]).sort();
      expect(uniqueSorted).to.deep.equal(["2", true, "bob"].sort());
    });

    it("should not coerce types", () => {
      var uniqueSorted = utils.arrayUnique(["2", true, "true", 2]).sort();
      expect(uniqueSorted).to.deep.equal(["2", true, "true", 2].sort());
    });

    it("should compare objects by identity, not contents", () => {
      var arr1 = []
      var arr2 = [];
      expect(utils.arrayUnique([arr1, arr2])).to.have.length(2);
    });

    it("should remove duplicate objects", () => {
      var r = {};
      expect(utils.arrayUnique([r, r])).to.have.length(1);
    });
  });
})