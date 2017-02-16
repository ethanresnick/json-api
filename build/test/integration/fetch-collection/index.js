"use strict";

var _Object$keys = require("babel-runtime/core-js/object/keys")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _appAgent = require("../../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

describe("Fetching Collection", function () {
  var res = undefined,
      Agent = undefined;

  before(function (done) {
    _appAgent2["default"].then(function (A) {
      Agent = A;
      return Agent.request("GET", "/organizations").accept("application/vnd.api+json").promise();
    }, done).then(function (response) {
      res = response;
      done();
    })["catch"](done);
  });

  describe("Status Code", function () {
    it("should be 200", function () {
      (0, _chai.expect)(res.status).to.equal(200);
    });
  });

  describe("Document Structure", function () {
    // "A JSON object MUST be at the root of every
    // JSON API request and response containing data."
    it("should have an object/document at the top level", function () {
      (0, _chai.expect)(res.body).to.be.an.object;
    });

    describe("Top-Level Links", function () {
      it("should contain a self link to the collection", function () {
        (0, _chai.expect)(res.body.links).to.be.an.object;
        (0, _chai.expect)(res.body.links.self).to.match(/\:\d{1,5}\/organizations/);
      });
    });

    describe("Resource Objects/Primary Data", function () {
      // "A logical collection of resources MUST be represented as
      //  an array, even if it only contains one item or is empty."
      it("should be an array under data", function () {
        (0, _chai.expect)(res.body.data).to.be.an("array");
      });

      // "Unless otherwise noted, objects defined by this
      //  specification MUST NOT contain any additional members."
      it("should not contain extra members", function () {
        var isAllowedKey = function isAllowedKey(key) {
          return ["type", "id", "attributes", "relationships", "links", "meta"].indexOf(key) !== -1;
        };

        if (!_Object$keys(res.body.data[0]).every(isAllowedKey)) {
          throw new Error("Invalid Key!");
        }
      });

      it("should contain links under each relationship", function () {
        // check each liaison relationship for a links object with links in it.
        res.body.data.map(function (it) {
          return it.relationships.liaisons;
        }).forEach(function (it) {
          (0, _chai.expect)(it.links).to.be.an("object");
          (0, _chai.expect)(it.self).to.be.undefined;
          (0, _chai.expect)(it.related).to.be.undefined;

          (0, _chai.expect)(it.links.self).to.be.a("string");
          (0, _chai.expect)(it.data).to.not.be.undefined; //can be null, though
        });
      });

      // This test is good on its own, and the next couple tests also assume it passes.
      it("should contain both organizations and schools", function () {
        (0, _chai.expect)(res.body.data.some(function (it) {
          return it.type === "schools";
        })).to.be["true"];
        (0, _chai.expect)(res.body.data.some(function (it) {
          return it.type === "organizations";
        })).to.be["true"];
      });

      it("should have transformed all resources, including sub types", function () {
        (0, _chai.expect)(res.body.data.every(function (resource) {
          return resource.attributes.addedBeforeRender;
        })).to.be["true"];
      });
    });

    describe("Fetching Ascending Gendered Collection", function () {
      before(function (done) {
        Agent.request("GET", "/people?sort=gender").accept("application/vnd.api+json").promise().then(function (response) {
          res = response;
          done();
        })["catch"](done);
      });

      it("should have Jane above John", function () {
        var johnJaneList = res.body.data.map(function (it) {
          return it.attributes.name;
        }).filter(function (it) {
          return ["John Smith", "Jane Doe"].indexOf(it) > -1;
        });
        (0, _chai.expect)(johnJaneList[0]).to.equal("Jane Doe");
        (0, _chai.expect)(johnJaneList[1]).to.equal("John Smith");
      });
    });

    describe("Fetching Descended Sorted Name Collection", function () {
      before(function (done) {
        Agent.request("GET", "/people?sort=-name").accept("application/vnd.api+json").promise().then(function (response) {
          res = response;
          done();
        })["catch"](done);
      });

      it("Should have John above Jane", function () {
        var johnJaneList = res.body.data.map(function (it) {
          return it.attributes.name;
        }).filter(function (it) {
          return ["John", "Jane"].indexOf(it.substring(0, 4)) > -1;
        });
        (0, _chai.expect)(johnJaneList[0]).to.equal("John Smith");
        (0, _chai.expect)(johnJaneList[1]).to.equal("Jane Doe");
      });
    });
  });

  describe("Fetching Multi-Sorted Collection", function () {
    before(function (done) {
      Agent.request("GET", "/people?sort=-gender,name").accept("application/vnd.api+json").promise().then(function (response) {
        res = response;
        done();
      })["catch"](done);
    });

    it("Should have John above Jane", function () {
      (0, _chai.expect)(res.body.data.map(function (it) {
        return it.attributes.name;
      })).to.deep.equal(["Doug Wilson", "John Smith", "Jane Doe"]);
    });
  });

  describe("Fetching with Offset and Limit", function () {
    before(function (done) {
      Agent.request("GET", "/people?page[offset]=1&page[limit]=1").accept("application/vnd.api+json").promise().then(function (response) {
        res = response;
        done();
      })["catch"](done);
    });

    it("Should only have the 2nd person", function () {
      (0, _chai.expect)(res.body.data.map(function (it) {
        return it.attributes.name;
      })).to.deep.equal(["Jane Doe"]);
    });

    it("Should include the total record count", function () {
      (0, _chai.expect)(res.body.meta).to.deep.equal({
        total: 3
      });
    });
  });

  describe("Fetching Descended Sorted by Name with Offset and Limit", function () {
    before(function (done) {
      Agent.request("GET", "/people?order=-name&page[offset]=1&page[limit]=3").accept("application/vnd.api+json").promise().then(function (response) {
        res = response;
        done();
      })["catch"](done);
    });

    it("Should have ", function () {
      (0, _chai.expect)(res.body.data.map(function (it) {
        return it.attributes.name;
      })).to.deep.equal(["Jane Doe", "Doug Wilson"]);
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
//require('./base-format');
// require('./extensions');
// require('./recommendations');
*/