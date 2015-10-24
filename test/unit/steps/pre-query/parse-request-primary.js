import chai from "chai";
import parsePrimary from "../../../../src/steps/pre-query/parse-request-primary";
import Resource from "../../../../src/types/Resource";
import Collection from "../../../../src/types/Collection";
import Linkage from "../../../../src/types/Linkage";
import Relationship from "../../../../src/types/Relationship";

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
      parsePrimary([]).then((collection) => {
        expect(collection).to.be.instanceof(Collection);
        done();
      }, done);
    });
  });

  describe("Parsing a single Resource", () => {
    it("should resolve with a resource object", (done) => {
      parsePrimary({"type": "tests", "id": "1"}).then((resource) => {
        expect(resource).to.be.instanceof(Resource);
        done();
      }, done);
    });

    it("should load up the id, type, and attributes", (done) => {
      let json = {
        "id": "21", "type": "people",
        "attributes": {"name": "bob", "isBob": true}
      };

      parsePrimary(json).then((resource) => {
        expect(resource.id).to.equal("21");
        expect(resource.type).to.equal("people");
        expect(resource.attrs).to.deep.equal({"name": "bob", "isBob": true});
        done();
      }, done);
    });

    it("should reject invalid resources", (done) => {
      parsePrimary({"id": "1"}).then(() => {}, (err) => {
        expect(err.detail).to.match(/type.*required/);
        done();
      });
    });

    it("should create Relationship/Linkage for each link", (done) => {
      const parents = [
        {"type": "people", "id": "1"}, {"type": "people", "id": "2"}
      ];
      const json = {
        "id": "3", "type": "people",
        "relationships": {
          "parents": { "data": parents }
        }
      };

      parsePrimary(json).then((resource) => {
        expect(resource.relationships.parents).to.be.instanceof(Relationship);
        expect(resource.relationships.parents.linkage).to.be.instanceof(Linkage);
        expect(resource.relationships.parents.linkage.value).to.deep.equal(parents);
        done();
      }, done);
    });
  });
});
