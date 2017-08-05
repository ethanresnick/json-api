"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const utils = require("../../../src/util/arrays");
describe("Utility methods", () => {
    describe("arrayUnique", () => {
        it("should remove duplicate primitive values", () => {
            const uniqueSorted = utils.arrayUnique(["2", true, "bob", "2"]).sort();
            chai_1.expect(uniqueSorted).to.deep.equal(["2", true, "bob"].sort());
        });
        it("should not coerce types", () => {
            const uniqueSorted = utils.arrayUnique(["2", true, "true", 2]).sort();
            chai_1.expect(uniqueSorted).to.deep.equal(["2", true, "true", 2].sort());
        });
        it("should compare objects by identity, not contents", () => {
            const arr1 = [];
            const arr2 = [];
            chai_1.expect(utils.arrayUnique([arr1, arr2])).to.have.length(2);
        });
        it("should remove duplicate objects", () => {
            const r = {};
            chai_1.expect(utils.arrayUnique([r, r])).to.have.length(1);
        });
    });
    describe("arrayValuesMatch", () => {
        it.skip("should work");
    });
    describe("arrayContains", () => {
        it.skip("should return whether an array contains the value", () => {
        });
    });
});
