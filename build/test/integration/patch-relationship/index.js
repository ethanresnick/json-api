"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const agent_1 = require("../../app/agent");
const updates_1 = require("../fixtures/updates");
const creation_1 = require("../fixtures/creation");
describe("Patching a relationship", () => {
    let Agent;
    before(() => {
        return agent_1.default.then(A => {
            Agent = A;
        });
    });
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
    it("should support full replacement at a to-many relationship endpoint", () => {
        return Agent.request("POST", "/organizations")
            .type("application/vnd.api+json")
            .send({ "data": creation_1.VALID_ORG_RESOURCE_NO_ID })
            .promise()
            .then((response) => {
            return response.body.data.id;
        }).then(orgId => {
            const url = `/organizations/${orgId}/relationships/liaisons`;
            return setRelationship(updates_1.VALID_ORG_RELATIONSHIP_PATCH, url)
                .then(() => {
                return testRelationshipState(updates_1.VALID_ORG_RELATIONSHIP_PATCH, url);
            })
                .then(() => {
                return setRelationship(updates_1.VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH, url);
            })
                .then(() => {
                return testRelationshipState(updates_1.VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH, url);
            })
                .then(() => {
                return setRelationship(updates_1.VALID_ORG_RELATIONSHIP_PATCH, url);
            })
                .then(() => {
                return testRelationshipState(updates_1.VALID_ORG_RELATIONSHIP_PATCH, url);
            });
        });
    });
    it("should support patching at a to-one relationship endpoint", () => {
        return Agent.request("POST", "/schools")
            .type("application/vnd.api+json")
            .send({ "data": creation_1.VALID_SCHOOL_RESOURCE_NO_ID_EMPTY_PRINCIPAL })
            .promise()
            .then((response) => {
            chai_1.expect(response.body.data.relationships.principal.data).to.equal(null);
            return response.body.data.id;
        }).then(schoolId => {
            const url = `/schools/${schoolId}/relationships/principal`;
            return setRelationship(updates_1.VALID_SCHOOL_PRINCIPAL_PATCH, url)
                .then((r) => {
                return testRelationshipState(updates_1.VALID_SCHOOL_PRINCIPAL_PATCH, url);
            })
                .then(() => {
                return setRelationship(updates_1.VALID_TO_ONE_RELATIONSHIP_EMPTY_PATCH, url);
            })
                .then(() => {
                return testRelationshipState(updates_1.VALID_TO_ONE_RELATIONSHIP_EMPTY_PATCH, url);
            })
                .then(() => {
                return setRelationship(updates_1.VALID_ORG_RELATIONSHIP_PATCH, url).then(() => {
                    throw new Error("Should have failed");
                }, (e) => { });
            });
        });
    });
});
