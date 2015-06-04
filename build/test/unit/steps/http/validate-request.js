"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _interopRequireWildcard = require("babel-runtime/helpers/interop-require-wildcard")["default"];

var _chai = require("chai");

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _srcStepsHttpValidateRequest = require("../../../../src/steps/http/validate-request");

var requestValidators = _interopRequireWildcard(_srcStepsHttpValidateRequest);

describe("Request Validation functions", function () {
  describe("checkBodyExistence", function () {
    it("should return a promise", function () {
      (0, _chai.expect)(_q2["default"].isPromise(requestValidators.checkBodyExistence({}))).to.be["true"];
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
});