import {expect} from "chai";
import Resource from "../../../src/types/Resource";
import ResourceSet from "../../../src/types/ResourceSet";

describe("ResourceSet type", () => {
  const item1 = new Resource("a", "1");
  const item2 = new Resource("b", "2");

  // sets
  const set1 = ResourceSet.of({ data: item1 });
  const set2 = ResourceSet.of({ data: [item1, item2] });

  // Callbacks
  const mapper = it => { it.type = it.type + 'here'; return it; };
  const asyncMapper = it => Promise.resolve(mapper(it));

  describe("map", () => {
    it("should return a ResourceSet instance", () => {
      expect(set1.map(mapper)).to.be.an.instanceof(ResourceSet);
    });
  });

  describe("mapAsync", () => {
    it("should produce a promise for the result of a normal map", () => {
      return set2.mapAsync(asyncMapper).then(mapped => {
        expect(mapped).to.deep.equal(set2.map(mapper))
      });
    });
  });
});
