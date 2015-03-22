import mocha from "mocha"
import sinon from "sinon"
import chai from "chai"
import Q from "q"
import bodyParser from "body-parser"
import express from "express"
import supertest from "supertest"
import * as requestValidators from "../../../src/steps/http/validate-request"

let expect = chai.expect;

describe("Request Validation functions", () => {
  describe("checkBodyExistence", () => {
    it("should return a promise", () => {
      expect(Q.isPromise(requestValidators.checkBodyExistence({}))).to.be.true;
    });

    it("should return a rejected promise if a POST request is missing a body", (done) => {
      let contextMock = {hasBody: false, method: "post"};
      requestValidators.checkBodyExistence(contextMock).then(() => {
        done(new Error("This fulfillment handler shoudn't run"));
      }, () => { done(); });
    });

    it("should return a rejected promise if a PATCH request is missing a body", (done) => {
      let contextMock = {hasBody: false, method: "patch"};
      requestValidators.checkBodyExistence(contextMock).then(() => {
        done(new Error("This fulfillment handler shoudn't run"));
      }, () => {done(); });
    });

    it("should return a rejected promise if an unexpected body is present", (done) => {
      let contextMock = {hasBody: true, method: "get"};
      requestValidators.checkBodyExistence(contextMock).then(() => {
        done(new Error("This fulfillment handler shoudn't run"));
      }, () => { done(); });
    });

    it("should resolve the promise successfully when expected body is present", (done) => {
      let contextMock = {hasBody: true, method: "patch"};
      requestValidators.checkBodyExistence(contextMock).then(done);
    });

    it("should resolve the promise when body is expectedly absent", (done) => {
      let contextMock = {hasBody: false, needsBody: false};
      requestValidators.checkBodyExistence(contextMock).then(done);
    });
  });

  describe("checkBodyIsValidJSONAPI", () => {
    it("should fulfill when the input is an object with data", (done) => {
      requestValidators.checkBodyIsValidJSONAPI({"data": null}).then(done);
    });

    it("should reject the promise for all other inputs", (done) => {
      requestValidators.checkBodyIsValidJSONAPI([]).then(
        () => { done(new Error("Should reject array bodies.")); },
        () => {
          requestValidators.checkBodyIsValidJSONAPI("string").then(
            () => { done(new Error("Should reject string bodies.")); },
            () => { done(); }
          );
        }
      );
    });
  });

  describe("checkContentType", () => {
    let invalidMock = {contentType: "application/json", ext: []};
    let validMock   = {contentType: "application/vnd.api+json", ext: []};

    it("should return a promise", () => {
      expect(Q.isPromise(requestValidators.checkContentType(validMock))).to.be.true;
    });

    it("should fail resquests with invalid content types with a 415", (done) => {
      requestValidators.checkContentType(invalidMock, [])
        .then(
          () => { done(new Error("This shouldn't run!")); },
          (err) => { if(err.status==="415") { done(); } }
        );
    });

    it("should allow requests with no extensions", (done) => {
      requestValidators.checkContentType(validMock, ["ext1", "ext2"]).then(done);
    });

    it("should allow requests with supported extensions", (done) => {
      let contextMock = {contentType: "application/vnd.api+json", ext: ["bulk"]};
      requestValidators.checkContentType(contextMock, ["bulk"]).then(done);
    });

    it("should reject requests for unsupported extensions with a 415", (done) => {
      let contextMock = {contentType: "application/vnd.api+json", ext: ["bulk"]};
      requestValidators.checkContentType(contextMock, ["ext1", "ext2"]).then(
        () => { done(new Error("This shouldn't run!")); },
        (err) => { if(err.status==="415") { done(); } }
      );
    });
  });
});
