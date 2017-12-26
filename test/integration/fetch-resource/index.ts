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
    it("should return a 404", () => {
      return Agent.request("GET", '/organizations/4')
        .accept("application/vnd.api+json")
        .then(() => {
          throw new Error("Shouldn't run")
        }, (err) => {
          expect(err.status).to.equal(404);
        });
    });
  });

  describe("Fetching single resource with include", () => {
    it("should work", () => {
      return Agent.request("GET", '/organizations/54419d550a5069a2129ef254?include=liaisons')
        .accept("application/vnd.api+json")
        .then((res) => {
          expect(res.body.data.id).to.equal('54419d550a5069a2129ef254');
          expect(res.body.included).to.be.an('array');
          expect(res.body.included.map(it => it.id).sort()).to.deep.equal([
            "53f54dd98d1e62ff12539db2",
            "53f54dd98d1e62ff12539db3"
          ])
        }).catch(e => { console.log(e); throw e; });
    });
  });
});
