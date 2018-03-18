import { expect } from "chai";
import AgentPromise from "../../app/agent";

describe("Error handling", () => {
  let Agent;

  before(() => {
    return AgentPromise.then(A => { Agent = A; });
  });

  describe("Fetching an erroring resource", () => {
    it("should not expose internal error details by default", () => {
      return Agent.request("GET", "/with-error")
        .accept("application/vnd.api+json")
        .then(() => {
          throw new Error("Shouldn't run")
        }, (err) => {
          expect(err.response.body.errors[0].title).to.match(/unknown error/);
        });
    });

    it("should expose internal error details if an APIError's thrown", () => {
      return Agent.request("GET", "/with-error?customError=true")
        .accept("application/vnd.api+json")
        .then(() => {
          throw new Error("Shouldn't run")
        }, (err) => {
          expect(err.response.body.errors[0].title).to.equal("Custom");
        });
    });
  });
});
