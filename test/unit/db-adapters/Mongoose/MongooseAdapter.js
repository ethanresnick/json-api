import Q from "q";
import {expect} from "chai";
import APIError from "../../../../src/types/APIError";
import mongoose from "mongoose";
import MongooseAdapter from "../../../../src/db-adapters/Mongoose/MongooseAdapter";

const School = mongoose.model('School');
const NumericId = mongoose.model('NumericId');
const StringId = mongoose.model('StringId');

describe("Mongoose Adapter", () => {
  describe("its instances methods", () => {
    describe("getModel", () => {
      it("should throw an exception for unknown models", () => {
        let adapter = new MongooseAdapter({});
        expect(() => { adapter.getModel("x"); }).to.throw(/model .+ has not been registered/);
      });
    });
  });

  describe("its static methods", () => {
    const typesToModelNames = {
      "teams": "Team",
      "jobs": "Job",
      "events": "Event",
      "venues": "Venue",
      "related-clubs": "RelatedClub",
      "team-memberships": "TeamMembership"
    };

    describe("getType", () => {
      it("should lowercase & pluralize the model name; use dashes in camelCased names", () => {
        for(let type in typesToModelNames) {
          expect(MongooseAdapter.getType(typesToModelNames[type])).to.equal(type);
        }
      });

      it("should use a custom pluralize if provided", () => {
        let pluralize = () => "customplural";
        expect(MongooseAdapter.getType("TestModel", pluralize)).to.equal("customplural");
      });
    });

    describe("getModelName", () => {
      it("should reverse getType", () => {
        for(let type in typesToModelNames) {
          let modelName = typesToModelNames[type];
          expect(MongooseAdapter.getModelName(type)).to.equal(modelName);
        }
      });

      it("should use a custom singularizer if provided", () => {
        let singularize = () => "customsingular";
        expect(MongooseAdapter.getModelName("test-models", singularize)).to.equal("TestCustomsingular");
      });
    });

    describe("getFriendlyName", () => {
      it("should detect camel-cased words, and separate and capitalize each one", () => {
        expect(MongooseAdapter.toFriendlyName("twitterId")).to.equal("Twitter Id");
      });

      it("should handle dot-separated, nested paths", () => {
        expect(MongooseAdapter.toFriendlyName("contact.name")).to.equal("Contact Name");
      });

      it("should handle acronyms in names", () => {
        expect(MongooseAdapter.toFriendlyName("inUSA")).to.equal("In USA");
        expect(MongooseAdapter.toFriendlyName("isMLBTeam")).to.equal("Is MLB Team");
        expect(MongooseAdapter.toFriendlyName("thisIsATest")).to.equal("This Is A Test");
        expect(MongooseAdapter.toFriendlyName("ATest")).to.equal("A Test");
        expect(MongooseAdapter.toFriendlyName("isCaseB")).to.equal("Is Case B");
      });
    });

    describe("getIdQueryType", () => {
      it("should handle null input", function(done) {
        MongooseAdapter.getIdQueryType(null, School).then(([ mode, idQuery ]) => {
          expect(mode).to.equal("find");
          expect(idQuery).to.be.undefined;
          done();
        }).catch(done);
      });

      describe("string", () => {
        it("should reject on invalid ObjectId input", function(done) {
          MongooseAdapter.getIdQueryType("1", School).then(res => {
            expect(false).to.be.ok;
          }, err => {
            expect(err).to.be.instanceof(APIError);
            done();
          }).catch(done);
        });

        it("should reject on invalid numeric ID input", function(done) {
          MongooseAdapter.getIdQueryType("123abc", NumericId).then(res => {
            expect(false).to.be.ok;
          }, err => {
            expect(err).to.be.instanceof(APIError);
            done();
          }).catch(done);
        });

        it("should produce query on valid ObjectId input", function(done) {
          MongooseAdapter.getIdQueryType("552c5e1c604d41e5836bb174", School).then(([ mode, idQuery ]) => {
            expect(mode).to.equal("findOne");
            expect(idQuery._id).to.equal("552c5e1c604d41e5836bb174");
            done();
          }).catch(done);
        });

        it("should produce query on valid numeric ID input", function(done) {
          MongooseAdapter.getIdQueryType("0", NumericId).then(([ mode, idQuery ]) => {
            expect(mode).to.equal("findOne");
            expect(idQuery._id).to.equal("0");
            done();
          }).catch(done);
        });

        it("should produce query on valid string ID input", function(done) {
          MongooseAdapter.getIdQueryType("null", StringId).then(([ mode, idQuery ]) => {
            expect(mode).to.equal("findOne");
            expect(idQuery._id).to.equal("null");
            done();
          }).catch(done);
        });
      });

      describe("array", () => {
        it("should throw if any ObjectIds are invalid", function(done) {
          MongooseAdapter.getIdQueryType(["1", "552c5e1c604d41e5836bb174"], School).then(res => {
            expect(false).to.be.ok;
          }, err => {
            expect(err).to.be.instanceof(APIError);
            done();
          }).catch(done);
        });

        it("should throw if any numeric ids are invalid", function(done) {
          MongooseAdapter.getIdQueryType(["abc", "123"], NumericId).then(res => {
            expect(false).to.be.ok;
          }, err => {
            expect(err).to.be.instanceof(APIError);
            done();
          }).catch(done);
        });

        it("should produce query on valid ObjectId input", function(done) {
          MongooseAdapter.getIdQueryType(["552c5e1c604d41e5836bb174", "552c5e1c604d41e5836bb175"], School).then(([ mode, idQuery ]) => {
            expect(mode).to.equal("find");
            expect(idQuery._id.$in).to.be.an.Array;
            expect(idQuery._id.$in[0]).to.equal("552c5e1c604d41e5836bb174");
            expect(idQuery._id.$in[1]).to.equal("552c5e1c604d41e5836bb175");
            done();
          }).catch(done);
        });

        it("should produce query on valid numeric ID input", function(done) {
          MongooseAdapter.getIdQueryType(["0", "1"], NumericId).then(([ mode, idQuery ]) => {
            expect(mode).to.equal("find");
            expect(idQuery._id.$in).to.be.an.Array;
            expect(idQuery._id.$in[0]).to.equal("0");
            expect(idQuery._id.$in[1]).to.equal("1");
            done();
          }).catch(done);
        });

        it("should produce query on valid string ID input", function(done) {
          MongooseAdapter.getIdQueryType(["a", "null"], StringId).then(([ mode, idQuery ]) => {
            expect(mode).to.equal("find");
            expect(idQuery._id.$in).to.be.an.Array;
            expect(idQuery._id.$in[0]).to.equal("a");
            expect(idQuery._id.$in[1]).to.equal("null");
            done();
          }).catch(done);
        });
      });
    });

    describe("idIsValid", () => {
      it("should reject all == null input", function(done) {
        const tests = [
          MongooseAdapter.idIsValid(School),
          MongooseAdapter.idIsValid(NumericId),
          MongooseAdapter.idIsValid(StringId),
          MongooseAdapter.idIsValid(null, School),
          MongooseAdapter.idIsValid(null, NumericId),
          MongooseAdapter.idIsValid(null, StringId),
          MongooseAdapter.idIsValid(undefined, School),
          MongooseAdapter.idIsValid(undefined, NumericId),
          MongooseAdapter.idIsValid(undefined, StringId),
        ];

        Q.allSettled(tests).then((res) => {
          res.forEach(result => expect(result.state).to.equal("rejected"));
          done();
        }).catch(done);
      });

      it("should reject bad input type", function(done) {
        const tests = [
          MongooseAdapter.idIsValid(true, School),
          MongooseAdapter.idIsValid(false, School),
          MongooseAdapter.idIsValid("not hex", School),
          MongooseAdapter.idIsValid([], School),
          MongooseAdapter.idIsValid("1234567890abcdef", School),
          MongooseAdapter.idIsValid(1234567890, School),
          MongooseAdapter.idIsValid("NaN", NumericId),
          MongooseAdapter.idIsValid("one", NumericId),
          MongooseAdapter.idIsValid([], NumericId),
          MongooseAdapter.idIsValid(true, NumericId),
          MongooseAdapter.idIsValid(false, NumericId)
          // StringId should except anything != null
        ];

        Q.allSettled(tests).then((res) => {
          res.forEach(result => expect(result.state).to.equal("rejected"));
          done();
        }).catch(done);
      });

      it("should reject empty string", function(done) {
        const tests = [
          MongooseAdapter.idIsValid("", School),
          MongooseAdapter.idIsValid("", NumericId)
          // StringId should except anything != null
        ];

        Q.allSettled(tests).then((res) => {
          res.forEach(result => expect(result.state).to.equal("rejected"));
          done();
        }).catch(done);
      });

      // the string coming into the MongooseAdapter needs to be the 24-character,
      // hex encoded version of the ObjectId, not an arbitrary 12 byte string.
      it("should reject 12-character strings", function(done) {
        MongooseAdapter.idIsValid("aaabbbccc111", School)
          .then(() => expect(false).to.be.ok)
          .catch(() => done());
      });

      it("should accpet valid IDs", function(done) {
        const tests = [
          MongooseAdapter.idIsValid("552c5e1c604d41e5836bb175", School),
          MongooseAdapter.idIsValid("123", NumericId),
          MongooseAdapter.idIsValid(123, NumericId),
          MongooseAdapter.idIsValid("0", NumericId),
          MongooseAdapter.idIsValid(0, NumericId),
          MongooseAdapter.idIsValid("0", StringId),
          MongooseAdapter.idIsValid("null", StringId)
        ];

        Q.all(tests).then((res) => done(), done);
      });
    });

    describe("getStandardizedSchema", () => {
      let schemaRaw;
      let standardizedSchema;

      before(() => {
        schemaRaw = {
          "valuesEnum": {
            type: String,
            enum: {
              values: ["c", "d"]
            }
          },
          "noValuesEnum": {
            type: String,
            enum: ["a", "b"]
          },
          "arrayValuesEnum": [{
            type: String,
            enum: {
              values: ["e", "f"]
            }
          }],
          "arrayNoValuesEnum": [{
            type: String,
            enum: ["g", "h"]
          }],
          "nonEnumNumber": {
            type: Number,
            default: 4
          },
          "nonEnumString": {
            type: String,
            default: 4
          },
          "arrayNonEnum": [{
            type: Number
          }]
        };

        // need to compile it, as a schema and a model, before reading.
        const model = mongoose.model("Test", mongoose.Schema(schemaRaw));
        standardizedSchema = MongooseAdapter.getStandardizedSchema(model);
      });

      after(() => {
        delete mongoose.models.Test;
      });

      it("should return an array of fields", () => {
        const expectedFieldCount = Object.keys(schemaRaw).length + 1; //+1 for _id

        expect(standardizedSchema).to.be.an("array");
        expect(standardizedSchema).to.have.length(expectedFieldCount);
      });

      it("should work with all the ways of declaring enums", () => {
        const fields = standardizedSchema.reduce((prev, field) => {
          prev[field.name] = field; return prev;
        }, {});

        // Mongoose only supports the enum validator on string fields, but it
        // supports it with two different declaration syntaxes and for single
        // strings or arrays of strings. That leads to four formats to test.
        expect(fields.valuesEnum.validation.oneOf).to.deep.equal(["c", "d"]);
        expect(fields.noValuesEnum.validation.oneOf).to.deep.equal(["a", "b"]);
        expect(fields.arrayValuesEnum.validation.oneOf).to.deep.equal(["e", "f"]);
        expect(fields.arrayNoValuesEnum.validation.oneOf).to.deep.equal(["g", "h"]);
        expect(fields.nonEnumNumber.validation.oneOf).to.be.undefined;
        expect(fields.nonEnumString.validation.oneOf).to.be.undefined;
        expect(fields.arrayNonEnum.validation.oneOf).to.be.undefined;
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
