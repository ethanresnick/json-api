import {expect} from "chai";
import ResourceIdentifier from "../../../src/types/ResourceIdentifier";
import Relationship from "../../../src/types/Relationship";

describe("Relationship type", () => {
  const item1 = new ResourceIdentifier("a", "1");
  const item2 = new ResourceIdentifier("b", "2");

  // relationships
  const owner = { "type": "b", "id": "2", "path": "test"};
  const rel1 = Relationship.of({ data: item1, owner });
  const rel2 = Relationship.of({ data: [item1, item2], owner });

  // Callbacks
  const mapper = it => { it.type = it.type + 'here'; return it; };
  const asyncMapper = it => Promise.resolve(mapper(it));

  describe("map", () => {
    const mapped = rel1.map(mapper);

    it("should return a Relationship instance", () => {
      expect(mapped).to.be.an.instanceof(Relationship);
    });

    it("should preserve the Relationship's owner", () => {
      expect(rel1.owner).to.deep.equal((mapped as Relationship).owner);
    });
  });

  describe("mapAsync", () => {
    it("should produce a promise for the result of a normal map", () => {
      return rel2.mapAsync(asyncMapper).then(mapped => {
        expect(mapped).to.deep.equal(rel2.map(mapper))
      });
    });
  });
});
