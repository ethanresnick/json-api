import chai = require("chai");
import parsePrimary from "../../../../src/steps/pre-query/parse-request-primary";
import Data from "../../../../src/types/Generic/Data";
import Resource from "../../../../src/types/Resource";
import Relationship from "../../../../src/types/Relationship";

const expect = chai.expect;

describe("Resource Parser", () => {
  describe("Parsing Linkage", () => {
    it("should read in the incoming json correctly", () => {
      const resourceIdentifier = {id: "3", type: "people"};

      return Promise.all([
        parsePrimary(null, true).then(res => {
          expect(res).to.deep.equal(Data.empty);
        }),
        parsePrimary([], true).then(res => {
          expect(res).to.deep.equal(Data.of([]))
        }),
        parsePrimary([resourceIdentifier], true).then(res => {
          expect(res).to.deep.equal(Data.of([resourceIdentifier]));
        }),
        parsePrimary(resourceIdentifier, true).then(res => {
          expect(res).to.deep.equal(Data.pure(resourceIdentifier));
        })
      ]);
    });

    it("should reject invalid linkage", () => {
      return Promise.all([
        parsePrimary(true, true).then(() => {
          throw new Error("Should have rejected.");
        }, (e) => { return; }),
        parsePrimary([{id: "3"}], true).then(() => {
          throw new Error("Should have rejected.");
        }, (e) => { return; })
      ]);
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

    it("should load up the id, type, and attributes", () => {
      const json = {
        "id": "21", "type": "people",
        "attributes": {"name": "bob", "isBob": true}
      };

      return parsePrimary(json).then((resourceData) => {
        const resource = resourceData.unwrap() as Resource;
        expect(resource).to.be.instanceof(Resource);
        expect(resource.id).to.equal("21");
        expect(resource.type).to.equal("people");
        expect(resource.attrs).to.deep.equal({"name": "bob", "isBob": true});
      });
    });

    it("should reject invalid resources", () => {
      return parsePrimary({"id": "1"}).then(() => {
        throw new Error("Should have rejected.")
      }, (err) => {
        expect(err.detail).to.match(/type.*required/);
      });
    });

    it("should create Relationship for each link", () => {
      const parents = [
        {"type": "people", "id": "1"}, {"type": "people", "id": "2"}
      ];
      const json = {
        "id": "3", "type": "people",
        "relationships": {
          "parents": { "data": parents }
        }
      };

      return parsePrimary(json).then((resourceData) => {
        const resource = resourceData.unwrap() as Resource;
        expect(resource.relationships.parents).to.be.instanceof(Relationship);
        expect(resource.relationships.parents.toJSON({}).data).to.deep.equal(parents);
      });
    });
  });
});
