import {expect} from "chai";
import AgentPromise from "../../app/agent";
import { VALID_ORG_RELATIONSHIP_PATCH, VALID_ORG_RELATIONSHIP_EMPTY_PATCH } from "../fixtures/updates";

describe("Patching a relationship", () => {
  let Agent, orgId;
  before(done => {
    AgentPromise.then(A => {
      Agent = A;
      return Agent.request("GET", "/organizations")
        .promise()
        .then(response => {
          orgId = response.body.data[0].id;
        })
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
          expect(res.body.data).to.deep.equal(data.data);
        });
    }

    const testRelationshipState = (expectedVal, url) => {
      return Agent.request("GET", url)
        .accept("application/vnd.api+json")
        .promise()
        .then((res) => {
          expect(res.body.data).to.deep.equal(expectedVal.data);
        });
    }

    setRelationship(VALID_ORG_RELATIONSHIP_PATCH, url)
    .then(() => {
      return testRelationshipState(VALID_ORG_RELATIONSHIP_PATCH, url)
    })
    .then(() => {
      return setRelationship(VALID_ORG_RELATIONSHIP_EMPTY_PATCH, url)
    })
    .then(() => {
      return testRelationshipState(VALID_ORG_RELATIONSHIP_EMPTY_PATCH, url)
    })
    .then(() => {
      return setRelationship(VALID_ORG_RELATIONSHIP_PATCH, url)
    })
    .then(() => {
      return testRelationshipState(VALID_ORG_RELATIONSHIP_PATCH, url)
    })
    .then(() => { done() }, done);
  });
});
