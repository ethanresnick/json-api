import {expect} from "chai";
import * as formatters from "../../../src/steps/format-json";

describe("Format JSON (dasherize/camelize)", () => {

  describe("dasherizeKeys", () => {
    let json = {
      type: "people",
      attributes: {
        name: "Joe",
        nameOfDog: "Max"
      }
    };

    it("should dasherize attributes of a document-like object", () => {
      let dasherized = formatters.dasherizeKeys(json, {});
      expect(dasherized.attributes).to.have.property("name-of-dog");
    });
  });

  describe("camelizeKeys", () => {
    let json = {
      type: "people",
      attributes: {
        "name": "Joe",
        "name-of-dog": "Max"
      }
    };

    it("should camelize attributes of a document-like object", () => {
      let camelized = formatters.camelizeKeys(json, {});
      expect(camelized.attributes).to.have.property("nameOfDog");
    });
  });
});
