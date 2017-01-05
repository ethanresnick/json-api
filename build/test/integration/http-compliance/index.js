"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _appAgent = require("../../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

describe("HTTP Compliance", function () {

  var Agent = undefined;
  before(function (done) {
    _appAgent2["default"].then(function (A) {
      Agent = A;
      done();
    }, done);
  });

  it("should reject PUT with a PUT-specific message", function (done) {
    Agent.request("PUT", "/organizations").send({}).promise().then(function (res) {
      done(new Error("Shouldn't run since response should be an error"));
    }, function (err) {
      (0, _chai.expect)(err.response.status).to.equal(405);
      (0, _chai.expect)(err.response.body.errors[0].detail).to.match(/PUT.+jsonapi\.org/i);
    }).then(done, done);
  });

  it("should reject other unknown methods too", function (done) {
    Agent.request("LOCK", "/organizations").send({}).promise().then(function (res) {
      done(new Error("Shouldn't run since response should be an error"));
    }, function (err) {
      (0, _chai.expect)(err.response.status).to.equal(405);
      (0, _chai.expect)(err.response.body.errors[0].detail).to.match(/lock/i);
    }).then(done, done);
  });
});