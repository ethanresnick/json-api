import {expect} from "chai";
import Resource from "../../../src/types/Resource";

describe("Resource type", () => {
  describe("validation", () => {
    it("should require a type on construction", () => {
      expect(() => new Resource(<any>null, "bob", {})).to.throw(/type.*required/);
      expect(() => new Resource("", "bob", {})).to.throw(/type.*required/);
    });

    it("should prevent setting type to emptly/null", () => {
      const r = new Resource("type", "133123", {});
      expect(() => { r.type = <any>undefined; }).to.throw(/type.*required/);
      expect(() => { r.type = ""; }).to.throw(/type.*required/);
      expect(() => { r.type = <any>null; }).to.throw(/type.*required/);
    });

    it("should coerce type to a string, as required", () => {
      const r = new Resource(<any>true);
      const r2 = new Resource(<any>1);
      expect(r.type).to.equal("true");
      expect(r2.type).to.equal("1");
    });

    it("should allow construction with no or valid id", () => {
      // valid/no ids should construct w/o error
      new Resource("type", undefined, {}); // no id case
      new Resource("aoin", "39.20nA_-xgGr", {}); // invalid id case
    });

    it("should coerce ids to strings, as required by the spec", () => {
      const r = new Resource("type", <any>19339, {});
      expect(r.id === "19339").to.be.true;
    });

    // Note: this behavior may change.
    // See https://github.com/json-api/json-api/issues/1261
    it("should allow empty id as a string", () => {
      expect(new Resource("type", undefined, {}).id).to.be.undefined;
      expect(new Resource("type", "", {}).id).to.equal("");
    });

    it("should reject non-object attrs", () => {
      // allow construction with no/empty attributes
      const valid = new Resource("type", "id");
      new Resource("pyt", "id", {});

      // just don't allow setting attributes to a non-object.
      expect(() => new Resource("type", "id", ["attrs"])).to.throw(/must.*object/);
      expect(() => new Resource("type", "id", "atts")).to.throw(/must.*object/);
      expect(() => valid.attrs = <any>"").to.throw(/must.*object/);
      expect(() => valid.attrs = <any>undefined).to.throw(/must.*object/);
      expect(() => valid.attrs = <any>"ias").to.throw(/must.*object/);
    });

    it("should reject reserved keys as attrs", () => {
      expect(() =>
        new Resource("type", "id", {"id": "bleh"})
      ).to.throw(/cannot be used as field names/);

      expect(() =>
        new Resource("type", "id", {"type": "bleh"})
      ).to.throw(/cannot be used as field names/);
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
