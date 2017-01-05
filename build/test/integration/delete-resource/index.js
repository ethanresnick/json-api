"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _appAgent = require("../../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

var _fixturesCreation = require("../fixtures/creation");

describe("Deleting a resource", function () {

  var Agent = undefined,
      id = undefined;
  before(function (done) {
    _appAgent2["default"].then(function (A) {
      Agent = A;
      return Agent.request("POST", "/schools").type("application/vnd.api+json").send({ "data": _fixturesCreation.VALID_SCHOOL_RESOURCE_NO_ID }).promise().then(function (response) {
        id = response.body.data.id;
        return Agent.request("DEL", "/schools/" + id).type("application/vnd.api+json").send().promise();
      }).then(function () {
        return done();
      });
    })["catch"](done);
  });

  it("should delete a resource by id", function (done) {
    Agent.request("GET", "/schools/" + id).accept("application/vnd.api+json").promise().then(done, function (err) {
      (0, _chai.expect)(err.response.statusCode).to.equal(404);
      done();
    })["catch"](done);
  });
});