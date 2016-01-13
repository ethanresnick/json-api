"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _appAgent = require("../../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

var _fixturesUpdates = require("../fixtures/updates");

describe("Patching a relationship", function () {
  var Agent = undefined,
      orgId = undefined;
  before(function (done) {
    _appAgent2["default"].then(function (A) {
      Agent = A;
      return Agent.request("GET", "/organizations").promise().then(function (response) {
        orgId = response.body.data[0].id;
      });
    }).then(done, done);
  });

  it("should support full replacement at a to-many relationship endpoint", function (done) {
    var url = "/organizations/" + orgId + "/relationships/liaisons";

    var setRelationship = function setRelationship(data, url) {
      //eslint-disable-line no-shadow
      return Agent.request("PATCH", url).accept("application/vnd.api+json").type("application/vnd.api+json").send(data).promise().then(function (res) {
        (0, _chai.expect)(res.body.data).to.deep.equal(data.data);
      });
    };

    var testRelationshipState = function testRelationshipState(expectedVal, url) {
      //eslint-disable-line no-shadow
      return Agent.request("GET", url).accept("application/vnd.api+json").promise().then(function (res) {
        (0, _chai.expect)(res.body.data).to.deep.equal(expectedVal.data);
      });
    };

    setRelationship(_fixturesUpdates.VALID_ORG_RELATIONSHIP_PATCH, url).then(function () {
      return testRelationshipState(_fixturesUpdates.VALID_ORG_RELATIONSHIP_PATCH, url);
    }).then(function () {
      return setRelationship(_fixturesUpdates.VALID_ORG_RELATIONSHIP_EMPTY_PATCH, url);
    }).then(function () {
      return testRelationshipState(_fixturesUpdates.VALID_ORG_RELATIONSHIP_EMPTY_PATCH, url);
    }).then(function () {
      return setRelationship(_fixturesUpdates.VALID_ORG_RELATIONSHIP_PATCH, url);
    }).then(function () {
      return testRelationshipState(_fixturesUpdates.VALID_ORG_RELATIONSHIP_PATCH, url);
    }).then(function () {
      done();
    }, done);
  });
});