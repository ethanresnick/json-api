import {expect} from "chai";
import AgentPromise from "../../app/agent";

describe("HTTP Compliance", () => {

  let Agent;
  before((done) => {
    AgentPromise.then(A => {
      Agent = A;
      done();
    }, done);
  });

  it("should reject PUT with a PUT-specific message", (done) => {
    Agent.request("PUT", "/organizations").send({}).promise().then(
      (res) => {
        done(new Error("Shouldn't run since response should be an error"));
      },
      (err) => {
        expect(err.response.status).to.equal(405);
        expect(err.response.body.errors[0].detail).to.match(/PUT.+jsonapi\.org/i);
      }
    ).then(done, done);
  });

  it("should reject other unknown methods too", (done) => {
    Agent.request("LOCK", "/organizations").send({}).promise().then(
      (res) => {
        done(new Error("Shouldn't run since response should be an error"));
      },
      (err) => {
        expect(err.response.status).to.equal(405);
        expect(err.response.body.errors[0].detail).to.match(/lock/i);
      }
    ).then(done, done);
  });

});
