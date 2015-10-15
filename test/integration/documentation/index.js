import {expect} from "chai";
import AgentPromise from "../../app/agent";

describe("Fetching JSON Documentation", () => {
  let res, Agent;

  before(done => {
    AgentPromise.then(A => {
      Agent = A;
      return Agent.request("GET", "/")
        .accept("application/vnd.api+json")
        .promise();
    }, done).then(response => {
      res = response;
      done();
    }).catch(done);
  });

  describe("Content Type", () => {
    it("should be JSON API", () => {
      expect(res.headers["content-type"]).to.equal("application/vnd.api+json");
    });
  });

  describe("Document Structure", () => {
    it("should transform type info", () => {
      // the default transform dasherizes key names, so we just check for that.
      console.log(res.body.data[0].attributes.fields)
      expect("friendly-name" in res.body.data[0].attributes.fields[0]).to.be.true;
    });
  });
});