import sinon = require("sinon");
import {expect} from "chai";
import * as utils from "../../../src/util/type-handling";
import Resource from "../../../src/types/Resource";
import Collection from "../../../src/types/Collection";

describe("Utility methods", () => {
  describe("mapResources", () => {
    it("should call the map function on a single resource", () => {
      const mapper = sinon.spy((it) => it);
      const resource = new Resource("tests", "43");
      utils.mapResources(resource, mapper);
      expect(mapper.calledOnce).to.be.true;
      expect(mapper.calledWith(resource)).to.be.true;
    });

    it("should call the map function on each resource in a collection", () => {
      const mapper = sinon.spy((it) => it);
      const resources = [new Resource("tests", "43"), new Resource("tests", "44")];
      const collection = new Collection(resources);

      utils.mapResources(collection, mapper);
      expect(mapper.callCount).to.equal(2);
      expect(mapper.calledWith(resources[0])).to.be.true;
      expect(mapper.calledWith(resources[1])).to.be.true;
    });

    it("should return the mapped output", () => {
      const mapper = sinon.spy((it) => it.id);
      const resources = [new Resource("tests", "43"), new Resource("tests", "44")];
      const collection = new Collection(resources);

      expect(utils.mapResources(collection, mapper)).to.deep.equal(["43", "44"]);
      expect(utils.mapResources(resources[0], mapper)).to.equal("43");
    });
  });

  describe.skip("forEachArrayOrVal", () => {
    it("should call the each function on a single value");
    it("should call the each function on each value in an array");
    it("should return void");
  });

  describe("objectIsEmpty", () => {
    it.skip("should return false on an object with direct properties");
    it.skip("should return true if the object only has prototype properties");
  });
});
