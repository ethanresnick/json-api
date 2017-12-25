"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const agent_1 = require("../../app/agent");
const updates_1 = require("../fixtures/updates");
describe("Updating Resources", () => {
    let Agent;
    let res;
    describe("Updating a resource's attributes", () => {
        before(done => {
            agent_1.default.then((A) => {
                Agent = A;
                return Agent.request("PATCH", `/organizations/${updates_1.VALID_ORG_VIRTUAL_PATCH.id}`)
                    .type("application/vnd.api+json")
                    .send({ "data": updates_1.VALID_ORG_VIRTUAL_PATCH })
                    .promise()
                    .then((response) => {
                    res = response.body.data;
                    done();
                });
            }).catch(done);
        });
        it("should not reset fields missing in the update to their defaults", () => {
            chai_1.expect(res.attributes.modified).to.be.equal(new Date("2015-01-01").toISOString());
        });
        it("should invoke setters on virtual, updated attributes", () => {
            chai_1.expect(res.attributes.echo).to.be.equal(updates_1.VALID_ORG_VIRTUAL_PATCH.attributes.echo);
            chai_1.expect(res.attributes.reversed).to.be.equal(updates_1.VALID_ORG_VIRTUAL_PATCH.attributes.echo.split("").reverse().join(""));
        });
        it("should invoke setters on non-virtual updated attributes", () => {
            chai_1.expect(res.attributes.name).to.equal("CHANGED NAME");
        });
        it("should not change attributes not (directly or indirectly) part of the update", () => {
            chai_1.expect(res.relationships.liaisons.data).to.deep.equal([{
                    type: "people",
                    id: "53f54dd98d1e62ff12539db3"
                }]);
        });
    });
    describe("Updating a non-existent resource", () => {
        it("should 404", () => {
            const missingOId = "507f191e810c19729de860ea";
            return agent_1.default.then((Agent) => {
                return Agent.request("PATCH", `/organizations/${missingOId}`)
                    .type("application/vnd.api+json")
                    .send({ "data": Object.assign({}, updates_1.VALID_ORG_VIRTUAL_PATCH, { id: missingOId }) })
                    .promise()
                    .then((response) => {
                    throw new Error("Should 404");
                }, (err) => {
                    chai_1.expect(err.status).to.equal(404);
                    return true;
                });
            });
        });
    });
});
