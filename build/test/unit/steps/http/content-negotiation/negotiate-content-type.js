"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _srcStepsHttpContentNegotiationNegotiateContentType = require("../../../../../src/steps/http/content-negotiation/negotiate-content-type");

var _srcStepsHttpContentNegotiationNegotiateContentType2 = _interopRequireDefault(_srcStepsHttpContentNegotiationNegotiateContentType);

describe("negotiateContentType", function () {
  it("should return a promise", function () {
    (0, _chai.expect)(_q2["default"].isPromise((0, _srcStepsHttpContentNegotiationNegotiateContentType2["default"])())).to.be["true"];
  });

  it("should 406 if all json api parameter instances are parameterized, even if there's a valid alternative", function (done) {
    var accept = "application/vnd.api+json; ext=\"ext2\", application/json";
    (0, _srcStepsHttpContentNegotiationNegotiateContentType2["default"])(accept, ["application/vnd.api+json"]).then(done, function (err) {
      (0, _chai.expect)(err.status).to.equal("406");
      done();
    }).done();
  });

  it("should allow parameterized json api media ranges as long as not all are parameterized", function (done) {
    var accept = "application/vnd.api+json; ext=\"ext2\",application/vnd.api+json";
    (0, _srcStepsHttpContentNegotiationNegotiateContentType2["default"])(accept, ["application/vnd.api+json", "text/html"]).then(function (contentType) {
      if (contentType === "application/vnd.api+json") {
        done();
      } else {
        done(new Error("Should have negotiated JSON API base type"));
      }
    }, done).done();
  });

  it("should resolve with a non-json-api type when its the highest priority + supported by the endpoint", function (done) {
    var accept = "text/html,application/vnd.api+json;q=0.5,application/json";
    (0, _srcStepsHttpContentNegotiationNegotiateContentType2["default"])(accept, ["application/vnd.api+json", "text/html"]).then(function (contentType) {
      if (contentType === "text/html") {
        done();
      } else {
        done(new Error("Expected HTML"));
      }
    }, done).done();
  });

  it("should resolve with json-api type if that's the highest priority, even if the endpoint supports an alternative", function (done) {
    var accept = "application/vnd.api+json,application/json,text/*";
    (0, _srcStepsHttpContentNegotiationNegotiateContentType2["default"])(accept, ["application/vnd.api+json", "text/html"]).then(function (contentType) {
      if (contentType === "application/vnd.api+json") {
        done();
      } else {
        done(new Error("Expected Json API content type."));
      }
    }, done).done();
  });

  it("should use json if client accepts only json", function (done) {
    var accept = "text/html,application/xhtml+xml,application/json;q=0.9,**;q=0.8";
    (0, _srcStepsHttpContentNegotiationNegotiateContentType2["default"])(accept, ["application/vnd.api+json"]).then(function (contentType) {
      if (contentType === "application/json") {
        done();
      } else {
        done(new Error("Expected JSON Content Type"));
      }
    }, done);
  });
});