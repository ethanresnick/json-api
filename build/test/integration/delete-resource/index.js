"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _appAgent = require("../../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

describe("Delete Resource", function () {
  var Agent = undefined;

  before(function (done) {
    _appAgent2["default"].then(function (A) {
      Agent = A;
      done();
    })["catch"](done);
  });

  describe("Valid deletion", function () {
    it("should return 204", function (done) {
      Agent.request("DEL", "/organizations/54419d550a5069a2129ef255").promise().then(function (res) {
        (0, _chai.expect)(res.status).to.equal(204);
        done();
      })["catch"](done);
    });
  });

  describe("Invalid deletion", function () {
    it("should return 403", function (done) {
      Agent.request("DEL", "/schools/53f54dd98d1e62ff12539db4").promise().then(done, function (err) {
        (0, _chai.expect)(err.status).to.equal(403);
        done();
      })["catch"](done);
    });
  });
});