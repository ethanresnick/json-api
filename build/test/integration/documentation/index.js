"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _appAgent = require("../../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

describe("Fetching JSON Documentation", function () {
  var res = undefined,
      Agent = undefined;

  before(function (done) {
    _appAgent2["default"].then(function (A) {
      Agent = A;
      return Agent.request("GET", "/").accept("application/vnd.api+json").promise();
    }, done).then(function (response) {
      res = response;
      done();
    })["catch"](done);
  });

  describe("Content Type", function () {
    it("should be JSON API", function () {
      (0, _chai.expect)(res.headers["content-type"]).to.equal("application/vnd.api+json");
    });
  });

  describe("Document Structure", function () {
    it("should transform type info", function () {
      // the default transform dasherizes key names, so we just check for that.
      (0, _chai.expect)("friendly-name" in res.body.data[0].attributes.fields[0]).to.be["true"];
    });
  });
});