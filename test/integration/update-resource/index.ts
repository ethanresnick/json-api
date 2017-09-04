import { expect } from "chai";
import AgentPromise from "../../app/agent";
import { VALID_ORG_VIRTUAL_PATCH } from "../fixtures/updates";

describe("Updating Resources", () => {
  let Agent;
  let res;

  describe("Updating a resource's attributes", () => {
    before(done => {
      AgentPromise.then((A) => {
        Agent = A;
        return Agent.request("PATCH", `/organizations/${VALID_ORG_VIRTUAL_PATCH.id}`)
          .type("application/vnd.api+json")
          .send({"data": VALID_ORG_VIRTUAL_PATCH })
          .promise()
          .then((response) => {
            res = response.body.data;
            done();
          });
      }).catch(done);
    });

    it("should not reset fields missing in the update to their defaults", () => {
      expect(res.attributes.modified).to.be.equal(new Date("2015-01-01").toISOString());
    });

    it("should invoke setters on virtual, updated attributes", () => {
      expect(res.attributes.echo).to.be.equal(VALID_ORG_VIRTUAL_PATCH.attributes.echo);
      expect(res.attributes.reversed).to.be.equal(
        VALID_ORG_VIRTUAL_PATCH.attributes.echo.split("").reverse().join("")
      );
    });

    it("should invoke setters on non-virtual updated attributes", () => {
      expect(res.attributes.name).to.equal("CHANGED NAME");
    });

    it("should not change attributes not (directly or indirectly) part of the update", () => {
      expect(res.relationships.liaisons.data).to.deep.equal([{
        type: "people",
        id: "53f54dd98d1e62ff12539db3"
      }]);
    });
  });

  /*
  describe("Changing a resource's type", () => {
    it.skip("should suceed if changing to a subtype");
    it.skip("should fail if changing to a super type not supported by the endpoint");
    it.skip("should succeed if changing to a super type supported by the endpoint");
  });*/
});
