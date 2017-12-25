import {expect} from "chai";
import AgentPromise from "../../app/agent";

describe("Fetching Resources", () => {
  let Agent;

  before(() => {
    return AgentPromise.then(A => {
      Agent = A;
    });
  });

  describe("Fetching missing resources", () => {
    it("should return a 404", (done) => {
      Agent.request("GET", '/organizations/4')
        .accept("application/vnd.api+json")
        .then(() => {
          done(new Error("Shouldn't run"))
        }, (err) => {
          expect(err.status).to.equal(404);
          done();
        }).catch(done);
    });
  });

});
