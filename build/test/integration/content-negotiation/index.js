"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _appAgent = require("../../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

var _fixturesCreation = require("../fixtures/creation");

var _fixturesUpdates = require("../fixtures/updates");

_appAgent2["default"].then(function (Agent) {
  describe("Content Negotiation", function () {
    // "Servers MUST respond with a 415 Unsupported Media Type status code if a
    //  request specifies the header Content-Type: application/vnd.api+json with
    //  any media type parameters."
    it("must reject parameterized content-type", function (done) {
      Agent.request("POST", "/organizations").type("application/vnd.api+json;ext=blah").send({ "data": _fixturesCreation.VALID_ORG_RESOURCE_NO_ID }).promise().then(function () {
        done(new Error("Should not run!"));
      }, function (err) {
        (0, _chai.expect)(err.status).to.equal(415);
        (0, _chai.expect)(err.response.body.errors).to.be.an("object");
        (0, _chai.expect)(err.response.body.errors[0].title).to.equal("Invalid Media Type Parameter(s)");
        done();
      })["catch"](done);
    });

    // "Servers MUST send all JSON API data in response documents with the
    //  header Content-Type: application/vnd.api+json without any media type
    //  parameters."
    it("must prefer sending JSON API media type, if its acceptable", function (done) {
      Agent.request("POST", "/organizations").accept("application/vnd.api+json, application/json").send({ "data": _fixturesCreation.VALID_ORG_RESOURCE_NO_ID }).type("application/vnd.api+json").promise().then(function (res) {
        (0, _chai.expect)(res.status).to.equal(201);
        (0, _chai.expect)(res.headers["content-type"]).to.equal("application/vnd.api+json");
        done();
      }, done)["catch"](done);
    });

    it.skip("should use the json-api media type for errors if no json accepted, even if not acceptable", function (done) {
      Agent.request("GET", "/organizations/unknown-id").accept("text/html").promise().then(function () {
        done(new Error("Should not run, since this request should be a 404"));
      }, function (err) {
        (0, _chai.expect)(err.response.headers["content-type"]).to.equal("application/vnd.api+json");
        done();
      })["catch"](done);
    });

    it("must accept unparameterized json api content-type", function (done) {
      Agent.request("PATCH", "/organizations/54419d550a5069a2129ef254").type("application/vnd.api+json").send({ "data": _fixturesUpdates.VALID_ORG_STATE_GOVT_PATCH }).promise().then(function (res) {
        (0, _chai.expect)(res.status).to.be.within(200, 204);
        (0, _chai.expect)(res.body.data).to.not.be.undefined;
        done();
      }, done)["catch"](done);
    });
  });
}, function (err) {});