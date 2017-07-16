"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const parse_request_primary_1 = require("../../../../src/steps/pre-query/parse-request-primary");
const Resource_1 = require("../../../../src/types/Resource");
const Collection_1 = require("../../../../src/types/Collection");
const Linkage_1 = require("../../../../src/types/Linkage");
const Relationship_1 = require("../../../../src/types/Relationship");
const expect = chai.expect;
describe("Resource Parser", () => {
    describe.skip("Parsing Linkage", () => {
        it.skip("should read in the incoming json correctly", () => {
            console.log("see https://github.com/json-api/json-api/issues/482");
        });
        it.skip("should reject invalid linkage", () => {
        });
    });
    describe("Parsing a Collection", () => {
        it("should resolve with a Collection object", (done) => {
            parse_request_primary_1.default([]).then((collection) => {
                expect(collection).to.be.instanceof(Collection_1.default);
                done();
            }, done);
        });
    });
    describe("Parsing a single Resource", () => {
        it("should resolve with a resource object", (done) => {
            parse_request_primary_1.default({ "type": "tests", "id": "1" }).then((resource) => {
                expect(resource).to.be.instanceof(Resource_1.default);
                done();
            }, done);
        });
        it("should load up the id, type, and attributes", (done) => {
            let json = {
                "id": "21", "type": "people",
                "attributes": { "name": "bob", "isBob": true }
            };
            parse_request_primary_1.default(json).then((resource) => {
                expect(resource.id).to.equal("21");
                expect(resource.type).to.equal("people");
                expect(resource.attrs).to.deep.equal({ "name": "bob", "isBob": true });
                done();
            }, done);
        });
        it("should reject invalid resources", (done) => {
            parse_request_primary_1.default({ "id": "1" }).then(() => { }, (err) => {
                expect(err.detail).to.match(/type.*required/);
                done();
            });
        });
        it("should create Relationship/Linkage for each link", (done) => {
            const parents = [
                { "type": "people", "id": "1" }, { "type": "people", "id": "2" }
            ];
            const json = {
                "id": "3", "type": "people",
                "relationships": {
                    "parents": { "data": parents }
                }
            };
            parse_request_primary_1.default(json).then((resource) => {
                expect(resource.relationships.parents).to.be.instanceof(Relationship_1.default);
                expect(resource.relationships.parents.linkage).to.be.instanceof(Linkage_1.default);
                expect(resource.relationships.parents.linkage.value).to.deep.equal(parents);
                done();
            }, done);
        });
    });
});
