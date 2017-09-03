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
