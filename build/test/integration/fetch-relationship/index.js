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
    describe("Fetching a relationship with transformed (removed) linkage", () => {
        it("should not have the removed linkage", () => {
            return Agent.request("GET", '/schools/59af14d3bbd18cd55ea08ea3/relationships/principal')
                .accept("application/vnd.api+json")
                .then((res) => {
                chai_1.expect(res.body.data).to.equal(null);
            });
        });
    });
});
