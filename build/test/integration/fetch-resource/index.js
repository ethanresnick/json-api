"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const agent_1 = require("../../app/agent");
describe("Fetching Resources", () => {
    let Agent;
    before(done => {
        return agent_1.default.then(A => {
            Agent = A;
        });
    });
    describe("Fetching missing resources", () => {
        it("should return a 404", (done) => {
            Agent.request("GET", '/organizations/4')
                .accept("application/vnd.api+json")
                .then((res) => {
                chai_1.expect(res.status).to.equal(404);
            }, done).catch(done);
        });
    });
});
