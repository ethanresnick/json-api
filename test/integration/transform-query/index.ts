import {expect} from "chai";
import AgentPromise from "../../app/agent";

describe("Transforming the Query", () => {
  let res, Agent;

  before(done => {
    AgentPromise.then(A => {
      Agent = A;
      return Agent.request("GET", `/people/non-binary`)
        .accept("application/vnd.api+json")
        .promise();
    }, done).then(response => {
      res = response;
      done();
    }).catch(done);
  });

  it("should run the query transform to support the endpoint", () => {
    expect(res.body.data).to.be.an('array');
    expect(res.body.data.map(it => it.id)).to.deep.equal(["59af14d3bbd18cd55ea08ea1"]);
  });

  it("should run the resultingIn transform to create a custom error", (done) => {
    Agent.request("GET", '/request-that-errors/people/42')
      .accept("application/vnd.api+json")
      .promise()
      .then((res) => {
        done(new Error("Should not reach here, as we're expecting a 4xx still."));
      }, (error) => {
        expect(error.response.status).to.equal(499);
        expect(error.response.body.errors).to.deep.equal([{
          "status": "499",
          "title": "custom error as string"
        }]);
        done();
      }).catch(done);
  });

  it("should run the resultingIn transform to customize success data", (done) => {
    Agent.request("GET", '/people/with-names')
      .accept("application/vnd.api+json")
      .promise()
      .then((res) => {
        const names = ["John Smith", "Jane Doe", "Jordi Jones", "Doug Wilson"];
        const returnedNames = new Set(res.body.meta.names);
        expect(names.every(name => returnedNames.has(name))).to.be.true;
        done();
      }, done).catch(done);
  });
});
