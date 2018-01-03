import chai = require("chai");
import chaiSubset = require("chai-subset");
import Data from "../../../src/types/Generic/Data";
import Resource from "../../../src/types/Resource";
import ResourceSet from "../../../src/types/ResourceSet";
import Relationship from "../../../src/types/Relationship";
import Document from "../../../src/types/Document";
import templating = require("url-template");

const expect = chai.expect;
chai.use(chaiSubset);

describe("Document class", () => {
  describe("Rendering a document", () => {
    const orgRelation = Relationship.of({
      data: Data.empty,
      owner: { type: "people", path: "organization", id: "31" }
    });

    const orgRelationCustom = Relationship.of({
      data: undefined,
      owner: { type: "people", path: "organization", id: "32" },
      links: { self: ({ ownerId }) => `http://localhost/a?filter=${ownerId}` }
    });

    const person =
      new Resource("people", "31", {"name": "mark"}, {"organization": orgRelation });

    const person2 =
      new Resource("people", "32", {"name": "ethan"}, {"organization": orgRelationCustom });

    const people = Data.of([person, person2]);
    const topLevelMeta = { "mcawesome": true };
    const urlTemplates = {
      "people": {
        // tslint:disable-next-line:no-unbound-method
        "relationship": templating.parse("RELATIONSHIP{ownerId}{path}").expand
      }
    };

    const relationshipDocJSON = new Document({
      primary: orgRelationCustom
    }).toJSON();

    const singleResourceDocJSON = new Document({
      primary: ResourceSet.of({ data: Data.pure(person) }),
      meta: topLevelMeta,
      urlTemplates
    }).toJSON();

    const collectionDocJSON = new Document({
      primary: ResourceSet.of({ data: people }),
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
      const doc = new Document({
        primary: ResourceSet.of({ data: people }),
        included: [person2]
      });

      expect(doc.toJSON().included)
        .to.containSubset([{"id": "32", "type": "people", "attributes": {"name": "ethan"}}]);
    });

    it("Should include a top-level self links from primary", () => {
      const primary = ResourceSet.of({ data: people });
      primary.links.self = () => "http://bob";
      const doc = new Document({
        primary,
        included: [person2]
      });

      const docJSON = doc.toJSON();
      expect(docJSON.links).to.be.an("object");
      expect(docJSON.links && docJSON.links.self).to.equal("http://bob");
    });

    it("should output top-level meta information, iff provided", () => {
      const docWithoutMeta = new Document({
        primary: ResourceSet.of({ data: people }),
        included: [person2]
      });

      expect(collectionDocJSON.meta).to.deep.equal(topLevelMeta);
      expect(docWithoutMeta.toJSON().meta).to.be.undefined;
    });

    it("should output relationship linkage iff provided", () => {
      if(!collectionDocJSON.data) { throw new Error("Should have top-level data."); }
      expect(collectionDocJSON.data[0].relationships.organization).to.have.property("data");
      expect(collectionDocJSON.data[0].relationships.organization.data).to.equal(null);
      expect(collectionDocJSON.data[1].relationships.organization).to.not.have.property("data");
    });

    it("should output relationship links iff provided, preferring relationship-specific templates", () => {
      if(!collectionDocJSON.data) { throw new Error("Should have top-level data."); }
      expect(collectionDocJSON.data[0].relationships.organization.links).to.be.an("object");
      expect(collectionDocJSON.data[0].relationships.organization.links.self).to.equal("RELATIONSHIP31organization");
      expect(collectionDocJSON.data[0].relationships.organization.links).to.not.have.property("related");

      expect(collectionDocJSON.data[1].relationships.organization.links).to.be.an("object");
      expect(collectionDocJSON.data[1].relationships.organization.links.self).to.equal("http://localhost/a?filter=32");
    });

    it('should render top-level links when a relationship is primary data', () => {
      expect(relationshipDocJSON.links).to.be.an("object");
      expect((relationshipDocJSON.links as any).self).to.equal("http://localhost/a?filter=32");
    })
  });
});
