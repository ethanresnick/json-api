"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const agent_1 = require("../../app/agent");
const creation_1 = require("../fixtures/creation");
const updates_1 = require("../fixtures/updates");
const { expect } = chai;
agent_1.default.then((Agent) => {
    describe("Content Negotiation", () => {
        it("must reject parameterized content-type", (done) => {
            Agent.request("POST", "/organizations")
                .type("application/vnd.api+json;ext=blah")
                .send({ "data": creation_1.VALID_ORG_RESOURCE_NO_ID })
                .promise()
                .then(() => {
                done(new Error("Should not run!"));
            }, (err) => {
                expect(err.status).to.equal(415);
                expect(err.response.body.errors).to.be.an("array");
                expect(err.response.body.errors[0].title).to.equal("Invalid Media Type Parameter(s)");
                done();
            }).catch(done);
        });
        it("must accept charset parameter", (done) => {
            Agent.request("POST", "/organizations")
                .type("application/vnd.api+json;charset=utf-8")
                .send({ "data": creation_1.VALID_ORG_RESOURCE_NO_ID })
                .promise()
                .then((res) => {
                expect(res.status).to.equal(201);
                done();
            }, done).catch(done);
        });
        it("must prefer sending JSON API media type, if its acceptable", (done) => {
            Agent.request("POST", "/organizations")
                .accept("application/vnd.api+json, application/json")
                .send({ "data": creation_1.VALID_ORG_RESOURCE_NO_ID })
                .type("application/vnd.api+json")
                .promise()
                .then((res) => {
                expect(res.status).to.equal(201);
                expect(res.headers["content-type"]).to.equal("application/vnd.api+json");
                done();
            }, done).catch(done);
        });
        it("should use the json-api media type for errors if no json accepted, even if not acceptable", (done) => {
            Agent.request("GET", "/organizations/unknown-id")
                .accept("text/html")
                .promise()
                .then(() => {
                done(new Error("Should not run, since this request should be a 404"));
            }, (err) => {
                expect(err.response.headers["content-type"]).to.equal("application/vnd.api+json");
                done();
            }).catch(done);
        });
        it("must accept unparameterized json api content-type", (done) => {
            Agent.request("PATCH", "/organizations/54419d550a5069a2129ef254")
                .type("application/vnd.api+json")
                .send({ "data": updates_1.VALID_ORG_STATE_GOVT_PATCH })
                .promise()
                .then((res) => {
                expect(res.status).to.be.within(200, 204);
                expect(res.body.data).to.not.be.undefined;
                done();
            }, done).catch(done);
        });
        it("should by default 406 if the client can't accept json", (done) => {
            Agent.request("GET", "/organizations")
                .accept('text/html')
                .promise()
                .then(res => {
                done(new Error("Should not run, since this request should be a 404"));
            }, (res) => {
                expect(res.status).to.equal(406);
                done();
            }).catch(done);
        });
        it("should delegate 406s to express if strategy so configured", (done) => {
            Agent.request("GET", "/organizations/no-id/406-delegation-test")
                .accept('text/html')
                .promise()
                .then(res => {
                expect(res.text).to.equal("Hello from express");
                done();
            }, done).catch(done);
        });
        it("should not set a content-type header on 204 responses", (done) => {
            return Agent.request("POST", "/organizations")
                .type("application/vnd.api+json")
                .send({ "data": creation_1.VALID_ORG_RESOURCE_NO_ID })
                .then((response) => {
                const orgId = response.body.data.id;
                return Agent.request("DELETE", `/organizations/${orgId}`).promise();
            })
                .then((res) => {
                expect(res.status).to.equal(204);
                expect(res.headers["content-type"]).to.be.undefined;
                done();
            })
                .catch(done);
        });
    });
});
