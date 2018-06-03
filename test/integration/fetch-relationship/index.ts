import { expect } from "chai";
import AgentPromise from "../../app/agent";

describe("Fetching Relationships", () => {
  let Agent;

  before(async () => {
    return AgentPromise.then(A => {
      Agent = A;
    });
  });

  describe("Fetching a relationship with transformed (removed) linkage", () => {
    it("should not have the removed linkage", () => {
      return Agent.request("GET", '/schools/59af14d3bbd18cd55ea08ea3/relationships/principal')
        .accept("application/vnd.api+json")
        .then((res) => {
          expect(res.body.data).to.equal(null);
        });
    });
  });

  describe("Fetching a non-existent relationship", () => {
    it("should be a 404", () => {
      return Agent.request("GET", '/schools/59af14d3bbd18cd55ea08ea3/relationships/x')
        .accept("application/vnd.api+json")
        .then((res) => {
          throw new Error("Should not run");
        }, (e) => {
          expect(e.response.status).to.equal(404);
          expect(e.response.body.errors[0].code).to.equal("https://jsonapi.js.org/errors/unknown-relationship-name");
        });
    });
  });

  describe("Fetching an empty relationship", () => {
    it.skip("should 200 w/ data: null in the to-one case");
    it.skip("should 200 w/ data: [] in the to-many case");
  });
});
