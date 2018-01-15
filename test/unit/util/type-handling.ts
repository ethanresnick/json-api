import { expect } from "chai";
import * as utils from "../../../src/util/type-handling";

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
});
