"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const lib_1 = require("../../../../src/db-adapters/Mongoose/lib");
describe("Mongoose Adapter private helper functions", () => {
    describe("toMongoCriteria", () => {
        describe("predicates", () => {
            it("should return empty objects for predicates with empty arguments", () => {
                const or = { field: undefined, value: [], operator: "or" };
                const and = { field: undefined, value: [], operator: "and" };
                chai_1.expect(lib_1.toMongoCriteria(or)).to.deep.equal({});
                chai_1.expect(lib_1.toMongoCriteria(and)).to.deep.equal({});
            });
        });
        it("should support multiple operators for the same field", () => {
            const testPredicate = {
                operator: "and",
                value: [
                    { field: "field", value: "value", operator: "eq" },
                    { field: "field", value: "value", operator: "neq" },
                    { field: "field", value: "value", operator: "gte" },
                    {
                        operator: "or",
                        value: [
                            { field: "field", value: "value2", operator: "eq" },
                            { field: "field3", value: 1, operator: "gte" }
                        ],
                        field: undefined
                    }
                ],
                field: undefined
            };
            chai_1.expect(lib_1.toMongoCriteria(testPredicate)).to.deep.equal({
                $and: [
                    { field: "value" },
                    { field: { $ne: "value" } },
                    { field: { $gte: "value" } },
                    { $or: [{ field: "value2" }, { field3: { $gte: 1 } }] }
                ]
            });
        });
        it("should support multiple filters with the same operator + field", () => {
            chai_1.expect(lib_1.toMongoCriteria({
                operator: 'and',
                value: [{ field: 'id2', operator: 'eq', value: '23' },
                    { field: 'id2', operator: 'in', value: ['1', '2'] },
                    { field: 'id2', operator: 'eq', value: '33' }],
                field: undefined
            })).to.deep.equal({
                $and: [
                    { id2: "23" },
                    { id2: { $in: ['1', '2'] } },
                    { id2: '33' }
                ]
            });
        });
        it("should transform filters on id to filters on _id", () => {
            chai_1.expect(lib_1.toMongoCriteria({
                operator: 'and',
                value: [{ field: 'id', operator: 'eq', value: '33' }],
                field: undefined
            })).to.deep.equal({
                $and: [
                    { _id: "33" }
                ]
            });
        });
        it("should support nested predicates", () => {
            const testPredicate = {
                operator: "and",
                value: [
                    { field: "field", value: "value", operator: "eq" },
                    {
                        operator: "or",
                        value: [
                            {
                                operator: "and",
                                value: [{ field: "field2", value: "varlu2", operator: "eq" }],
                                field: undefined
                            },
                            { field: "field3", value: 1, operator: "gte" }
                        ],
                        field: undefined
                    }
                ],
                field: undefined
            };
            chai_1.expect(lib_1.toMongoCriteria(testPredicate)).to.deep.equal({
                $and: [
                    { field: "value" },
                    {
                        $or: [
                            { $and: [{ field2: "varlu2" }] },
                            { field3: { $gte: 1 } }
                        ]
                    }
                ]
            });
        });
    });
});
