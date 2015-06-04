"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _srcStepsPreQueryValidateDocument = require("../../../../src/steps/pre-query/validate-document");

var _srcStepsPreQueryValidateDocument2 = _interopRequireDefault(_srcStepsPreQueryValidateDocument);

describe("Validate Request Is a JSON API Document", function () {
  it("should fulfill when the input is an object with a data key", function (done) {
    (0, _srcStepsPreQueryValidateDocument2["default"])({ "data": null }).then(done);
  });

  it("should reject the promise for an array body", function (done) {
    (0, _srcStepsPreQueryValidateDocument2["default"])([]).then(function () {
      done(new Error("Should reject array bodies."));
    }, function (err1) {
      (0, _chai.expect)(err1.title).to.match(/not a valid JSON API document/);
      done();
    })["catch"](done);
  });

  it("should rejet the promise for a string body", function (done) {
    (0, _srcStepsPreQueryValidateDocument2["default"])("string").then(function () {
      done(new Error("Should reject string bodies."));
    }, function (err2) {
      (0, _chai.expect)(err2.title).to.match(/not a valid JSON API document/);
      done();
    })["catch"](done);
  });
});