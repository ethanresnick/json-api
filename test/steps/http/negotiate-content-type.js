import mocha from "mocha"
import sinon from "sinon"
import chai from "chai"
import Q from "q"
import negotiate from "../../../src/steps/http/negotiate-content-type"

let expect = chai.expect;

describe("negotiateContentType", () => {
  it("should return a promise", () => {
    expect(Q.isPromise(negotiate())).to.be.true;
  });

  it("should use json api with supported-ext when json api is supported and we're using no extensions", (done) => {
    let accept = "application/vnd.api+json";
    negotiate(accept, [], ["ext1", "ext2"]).then((contentType) => {
      if(contentType === 'application/vnd.api+json; supported-ext="ext1,ext2"') {
        done();
      }
      else {
        done(new Error("Expected JSON API Content Type"));
      }
    }, done);
  });

  it("should use json api with supported-ext and ext if json api with our extensions is supported", (done) => {
    let accept = 'application/vnd.api+json; ext="inuse,second", */*';
    negotiate(accept, ["inuse", "second"], ["inuse", "second", "three"]).then((contentType) => {
      if(contentType === 'application/vnd.api+json; supported-ext="inuse,second,three"; ext="inuse,second"') {
        done();
      }
      else {
        done(new Error("Expected JSON API Content Type; got: " + contentType));
      }
    }, done);
  });

  it("should use json if client accepts json and json api, but not with our extensions", (done) => {
    let accept = 'application/vnd.api+json; ext="ext2",application/json;q=0.9,*/*;q=0.8';
    negotiate(accept, ["bulk"], ["ext1, ext2"]).then((contentType) => {
      if(contentType === "application/json") {
        done();
      }
      else {
        done(new Error("Expected JSON Content Type"));
      }
    }, done);
  });


  it("should use json if client accepts only json", (done) => {
    let accept = "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8";
    negotiate(accept, [], ["ext1, ext2"]).then((contentType) => {
      if(contentType === "application/json") {
        done();
      }
      else {
        done(new Error("Expected JSON Content Type"));
      }
    }, done);
  });
});
