"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var chai = _interopRequire(require("chai"));

var validateDocument = _interopRequire(require("../../../src/steps/pre-query/validate-document"));

var expect = chai.expect;

describe("Validate Request Is a JSON API Document", function () {
  it("should fulfill when the input is an object with a data key", function (done) {
    validateDocument({ data: null }).then(done);
  });

  it("should reject the promise for an array body", function (done) {
    validateDocument([]).then(function () {
      done(new Error("Should reject array bodies."));
    }, function (err1) {
      //expect(err1.message).to.match(/not a valid JSON API document/);
      done();
    });
  });

  it("should rejet the promise for a string body", function (done) {
    validateDocument("string").then(function () {
      done(new Error("Should reject string bodies."));
    }, function (err2) {
      //expect(err2.message).to.match(/not a valid JSON API document/);
      done();
    });
  });
});