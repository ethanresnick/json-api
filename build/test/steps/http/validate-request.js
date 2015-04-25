"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var _interopRequireWildcard = require("babel-runtime/helpers/interop-require-wildcard")["default"];

var chai = _interopRequire(require("chai"));

var Q = _interopRequire(require("q"));

var requestValidators = _interopRequireWildcard(require("../../../src/steps/http/validate-request"));

var expect = chai.expect;

describe("Request Validation functions", function () {
  describe("checkBodyExistence", function () {
    it("should return a promise", function () {
      expect(Q.isPromise(requestValidators.checkBodyExistence({}))).to.be["true"];
    });

    it("should return a rejected promise if a POST request is missing a body", function (done) {
      var contextMock = { hasBody: false, method: "post" };
      requestValidators.checkBodyExistence(contextMock).then(function () {
        done(new Error("This fulfillment handler shoudn't run"));
      }, function () {
        done();
      });
    });

    it("should return a rejected promise if a PATCH request is missing a body", function (done) {
      var contextMock = { hasBody: false, method: "patch" };
      requestValidators.checkBodyExistence(contextMock).then(function () {
        done(new Error("This fulfillment handler shoudn't run"));
      }, function () {
        done();
      });
    });

    it("should return a rejected promise if an unexpected body is present", function (done) {
      var contextMock = { hasBody: true, method: "get" };
      requestValidators.checkBodyExistence(contextMock).then(function () {
        done(new Error("This fulfillment handler shoudn't run"));
      }, function () {
        done();
      });
    });

    it("should resolve the promise successfully when expected body is present", function (done) {
      var contextMock = { hasBody: true, method: "patch" };
      requestValidators.checkBodyExistence(contextMock).then(done);
    });

    it("should resolve the promise when body is expectedly absent", function (done) {
      var contextMock = { hasBody: false, needsBody: false };
      requestValidators.checkBodyExistence(contextMock).then(done);
    });
  });

  describe("checkContentType", function () {
    var invalidMock = { contentType: "application/json", ext: [] };
    var validMock = { contentType: "application/vnd.api+json", ext: [] };

    it("should return a promise", function () {
      expect(Q.isPromise(requestValidators.checkContentType(validMock))).to.be["true"];
    });

    it("should fail resquests with invalid content types with a 415", function (done) {
      requestValidators.checkContentType(invalidMock, []).then(function () {
        done(new Error("This shouldn't run!"));
      }, function (err) {
        if (err.status === "415") {
          done();
        }
      });
    });

    it("should allow requests with no extensions", function (done) {
      requestValidators.checkContentType(validMock, ["ext1", "ext2"]).then(done);
    });

    it("should allow requests with supported extensions", function (done) {
      var contextMock = { contentType: "application/vnd.api+json", ext: ["bulk"] };
      requestValidators.checkContentType(contextMock, ["bulk"]).then(done);
    });

    it("should reject requests for unsupported extensions with a 415", function (done) {
      var contextMock = { contentType: "application/vnd.api+json", ext: ["bulk"] };
      requestValidators.checkContentType(contextMock, ["ext1", "ext2"]).then(function () {
        done(new Error("This shouldn't run!"));
      }, function (err) {
        if (err.status === "415") {
          done();
        }
      });
    });
  });
});