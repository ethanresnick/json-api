"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiSubset = require("chai-subset");
const Collection_1 = require("../../../src/types/Collection");
const Resource_1 = require("../../../src/types/Resource");
const Relationship_1 = require("../../../src/types/Relationship");
const Linkage_1 = require("../../../src/types/Linkage");
const Document_1 = require("../../../src/types/Document");
const expect = chai.expect;
chai.use(chaiSubset);
describe("Document class", () => {
    describe("Rendering a document", () => {
        const orgRelation = new Relationship_1.default(new Linkage_1.default(null));
        const orgRelationCustom = new Relationship_1.default(undefined, undefined, "http://localhost/a?filter={ownerId}");
        const person = new Resource_1.default("people", "31", { "name": "mark" }, { "organization": orgRelation });
        const person2 = new Resource_1.default("people", "32", { "name": "ethan" }, { "organization": orgRelationCustom });
        const people = new Collection_1.default([person, person2]);
        const topLevelMeta = { "mcawesome": true };
        const urlTemplates = { "people": { "relationship": "RELATIONSHIP{ownerId}{path}" } };
        const singleResourceDocJSON = new Document_1.default(person, undefined, topLevelMeta, urlTemplates).get();
        const collectionDocJSON = new Document_1.default(people, undefined, topLevelMeta, urlTemplates).get();
        it("should key primary data under data, with each resource's type, id", () => {
            expect(singleResourceDocJSON.data).to.containSubset({ "id": "31", "type": "people" });
        });
        it("resource collections should be represented as arrays", () => {
            expect(collectionDocJSON.data).to.be.an("array");
        });
        it("should represent includes as an array under `included`", () => {
            expect((new Document_1.default(people, new Collection_1.default([person2]))).get().included)
                .to.containSubset([{ "id": "32", "type": "people", "attributes": { "name": "ethan" } }]);
        });
        it("Should include a top-level self links", () => {
            const reqURI = "http://bob";
            const doc = new Document_1.default(people, new Collection_1.default([person2]), undefined, undefined, reqURI);
            const docJSON = doc.get();
            expect(docJSON.links).to.be.an("object");
            expect(docJSON.links && docJSON.links['self']).to.equal(reqURI);
        });
        it("should output top-level meta information, iff provided", () => {
            const docWithoutMeta = new Document_1.default(people, new Collection_1.default([person2]), undefined);
            expect(collectionDocJSON.meta).to.deep.equal(topLevelMeta);
            expect(docWithoutMeta.get().meta).to.be.undefined;
        });
        it("should reject non-object meta information", () => {
            expect(() => new Document_1.default(people, new Collection_1.default([person2]), ["bob"]))
                .to.throw(/meta.*object/i);
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
