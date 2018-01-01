"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const Resource_1 = require("../../../src/types/Resource");
const ResourceSet_1 = require("../../../src/types/ResourceSet");
describe("ResourceSet type", () => {
    const item1 = new Resource_1.default("a", "1");
    const item2 = new Resource_1.default("b", "2");
    const set1 = ResourceSet_1.default.of({ data: item1 });
    const set2 = ResourceSet_1.default.of({ data: [item1, item2] });
    const mapper = it => { it.type = it.type + 'here'; return it; };
    const asyncMapper = it => Promise.resolve(mapper(it));
    describe("map", () => {
        it("should return a ResourceSet instance", () => {
            chai_1.expect(set1.map(mapper)).to.be.an.instanceof(ResourceSet_1.default);
        });
    });
    describe("mapAsync", () => {
        it("should produce a promise for the result of a normal map", () => {
            return set2.mapAsync(asyncMapper).then(mapped => {
                chai_1.expect(mapped).to.deep.equal(set2.map(mapper));
            });
        });
    });
});
