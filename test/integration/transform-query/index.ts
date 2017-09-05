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
});
