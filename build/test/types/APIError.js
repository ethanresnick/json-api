"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var mocha = _interopRequire(require("mocha"));

var sinon = _interopRequire(require("sinon"));

var chai = _interopRequire(require("chai"));

var APIError = _interopRequire(require("../../src/types/APIError"));

var expect = chai.expect;

describe("Error Objects", function () {
  describe("validation", function () {
    var er = new APIError(300, 1401);

    it("should coerce the status to a string", function () {
      expect(er.status === "300").to.be["true"];
    });

    it("should coerce the code to a string", function () {
      expect(er.code === "1401").to.be["true"];
    });
  });

  describe("the fromError helper", function () {
    it("should use the error's statusCode val as status if status not defined", function () {
      var er = APIError.fromError({ statusCode: 300 });
      expect(er.status === "300").to.be["true"];

      er = APIError.fromError({ status: 200, statusCode: 300 });
      expect(er.status === "200").to.be["true"];
    });

    it("should default to status 500", function () {
      expect(APIError.fromError({}).status).to.equal("500");
    });
  });
});