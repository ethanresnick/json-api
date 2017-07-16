"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const chai_1 = require("chai");
const utils = require("../../../src/util/type-handling");
const Resource_1 = require("../../../src/types/Resource");
const Collection_1 = require("../../../src/types/Collection");
describe("Utility methods", () => {
    describe("mapResources", () => {
        it("should call the map function on a single resource", () => {
            let mapper = sinon.spy((it) => it);
            let resource = new Resource_1.default("tests", "43");
            utils.mapResources(resource, mapper);
            chai_1.expect(mapper.calledOnce).to.be.true;
            chai_1.expect(mapper.calledWith(resource)).to.be.true;
        });
        it("should call the map function on each resource in a collection", () => {
            let mapper = sinon.spy((it) => it);
            let resources = [new Resource_1.default("tests", "43"), new Resource_1.default("tests", "44")];
            let collection = new Collection_1.default(resources);
            utils.mapResources(collection, mapper);
            chai_1.expect(mapper.callCount).to.equal(2);
            chai_1.expect(mapper.calledWith(resources[0])).to.be.true;
            chai_1.expect(mapper.calledWith(resources[1])).to.be.true;
        });
        it("should return the mapped output", () => {
            let mapper = sinon.spy((it) => it.id);
            let resources = [new Resource_1.default("tests", "43"), new Resource_1.default("tests", "44")];
            let collection = new Collection_1.default(resources);
            chai_1.expect(utils.mapResources(collection, mapper)).to.deep.equal(["43", "44"]);
            chai_1.expect(utils.mapResources(resources[0], mapper)).to.equal("43");
        });
    });
    describe.skip("forEachArrayOrVal", () => {
        it("should call the each function on a single value");
        it("should call the each function on each value in an array");
        it("should return void");
    });
    describe("objectIsEmpty", () => {
        it.skip("should return false on an object with direct properties");
        it.skip("should return true if the object only has prototype properties");
    });
    describe("ValueObject", () => {
        describe("the constructor function it produces", () => {
            let x = function x() {
                this.allowedProp = null;
                Object.defineProperty(this, "otherValidProp", { writable: true, enumerable: true });
            };
            let WrappedConstructor = utils.ValueObject(x);
            it("should use provided initial values", () => {
                let it = WrappedConstructor({ allowedProp: "14" });
                chai_1.expect(it.allowedProp).to.equal("14");
            });
            it("should ignore initial values for unknown property names", () => {
                let it = WrappedConstructor({ notAValidProperty: "14" });
                chai_1.expect(it.notAValidProperty).to.be.undefined;
            });
            it("should prevent adding new properties to the object", () => {
                let it = WrappedConstructor();
                chai_1.expect(() => it.notAValidContextProperty = 4).to.throw(TypeError);
            });
            it("should allow the values of existing properties to change", () => {
                let it = WrappedConstructor();
                it.allowedProp = 9;
                it.otherValidProp = 7;
                chai_1.expect(it.allowedProp).to.equal(9);
                chai_1.expect(it.otherValidProp).to.equal(7);
            });
        });
    });
});
