import {expect} from "chai";
import * as formatters from "../../../src/steps/format-json";
import Resource from "../../../src/types/Resource";
import Collection from "../../../src/types/Collection";
import ResourceTypeRegistry from "../../../src/ResourceTypeRegistry";

describe("Format JSON (dasherize/camelize)", () => {

  let registry;
  before(() => {
    registry = new ResourceTypeRegistry();
    registry.type("people", {});
  });

  describe("dasherizeResourceOrCollection", () => {
    let resource;
    before(() => {
      resource = new Resource("people", 1, {
        name: "Joe",
        nameOfDog: "Max"
      });
    });

    it("should dasherize attributes of a resource", () => {
      let dasherized = formatters.dasherizeResourceOrCollection(resource, registry);
      expect(dasherized.attrs).to.have.property("name-of-dog");
    });

    it("should dasherize attributes of each resource in a collection", () => {
      let collection = new Collection([resource]);
      let dasherized = formatters.dasherizeResourceOrCollection(collection, registry);
      expect(dasherized.resources[0].attrs).to.have.property("name-of-dog");
    });
  });

  describe("camelizeResourceOrCollection", () => {
    let resource;
    before(() => {
      resource = new Resource("people", 2, {
        "name": "Joe",
        "name-of-dog": "Max"
      });
    });

    it("should camelize attributes of a resource", () => {
      let camelized = formatters.camelizeResourceOrCollection(resource, registry);
      expect(camelized.attrs).to.have.property("nameOfDog");
    });

    it("should camelize attributes of each resource in a collection", () => {
      let collection = new Collection([resource]);
      let camelized = formatters.camelizeResourceOrCollection(collection, registry);
      expect(camelized.resources[0].attrs).to.have.property("nameOfDog");
    });
  });
});
