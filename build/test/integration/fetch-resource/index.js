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
        it("should return a 404", () => {
            return Agent.request("GET", '/organizations/4')
                .accept("application/vnd.api+json")
                .then(() => {
                throw new Error("Shouldn't run");
            }, (err) => {
                chai_1.expect(err.status).to.equal(404);
            });
        });
    });
    describe("Fetching single resource with include", () => {
        it("should work", () => {
            return Agent.request("GET", '/organizations/54419d550a5069a2129ef254?include=liaisons')
                .accept("application/vnd.api+json")
                .then((res) => {
                chai_1.expect(res.body.data.id).to.equal('54419d550a5069a2129ef254');
                chai_1.expect(res.body.included).to.be.an('array');
                chai_1.expect(res.body.included.map(it => it.id).sort()).to.deep.equal([
                    "53f54dd98d1e62ff12539db2",
                    "53f54dd98d1e62ff12539db3"
                ]);
            });
        });
    });
    describe("Fetching a single resource removed by beforeRender", () => {
        it("should return `data: null`", () => {
            return Agent.request("GET", '/people/59af14d3bbd18cd55ea08ea2')
                .accept("application/vnd.api+json")
                .then((res) => {
                chai_1.expect(res.body.data).to.equal(null);
            });
        });
    });
    describe("Fetching a single resource with transformed (removed) linkage", () => {
        it("should not have the removed linkage", () => {
            return Agent.request("GET", '/schools/59af14d3bbd18cd55ea08ea3')
                .accept("application/vnd.api+json")
                .then((res) => {
                chai_1.expect(res.body.data.relationships.principal.data).to.equal(null);
            });
        });
    });
});
