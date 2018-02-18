import {expect} from "chai";
import AgentPromise from "../../app/agent";
import {
  VALID_ORG_RELATIONSHIP_PATCH,
  VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH,
  VALID_SCHOOL_PRINCIPAL_PATCH,
  VALID_TO_ONE_RELATIONSHIP_EMPTY_PATCH
} from "../fixtures/updates";
import {
  VALID_ORG_RESOURCE_NO_ID,
  VALID_SCHOOL_RESOURCE_NO_ID_EMPTY_PRINCIPAL_NO_LIAISONS
} from "../fixtures/creation";

describe("Replacing a relationship at a relationship endpoint", () => {
  let Agent;
  before(() => {
    return AgentPromise.then(A => {
      Agent = A;
    })
  });

  const setRelationship = (data, url) => { //eslint-disable-line no-shadow
    return Agent.request("PATCH", url)
      .accept("application/vnd.api+json")
      .type("application/vnd.api+json")
      .send(data)
      .promise()
      .then((res) => {
        expect(res.body.data).to.deep.equal(data.data);
      });
  };

  const testRelationshipState = (expectedVal, url) => { //eslint-disable-line no-shadow
    return Agent.request("GET", url)
      .accept("application/vnd.api+json")
      .promise()
      .then((res) => {
        expect(res.body.data).to.deep.equal(expectedVal.data);
      });
  };

  it("should support full replacement at a to-many relationship endpoint", () => {
    return Agent.request("POST", "/organizations")
      .type("application/vnd.api+json")
      .send({"data": VALID_ORG_RESOURCE_NO_ID })
      .promise()
      .then((response) => {
        return response.body.data.id;
      }).then(orgId => {
        const url = `/organizations/${orgId}/relationships/liaisons`;

        return setRelationship(VALID_ORG_RELATIONSHIP_PATCH, url)
          .then(() => {
            return testRelationshipState(VALID_ORG_RELATIONSHIP_PATCH, url);
          })
          .then(() => {
            return setRelationship(VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH, url);
          })
          .then(() => {
            return testRelationshipState(VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH, url);
          })
          .then(() => {
            return setRelationship(VALID_ORG_RELATIONSHIP_PATCH, url);
          })
          .then(() => {
            return testRelationshipState(VALID_ORG_RELATIONSHIP_PATCH, url);
          });
      });
  });

  it("should support patching at a to-one relationship endpoint", () => {
    return Agent.request("POST", "/schools")
      .type("application/vnd.api+json")
      .send({"data": VALID_SCHOOL_RESOURCE_NO_ID_EMPTY_PRINCIPAL_NO_LIAISONS })
      .promise()
      .then((response) => {
        expect(response.body.data.relationships.principal.data).to.equal(null);
        return response.body.data.id;
      }).then(schoolId => {
        const url = `/schools/${schoolId}/relationships/principal`;

        return setRelationship(VALID_SCHOOL_PRINCIPAL_PATCH, url)
          .then((r) => {
            return testRelationshipState(VALID_SCHOOL_PRINCIPAL_PATCH, url);
          })
          .then(() => {
            return setRelationship(VALID_TO_ONE_RELATIONSHIP_EMPTY_PATCH, url);
          })
          .then(() => {
            return testRelationshipState(VALID_TO_ONE_RELATIONSHIP_EMPTY_PATCH, url);
          })
          .then(() => {
            return setRelationship(VALID_ORG_RELATIONSHIP_PATCH, url).then(() => {
              throw new Error("Should have failed");
            }, (e) => { return; });
          });
      });
  });
});
