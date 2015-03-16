"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var mocha = _interopRequire(require("mocha"));

var sinon = _interopRequire(require("sinon"));

var chai = _interopRequire(require("chai"));

var Q = _interopRequire(require("q"));

var bodyParser = _interopRequire(require("body-parser"));

var express = _interopRequire(require("express"));

var supertest = _interopRequire(require("supertest"));

var requestValidators = _interopRequireWildcard(require("../../../lib/steps/http/validate-request"));

var expect = chai.expect;

describe("Request Validation functions", function () {
  describe("checkBodyExistence", function () {
    it("should return a promise", function () {
      expect(Q.isPromise(requestValidators.checkBodyExistence({}))).to.be["true"];
    });

    it("should return a rejected promise if an expected body is missing", function (done) {
      var contextMock = { hasBody: false, needsBody: true };
      requestValidators.checkBodyExistence(contextMock).then(function () {
        done(new Error("This fulfillment handler shoudn't run"));
      }, function () {
        done();
      });
    });

    it("should return a rejected promise if an unexpected body is present", function (done) {
      var contextMock = { hasBody: true, needsBody: false };
      requestValidators.checkBodyExistence(contextMock).then(function () {
        done(new Error("This fulfillment handler shoudn't run"));
      }, function () {
        done();
      });
    });

    it("should resolve the promise successfully when expected body is present", function (done) {
      var contextMock = { hasBody: true, needsBody: true };
      requestValidators.checkBodyExistence(contextMock).then(done);
    });

    it("should resolve the promise when body is expectedly absent", function (done) {
      var contextMock = { hasBody: false, needsBody: false };
      requestValidators.checkBodyExistence(contextMock).then(done);
    });
  });

  describe("checkBodyParsesAsJSON", function () {
    var app = express();
    app.use(function (req, res, next) {
      requestValidators.checkBodyParsesAsJSON(req, res, bodyParser).then(function () {
        res.json(req.body);
      }, function (err) {
        res.status(Number(err.status)).send("Error");
      });
    });

    it("should try to parse all bodies, no matter the content-type", function (done) {
      var request = supertest(app);
      request.post("/").set("Content-Type", "application/xml").send("{\"json\":true}").expect(200, "{\"json\":true}", done);
    });

    it("should reject the promise with a 400 error for an invalid json body", function (done) {
      var request = supertest(app);
      request.post("/").send("unquoted:false}").expect(400, done);
    });

    it("should resolve the promise successfully for a valid body", function (done) {
      var request = supertest(app);
      request.post("/").send("{\"json\":[]}").expect(200, "{\"json\":[]}", done);
    });
  });

  describe("checkContentType", function () {
    var invalidMock = { contentType: "application/json", ext: [] };
    var validMock = { contentType: "application/vnd.api+json", ext: [] };

    it("should return a promise", function () {
      expect(Q.isPromise(requestValidators.checkContentType(validMock))).to.be["true"];
    });

    it("should fail resquests with invalid content types with a 415", function (done) {
      requestValidators.checkContentType(invalidMock, []).then(function () {
        done(new Error("This shouldn't run!"));
      }, function (err) {
        if (err.status === "415") {
          done();
        }
      });
    });

    it("should allow requests with no extensions", function (done) {
      requestValidators.checkContentType(validMock, ["ext1", "ext2"]).then(done);
    });

    it("should allow requests with supported extensions", function (done) {
      var contextMock = { contentType: "application/vnd.api+json", ext: ["bulk"] };
      requestValidators.checkContentType(contextMock, ["bulk"]).then(done);
    });

    it("should reject requests for unsupported extensions with a 415", function (done) {
      var contextMock = { contentType: "application/vnd.api+json", ext: ["bulk"] };
      requestValidators.checkContentType(contextMock, ["ext1", "ext2"]).then(function () {
        done(new Error("This shouldn't run!"));
      }, function (err) {
        if (err.status === "415") {
          done();
        }
      });
    });
  });
});