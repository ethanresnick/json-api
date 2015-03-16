import mocha from "mocha"
import sinon from "sinon"
import chai from "chai"
import Q from "q"
import bodyParser from "body-parser"
import express from "express"
import supertest from "supertest"
import * as requestValidators from "../../../lib/steps/http/validate-request"

var expect = chai.expect

describe("Request Validation functions", () => {
  describe("checkBodyExistence", () => {
    it("should return a promise", () => {
      expect(Q.isPromise(requestValidators.checkBodyExistence({}))).to.be.true;
    });

    it("should return a rejected promise if an expected body is missing", (done) => {
      var contextMock = {hasBody: false, needsBody: true};
      requestValidators.checkBodyExistence(contextMock).then(() => {
        done(new Error("This fulfillment handler shoudn't run"))
      }, () => {done()})
    });

    it("should return a rejected promise if an unexpected body is present", (done) => {
      var contextMock = {hasBody: true, needsBody: false};
      requestValidators.checkBodyExistence(contextMock).then(() => {
        done(new Error("This fulfillment handler shoudn't run"))
      }, () => {done()})
    });

    it("should resolve the promise successfully when expected body is present", (done) => {
      var contextMock = {hasBody: true, needsBody: true};
      requestValidators.checkBodyExistence(contextMock).then(done);
    });

    it("should resolve the promise when body is expectedly absent", (done) => {
      var contextMock = {hasBody: false, needsBody: false};
      requestValidators.checkBodyExistence(contextMock).then(done);
    });
  });
  
  describe("checkBodyParsesAsJSON", () => {
    var app = express();
    app.use(function(req, res, next) {
      requestValidators.checkBodyParsesAsJSON(req, res, bodyParser).then(
        () => { res.json(req.body); },
        (err) => { res.status(Number(err.status)).send("Error"); }
      );
    });

    it("should try to parse all bodies, no matter the content-type", (done) => {
      var request = supertest(app);
      request
        .post('/').set('Content-Type', 'application/xml').send('{"json":true}')
        .expect(200, '{"json":true}', done);
    });

    it("should reject the promise with a 400 error for an invalid json body", (done) => {
      var request = supertest(app);
      request.post('/').send("unquoted:false}").expect(400, done);
    });

    it("should resolve the promise successfully for a valid body", (done) => {
      var request = supertest(app);
      request
        .post('/').send('{"json":[]}')
        .expect(200, '{"json":[]}', done);
    });
  });

  describe("checkContentType", () => {
    var invalidMock = {contentType: 'application/json', ext: []};
    var validMock   = {contentType: 'application/vnd.api+json', ext: []};

    it("should return a promise", () => {
      expect(Q.isPromise(requestValidators.checkContentType(validMock))).to.be.true;
    });

    it("should fail resquests with invalid content types with a 415", (done) => {
      requestValidators.checkContentType(invalidMock, [])
        .then(
          () => { done(new Error("This shouldn't run!")); },
          (err) => { if(err.status==="415") { done(); } }
        );
    });

    it("should allow requests with no extensions", (done) => {
      requestValidators.checkContentType(validMock, ["ext1", "ext2"]).then(done);
    });

    it("should allow requests with supported extensions", (done) => {
      var contextMock = {contentType: 'application/vnd.api+json', ext: ["bulk"]}
      requestValidators.checkContentType(contextMock, ["bulk"]).then(done);
    });

    it("should reject requests for unsupported extensions with a 415", (done) => {
      var contextMock = {contentType: 'application/vnd.api+json', ext: ["bulk"]}
      requestValidators.checkContentType(contextMock, ["ext1", "ext2"]).then(
        () => { done(new Error("This shouldn't run!")); },
        (err) => { if(err.status==="415") { done(); } }
      );
    });
  })
});