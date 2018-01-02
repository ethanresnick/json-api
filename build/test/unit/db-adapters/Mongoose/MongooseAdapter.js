"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mongoose = require("mongoose");
const APIError_1 = require("../../../../src/types/APIError");
const MongooseAdapter_1 = require("../../../../src/db-adapters/Mongoose/MongooseAdapter");
describe("Mongoose Adapter", () => {
    describe("its instances methods", () => {
        describe("getModel", () => {
            it("should throw an exception for unknown models", () => {
                const adapter = new MongooseAdapter_1.default({});
                chai_1.expect(() => { adapter.getModel("x"); }).to.throw(/model .+ has not been registered/);
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
                for (const type in typesToModelNames) {
                    chai_1.expect(MongooseAdapter_1.default.getType(typesToModelNames[type])).to.equal(type);
                }
            });
            it("should use a custom pluralize if provided", () => {
                const pluralize = () => "customplural";
                chai_1.expect(MongooseAdapter_1.default.getType("TestModel", pluralize)).to.equal("customplural");
            });
        });
        describe("getModelName", () => {
            it("should reverse getType", () => {
                for (const type in typesToModelNames) {
                    const modelName = typesToModelNames[type];
                    chai_1.expect(MongooseAdapter_1.default.getModelName(type)).to.equal(modelName);
                }
            });
            it("should use a custom singularizer if provided", () => {
                const singularize = () => "customsingular";
                chai_1.expect(MongooseAdapter_1.default.getModelName("test-models", singularize)).to.equal("TestCustomsingular");
            });
        });
        describe("getFriendlyName", () => {
            it("should detect camel-cased words, and separate and capitalize each one", () => {
                chai_1.expect(MongooseAdapter_1.default.toFriendlyName("twitterId")).to.equal("Twitter Id");
            });
            it("should handle dot-separated, nested paths", () => {
                chai_1.expect(MongooseAdapter_1.default.toFriendlyName("contact.name")).to.equal("Contact Name");
            });
            it("should handle acronyms in names", () => {
                chai_1.expect(MongooseAdapter_1.default.toFriendlyName("inUSA")).to.equal("In USA");
                chai_1.expect(MongooseAdapter_1.default.toFriendlyName("isMLBTeam")).to.equal("Is MLB Team");
                chai_1.expect(MongooseAdapter_1.default.toFriendlyName("thisIsATest")).to.equal("This Is A Test");
                chai_1.expect(MongooseAdapter_1.default.toFriendlyName("ATest")).to.equal("A Test");
                chai_1.expect(MongooseAdapter_1.default.toFriendlyName("isCaseB")).to.equal("Is Case B");
            });
        });
        describe("assertIdsValid", () => {
            it("should return void on empty input, a valid id, or valid ids", () => {
                const basicPredicate = {
                    operator: "and",
                    value: [{ field: "a", value: "b", operator: "eq" }],
                    field: undefined
                };
                const validInputs = [
                    basicPredicate,
                    Object.assign({}, basicPredicate, { values: basicPredicate.value.concat({
                            field: "id",
                            value: "552c5e1c604d41e5836bb174",
                            operator: 'eq'
                        }) }),
                    Object.assign({}, basicPredicate, { values: basicPredicate.value.concat({
                            field: "id",
                            value: ["552c5e1c604d41e5836bb174", "552c5e1c604d41e5836bb175"],
                            operator: 'in'
                        }) })
                ];
                const results = validInputs.map(it => MongooseAdapter_1.default.assertIdsValid(it, true));
                chai_1.expect(results.every(it => it === undefined)).to.be.true;
            });
            it("should throw on an invalid id, or if any id in an array is invalid", () => {
                const fn = () => MongooseAdapter_1.default.assertIdsValid({
                    operator: "and",
                    value: [
                        { field: "a", value: "b", operator: "eq" },
                        { field: "id", value: "1", operator: "eq" }
                    ],
                    field: undefined
                }, true);
                chai_1.expect(fn).to.throw(APIError_1.default);
                const fn2 = () => MongooseAdapter_1.default.assertIdsValid({
                    operator: "and",
                    value: [
                        { field: "a", value: "b", operator: "eq" },
                        { field: "id", value: ["1", "552c5e1c604d41e5836bb174"], operator: "in" }
                    ],
                    field: undefined
                }, false);
                chai_1.expect(fn2).to.throw(APIError_1.default);
            });
        });
        describe("idIsValid", () => {
            it("should reject all == null input", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid()).to.be.false;
                chai_1.expect(MongooseAdapter_1.default.idIsValid(null)).to.be.false;
                chai_1.expect(MongooseAdapter_1.default.idIsValid(undefined)).to.be.false;
            });
            it("should reject bad input type", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid(true)).to.be.false;
            });
            it("should reject empty string", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid("")).to.be.false;
            });
            it("should reject 12-character strings", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid("aaabbbccc111")).to.be.false;
            });
            it("should reject numbers", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid(1)).to.be.false;
            });
            it("should accpet valid hex string", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid("552c5e1c604d41e5836bb175")).to.be.true;
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
                        }],
                    "arrayObjectId": [
                        { type: mongoose.Schema.Types.ObjectId, ref: "Test" }
                    ],
                    "stringArray": [String]
                };
                const model = mongoose.model("Test", new mongoose.Schema(schemaRaw));
                standardizedSchema = MongooseAdapter_1.default.getStandardizedSchema(model);
            });
            after(() => {
                delete mongoose.models.Test;
            });
            it("should return an array of fields", () => {
                const expectedFieldCount = Object.keys(schemaRaw).length + 1;
                chai_1.expect(standardizedSchema).to.be.an("array");
                chai_1.expect(standardizedSchema).to.have.length(expectedFieldCount);
            });
            it("should work with all the ways of declaring enums", () => {
                const fields = standardizedSchema.reduce((prev, field) => {
                    prev[field.name] = field;
                    return prev;
                }, {});
                chai_1.expect(fields.valuesEnum.validation.oneOf).to.deep.equal(["c", "d"]);
                chai_1.expect(fields.noValuesEnum.validation.oneOf).to.deep.equal(["a", "b"]);
                chai_1.expect(fields.arrayValuesEnum.validation.oneOf).to.deep.equal(["e", "f"]);
                chai_1.expect(fields.arrayNoValuesEnum.validation.oneOf).to.deep.equal(["g", "h"]);
                chai_1.expect(fields.nonEnumNumber.validation.oneOf).to.be.undefined;
                chai_1.expect(fields.nonEnumString.validation.oneOf).to.be.undefined;
                chai_1.expect(fields.arrayNonEnum.validation.oneOf).to.be.undefined;
                chai_1.expect(fields.arrayObjectId.validation.oneOf).to.be.undefined;
                chai_1.expect(fields.stringArray.validation.oneOf).to.be.undefined;
            });
        });
    });
});
