"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _appAgent = require("../../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

var _fixturesCreation = require("../fixtures/creation");

describe("Creating Resources", function () {
  var Agent = undefined;

  describe("Creating a Valid Resource (With an Extra Member)", function () {
    var createdResource = undefined,
        res = undefined;
    before(function (done) {
      _appAgent2["default"].then(function (A) {
        Agent = A;
        Agent.request("POST", "/organizations").type("application/vnd.api+json").send({ "data": _fixturesCreation.VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER, "extra": false }).promise().then(function (response) {
          res = response;
          createdResource = res.body.data;
          done();
        });
      })["catch"](done);
    });

    describe("HTTP", function () {
      it("should return 201", function () {
        (0, _chai.expect)(res.status).to.equal(201);
      });

      it("should include a valid Location header", function () {
        (0, _chai.expect)(res.headers.location).to.match(/\/organizations\/[a-z0-9]+/);
        (0, _chai.expect)(createdResource.links.self).to.equal(res.headers.location);
      });
    });

    describe("Document Structure", function () {
      // "A JSON object MUST be at the root of every
      // JSON API request and response containing data."
      it("should have an object/document at the top level", function () {
        (0, _chai.expect)(res.body).to.be.an("object");
      });

      it("should ignore extra document object members", function () {
        (0, _chai.expect)(res.status).to.be.within(200, 299);
        (0, _chai.expect)(res.body.extra).to.be.undefined;
      });
    });

    describe("Links", function () {});

    describe("Transforms", function () {
      describe("beforeSave", function () {
        it("should execute beforeSave hook", function () {
          (0, _chai.expect)(createdResource.attributes.description).to.equal("Added a description in beforeSave");
          (0, _chai.expect)(createdResource.attributes.modified).to.equal("2015-01-01T00:00:00.000Z");
        });

        it("should allow beforeSave to return a Promise and support super()", function (done) {
          Agent.request("POST", "/schools").type("application/vnd.api+json").send({ "data": _fixturesCreation.VALID_SCHOOL_RESOURCE_NO_ID }).promise().then(function (response) {
            (0, _chai.expect)(response.body.data.attributes.description).to.equal("Added a description in beforeSave");
            (0, _chai.expect)(response.body.data.attributes.modified).to.equal("2015-10-27T05:16:57.257Z");
            done();
          }, done)["catch"](done);
        });
      });
    });

    describe("The Created Resource", function () {
      it("should be returned in the body", function () {
        (0, _chai.expect)(createdResource).to.be.an("object");
        (0, _chai.expect)(createdResource.type).to.equal("organizations");
        (0, _chai.expect)(createdResource.attributes).to.be.an("object");
        (0, _chai.expect)(createdResource.relationships).to.be.an("object");
        (0, _chai.expect)(createdResource.relationships.liaisons).to.be.an("object");
      });

      it("should ignore extra resource object members", function () {
        (0, _chai.expect)(res.body.data.extraMember).to.be.undefined;
        (0, _chai.expect)(res.body.data.attributes.extraMember).to.be.undefined;
      });
    });
  });

  describe("Creating a Resource With A Client-Id", function () {
    var err = undefined;
    before(function (done) {
      Agent.request("POST", "/organizations").type("application/vnd.api+json").send({ "data": _fixturesCreation.ORG_RESOURCE_CLIENT_ID }).promise().then(function () {
        done("Should not run!");
      }, function (error) {
        err = error;
        done();
      });
    });

    describe("HTTP", function () {
      it("should return 403", function () {
        (0, _chai.expect)(err.response.status).to.equal(403);
      });
    });

    describe("Document Structure", function () {
      it("should contain an error", function () {
        (0, _chai.expect)(err.response.body.errors).to.be.an("array");
      });
    });
  });

  describe("Creating a Resource With a Missing Relationship Data Key", function () {
    var err = undefined;
    before(function (done) {
      Agent.request("POST", "/organizations").type("application/vnd.api+json").send({ "data": _fixturesCreation.INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP }).promise().then(function () {
        done("Should not run!");
      }, function (error) {
        err = error;
        done();
      });
    });

    describe("HTTP", function () {
      it("should return 400", function () {
        (0, _chai.expect)(err.response.status).to.equal(400);
      });
    });

    describe("Document Structure", function () {
      it("should contain an error", function () {
        (0, _chai.expect)(err.response.body.errors).to.be.an("array");
      });
    });

    describe("The error", function () {
      it("should have the correct title", function () {
        (0, _chai.expect)(err.response.body.errors[0].title).to.be.equal("Missing relationship linkage.");
      });

      it("should have the correct details", function () {
        (0, _chai.expect)(err.response.body.errors[0].details).to.be.equal("No data was found for the liaisons relationship.");
      });
    });
  });
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