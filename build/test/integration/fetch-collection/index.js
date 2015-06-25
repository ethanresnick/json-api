"use strict";

var _Object$keys = require("babel-runtime/core-js/object/keys")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _appAgent = require("../../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

describe("", function (describeDone) {
  _appAgent2["default"].then(function (Agent) {
    Agent.request("GET", "/organizations").accept("application/vnd.api+json").promise().then(function (res) {
      describe("Fetching Collection", function () {
        describe("Status Code", function () {
          it("should be 200", function (done) {
            (0, _chai.expect)(res.status).to.equal(200);
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

          describe("Links", function () {
            it("should contain a self link to the collection", function (done) {
              (0, _chai.expect)(res.body.links).to.be.an("object");
              (0, _chai.expect)(res.body.links.self).to.match(/\:\d{1,5}\/organizations/);
              done();
            });
          });

          describe("Resource Objects/Primary Data", function () {
            // "A logical collection of resources MUST be represented as
            //  an array, even if it only contains one item or is empty."
            it("should be an array under data", function (done) {
              (0, _chai.expect)(res.body.data).to.be.an("array");
              done();
            });

            // "Unless otherwise noted, objects defined by this
            //  specification MUST NOT contain any additional members."
            it("should not contain extra members", function (done) {
              var isAllowedKey = function isAllowedKey(key) {
                return ["type", "id", "attributes", "relationships", "links", "meta"].indexOf(key) !== -1;
              };

              if (!_Object$keys(res.body.data[0]).every(isAllowedKey)) {
                throw new Error("Invalid Key!");
              }

              done();
            });

            it("should contain links under each relationship", function (done) {
              var liaisonRelationships = res.body.data.map(function (it) {
                return it.relationships.liaisons;
              });
              liaisonRelationships.forEach(function (it) {
                // Every liaison should have a links object,
                // and self and related must not be outside of links.
                (0, _chai.expect)(it.links).to.be.an("object");
                (0, _chai.expect)(it.self).to.be.undefined;
                (0, _chai.expect)(it.related).to.be.undefined;

                (0, _chai.expect)(it.links.self).to.be.a("string");
                (0, _chai.expect)(it.data).to.not.be.undefined; //can be null, though
              });
              done();
            });
          });
        });
      });
      describeDone();
    }, describeDone)["catch"](describeDone);
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
//require('./base-format');
// require('./extensions');
// require('./recommendations');
*/