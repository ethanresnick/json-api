"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _sinon = require("sinon");

var _sinon2 = _interopRequireDefault(_sinon);

var _srcTypesResource = require("../../../../src/types/Resource");

var _srcTypesResource2 = _interopRequireDefault(_srcTypesResource);

var _srcTypesCollection = require("../../../../src/types/Collection");

var _srcTypesCollection2 = _interopRequireDefault(_srcTypesCollection);

var _srcDbAdaptersMongooseMongooseAdapter = require("../../../../src/db-adapters/Mongoose/MongooseAdapter");

var _srcDbAdaptersMongooseMongooseAdapter2 = _interopRequireDefault(_srcDbAdaptersMongooseMongooseAdapter);

describe("Mongoose Adapter", function () {
  describe("its instances methods", function () {
    describe("getModel", function () {
      it("should throw an exception for unknown models", function () {
        var adapter = new _srcDbAdaptersMongooseMongooseAdapter2["default"]({});
        (0, _chai.expect)(function () {
          adapter.getModel("x");
        }).to["throw"](/model .+ has not been registered/);
      });
    });
  });

  describe("its static methods", function () {
    var typesToModelNames = {
      "teams": "Team",
      "jobs": "Job",
      "events": "Event",
      "venues": "Venue",
      "related-clubs": "RelatedClub",
      "team-memberships": "TeamMembership"
    };

    describe("getType", function () {
      it("should lowercase & pluralize the model name; use dashes in camelCased names", function () {
        for (var type in typesToModelNames) {
          (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].getType(typesToModelNames[type])).to.equal(type);
        }
      });

      it("should use a custom pluralize if provided", function () {
        var pluralize = function pluralize() {
          return "customplural";
        };
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].getType("TestModel", pluralize)).to.equal("customplural");
      });
    });

    describe("getModelName", function () {
      it("should reverse getType", function () {
        for (var type in typesToModelNames) {
          var modelName = typesToModelNames[type];
          (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].getModelName(type)).to.equal(modelName);
        }
      });

      it("should use a custom singularizer if provided", function () {
        var singularize = function singularize() {
          return "customsingular";
        };
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].getModelName("test-models", singularize)).to.equal("TestCustomsingular");
      });
    });

    describe("getFriendlyName", function () {
      it("should detect camel-cased words, and separate and capitalize each one", function () {
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].toFriendlyName("twitterId")).to.equal("Twitter Id");
      });

      it("should handle dot-separated, nested paths", function () {
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].toFriendlyName("contact.name")).to.equal("Contact Name");
      });

      it("should handle acronyms in names", function () {
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].toFriendlyName("inUSA")).to.equal("In USA");
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].toFriendlyName("isMLBTeam")).to.equal("Is MLB Team");
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].toFriendlyName("thisIsATest")).to.equal("This Is A Test");
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].toFriendlyName("ATest")).to.equal("A Test");
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].toFriendlyName("isCaseB")).to.equal("Is Case B");
      });
    });
  });
});

/*
describe("docToResource", () => {
  it("should remove _id, __v, __t; use id as the id; and call toObject", () => {
    const type = "myType";
    docStub = {
      id: "blah2",
      prop: "val",
      _id: "blah",
      __t: "blah4",
      __v: "blah3",
      toObject: sinon.spy(() => {
        return {_id: this._id, __v: this.__v, __t: this.__t, prop:"valToObject"};
      }
    }
       // above, toObject doesn"t copy over id, which may be "virtual"
     resource = MongooseAdapter.docToResource(doc, type, []);
     expect(MongooseAdapter.docToResource).to.be.a("function");
    expect(resource).to.be.an.instanceof(Resource);
    expect(doc.toObject.callCount).to.equal(1);
    expect(resource.attrs.prop).to.equal("valToObject");
    expect(resource.attrs._id).to.be.undefined;
    expect(resource.attrs.__v).to.be.undefined;
    expect(resource.attrs.__t).to.be.undefined;
    expect(resource.id).to.equal("blah2");
  });
});*/