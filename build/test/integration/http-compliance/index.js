"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const agent_1 = require("../../app/agent");
describe("HTTP Compliance", () => {
    let Agent;
    before((done) => {
        agent_1.default.then(A => {
            Agent = A;
            done();
        }, done);
    });
    it("should reject PUT with a PUT-specific message", (done) => {
        Agent.request("PUT", "/organizations").send({}).promise().then((res) => {
            done(new Error("Shouldn't run since response should be an error"));
        }, (err) => {
            chai_1.expect(err.response.status).to.equal(405);
            chai_1.expect(err.response.body.errors[0].detail).to.match(/PUT.+jsonapi\.org/i);
        }).then(done, done);
    });
    it("should reject other unknown methods too", (done) => {
        Agent.request("LOCK", "/organizations").send({}).promise().then((res) => {
            done(new Error("Shouldn't run since response should be an error"));
        }, (err) => {
            chai_1.expect(err.response.status).to.equal(405);
            chai_1.expect(err.response.body.errors[0].detail).to.match(/lock/i);
        }).then(done, done);
    });
});
