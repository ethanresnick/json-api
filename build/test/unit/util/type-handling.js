"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const utils = require("../../../src/util/type-handling");
describe("Utility methods", () => {
    describe.skip("forEachArrayOrVal", () => {
        it("should call the each function on a single value");
        it("should call the each function on each value in an array");
        it("should return void");
    });
    describe("objectIsEmpty", () => {
        it("should return false on an object with direct properties", () => {
            chai_1.expect(utils.objectIsEmpty({ test: true })).to.be.false;
        });
        it("should return true if the object only has prototype properties", () => {
            chai_1.expect(utils.objectIsEmpty({})).to.be.true;
            chai_1.expect(utils.objectIsEmpty(Object.create({ test: true }))).to.be.true;
        });
    });
});
