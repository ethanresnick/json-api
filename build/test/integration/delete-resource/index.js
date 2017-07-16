"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const agent_1 = require("../../app/agent");
const creation_1 = require("../fixtures/creation");
describe("Deleting a resource", () => {
    let Agent, id;
    before(done => {
        agent_1.default.then(A => {
            Agent = A;
            return Agent.request("POST", "/schools")
                .type("application/vnd.api+json")
                .send({ "data": creation_1.VALID_SCHOOL_RESOURCE_NO_ID })
                .promise()
                .then(response => {
                id = response.body.data.id;
                return Agent.request("DEL", `/schools/${id}`)
                    .type("application/vnd.api+json")
                    .send()
                    .promise();
            }).then(() => done());
        }).catch(done);
    });
    it("should delete a resource by id", done => {
        Agent.request("GET", `/schools/${id}`)
            .accept("application/vnd.api+json")
            .promise()
            .then(done, err => {
            chai_1.expect(err.response.statusCode).to.equal(404);
            done();
        }).catch(done);
    });
});
