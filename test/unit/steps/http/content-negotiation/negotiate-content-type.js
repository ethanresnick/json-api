import {expect} from "chai";
import Q from "q";
import negotiate from "../../../../../src/steps/http/content-negotiation/negotiate-content-type";

describe("negotiateContentType", () => {
  it("should return a promise", () => {
    expect(Q.isPromise(negotiate())).to.be.true;
  });

  it("should 406 if all json api parameter instances are parameterized, even if there's a valid alternative", (done) => {
    let accept = 'application/vnd.api+json; ext="ext2", application/json';
    negotiate(accept, ["application/vnd.api+json"]).then(done, (err) => {
      expect(err.status).to.equal("406");
      done();
    }).done();
  });

  it("should allow parameterized json api media ranges as long as not all are parameterized", (done) => {
    let accept = 'application/vnd.api+json; ext="ext2",application/vnd.api+json';
    negotiate(accept, ["application/vnd.api+json", "text/html"]).then((contentType) => {
      if(contentType === "application/vnd.api+json") {
        done();
      }
      else {
        done(new Error("Should have negotiated JSON API base type"));
      }
    }, done).done();
  });

  it("should resolve with a non-json-api type when its the highest priority + supported by the endpoint", (done) => {
    let accept = "text/html,application/vnd.api+json;q=0.5,application/json";
    negotiate(accept, ["application/vnd.api+json", "text/html"]).then((contentType) => {
      if(contentType === "text/html") {
        done();
      }
      else {
        done(new Error("Expected HTML"));
      }
    }, done).done();
  });

  it("should resolve with json-api type if that's the highest priority, even if the endpoint supports an alternative", (done) => {
    let accept = "application/vnd.api+json,application/json,text/*";
    negotiate(accept, ["application/vnd.api+json", "text/html"]).then((contentType) => {
      if(contentType === "application/vnd.api+json") {
        done();
      }
      else {
        done(new Error("Expected Json API content type."));
      }
    }, done).done();
  });

  it("should use json if client accepts only json", (done) => {
    let accept = "text/html,application/xhtml+xml,application/json;q=0.9,**;q=0.8";
    negotiate(accept, ["application/vnd.api+json"]).then((contentType) => {
      if(contentType === "application/json") {
        done();
      }
      else {
        done(new Error("Expected JSON Content Type"));
      }
    }, done);
  });
});
