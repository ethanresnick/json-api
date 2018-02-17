import { expect } from "chai";
import mongoose = require("mongoose");
import APIError from "../../../../src/types/APIError";
import { AndPredicate } from "../../../../src/types";
import MongooseAdapter from "../../../../src/db-adapters/Mongoose/MongooseAdapter";

describe("Mongoose Adapter", () => {
  describe("its instances methods", () => {
    describe("getModel", () => {
      it("should throw an exception for unknown models", () => {
        const adapter = new MongooseAdapter({});
        expect(() => { adapter.getModel("x"); }).to.throw(/model .+ has not been registered/);
      });
    });
  });

  describe("its static methods", () => {
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

    describe("assertIdsValid", () => {
      it("should return void on empty input, a valid id, or valid ids", () => {
        const basicPredicate = {
          operator: <"and">"and",
          value: [{ field: "a", value: <any>"b", operator: "eq"}],
          field: undefined
        };

        const validInputs = [
          basicPredicate,
          {
            ...basicPredicate,
            values: basicPredicate.value.concat({
              field: "id",
              value: "552c5e1c604d41e5836bb174",
              operator: 'eq'
            })
          },
          {
            ...basicPredicate,
            values: basicPredicate.value.concat({
              field: "id",
              value: ["552c5e1c604d41e5836bb174", "552c5e1c604d41e5836bb175"],
              operator: 'in'
            })
          }
        ];

        const results = validInputs.map(it =>
          // tslint:disable-next-line: no-void-expression
          MongooseAdapter.assertIdsValid((it as any as AndPredicate), true));

        expect(results.every(it => it === undefined)).to.be.true;
      });

      it("should throw on an invalid id, or if any id in an array is invalid", () => {
        const fn = () => {
          MongooseAdapter.assertIdsValid({
            operator: <"and">"and",
            value: [
              { field: "a", value: <any>"b", operator: "eq"},
              { field: "id", value: "1", operator: "eq"}
            ],
            field: undefined
          }, true);
        }

        expect(fn).to.throw(APIError);

        const fn2 = () => {
          MongooseAdapter.assertIdsValid({
            operator: <"and">"and",
            value: [
              { field: "a", value: "b", operator: "eq"},
              { field: "id", value: ["1", "552c5e1c604d41e5836bb174"], operator: "in"}
            ],
            field: undefined
          }, false);
        };

        expect(fn2).to.throw(APIError);
      });
    });

    describe("idIsValid", () => {
      it("should reject all == null input", () => {
        expect((<any>MongooseAdapter).idIsValid()).to.be.false;
        expect(MongooseAdapter.idIsValid(null)).to.be.false;
        expect(MongooseAdapter.idIsValid(undefined)).to.be.false;
      });

      it("should reject bad input type", () => {
        expect(MongooseAdapter.idIsValid(true)).to.be.false;
      });

      it("should reject empty string", () => {
        expect(MongooseAdapter.idIsValid("")).to.be.false;
      });

      // the string coming into the MongooseAdapter needs to be the 24-character,
      // hex encoded version of the ObjectId, not an arbitrary 12 byte string.
      it("should reject 12-character strings", () => {
        expect(MongooseAdapter.idIsValid("aaabbbccc111")).to.be.false;
      });

      it("should reject numbers", () => {
        expect(MongooseAdapter.idIsValid(1)).to.be.false;
      });

      it("should accpet valid hex string", () => {
        expect(MongooseAdapter.idIsValid("552c5e1c604d41e5836bb175")).to.be.true;
      });
    });

    describe("getStandardizedSchema", () => {
      let schemaRaw: any;
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
          }],
          "arrayObjectId": [
            { type: mongoose.Schema.Types.ObjectId, ref: "Test" }
          ],
          "stringArray": [String]
        };

        // need to compile it, as a schema and a model, before reading.
        const model = mongoose.model("Test", new mongoose.Schema(schemaRaw));
        standardizedSchema = MongooseAdapter.getStandardizedSchema(model);
      });

      after(() => {
        // must access private .models prop below to remove a model.
        // See https://github.com/Automattic/mongoose/issues/2874
        delete (<any>mongoose).models.Test;
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
        expect(fields.arrayObjectId.validation.oneOf).to.be.undefined;
        expect(fields.stringArray.validation.oneOf).to.be.undefined;
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
