"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _srcTypesAPIError = require("../../../src/types/APIError");

var _srcTypesAPIError2 = _interopRequireDefault(_srcTypesAPIError);

describe("Error Objects", function () {
  describe("validation", function () {
    var er = new _srcTypesAPIError2["default"](300, 1401);

    it("should coerce the status to a string", function () {
      (0, _chai.expect)(er.status === "300").to.be["true"];
    });

    it("should coerce the code to a string", function () {
      (0, _chai.expect)(er.code === "1401").to.be["true"];
    });
  });

  describe("the fromError helper", function () {
    it("should pass APIError instances through as is", function () {
      var error = new _srcTypesAPIError2["default"]();
      (0, _chai.expect)(_srcTypesAPIError2["default"].fromError(error)).to.equal(error);
    });

    it("should use the error's statusCode val as status iff status not defined", function () {
      var er = _srcTypesAPIError2["default"].fromError({
        "statusCode": 300,
        "isJSONAPIDisplayReady": true
      });
      (0, _chai.expect)(er.status === "300").to.be["true"];

      er = _srcTypesAPIError2["default"].fromError({
        "status": 200,
        "statusCode": 300,
        "isJSONAPIDisplayReady": true
      });
      (0, _chai.expect)(er.status === "200").to.be["true"];
    });

    it("should default to status 500", function () {
      (0, _chai.expect)(_srcTypesAPIError2["default"].fromError({}).status).to.equal("500");
    });
  });
});