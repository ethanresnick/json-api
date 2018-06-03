import { expect } from "chai";
import AgentPromise from "../../app/agent";

describe("Documentation", () => {
  let Agent;
  before(async () => {
    return AgentPromise.then(A => { Agent = A; });
  });

  describe("Fetching JSON Documentation", () => {
    let res;
    before(async () => {
      return Agent
        .request("GET", "/")
        .accept("application/vnd.api+json")
        .then(response => { res = response; });
    });

    describe("Content Type", () => {
      it("should be JSON API", () => {
        expect(res.headers["content-type"]).to.equal("application/vnd.api+json");
      });
    });

    describe("Document Structure", () => {
      it("should transform type info", () => {
        // the default transform dasherizes key names, so we just check for that.
        expect("friendly-name" in res.body.data[0].attributes.fields[0]).to.be.true;
      });
    });
  });

  describe("Fetching HTML Documentation", () => {
    let res;
    // tslint:disable-next-line no-identical-functions
    before(async () => {
      return Agent
        .request("GET", "/")
        .accept("text/*")
        .then(response => { res = response; });
    });

    // tslint:disable-next-line no-identical-functions
    describe("Content Type", () => {
      it("should be HTML", () => {
        expect(res.headers["content-type"]).to.equal("text/html; charset=utf-8");
      });
    });
  });
});
