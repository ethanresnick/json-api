"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const agent_1 = require("../../app/agent");
describe("Fetching Resources", () => {
    let Agent;
    before(() => {
        return agent_1.default.then(A => {
            Agent = A;
        });
    });
    describe("Fetching missing resources", () => {
        it("should return a 404", (done) => {
            Agent.request("GET", '/organizations/4')
                .accept("application/vnd.api+json")
                .then(() => {
                done(new Error("Shouldn't run"));
            }, (err) => {
                chai_1.expect(err.status).to.equal(404);
                done();
            }).catch(done);
        });
    });
});
