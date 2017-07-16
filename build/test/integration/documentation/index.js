"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const agent_1 = require("../../app/agent");
describe("Fetching JSON Documentation", () => {
    let res, Agent;
    before(done => {
        agent_1.default.then(A => {
            Agent = A;
            return Agent.request("GET", "/")
                .accept("application/vnd.api+json")
                .promise();
        }, done).then(response => {
            res = response;
            done();
        }).catch(done);
    });
    describe("Content Type", () => {
        it("should be JSON API", () => {
            chai_1.expect(res.headers["content-type"]).to.equal("application/vnd.api+json");
        });
    });
    describe("Document Structure", () => {
        it("should transform type info", () => {
            chai_1.expect("friendly-name" in res.body.data[0].attributes.fields[0]).to.be.true;
        });
    });
});
describe("Fetching HTML Documentation", () => {
    let res, Agent;
    before(done => {
        agent_1.default.then(A => {
            Agent = A;
            return Agent.request("GET", "/")
                .accept("text/*")
                .promise();
        }, (e) => {
            console.log(e);
            done(e);
        }).then(response => {
            res = response;
            done();
        }).catch((e) => {
            console.log(e);
            done(e);
        });
    });
    describe("Content Type", () => {
        it("should be HTML", () => {
            chai_1.expect(res.headers["content-type"]).to.equal("text/html; charset=utf-8");
        });
    });
});
