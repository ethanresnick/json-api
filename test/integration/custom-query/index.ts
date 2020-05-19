import { expect } from "chai";
import AgentPromise from "../../app/agent";

describe("Customizing the Query", () => {
  let Agent;

  before(() => {
    return AgentPromise.then(A => { Agent = A; });
  });

  it("should run the query transform to support the endpoint", () => {
    return Agent.request("GET", `/people/non-binary`)
      .accept("application/vnd.api+json")
      .then(res => {
        expect(res.body.data).to.be.an('array');
        expect(res.body.data.map(it => it.id)).to.deep.equal(["59af14d3bbd18cd55ea08ea1"]);
      });
  });

  it("should rceive an empty response from an async query transform without error", () => {
    return Agent.request("GET", "/request-with-async-transform/people/42")
      .accept("application/vnd.api+json")
      .then((res) => {
        expect(res).to.be.ok
      });
  });

  it("should run the resultingIn transform to create a custom error", () => {
    return Agent.request("GET", "/request-that-errors/people/42")
      .accept("application/vnd.api+json")
      .then((res) => {
        throw new Error("Should not reach here, as we're expecting a 4xx still.");
      }, (error) => {
        expect(error.response.status).to.equal(499);
        expect(error.response.body.errors).to.deep.equal([{
          "status": "499",
          "title": "custom error as string"
        }]);
      });
  });

  it("should run the resultingIn transform to customize success data", () => {
    return Agent.request("GET", "/people/with-names")
      .accept("application/vnd.api+json")
      .then((res) => {
        const names = ["John Smith", "Jane Doe", "Jordi Jones", "Doug Wilson"];
        const returnedNames = new Set<any>(res.body.meta.names);
        expect(names.every(name => returnedNames.has(name))).to.be.true;
      });
  });

  it("should take and run a totally custom query as is (no beforeRender on result)", () => {
    return Promise.all([
      Agent.request("POST", "/sign-in")
        .auth("Doug Wilson", "password")
        .accept("application/vnd.api+json")
        .then(res => {
          expect(res.body.data.attributes.name).to.equal("Doug Wilson");
          expect(res.body.data.attributes.signInBeforeRender).to.be.undefined;
        }),
      Agent.request("POST", "/sign-in/with-before-render")
        .auth("Doug Wilson", "password")
        .accept("application/vnd.api+json")
        .then(res => {
          expect(res.body.data.attributes.name).to.equal("Doug Wilson");
          expect(res.body.data.attributes.signInBeforeRender).to.be.true;
        })
    ]);
  });

  it("should gracefully handle query factory errors", () => {
    return Agent.request("POST", "/sign-in")
      .accept("application/vnd.api+json")
      .then(res => {
        throw new Error("shoudl've been a 400 bc of missing auth header");
      }, e => {
        expect(e.status).to.equal(400);
        expect(e.response.body.errors[0].title).to.equal("Missing user info.")
      });
  });

  it("should gracefully handle query.returning errors", () => {
    return Agent.request("POST", "/sign-in")
      .auth("Doug Wilson", "pass")
      .accept("application/vnd.api+json")
      .then(res => {
        throw new Error("should've been a 401")
      }, (e) => {
        expect(e.status).to.equal(401);
      });
  });
});
