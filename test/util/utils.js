import mocha from "mocha"
import sinon from "sinon"
import chai from "chai"
import * as utils from "../../src/util/utils"
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

  describe("mapResources", () => {
    it("should call the map function on a single resource", () => {
      let mapper = sinon.spy((it) => it);
      let resource = new Resource("tests", "43");
      utils.mapResources(resource, mapper);
      expect(mapper.calledOnce).to.be.true;
      expect(mapper.calledWith(resource)).to.be.true;
    });

    it("should call the map function on each resource in a collection", () => {
      let mapper = sinon.spy((it) => it);
      let resources = [new Resource("tests", "43"), new Resource("tests", "44")];
      let collection = new Collection(resources);

      utils.mapResources(collection, mapper);
      expect(mapper.callCount).to.equal(2);
      expect(mapper.calledWith(resources[0])).to.be.true;
      expect(mapper.calledWith(resources[1])).to.be.true;
    });

    it("should return the mapped output", () => {
      let mapper = sinon.spy((it) => it.id);
      let resources = [new Resource("tests", "43"), new Resource("tests", "44")];
      let collection = new Collection(resources);

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
      let uniqueSorted = utils.arrayUnique(["2", true, "bob", "2"]).sort();
      expect(uniqueSorted).to.deep.equal(["2", true, "bob"].sort());
    });

    it("should not coerce types", () => {
      let uniqueSorted = utils.arrayUnique(["2", true, "true", 2]).sort();
      expect(uniqueSorted).to.deep.equal(["2", true, "true", 2].sort());
    });

    it("should compare objects by identity, not contents", () => {
      let arr1 = [];
      let arr2 = [];
      expect(utils.arrayUnique([arr1, arr2])).to.have.length(2);
    });

    it("should remove duplicate objects", () => {
      let r = {};
      expect(utils.arrayUnique([r, r])).to.have.length(1);
    });
  });

  describe("arrayValuesMatch", () => {
    it.skip("should work");
  });

  describe("objectIsEmpty", () => {
    it.skip("should return false on an object with direct properties");
    it.skip("should return true if the object only has prototype properties");
  });

  describe("ValueObject", () => {
    describe("the constructor function it produces", () => {
      /*eslint-disable new-cap */
      let WrappedConstructor = utils.ValueObject(function() {
        this.allowedProp = null;
        Object.defineProperty(this, "otherValidProp", {writable: true, enumerable: true});
      });
      /*eslint-enable */

      it("should use provided initial values", () => {
        let it = new WrappedConstructor({allowedProp: "14"});
        expect(it.allowedProp).to.equal("14");
      });

      it("should ignore initial values for unknown property names", () => {
        let it = new WrappedConstructor({notAValidProperty: "14"});
        expect(it.notAValidProperty).to.be.undefined;
      });

      it("should prevent adding new properties to the object", () => {
        let it = new WrappedConstructor();
        expect(() => it.notAValidContextProperty = 4).to.throw(TypeError);
      });

      it("should allow the values of existing properties to change", () => {
        let it = new WrappedConstructor();
        it.allowedProp = 9;
        it.otherValidProp = 7; //check Object.defineProperty props too.
        expect(it.allowedProp).to.equal(9);
        expect(it.otherValidProp).to.equal(7);
      });
    });
  });
});
