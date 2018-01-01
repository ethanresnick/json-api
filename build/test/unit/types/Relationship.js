"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const ResourceIdentifier_1 = require("../../../src/types/ResourceIdentifier");
const Relationship_1 = require("../../../src/types/Relationship");
describe("Relationship type", () => {
    const item1 = new ResourceIdentifier_1.default("a", "1");
    const item2 = new ResourceIdentifier_1.default("b", "2");
    const owner = { "type": "b", "id": "2", "path": "test" };
    const rel1 = Relationship_1.default.of({ data: item1, owner });
    const rel2 = Relationship_1.default.of({ data: [item1, item2], owner });
    const mapper = it => { it.type = it.type + 'here'; return it; };
    const asyncMapper = it => Promise.resolve(mapper(it));
    describe("map", () => {
        const mapped = rel1.map(mapper);
        it("should return a Relationship instance", () => {
            chai_1.expect(mapped).to.be.an.instanceof(Relationship_1.default);
        });
        it("should preserve the Relationship's owner", () => {
            chai_1.expect(rel1.owner).to.deep.equal(mapped.owner);
        });
    });
    describe("mapAsync", () => {
        it("should produce a promise for the result of a normal map", () => {
            return rel2.mapAsync(asyncMapper).then(mapped => {
                chai_1.expect(mapped).to.deep.equal(rel2.map(mapper));
            });
        });
    });
});
