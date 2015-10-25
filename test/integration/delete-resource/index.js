import {expect} from "chai";
import AgentPromise from "../../app/agent";

describe("Delete Resource", () => {
  let Agent;

  before((done) => {
    AgentPromise.then((A) => {
      Agent = A;
      done();
    }).catch(done);
  });

  describe("Valid deletion", () => {
    it("should return 204", (done) => {
      Agent.request("DEL", "/organizations/54419d550a5069a2129ef255")
        .promise()
        .then((res) => {
          expect(res.status).to.equal(204);
          done();
        }).catch(done);
    });

    it("should have deleted the resource", (done) => {
      Agent.request("GET", "/organizations/54419d550a5069a2129ef255")
        .promise()
        .then(done, (err) => {
          expect(err.status).to.equal(404);
          done();
        }).catch(done);
    })
  });

  describe("Invalid deletion", () => {
    it("should return 403", (done) => {
      Agent.request("DEL", "/schools/53f54dd98d1e62ff12539db4")
        .promise()
        .then(done, (err) => {
          expect(err.status).to.equal(403);
          done();
        }).catch(done);
    });
  });
});
