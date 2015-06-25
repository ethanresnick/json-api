"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _appAgent = require("../../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

var _fixturesCreation = require("../fixtures/creation");

describe("", function (describeDone) {
  _appAgent2["default"].then(function (Agent) {
    Agent.request("POST", "/organizations").type("application/vnd.api+json").send({ "data": _fixturesCreation.VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER, "extra": false }).promise().then(function (res) {
      var createdResource = res.body.data;

      describe("Creating a Valid Resource (With an Extra Member)", function () {
        describe("HTTP", function () {
          it("should return 201", function (done) {
            (0, _chai.expect)(res.status).to.equal(201);
            done();
          });

          it("should include a valid Location header", function (done) {
            (0, _chai.expect)(res.headers.location).to.match(/\/organizations\/[a-z0-9]+/);
            (0, _chai.expect)(createdResource.links.self).to.equal(res.headers.location);
            done();
          });
        });

        describe("Document Structure", function () {
          // "A JSON object MUST be at the root of every
          // JSON API request and response containing data."
          it("should have an object/document at the top level", function (done) {
            (0, _chai.expect)(res.body).to.be.an("object");
            done();
          });

          it("should ignore extra document object members", function (done) {
            (0, _chai.expect)(res.status).to.be.within(200, 299);
            (0, _chai.expect)(res.body.extra).to.be.undefined;
            done();
          });

          describe("Links", function () {});

          describe("Transforms", function () {
            describe("beforeSave", function () {
              it("should execute beforeSave hook", function (done) {
                (0, _chai.expect)(createdResource.attributes.description).to.equal("Added a description in beforeSave");
                done();
              });

              it("should allow beforeSave to return a Promise", function (done) {
                Agent.request("POST", "/schools").type("application/vnd.api+json").send({ "data": _fixturesCreation.VALID_SCHOOL_RESOURCE_NO_ID }).promise().then(function (res) {
                  (0, _chai.expect)(res.body.data.attributes.description).to.equal("Modified in a Promise");
                  done();
                }, done)["catch"](done);
              });
            });
          });

          describe("The Created Resource", function () {
            it("should return the created resource", function (done) {
              (0, _chai.expect)(createdResource).to.be.an("object");
              (0, _chai.expect)(createdResource.type).to.equal("organizations");
              (0, _chai.expect)(createdResource.attributes).to.be.an("object");
              (0, _chai.expect)(createdResource.relationships).to.be.an("object");
              (0, _chai.expect)(createdResource.relationships.liaisons).to.be.an("object");
              done();
            });

            it("should ignore extra resource object members", function (done) {
              (0, _chai.expect)(res.body.data.extraMember).to.be.undefined;
              (0, _chai.expect)(res.body.data.attributes.extraMember).to.be.undefined;
              done();
            });
          });
        });
      });
      describeDone();
    }, describeDone);
  })["catch"](describeDone);
});

describe("", function (describeDone) {
  _appAgent2["default"].then(function (Agent) {
    Agent.request("POST", "/organizations").type("application/vnd.api+json").send({ "data": _fixturesCreation.ORG_RESOURCE_CLIENT_ID }).promise().then(function () {
      throw new Error("Should not run!");
    }, function (err) {
      describe("Creating a Resource With A Client-Id", function () {
        describe("HTTP", function () {
          it("should return 403", function (done) {
            (0, _chai.expect)(err.response.status).to.equal(403);
            done();
          });
        });

        describe("Document Structure", function () {
          it("should contain an error", function (done) {
            (0, _chai.expect)(err.response.body.errors).to.be.an("object");
            done();
          });
        });
      });
      describeDone();
    }, describeDone);
  })["catch"](describeDone);
});

// "[S]erver implementations MUST ignore
//  [members] not recognized by this specification."
/*it("must ignore unrecognized request object members", (done) => {
  return "PATCH", '/organizations/' + ORG_STATE_GOVT_PATCH_EXTRA_MEMBERS.id)
    .send({ data: ORG_STATE_GOVT_PATCH_EXTRA_MEMBERS})
    .promise()
    .then(function(res) {
      expect(res.status).to.be.within(200, 299);
    });
});
VALID_ORG_STATE_GOVT_PATCH
// A logical collection of resources (e.g., the target of a to-many relationship) MUST be represented as an array, even if it only contains one item.
// TODO: unit test to ensure to-Many relationships always represented as arrays
// http://jsonapi.org/format/#document-structure-top-level
it('must represent a logical collection of resources as an array, even if it only contains one item', function() {
return Agent.request('GET', '/v1/books/?filter[date_published]=1954-07-29')
  .promise()
  .then(function(res) {
    expect(res.status).to.equal(200);
    expect(res.body)
      .to.have.property('data')
        .that.is.a('array');
    expect(res.body.data.length).to.equal(1);
  });
});
// A logically singular resource (e.g., the target of a to-one relationship) MUST be represented as a single resource object.
// TODO: unit test to ensure to-One relationships always represented as single objects
// it('must represent a logically singular resource as a single resource object');
*/