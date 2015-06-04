"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _srcStepsHttpContentNegotiationValidateContentType = require("../../../../../src/steps/http/content-negotiation/validate-content-type");

var _srcStepsHttpContentNegotiationValidateContentType2 = _interopRequireDefault(_srcStepsHttpContentNegotiationValidateContentType);

describe("validateContentType", function () {
  var invalidMock = { contentType: "application/json", ext: [] };
  var validMock = { contentType: "application/vnd.api+json", ext: [] };

  it("should return a promise", function () {
    (0, _chai.expect)(_q2["default"].isPromise((0, _srcStepsHttpContentNegotiationValidateContentType2["default"])(validMock))).to.be["true"];
  });

  it("should fail resquests with invalid content types with a 415", function (done) {
    (0, _srcStepsHttpContentNegotiationValidateContentType2["default"])(invalidMock, []).then(function () {
      done(new Error("This shouldn't run!"));
    }, function (err) {
      if (err.status === "415") {
        done();
      }
    });
  });

  it("should allow requests with no extensions", function (done) {
    (0, _srcStepsHttpContentNegotiationValidateContentType2["default"])(validMock, ["ext1", "ext2"]).then(done);
  });

  /*
  it("should reject requests for unsupported extensions with a 415", (done) => {
    let contextMock = {contentType: "application/vnd.api+json", ext: ["bulk"]};
    requestValidators.checkContentType(contextMock, ["ext1", "ext2"]).then(
      () => { done(new Error("This shouldn't run!")); },
      (err) => { if(err.status === "415") { done(); } }
    );
  });
   it("should use json api with supported-ext when json api is supported and we're using no extensions", (done) => {
    let accept = "application/vnd.api+json";
    negotiate(accept, [], ["ext1", "ext2"]).then((contentType) => {
      if(contentType === 'application/vnd.api+json; supported-ext="ext1,ext2"') {
        done();
      }
      else {
        done(new Error("Expected JSON API Content Type"));
      }
    }, done);
  });
  */
});