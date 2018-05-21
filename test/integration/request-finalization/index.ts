// TODO: split up API controller so that we can have stuff like this in unit
// tests, rather than in integration tests like this.
import AgentPromise from "../../app/agent";

describe("Request finalization", () => {
  let Agent;
  before(() => {
    return AgentPromise.then(A => {
      Agent = A;
    });
  });

  it("should support request-specific custom operators", () => {
    return Promise.all([
      // This is valid, so expect 200
      Agent.request("GET", "/request-specific-operators-test")
        .query("sort=(field,customOp,true)")
        .catch(e => { console.log(e); throw e }),

      // This is valid (we're just combining custom ops with normal ops)
      Agent.request("GET", "/request-specific-operators-test")
        .query("sort=(field,customOp,true)&filter=(salary,gte,42)")
        .catch(e => { console.log(e); throw e }),

      // This is invalid, because we said customOp is binary
      Agent.request("GET", "/request-specific-operators-test")
        .query("sort=(customOp,field,true)")
        .ok(it => it.status === 400)
        .catch(e => { console.log(e); throw e }),

      // This is invalid, because we said customOp is only usable in sorts
      Agent.request("GET", "/request-specific-operators-test")
        .query("filter=(customOp,field,true)")
        .ok(it => it.status === 400)
        .catch(e => { console.log(e); throw e })
    ]);
  });
});
