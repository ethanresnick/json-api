import chai = require("chai");
import parsePrimary from "../../../../src/steps/pre-query/parse-request-primary";
import Data from "../../../../src/types/Data";
import Resource from "../../../../src/types/Resource";
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
    it("should resolve with a plural Data object", (done) => {
      parsePrimary([]).then((collection) => {
        expect(collection).to.be.instanceof(Data);
        expect(collection.isSingular).to.be.false;
        done();
      }, done);
    });
  });

  describe("Parsing a single Resource", () => {
    it("should resolve with a singular Data object", (done) => {
      parsePrimary({"type": "tests", "id": "1"}).then((resource) => {
        expect(resource).to.be.instanceof(Data);
        expect(resource.isSingular).to.be.true;
        done();
      }, done);
    });

    it("should load up the id, type, and attributes", (done) => {
      const json = {
        "id": "21", "type": "people",
        "attributes": {"name": "bob", "isBob": true}
      };

      parsePrimary(json).then((resourceData: Data<Resource>) => {
        const resource = resourceData.unwrap() as Resource;
        expect(resource).to.be.instanceof(Resource);
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

    it("should create Relationship for each link", (done) => {
      const parents = [
        {"type": "people", "id": "1"}, {"type": "people", "id": "2"}
      ];
      const json = {
        "id": "3", "type": "people",
        "relationships": {
          "parents": { "data": parents }
        }
      };

      parsePrimary(json).then((resourceData: Data<Resource>) => {
        const resource = resourceData.unwrap() as Resource;
        expect(resource.relationships.parents).to.be.instanceof(Relationship);
        expect(resource.relationships.parents.toJSON({}).data).to.deep.equal(parents);
        done();
      }, done);
    });
  });
});
