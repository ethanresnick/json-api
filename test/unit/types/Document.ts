import chai = require("chai");
import sinon = require("sinon");
import chaiSubset = require("chai-subset");
import Data from "../../../src/types/Generic/Data";
import Resource from "../../../src/types/Resource";
import ResourceSet from "../../../src/types/ResourceSet";
import Relationship from "../../../src/types/Relationship";
import ResourceIdentifier from "../../../src/types/ResourceIdentifier";
import ResourceIdentifierSet from "../../../src/types/ResourceIdentifierSet";
import Document from "../../../src/types/Document";
import templating = require("url-template");

const expect = chai.expect;
chai.use(chaiSubset);

describe("Document class", () => {
  const makeEmptyRelation = () =>
    Relationship.of({
      data: Data.empty,
      owner: { type: "people", path: "organization", id: "31" }
    });

  const makeDatalessRelation = () =>
    Relationship.of({
      data: undefined,
      owner: { type: "people", path: "organization", id: "32" },
      links: { self: ({ ownerId }) => `http://localhost/a?filter=${ownerId}` }
    });

  const makeFullRelation = () =>
    Relationship.of({
      data: Data.pure(new ResourceIdentifier("organizations", "1")),
      owner: { type: "people", path: "organization", id: "33" },
      links: { self: ({ ownerId }) => `http://localhost/a?filter=${ownerId}` }
    });

  const makePerson = () =>
    new Resource(
      "people",
      "31",
      { name: "mark" },
      { organization: makeEmptyRelation() }
    );

  const makePerson2 = () =>
    new Resource(
      "people",
      "32",
      { name: "ethan" },
      { organization: makeDatalessRelation() }
    );

  const makePerson3 = () =>
    new Resource(
      "people",
      "33",
      { name: "john" },
      { organization: makeFullRelation() }
    );

  const person = makePerson();
  const person2 = makePerson2();
  const people = Data.of([person, person2]);

  const topLevelMeta = { mcawesome: true };
  const urlTemplates = {
    people: {
      // tslint:disable-next-line:no-unbound-method
      relationship: templating.parse("RELATIONSHIP{ownerId}{path}").expand
    }
  };

  describe("Creating a Document", () => {
    it("should reject non-object meta information", () => {
      expect(() => new Document({
        primary: ResourceSet.of({ data: people }),
        meta: (["bob"] as any)
      })).to.throw(/meta.*object/i);
    });
  });

  describe("Rendering a document", () => {
    const relationshipDocJSON = new Document({
      primary: makeDatalessRelation()
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
      expect(singleResourceDocJSON.data).to.containSubset({ "id": "31", "type": "people" });
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
        .to.containSubset([{ "id": "32", "type": "people", "attributes": { "name": "ethan" } }]);
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
      if (!collectionDocJSON.data) { throw new Error("Should have top-level data."); }
      expect(collectionDocJSON.data[0].relationships.organization).to.have.property("data");
      expect(collectionDocJSON.data[0].relationships.organization.data).to.equal(null);
      expect(collectionDocJSON.data[1].relationships.organization).to.not.have.property("data");
    });

    it("should output relationship links iff provided, preferring relationship-specific templates", () => {
      if (!collectionDocJSON.data) { throw new Error("Should have top-level data."); }
      expect(collectionDocJSON.data[0].relationships.organization.links).to.be.an("object");
      expect(collectionDocJSON.data[0].relationships.organization.links.self).to.equal("RELATIONSHIP31organization");
      expect(collectionDocJSON.data[0].relationships.organization.links).to.not.have.property("related");

      expect(collectionDocJSON.data[1].relationships.organization.links).to.be.an("object");
      expect(collectionDocJSON.data[1].relationships.organization.links.self).to.equal("http://localhost/a?filter=32");
    });

    it("should render top-level links when a relationship is primary data", () => {
      expect(relationshipDocJSON.links).to.be.an("object");
      expect((relationshipDocJSON.links as any).self).to.equal("http://localhost/a?filter=32");
    })
  });

  describe("transform", () => {
    const removeTransform = it => Promise.resolve(undefined);
    const removeLinkageTransform = (it) => {
      return Promise.resolve(it instanceof Resource ? it : undefined);
    };

    let collectionDoc: Document,
      relationshipDoc: Document,
      collectionWithLinkageDoc: Document,
      singleResourceDoc: Document,
      resourceIdDoc: Document;

    beforeEach(() => {
      // Reset docs to untransformed versions with fresh resource objects.
      collectionDoc = new Document({
        primary: ResourceSet.of({ data: [makePerson(), makePerson2()] }),
        included: [makePerson2()]
      });

      relationshipDoc = new Document({ primary: makeFullRelation() });

      collectionWithLinkageDoc = new Document({
        primary: ResourceSet.of({ data: [makePerson(), makePerson3()] }),
        included: [makePerson2()]
      });

      singleResourceDoc = new Document({
        primary: ResourceSet.of({ data: Data.pure(makePerson3()) }),
        meta: topLevelMeta
      });

      resourceIdDoc = new Document({
        primary: ResourceIdentifierSet.of({
          data: [new ResourceIdentifier("people", "4")]
        }),
        meta: topLevelMeta
      });
    });

    it("should remove items when function returns undefined", () => {
      const newDocsPromises = [
        collectionDoc.transform(removeTransform, false),
        relationshipDoc.transform(removeTransform, false),
        resourceIdDoc.transform(removeTransform, false),
        singleResourceDoc.transform(removeLinkageTransform, false)
      ];

      return Promise.all(newDocsPromises).then((newDocs) => {
        const newDocsJSON = newDocs.map(it => it.toJSON());
        expect(newDocsJSON[0].data).to.deep.equal([]);
        expect(newDocsJSON[0].included).to.deep.equal([]);

        expect(newDocsJSON[1].data).to.equal(null);

        expect(newDocsJSON[2].data).to.deep.equal([]);

        expect(newDocsJSON[3].data).to.deep.equal({
          "type": "people",
          "id": "33",
          "attributes": { "name": "john" },
          "relationships": {
            "organization": {
              "data": null, // linkage removed!
              "links": {
                "self": "http://localhost/a?filter=33"
              }
            }
          }
        });
      });
    });

    it("should skip linkage if second argument true", () => {
      const newDocsPromises = [
        relationshipDoc.transform(removeTransform, true),
        resourceIdDoc.transform(removeTransform, true),
        singleResourceDoc.transform(removeLinkageTransform, true)
      ];

      return Promise.all(newDocsPromises).then((newDocs) => {
        const newDocsJSON = newDocs.map(it => it.toJSON());
        expect(newDocsJSON[0].data).to.deep.equal({ type: "organizations", id: "1" });
        expect(newDocsJSON[1].data).to.deep.equal([{ type: "people", id: "4" }]);
        expect(newDocsJSON[2].data).to.deep.equal({
          "type": "people",
          "id": "33",
          "attributes": { "name": "john" },
          "relationships": {
            "organization": {
              "data": { type: "organizations", id: "1" }, // linkage still there
              "links": {
                "self": "http://localhost/a?filter=33"
              }
            }
          }
        });
      });
    });

    it("should leave document.meta alone", () => {
      return singleResourceDoc.transform(removeTransform).then((newDoc) => {
        expect(newDoc.meta).to.deep.equal(singleResourceDoc.meta);
      });
    });

    it("should call the tranform function on each resource/identifier with proper meta", async () => {
      const transformFn = sinon.spy(function(resourceOrId) {
        // Test that linkage is transformed before the full resource by
        // throwing if we encounter person3 and its linkage isn't yet {test, 4}.
        if(resourceOrId instanceof Resource && resourceOrId.id === "33") {
          const linkage = resourceOrId.relationships.organization.values;
          expect(linkage).to.deep.equal([new ResourceIdentifier("test", "4")]);
        }

        return resourceOrId instanceof ResourceIdentifier
          ? Promise.resolve(new ResourceIdentifier("test", "4"))
          : Promise.resolve(resourceOrId);
      });

      // tslint:disable-next-line no-shadowed-variable
      const hasMatchingCall = (calls: any[], args: any[]) => {
        return calls.findIndex((call) => {
          try { expect(call.args).to.deep.equal(args); return true; }
          catch(e) { return false; }
        }) > -1;
      }

      // Capture some data so we can test that our spy was called with it.
      const [person1, person3] = (collectionWithLinkageDoc.primary as ResourceSet).values;
      //tslint:disable-next-line no-shadowed-variable no-non-null-assertion
      const [person2] = collectionWithLinkageDoc.included!;

      // Exercise the spy and capture what happened.
      await collectionWithLinkageDoc.transform(transformFn, false);
      const calls = transformFn.getCalls();

      // Called on all three resources and the linkage.
      expect(transformFn.callCount).to.equal(4);

      // Test for call on the linkage with proper meta.
      expect(hasMatchingCall(calls, [
        new ResourceIdentifier("organizations", "1"),
        { section: "primary" },
      ])).to.be.true;

      // Test for call on the resources
      expect(hasMatchingCall(calls, [person3, { section: "primary" }])).to.be.true;
      expect(hasMatchingCall(calls, [person1, { section: "primary" }])).to.be.true;
      expect(hasMatchingCall(calls, [person2, { section: "included" }])).to.be.true;
    });
  });
});
