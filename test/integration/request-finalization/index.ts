// TODO: split up API controller so that we can have stuff like this in unit
// tests, rather than in integration tests like this.
import AgentPromise from "../../app/agent";

describe("Request finalization", () => {
  // Log an error and throw it.
  // Useful for debugging failing async tests while keeping them failing.
  const logAndRethrow = (e) => {
    console.log(e);
    throw e;
  }

  let Agent;
  before(async () => {
    return AgentPromise.then(A => {
      Agent = A;
    });
  });

  it("should support request-specific custom operators", () => {
    return Promise.all([
      // This is valid, so expect 200
      Agent.request("GET", "/request-specific-operators-test")
        .query("sort=(field,customOp,true)"),

      // This is valid (we're just combining custom ops with normal ops)
      Agent.request("GET", "/request-specific-operators-test")
        .query("sort=(field,customOp,true)&filter=(salary,gte,42)"),

      // This is invalid, because we said customOp is binary
      Agent.request("GET", "/request-specific-operators-test")
        .query("sort=(customOp,field,true)")
        .ok(it => it.status === 400),

      // This is invalid, because we said customOp is only usable in sorts
      Agent.request("GET", "/request-specific-operators-test")
        .query("filter=(customOp,field,true)")
        .ok(it => it.status === 400)
    ]).catch(logAndRethrow);
  });
});
