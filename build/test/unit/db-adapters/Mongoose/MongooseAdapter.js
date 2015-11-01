"use strict";

var _Object$keys = require("babel-runtime/core-js/object/keys")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _srcTypesAPIError = require("../../../../src/types/APIError");

var _srcTypesAPIError2 = _interopRequireDefault(_srcTypesAPIError);

var _mongoose = require("mongoose");

var _mongoose2 = _interopRequireDefault(_mongoose);

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

    describe("getIdQueryType", function () {
      it("should handle null input", function () {
        var res = _srcDbAdaptersMongooseMongooseAdapter2["default"].getIdQueryType();
        (0, _chai.expect)(res[0]).to.equal("find");
        (0, _chai.expect)(res[1]).to.be.undefined;
      });

      describe("string", function () {
        it("should throw on invalid input", function () {
          var fn = function fn() {
            _srcDbAdaptersMongooseMongooseAdapter2["default"].getIdQueryType("1");
          };
          (0, _chai.expect)(fn).to["throw"](_srcTypesAPIError2["default"]);
        });

        it("should produce query on valid input", function () {
          var res = _srcDbAdaptersMongooseMongooseAdapter2["default"].getIdQueryType("552c5e1c604d41e5836bb174");
          (0, _chai.expect)(res[0]).to.equal("findOne");
          (0, _chai.expect)(res[1]._id).to.equal("552c5e1c604d41e5836bb174");
        });
      });

      describe("array", function () {
        it("should throw if any ids are invalid", function () {
          var fn = function fn() {
            _srcDbAdaptersMongooseMongooseAdapter2["default"].getIdQueryType(["1", "552c5e1c604d41e5836bb174"]);
          };
          (0, _chai.expect)(fn).to["throw"](_srcTypesAPIError2["default"]);
        });

        it("should produce query on valid input", function () {
          var res = _srcDbAdaptersMongooseMongooseAdapter2["default"].getIdQueryType(["552c5e1c604d41e5836bb174", "552c5e1c604d41e5836bb175"]);
          (0, _chai.expect)(res[0]).to.equal("find");
          (0, _chai.expect)(res[1]._id.$in).to.be.an.Array;
          (0, _chai.expect)(res[1]._id.$in[0]).to.equal("552c5e1c604d41e5836bb174");
          (0, _chai.expect)(res[1]._id.$in[1]).to.equal("552c5e1c604d41e5836bb175");
        });
      });
    });

    describe("idIsValid", function () {
      it("should reject all == null input", function () {
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].idIsValid()).to.not.be.ok;
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].idIsValid(null)).to.not.be.ok;
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].idIsValid(undefined)).to.not.be.ok;
      });

      it("should reject bad input type", function () {
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].idIsValid(true)).to.not.be.ok;
      });

      it("should reject empty string", function () {
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].idIsValid("")).to.not.be.ok;
      });

      // the string coming into the MongooseAdapter needs to be the 24-character,
      // hex encoded version of the ObjectId, not an arbitrary 12 byte string.
      it("should reject 12-character strings", function () {
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].idIsValid("aaabbbccc111")).to.not.be.ok;
      });

      it("should reject numbers", function () {
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].idIsValid(1)).to.not.be.ok;
      });

      it("should accpet valid hex string", function () {
        (0, _chai.expect)(_srcDbAdaptersMongooseMongooseAdapter2["default"].idIsValid("552c5e1c604d41e5836bb175")).to.be.ok;
      });
    });

    describe("getStandardizedSchema", function () {
      var schemaRaw = undefined;
      var standardizedSchema = undefined;

      before(function () {
        schemaRaw = {
          "valuesEnum": {
            type: String,
            "enum": {
              values: ["c", "d"]
            }
          },
          "noValuesEnum": {
            type: String,
            "enum": ["a", "b"]
          },
          "arrayValuesEnum": [{
            type: String,
            "enum": {
              values: ["e", "f"]
            }
          }],
          "arrayNoValuesEnum": [{
            type: String,
            "enum": ["g", "h"]
          }],
          "nonEnumNumber": {
            type: Number,
            "default": 4
          },
          "nonEnumString": {
            type: String,
            "default": 4
          },
          "arrayNonEnum": [{
            type: Number
          }]
        };

        // need to compile it, as a schema and a model, before reading.
        var model = _mongoose2["default"].model("Test", _mongoose2["default"].Schema(schemaRaw));
        standardizedSchema = _srcDbAdaptersMongooseMongooseAdapter2["default"].getStandardizedSchema(model);
      });

      after(function () {
        delete _mongoose2["default"].models.Test;
      });

      it("should return an array of fields", function () {
        var expectedFieldCount = _Object$keys(schemaRaw).length + 1; //+1 for _id

        (0, _chai.expect)(standardizedSchema).to.be.an("array");
        (0, _chai.expect)(standardizedSchema).to.have.length(expectedFieldCount);
      });

      it("should work with all the ways of declaring enums", function () {
        var fields = standardizedSchema.reduce(function (prev, field) {
          prev[field.name] = field;return prev;
        }, {});

        // Mongoose only supports the enum validator on string fields, but it
        // supports it with two different declaration syntaxes and for single
        // strings or arrays of strings. That leads to four formats to test.
        (0, _chai.expect)(fields.valuesEnum.validation.oneOf).to.deep.equal(["c", "d"]);
        (0, _chai.expect)(fields.noValuesEnum.validation.oneOf).to.deep.equal(["a", "b"]);
        (0, _chai.expect)(fields.arrayValuesEnum.validation.oneOf).to.deep.equal(["e", "f"]);
        (0, _chai.expect)(fields.arrayNoValuesEnum.validation.oneOf).to.deep.equal(["g", "h"]);
        (0, _chai.expect)(fields.nonEnumNumber.validation.oneOf).to.be.undefined;
        (0, _chai.expect)(fields.nonEnumString.validation.oneOf).to.be.undefined;
        (0, _chai.expect)(fields.arrayNonEnum.validation.oneOf).to.be.undefined;
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