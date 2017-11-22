import chai = require("chai");
import chaiSubset = require("chai-subset");
import Collection from "../../../src/types/Collection";
import Resource from "../../../src/types/Resource";
import Relationship from "../../../src/types/Relationship";
import Linkage from "../../../src/types/Linkage";
import Document from "../../../src/types/Document";

const expect = chai.expect;
chai.use(chaiSubset);

describe("Document class", () => {
  describe("Rendering a document", () => {
    const orgRelation = new Relationship(new Linkage(null));
    const orgRelationCustom = new Relationship(undefined, undefined, "http://localhost/a?filter={ownerId}");
    const person = new Resource("people", "31", {"name": "mark"}, {"organization": orgRelation});
    const person2 = new Resource("people", "32", {"name": "ethan"}, {"organization": orgRelationCustom});
    const people = new Collection([person, person2]);
    const topLevelMeta = {"mcawesome": true};
    const urlTemplates = {"people": {"relationship": "RELATIONSHIP{ownerId}{path}"}};

    const singleResourceDocJSON = new Document({
      primary: person,
      meta: topLevelMeta,
      urlTemplates
    }).toJSON();

    const collectionDocJSON = new Document({
      primary: people,
      meta: topLevelMeta,
      urlTemplates
    }).toJSON();

    it("should key primary data under data, with each resource's type, id", () => {
      expect(singleResourceDocJSON.data).to.containSubset({"id": "31", "type": "people"});
    });

    it("resource collections should be represented as arrays", () => {
      expect(collectionDocJSON.data).to.be.an("array");
    });

    it("should represent includes as an array under `included`", () => {
      const doc =
        new Document({ primary: people, included: new Collection([person2]) });

      expect(doc.toJSON().included)
        .to.containSubset([{"id": "32", "type": "people", "attributes": {"name": "ethan"}}]);
    });

    it("Should include a top-level self links", () => {
      const reqURI = "http://bob";
      const doc = new Document({ primary: people, included: new Collection([person2]), reqURI });
      const docJSON = doc.toJSON();

      expect(docJSON.links).to.be.an("object");
      expect(docJSON.links && docJSON.links['self']).to.equal(reqURI);
    });

    it("should output top-level meta information, iff provided", () => {
      const docWithoutMeta = new Document({ primary: people, included: new Collection([person2]) });
      expect(collectionDocJSON.meta).to.deep.equal(topLevelMeta);
      expect(docWithoutMeta.toJSON().meta).to.be.undefined;
    });

    it("should output relationship linkage iff provided", () => {
      expect(collectionDocJSON.data[0].relationships.organization).to.have.property("data");
      expect(collectionDocJSON.data[0].relationships.organization.data).to.equal(null);
      expect(collectionDocJSON.data[1].relationships.organization).to.not.have.property("data");
    });

    it("should output relationship links iff provided, preferring relationship-specific templates", () => {
      expect(collectionDocJSON.data[0].relationships.organization.links).to.be.an("object");
      expect(collectionDocJSON.data[0].relationships.organization.links.self).to.equal("RELATIONSHIP31organization");
      expect(collectionDocJSON.data[0].relationships.organization.links).to.not.have.property("related");

      expect(collectionDocJSON.data[1].relationships.organization.links).to.be.an("object");
      expect(collectionDocJSON.data[1].relationships.organization.links.self).to.equal("http://localhost/a?filter=32");
    });
  });

});
