import { expect } from "chai";
import AgentPromise from "../../app/agent";

describe("HTTP Compliance", () => {
  let Agent;
  before(async () => {
    return AgentPromise.then(A => { Agent = A; });
  });

  it("should reject PUT with a PUT-specific message", () => {
    return Agent.request("PUT", "/organizations").then((res) => {
      throw new Error("Shouldn't run since response should be an error");
    }, (err) => {
      expect(err.response.status).to.equal(405);
      expect(err.response.body.errors[0].detail).to.match(/PUT.+jsonapi\.org/i);
    });
  });

  it("should reject other unknown methods too", () => {
    return Agent.request("LOCK", "/organizations").then(() => {
      throw new Error("Shouldn't run since response should be an error");
    }, (err) => {
      expect(err.response.status).to.equal(405);
      expect(err.response.body.errors[0].detail).to.match(/lock/i);
    });
  });

  it("should reject requests with a body but no content-type", () => {
    return Agent
      .request("DELETE", "/organizations/59af14d3bbd18cd55ea08ea3/relationships/liaisons")
      .send({ data: [] })
      .then((it) => {
        throw new Error("Should not run");
      }, (err) => {
        expect(err.status).to.equal(415);
      });
  });
});
