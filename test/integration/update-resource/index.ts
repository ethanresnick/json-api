import { expect } from "chai";
import AgentPromise from "../../app/agent";
import { VALID_ORG_VIRTUAL_PATCH, INVALID_ORG_PATCH_NO_ID } from "../fixtures/updates";

describe("Updating Resources", () => {
  let Agent;
  before(() => {
    return AgentPromise.then((A) => { Agent = A; })
  });

  describe("Updating a resource's attributes", () => {
    let res;
    before(() => {
      return Agent.request("PATCH", `/organizations/${VALID_ORG_VIRTUAL_PATCH.id}`)
        .type("application/vnd.api+json")
        .send({"data": VALID_ORG_VIRTUAL_PATCH })
        .then((response) => {
          res = response.body.data;
        });
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

  describe("Updating a non-existent resource", () => {
    it("should 404", () => {
      const missingOId = "507f191e810c19729de860ea";
      return Agent.request("PATCH", `/organizations/${missingOId}`)
        .type("application/vnd.api+json")
        .send({"data": { ...VALID_ORG_VIRTUAL_PATCH, id: missingOId } })
        .promise()
        .then((response) => {
          throw new Error("Should 404");
        }, (err) => {
          expect(err.status).to.equal(404);
          return true;
        });
    });
  });

  describe("Updating a resource without providing an id in json", () => {
    it("should 400", () => {
      return Agent.request("PATCH", `/organizations/59ac9c0ecc4c356fcda65202`)
        .type("application/vnd.api+json")
        .send({ "data": INVALID_ORG_PATCH_NO_ID })
        .promise()
        .then((response) => {
          throw new Error("Should 400");
        }, (err) => {
          expect(err.status).to.equal(400);
        });
    });
  });

  describe("Bulk updates", () => {
    it("should 400 if any resources don't have ids", () => {
      return Agent.request("PATCH", `/organizations`)
        .type("application/vnd.api+json")
        .send({ "data": [ VALID_ORG_VIRTUAL_PATCH, INVALID_ORG_PATCH_NO_ID ] })
        .promise()
        .then((response) => {
          throw new Error("Should 400");
        }, (err) => {
          expect(err.status).to.equal(400);
        });
    });
  })
  /*
  describe("Changing a resource's type", () => {
    it.skip("should suceed if changing to a subtype");
    it.skip("should fail if changing to a super type not supported by the endpoint");
    it.skip("should succeed if changing to a super type supported by the endpoint");
  });*/
});
