import {expect} from "chai";
import Resource from "../../../src/types/Resource";

describe("Resource type", () => {
  describe("validation", () => {
    it("should require a type on construction", () => {
      expect(() => new Resource(null, "bob", {})).to.throw(/type.*required/);
      expect(() => new Resource("", "bob", {})).to.throw(/type.*required/);
    });

    it("should prevent setting type to emptly/null", () => {
      let r = new Resource("type", "133123", {});
      expect(() => { r.type = undefined; }).to.throw(/type.*required/);
      expect(() => { r.type = ""; }).to.throw(/type.*required/);
      expect(() => { r.type = null; }).to.throw(/type.*required/);
    });

    it("should coerce type to a string, as required", () => {
      let r = new Resource(true);
      let r2 = new Resource(1);
      expect(r.type).to.equal("true");
      expect(r2.type).to.equal("1");
    });

    it("should allow construction with no or valid id", () => {
      // valid/no ids should construct w/o error
      /*eslint-disable no-unused-vars */
      let noId    = new Resource("type", undefined, {});
      let validId = new Resource("aoin", "39.20nA_-xgGr", {});
      /*eslint-enable */
    });

    it("should coerce ids to strings, as required by the spec", () => {
      let r = new Resource("type", 19339, {});
      expect(r.id === "19339").to.be.true;
    });

    it("should reject non-object attrs", () => {
      // allow construction with no/empty attributes, though
      let valid  = new Resource("type", "id");
      let valid2 = new Resource("pyt", "id", {}); //eslint-disable-line no-unused-vars

      // just don't allow setting attributes to a non-object.
      expect(() => new Resource("type", "id", ["attrs"])).to.throw(/must.*object/);
      expect(() => new Resource("type", "id", "atts")).to.throw(/must.*object/);
      expect(() => valid.attrs = "").to.throw(/must.*object/);
      expect(() => valid.attrs = undefined).to.throw(/must.*object/);
      expect(() => valid.attrs = "ias").to.throw(/must.*object/);
    });

    it("should reject reserved keys as attrs", () => {
      expect(() =>
        new Resource("type", "id", {"id": "bleh"})
      ).to.throw(/cannot be used as attribute/);

      expect(() =>
        new Resource("type", "id", {"type": "bleh"})
      ).to.throw(/cannot be used as attribute/);
    });

    it("should reject use of same name for an attribute and a relationship", () => {
      expect(() =>
        new Resource("type", "id", {"test": true}, {"test": false})
      ).to.throw(/relationship.+same name/);
    });

    it("should reject reserved complex attribute keys at all levels", () => {
      expect(() =>
        new Resource("type", "id", {"valid": {"links": "bb"}})
      ).to.throw(/Complex attributes may not/);

      expect(() =>
        new Resource("type", "id", {"valid": {"relationships": "bb"}})
      ).to.throw(/Complex attributes may not/);

      expect(() =>
        new Resource("type", "id", {"valid": ["a", "b", {"links": true}]})
      ).to.throw(/Complex attributes may not/);
    });
  });
});
