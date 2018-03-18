import { expect } from "chai";
import AgentPromise from "../../app/agent";

describe("Fetching Resources", () => {
  let Agent;

  before(() => {
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
});
