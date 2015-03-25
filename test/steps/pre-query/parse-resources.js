import mocha from "mocha";
import chai from "chai";
import parseResources from "../../../src/steps/pre-query/parse-resources";
import Resource from "../../../src/types/Resource";
import Collection from "../../../src/types/Collection";
import Linkage from "../../../src/types/Linkage";
import LinkObject from "../../../src/types/LinkObject";

const expect = chai.expect;

describe("Resource Parser", () => {
  describe.skip("Parsing Linkage", () => {
    it.skip("should read in the incoming json correctly", () => {
      console.log("see https://github.com/json-api/json-api/issues/482");
    });

    it.skip("should reject invalid linkage", () => {
      //linkage who's value is true, or {"id": ""}
    });
  });

  describe("Parsing a Collection", () => {
    it("should resolve with a Collection object", (done) => {
      parseResources([]).then((collection) => {
        expect(collection).to.be.instanceof(Collection);
        done();
      }, done);
    });
  });

  describe("Parsing a single Resource", () => {
    it("should resolve with a resource object", (done) => {
      parseResources({"type": "tests", "id": "1"}).then((resource) => {
        expect(resource).to.be.instanceof(Resource);
        done();
      }, done);
    });

    it("should load up the id, type, and attributes", (done) => {
      let json = {"id": "21", "type": "people", "name": "bob", "isBob": true};

      parseResources(json).then((resource) => {
        expect(resource.id).to.equal("21");
        expect(resource.type).to.equal("people");
        expect(resource.attrs).to.deep.equal({"name": "bob", "isBob": true});
        done();
      }, done);
    });

    it("should reject invalid resources", (done) => {
      parseResources({"id": "1"}).then(() => {}, (err) => {
        expect(err.detail).to.match(/type.*required/)
        done();
      });
    });

    it("should create LinkObjects/Linkage for each link", (done) => {
      const parents = [
        {"type": "people", "id": "1"}, {"type": "people", "id": "2"}
      ];
      const json = {
        "id": "3", "type": "people", "name": "Ethan",
        "links": {
          "parents": { "linkage": parents }
        }
      };

      parseResources(json).then((resource) => {
        expect(resource.links.parents).to.be.instanceof(LinkObject);
        expect(resource.links.parents.linkage).to.be.instanceof(Linkage);
        expect(resource.links.parents.linkage.value).to.deep.equal(parents);
        done();
      }, done);
    });
  });
});
