"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const agent_1 = require("../../app/agent");
describe("Error handling", () => {
    let Agent;
    before(() => {
        return agent_1.default.then(A => { Agent = A; });
    });
    describe("Fetching an erroring resource", () => {
        it("should not expose internal error details by default", () => {
            return Agent.request("GET", '/with-error')
                .accept("application/vnd.api+json")
                .then(() => {
                throw new Error("Shouldn't run");
            }, (err) => {
                chai_1.expect(err.response.body.errors[0].title).to.match(/unknown error/);
            });
        });
        it("should expose internal error details if an APIError's thrown", () => {
            return Agent.request("GET", '/with-error?customError=true')
                .accept("application/vnd.api+json")
                .then(() => {
                throw new Error("Shouldn't run");
            }, (err) => {
                chai_1.expect(err.response.body.errors[0].title).to.equal("Custom");
            });
        });
    });
});
