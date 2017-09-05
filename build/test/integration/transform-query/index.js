"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const agent_1 = require("../../app/agent");
describe("Transforming the Query", () => {
    let res, Agent;
    before(done => {
        agent_1.default.then(A => {
            Agent = A;
            return Agent.request("GET", `/people/non-binary`)
                .accept("application/vnd.api+json")
                .promise();
        }, done).then(response => {
            res = response;
            done();
        }).catch(done);
    });
    it("should run the query transform to support the endpoint", () => {
        chai_1.expect(res.body.data).to.be.an('array');
        chai_1.expect(res.body.data.map(it => it.id)).to.deep.equal(["59af14d3bbd18cd55ea08ea1"]);
    });
});
