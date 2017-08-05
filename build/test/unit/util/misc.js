"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const utils = require("../../../src/util/misc");
describe("Utility methods", () => {
    describe("deleteNested", () => {
        const obj = { "contact": { "phone": "310" }, "top-level": true };
        const deletion = utils.deleteNested("contact.phone", obj);
        it("should delete a nested property when present", () => {
            chai_1.expect(obj.contact.phone).to.equal(undefined);
        });
        it("should work on non-nested properties too", () => {
            utils.deleteNested("top-level", obj);
            chai_1.expect(obj["top-level"]).to.be.undefined;
        });
        it("should return true if deletion succeeds", () => {
            chai_1.expect(deletion).to.be.true;
        });
        it("should return false if deletion fails", () => {
            chai_1.expect(utils.deleteNested("contact.twitter", obj)).to.be.false;
        });
    });
    describe("isSubsetOf", () => {
        it("should return true for two equal arrays", () => {
            chai_1.expect(utils.isSubsetOf([1, 2, 3], [1, 2, 3])).to.be.true;
        });
        it("should return true for strict subsets", () => {
            chai_1.expect(utils.isSubsetOf(["test", "bob", 3], ["test", 3])).to.be.true;
        });
        it("should return false for non-subsets", () => {
            chai_1.expect(utils.isSubsetOf(["myprop", "bob"], ["john", "mary"])).to.be.false;
        });
        it("should handle duplicate elements in either argument", () => {
            chai_1.expect(utils.isSubsetOf(["test", 3, 3], ["test", 3])).to.be.true;
            chai_1.expect(utils.isSubsetOf(["test", 3], [3, 3])).to.be.true;
            chai_1.expect(utils.isSubsetOf(["test", 3], ["test", 3, 3])).to.be.true;
        });
        it("should treat values differently even if they have equal string representations", () => {
            chai_1.expect(utils.isSubsetOf(["test", "3"], ["test", 3])).to.be.false;
            chai_1.expect(utils.isSubsetOf(["false"], [false])).to.be.false;
            chai_1.expect(utils.isSubsetOf(["false"], [0])).to.be.false;
        });
    });
    describe("pseudoTopSort", function () {
        it("should sort the items correctly", function () {
            const nodes = ["c", "b", "f", "a", "d", "e"];
            const roots = ["a", "d", "f"];
            const edges = { "a": { "b": true }, "b": { "c": true }, "d": { "e": true } };
            const sorted = utils.pseudoTopSort(nodes, edges, roots);
            chai_1.expect(sorted.length).to.equal(6);
            chai_1.expect(nodes.every(function (node) {
                return sorted.indexOf(node) > -1;
            })).to.be.true;
            chai_1.expect(sorted.indexOf("b")).to.be.gt(sorted.indexOf("a"));
            chai_1.expect(sorted.indexOf("c")).to.be.gt(sorted.indexOf("b"));
            chai_1.expect(sorted.indexOf("e")).to.be.gt(sorted.indexOf("d"));
        });
    });
});
