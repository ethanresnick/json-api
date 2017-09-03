"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const agent_1 = require("../../app/agent");
const creation_1 = require("../fixtures/creation");
describe("Creating Resources", () => {
    let Agent;
    describe("Creating a Valid Resource (With an Extra Member)", () => {
        let createdResource, res;
        before(done => {
            agent_1.default.then((A) => {
                Agent = A;
                return Agent.request("POST", "/organizations")
                    .type("application/vnd.api+json")
                    .send({ "data": creation_1.VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER, "extra": false })
                    .promise()
                    .then((response) => {
                    res = response;
                    createdResource = res.body.data;
                    done();
                });
            }).catch(done);
        });
        describe("HTTP", () => {
            it("should return 201", () => {
                chai_1.expect(res.status).to.equal(201);
            });
            it("should include a valid Location header", () => {
                chai_1.expect(res.headers.location).to.match(/\/organizations\/[a-z0-9]+/);
                chai_1.expect(createdResource.links.self).to.equal(res.headers.location);
            });
        });
        describe("Document Structure", () => {
            it("should have an object/document at the top level", () => {
                chai_1.expect(res.body).to.be.an("object");
            });
            it("should ignore extra document object members", () => {
                chai_1.expect(res.status).to.be.within(200, 299);
                chai_1.expect(res.body.extra).to.be.undefined;
            });
        });
        describe("Links", () => {
        });
        describe("Transforms", () => {
            describe("beforeSave", () => {
                it("should execute beforeSave hook", () => {
                    chai_1.expect(createdResource.attributes.description).to.equal("Added a description in beforeSave");
                    chai_1.expect(createdResource.attributes.modified).to.equal("2015-01-01T00:00:00.000Z");
                });
                it("should allow beforeSave to return a Promise and support super()", (done) => {
                    Agent.request("POST", "/schools")
                        .type("application/vnd.api+json")
                        .send({ "data": creation_1.VALID_SCHOOL_RESOURCE_NO_ID })
                        .promise()
                        .then((response) => {
                        chai_1.expect(response.body.data.attributes.description).to.equal("Added a description in beforeSave");
                        chai_1.expect(response.body.data.attributes.modified).to.equal("2015-10-27T05:16:57.257Z");
                        done();
                    }, done).catch(done);
                });
            });
        });
        describe("Setters and virtuals", () => {
            it("should run setters on create", () => {
                chai_1.expect(createdResource.attributes.name).to.equal(creation_1.VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER.attributes.name.toUpperCase());
                chai_1.expect(createdResource.attributes.echo).to.equal(creation_1.VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER.attributes.echo);
            });
            it("should show virtuals in the response", () => {
                chai_1.expect(createdResource.attributes.virtualName).to.equal(creation_1.VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER.attributes.name.toUpperCase() + ' (virtualized)');
                chai_1.expect(createdResource.attributes.reversed).to.equal(creation_1.VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER.attributes.echo.split("").reverse().join(""));
            });
        });
        describe("The Created Resource", () => {
            it("should be returned in the body", () => {
                chai_1.expect(createdResource).to.be.an("object");
                chai_1.expect(createdResource.type).to.equal("organizations");
                chai_1.expect(createdResource.attributes).to.be.an("object");
                chai_1.expect(createdResource.relationships).to.be.an("object");
                chai_1.expect(createdResource.relationships.liaisons).to.be.an("object");
            });
            it("should ignore extra resource object members", () => {
                chai_1.expect(res.body.data.extraMember).to.be.undefined;
                chai_1.expect(res.body.data.attributes.extraMember).to.be.undefined;
            });
        });
    });
    describe("Creating a Resource With A Client-Id", () => {
        let err;
        before(done => {
            Agent.request("POST", "/organizations")
                .type("application/vnd.api+json")
                .send({ "data": creation_1.ORG_RESOURCE_CLIENT_ID })
                .promise()
                .then(() => { done("Should not run!"); }, (error) => {
                err = error;
                done();
            });
        });
        describe("HTTP", () => {
            it("should return 403", () => {
                chai_1.expect(err.response.status).to.equal(403);
            });
        });
        describe("Document Structure", () => {
            it("should contain an error", () => {
                chai_1.expect(err.response.body.errors).to.be.an("array");
            });
        });
    });
    describe("Creating a Resource With a Missing Relationship Data Key", () => {
        let err;
        before((done) => {
            Agent.request("POST", "/organizations")
                .type("application/vnd.api+json")
                .send({ "data": creation_1.INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP })
                .promise()
                .then(() => { done("Should not run!"); }, (error) => {
                err = error;
                done();
            });
        });
        describe("HTTP", () => {
            it("should return 400", () => {
                chai_1.expect(err.response.status).to.equal(400);
            });
        });
        describe("Document Structure", () => {
            it("should contain an error", () => {
                chai_1.expect(err.response.body.errors).to.be.an("array");
            });
        });
        describe("The error", () => {
            it("should have the correct title", () => {
                chai_1.expect(err.response.body.errors[0].title).to.be.equal("Missing relationship linkage.");
            });
            it("should have the correct details", () => {
                chai_1.expect(err.response.body.errors[0].details).to.be.equal("No data was found for the liaisons relationship.");
            });
        });
    });
});
