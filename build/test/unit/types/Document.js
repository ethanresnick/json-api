"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiSubset = require("chai-subset");
const Data_1 = require("../../../src/types/Generic/Data");
const Resource_1 = require("../../../src/types/Resource");
const ResourceSet_1 = require("../../../src/types/ResourceSet");
const Relationship_1 = require("../../../src/types/Relationship");
const Document_1 = require("../../../src/types/Document");
const templating = require("url-template");
const expect = chai.expect;
chai.use(chaiSubset);
describe("Document class", () => {
    const orgRelation = Relationship_1.default.of({
        data: Data_1.default.empty,
        owner: { type: "people", path: "organization", id: "31" }
    });
    const orgRelationCustom = Relationship_1.default.of({
        data: undefined,
        owner: { type: "people", path: "organization", id: "32" },
        links: { self: ({ ownerId }) => `http://localhost/a?filter=${ownerId}` }
    });
    const person = new Resource_1.default("people", "31", { "name": "mark" }, { "organization": orgRelation });
    const person2 = new Resource_1.default("people", "32", { "name": "ethan" }, { "organization": orgRelationCustom });
    const people = Data_1.default.of([person, person2]);
    const topLevelMeta = { "mcawesome": true };
    const urlTemplates = {
        "people": {
            "relationship": templating.parse("RELATIONSHIP{ownerId}{path}").expand
        }
    };
    describe("Creating a Document", () => {
        it("should reject non-object meta information", () => {
            expect(() => new Document_1.default({
                primary: ResourceSet_1.default.of({ data: people }),
                meta: ["bob"]
            })).to.throw(/meta.*object/i);
        });
    });
    describe("Rendering a document", () => {
        const relationshipDocJSON = new Document_1.default({
            primary: orgRelationCustom
        }).toJSON();
        const singleResourceDocJSON = new Document_1.default({
            primary: ResourceSet_1.default.of({ data: Data_1.default.pure(person) }),
            meta: topLevelMeta,
            urlTemplates
        }).toJSON();
        const collectionDocJSON = new Document_1.default({
            primary: ResourceSet_1.default.of({ data: people }),
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
            const doc = new Document_1.default({
                primary: ResourceSet_1.default.of({ data: people }),
                included: [person2]
            });
            expect(doc.toJSON().included)
                .to.containSubset([{ "id": "32", "type": "people", "attributes": { "name": "ethan" } }]);
        });
        it("Should include a top-level self links from primary", () => {
            const primary = ResourceSet_1.default.of({ data: people });
            primary.links.self = () => "http://bob";
            const doc = new Document_1.default({
                primary,
                included: [person2]
            });
            const docJSON = doc.toJSON();
            expect(docJSON.links).to.be.an("object");
            expect(docJSON.links && docJSON.links.self).to.equal("http://bob");
        });
        it("should output top-level meta information, iff provided", () => {
            const docWithoutMeta = new Document_1.default({
                primary: ResourceSet_1.default.of({ data: people }),
                included: [person2]
            });
            expect(collectionDocJSON.meta).to.deep.equal(topLevelMeta);
            expect(docWithoutMeta.toJSON().meta).to.be.undefined;
        });
        it("should output relationship linkage iff provided", () => {
            if (!collectionDocJSON.data) {
                throw new Error("Should have top-level data.");
            }
            expect(collectionDocJSON.data[0].relationships.organization).to.have.property("data");
            expect(collectionDocJSON.data[0].relationships.organization.data).to.equal(null);
            expect(collectionDocJSON.data[1].relationships.organization).to.not.have.property("data");
        });
        it("should output relationship links iff provided, preferring relationship-specific templates", () => {
            if (!collectionDocJSON.data) {
                throw new Error("Should have top-level data.");
            }
            expect(collectionDocJSON.data[0].relationships.organization.links).to.be.an("object");
            expect(collectionDocJSON.data[0].relationships.organization.links.self).to.equal("RELATIONSHIP31organization");
            expect(collectionDocJSON.data[0].relationships.organization.links).to.not.have.property("related");
            expect(collectionDocJSON.data[1].relationships.organization.links).to.be.an("object");
            expect(collectionDocJSON.data[1].relationships.organization.links.self).to.equal("http://localhost/a?filter=32");
        });
        it('should render top-level links when a relationship is primary data', () => {
            expect(relationshipDocJSON.links).to.be.an("object");
            expect(relationshipDocJSON.links.self).to.equal("http://localhost/a?filter=32");
        });
    });
});
