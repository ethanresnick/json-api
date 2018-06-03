import chai = require("chai");
import AgentPromise from "../../app/agent";
import { VALID_ORG_RESOURCE_NO_ID } from "../fixtures/creation";

const { expect } = chai;
describe("Content Negotiation", () => {
  let Agent;
  before(async () => {
    return AgentPromise.then(A => { Agent = A; });
  });

  // "Servers MUST respond with a 415 Unsupported Media Type status code if a
  //  request specifies the header Content-Type: application/vnd.api+json with
  //  any media type parameters."
  it("must reject parameterized content-type", (done) => {
    // tslint:disable-next-line no-duplicate-string
    Agent.request("POST", "/organizations")
      .type("application/vnd.api+json;ext=blah")
      .send({ data: VALID_ORG_RESOURCE_NO_ID })
      .promise()
      .then(() => {
        done(new Error("Should not run!"));
      }, (err) => {
        expect(err.status).to.equal(415);
        expect(err.response.body.errors).to.be.an("array");
        expect(err.response.body.errors[0].code).to.equal("https://jsonapi.js.org/errors/invalid-media-type-parameter");
        done();
      }).catch(done);
  });

  // Spec ignored due to issues with Firefox automatically adding charset parameter
  // See: https://github.com/ethanresnick/json-api/issues/78
  it("must accept charset parameter", (done) => {
    Agent.request("POST", "/organizations")
      .type("application/vnd.api+json;charset=utf-8")
      .send({ data: VALID_ORG_RESOURCE_NO_ID })
      .promise()
      .then((res) => {
        expect(res.status).to.equal(201);
        done();
      }, done).catch(done);
  });

  // "Servers MUST send all JSON API data in response documents with the
  //  header Content-Type: application/vnd.api+json without any media type
  //  parameters."
  it("must prefer sending JSON API media type, if its acceptable", (done) => {
    Agent.request("POST", "/organizations", { withContentType: true })
      .accept("application/vnd.api+json, application/json")
      .send({ data: VALID_ORG_RESOURCE_NO_ID })
      .promise()
      .then((res) => {
        expect(res.status).to.equal(201);
        // tslint:disable-next-line no-duplicate-string
        expect(res.headers["content-type"]).to.equal("application/vnd.api+json");
        done();
      }, done).catch(done);
  });

  it("should use the json-api media type for errors if no json accepted, even if not acceptable", (done) => {
    Agent.request("GET", "/organizations/unknown-id")
      .accept("text/html")
      .promise()
      .then(() => {
        done(new Error("Should not run, since this request should be a 404"));
      }, (err) => {
        expect(err.response.headers["content-type"]).to.equal("application/vnd.api+json");
        done();
      }).catch(done);
  });

  it("must accept unparameterized json api content-type", (done) => {
    Agent.request("POST", "/organizations", { withContentType: true })
      .send({ "data": VALID_ORG_RESOURCE_NO_ID })
      .promise()
      .then((res) => {
        expect(res.status).to.be.within(200, 204);
        expect(res.body.data).to.not.eq(undefined, "Resp should have primary data in body.");
        done();
      }, done).catch(done);
  });

  it("should by default 406 if the client can't accept json", (done) => {
    Agent.request("GET", "/organizations")
      .accept("text/html")
      .promise()
      .then(res => {
        done(new Error("Should not run, since this request should be a 404"));
      }, (res) => {
        expect(res.status).to.equal(406);
        done();
      }).catch(done);
  });

  it("should delegate 406s to express if strategy so configured", (done) => {
    Agent.request("GET", "/organizations/no-id/406-delegation-test")
      .accept("text/html")
      .promise()
      .then(res => {
        expect(res.text).to.equal("Hello from express");
        done();
      }, done).catch(done);
  });

  it("should not set a content-type header on 204 responses", (done) => {
    return Agent.request("POST", "/organizations", { withContentType: true })
      .send({"data": VALID_ORG_RESOURCE_NO_ID })
      .then((response) => {
        const orgId = response.body.data.id;
        return Agent.request("DELETE", `/organizations/${orgId}`).promise();
      })
      .then((res) => {
        expect(res.status).to.equal(204);
        expect(res.headers).to.not.include.keys("content-type");
        done();
      })
      .catch(done);
  });
});
