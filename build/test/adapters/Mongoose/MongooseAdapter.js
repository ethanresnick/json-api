"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var chai = _interopRequire(require("chai"));

var sinon = _interopRequire(require("sinon"));

var Resource = _interopRequire(require("../../../src/types/Resource"));

var Collection = _interopRequire(require("../../../src/types/Collection"));

var MongooseAdapter = _interopRequire(require("../../../src/adapters/Mongoose/MongooseAdapter"));

var expect = chai.expect;

describe("Mongoose Adapter", function () {
  describe("its static methods", function () {
    var typesToModelNames = {
      teams: "Team",
      jobs: "Job",
      events: "Event",
      venues: "Venue",
      "related-clubs": "RelatedClub",
      "team-memberships": "TeamMembership"
    };

    describe("getType", function () {
      it("should lowercase & pluralize the model name; use dashes in camelCased names", function () {
        for (var type in typesToModelNames) {
          expect(MongooseAdapter.getType(typesToModelNames[type])).to.equal(type);
        }
      });

      it("should use a custom pluralize if provided", function () {
        var pluralize = function () {
          return "customplural";
        };
        expect(MongooseAdapter.getType("TestModel", pluralize)).to.equal("customplural");
      });
    });

    describe("getModelName", function () {
      it("should reverse getType", function () {
        for (var type in typesToModelNames) {
          var modelName = typesToModelNames[type];
          expect(MongooseAdapter.getModelName(type)).to.equal(modelName);
        }
      });

      it("should use a custom singularizer if provided", function () {
        var singularize = function () {
          return "customsingular";
        };
        expect(MongooseAdapter.getModelName("test-models", singularize)).to.equal("TestCustomsingular");
      });
    });

    describe("getFriendlyName", function () {
      it("should detect camel-cased words, and separate and capitalize each one", function () {
        expect(MongooseAdapter.toFriendlyName("twitterId")).to.equal("Twitter Id");
      });

      it("should handle dot-separated, nested paths", function () {
        expect(MongooseAdapter.toFriendlyName("contact.name")).to.equal("Contact Name");
      });

      it("should handle acronyms in names", function () {
        expect(MongooseAdapter.toFriendlyName("inUSA")).to.equal("In USA");
        expect(MongooseAdapter.toFriendlyName("isMLBTeam")).to.equal("Is MLB Team");
        expect(MongooseAdapter.toFriendlyName("thisIsATest")).to.equal("This Is A Test");
        expect(MongooseAdapter.toFriendlyName("ATest")).to.equal("A Test");
        expect(MongooseAdapter.toFriendlyName("isCaseB")).to.equal("Is Case B");
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