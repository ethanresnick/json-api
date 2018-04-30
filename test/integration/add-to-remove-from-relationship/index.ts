import { expect } from "chai";
import AgentPromise from "../../app/agent";
import {
  VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH,
  VALID_ORG_RELATIONSHIP_PATCH
} from "../fixtures/updates";
import {
  VALID_SCHOOL_RESOURCE_NO_ID_EMPTY_PRINCIPAL_NO_LIAISONS
} from "../fixtures/creation";

describe("Partially modifying a relationship at a relationship endpoint", () => {
  let Agent, relationshipEndpointUrl;
  before(() => {
    return AgentPromise.then(A => {
      Agent = A;

      return Agent.request("POST", "/organizations")
        .type("application/vnd.api+json")
        .send({"data": VALID_SCHOOL_RESOURCE_NO_ID_EMPTY_PRINCIPAL_NO_LIAISONS })
        .then((response) => {
          relationshipEndpointUrl =
            `/organizations/${response.body.data.id}/relationships/liaisons`;
        })
    })
  });

  const modifyRelationship = (method, linkage, url) => {
    return Agent.request(method, url)
      .accept("application/vnd.api+json")
      .type("application/vnd.api+json")
      .send(linkage)
      .then((res) => {
        expect(res.status).to.equal(204);
      });
  };

  const testRelationshipState = (expectedVal, url) => { //eslint-disable-line no-shadow
    return Agent.request("GET", url)
      .accept("application/vnd.api+json")
      .then((res) => {
        expect(res.body.data).to.deep.equal(expectedVal.data);
      });
  };

  const duplicateLinkage = {
    ...VALID_ORG_RELATIONSHIP_PATCH,
    data: [
      ...VALID_ORG_RELATIONSHIP_PATCH.data,
      ...VALID_ORG_RELATIONSHIP_PATCH.data
    ]
  };

  describe("Adding to a to-many relationship at a relationship endpoint", () => {
    it("should work", () => {
      return modifyRelationship("POST", VALID_ORG_RELATIONSHIP_PATCH, relationshipEndpointUrl).then(() => {
        return testRelationshipState(VALID_ORG_RELATIONSHIP_PATCH, relationshipEndpointUrl);
      })
    });

    it("should not add a resource that's already in the relationship", () => {
      return modifyRelationship("POST", VALID_ORG_RELATIONSHIP_PATCH, relationshipEndpointUrl).then(() => {
        return testRelationshipState(VALID_ORG_RELATIONSHIP_PATCH, relationshipEndpointUrl);
      });
    });

    it("should ignore duplicates in linkage to add", () => {
      return modifyRelationship("POST", duplicateLinkage, relationshipEndpointUrl).then(() => {
        return testRelationshipState(VALID_ORG_RELATIONSHIP_PATCH, relationshipEndpointUrl);
      });
    });

    it("should do nothing when adding an empty linkage array", () => {
      return modifyRelationship("POST", VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH, relationshipEndpointUrl).then(() => {
        return testRelationshipState(VALID_ORG_RELATIONSHIP_PATCH, relationshipEndpointUrl);
      });
    });
  });

  describe("removing from a to-many relationship at a relationship endpoint", () => {
    it("should work", () => {
      return modifyRelationship("DEL", VALID_ORG_RELATIONSHIP_PATCH, relationshipEndpointUrl).then(() => {
        return testRelationshipState(VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH, relationshipEndpointUrl);
      })
    });

    it("should be a no-op when removing an item that isn't in the relationship", () => {
      return modifyRelationship("DEL", VALID_ORG_RELATIONSHIP_PATCH, relationshipEndpointUrl).then(() => {
        return testRelationshipState(VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH, relationshipEndpointUrl);
      });
    });

    it("should ignore duplicates in linkage to remove", () => {
      return modifyRelationship("POST", VALID_ORG_RELATIONSHIP_PATCH, relationshipEndpointUrl)
        .then(() => modifyRelationship("DEL", duplicateLinkage, relationshipEndpointUrl))
        .then(() => testRelationshipState(VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH, relationshipEndpointUrl));
    });

    it("should do nothing when removing an empty linkage array", () => {
      return modifyRelationship("POST", VALID_ORG_RELATIONSHIP_PATCH, relationshipEndpointUrl)
        .then(() => modifyRelationship("DEL", VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH, relationshipEndpointUrl))
        .then(() => testRelationshipState(VALID_ORG_RELATIONSHIP_PATCH, relationshipEndpointUrl));
    });
  });

  describe("Using POST or DELETE on a to-one relationship", () => {
    // TODO: implementing this requires adapters to provide more information
    // the library about the cardinality of model relationships. Rather than
    // hacking support for that onto the existing adapter interface, I'll implement
    // this when I clean up the general division of labor between the adapter
    // and the resource type descriptions.
    it.skip("should 405");
  });
});
