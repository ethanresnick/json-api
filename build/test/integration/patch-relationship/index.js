"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const agent_1 = require("../../app/agent");
const updates_1 = require("../fixtures/updates");
const creation_1 = require("../fixtures/creation");
describe("Patching a relationship", () => {
    let Agent, orgId;
    before(done => {
        agent_1.default.then(A => {
            Agent = A;
            return Agent.request("POST", "/organizations")
                .type("application/vnd.api+json")
                .send({ "data": creation_1.VALID_ORG_RESOURCE_NO_ID })
                .promise()
                .then((response) => {
                orgId = response.body.data.id;
            });
        }).then(done, done);
    });
    it("should support full replacement at a to-many relationship endpoint", (done) => {
        const url = `/organizations/${orgId}/relationships/liaisons`;
        const setRelationship = (data, url) => {
            return Agent.request("PATCH", url)
                .accept("application/vnd.api+json")
                .type("application/vnd.api+json")
                .send(data)
                .promise()
                .then((res) => {
                chai_1.expect(res.body.data).to.deep.equal(data.data);
            });
        };
        const testRelationshipState = (expectedVal, url) => {
            return Agent.request("GET", url)
                .accept("application/vnd.api+json")
                .promise()
                .then((res) => {
                chai_1.expect(res.body.data).to.deep.equal(expectedVal.data);
            });
        };
        setRelationship(updates_1.VALID_ORG_RELATIONSHIP_PATCH, url)
            .then(() => {
            return testRelationshipState(updates_1.VALID_ORG_RELATIONSHIP_PATCH, url);
        })
            .then(() => {
            return setRelationship(updates_1.VALID_ORG_RELATIONSHIP_EMPTY_PATCH, url);
        })
            .then(() => {
            return testRelationshipState(updates_1.VALID_ORG_RELATIONSHIP_EMPTY_PATCH, url);
        })
            .then(() => {
            return setRelationship(updates_1.VALID_ORG_RELATIONSHIP_PATCH, url);
        })
            .then(() => {
            return testRelationshipState(updates_1.VALID_ORG_RELATIONSHIP_PATCH, url);
        })
            .then(() => { done(); }, done);
    });
});
