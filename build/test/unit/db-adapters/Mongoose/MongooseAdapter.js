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
                let adapter = new MongooseAdapter_1.default({});
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
                for (let type in typesToModelNames) {
                    chai_1.expect(MongooseAdapter_1.default.getType(typesToModelNames[type])).to.equal(type);
                }
            });
            it("should use a custom pluralize if provided", () => {
                let pluralize = () => "customplural";
                chai_1.expect(MongooseAdapter_1.default.getType("TestModel", pluralize)).to.equal("customplural");
            });
        });
        describe("getModelName", () => {
            it("should reverse getType", () => {
                for (let type in typesToModelNames) {
                    let modelName = typesToModelNames[type];
                    chai_1.expect(MongooseAdapter_1.default.getModelName(type)).to.equal(modelName);
                }
            });
            it("should use a custom singularizer if provided", () => {
                let singularize = () => "customsingular";
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
        describe("getIdQueryType", () => {
            it("should handle null input", () => {
                const res = MongooseAdapter_1.default.getIdQueryType();
                chai_1.expect(res[0]).to.equal("find");
                chai_1.expect(res[1]).to.be.undefined;
            });
            describe("string", () => {
                it("should throw on invalid input", () => {
                    const fn = function () { MongooseAdapter_1.default.getIdQueryType("1"); };
                    chai_1.expect(fn).to.throw(APIError_1.default);
                });
                it("should produce query on valid input", () => {
                    const res = MongooseAdapter_1.default.getIdQueryType("552c5e1c604d41e5836bb174");
                    chai_1.expect(res[0]).to.equal("findOne");
                    chai_1.expect(res[1]._id).to.equal("552c5e1c604d41e5836bb174");
                });
            });
            describe("array", () => {
                it("should throw if any ids are invalid", () => {
                    const fn = function () { MongooseAdapter_1.default.getIdQueryType(["1", "552c5e1c604d41e5836bb174"]); };
                    chai_1.expect(fn).to.throw(APIError_1.default);
                });
                it("should produce query on valid input", () => {
                    const res = MongooseAdapter_1.default.getIdQueryType(["552c5e1c604d41e5836bb174", "552c5e1c604d41e5836bb175"]);
                    chai_1.expect(res[0]).to.equal("find");
                    chai_1.expect(res[1]._id.$in).to.be.an('array');
                    chai_1.expect(res[1].$in[0]).to.equal("552c5e1c604d41e5836bb174");
                    chai_1.expect(res[1].$in[1]).to.equal("552c5e1c604d41e5836bb175");
                });
            });
        });
        describe("idIsValid", () => {
            it("should reject all == null input", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid()).to.not.be.ok;
                chai_1.expect(MongooseAdapter_1.default.idIsValid(null)).to.not.be.ok;
                chai_1.expect(MongooseAdapter_1.default.idIsValid(undefined)).to.not.be.ok;
            });
            it("should reject bad input type", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid(true)).to.not.be.ok;
            });
            it("should reject empty string", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid("")).to.not.be.ok;
            });
            it("should reject 12-character strings", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid("aaabbbccc111")).to.not.be.ok;
            });
            it("should reject numbers", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid(1)).to.not.be.ok;
            });
            it("should accpet valid hex string", () => {
                chai_1.expect(MongooseAdapter_1.default.idIsValid("552c5e1c604d41e5836bb175")).to.be.ok;
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
