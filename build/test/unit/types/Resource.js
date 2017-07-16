"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const Resource_1 = require("../../../src/types/Resource");
describe("Resource type", () => {
    describe("validation", () => {
        it("should require a type on construction", () => {
            chai_1.expect(() => new Resource_1.default(null, "bob", {})).to.throw(/type.*required/);
            chai_1.expect(() => new Resource_1.default("", "bob", {})).to.throw(/type.*required/);
        });
        it("should prevent setting type to emptly/null", () => {
            let r = new Resource_1.default("type", "133123", {});
            chai_1.expect(() => { r.type = undefined; }).to.throw(/type.*required/);
            chai_1.expect(() => { r.type = ""; }).to.throw(/type.*required/);
            chai_1.expect(() => { r.type = null; }).to.throw(/type.*required/);
        });
        it("should coerce type to a string, as required", () => {
            let r = new Resource_1.default(true);
            let r2 = new Resource_1.default(1);
            chai_1.expect(r.type).to.equal("true");
            chai_1.expect(r2.type).to.equal("1");
        });
        it("should allow construction with no or valid id", () => {
            new Resource_1.default("type", undefined, {});
            new Resource_1.default("aoin", "39.20nA_-xgGr", {});
        });
        it("should coerce ids to strings, as required by the spec", () => {
            let r = new Resource_1.default("type", 19339, {});
            chai_1.expect(r.id === "19339").to.be.true;
        });
        it("should reject non-object attrs", () => {
            let valid = new Resource_1.default("type", "id");
            new Resource_1.default("pyt", "id", {});
            chai_1.expect(() => new Resource_1.default("type", "id", ["attrs"])).to.throw(/must.*object/);
            chai_1.expect(() => new Resource_1.default("type", "id", "atts")).to.throw(/must.*object/);
            chai_1.expect(() => valid.attrs = "").to.throw(/must.*object/);
            chai_1.expect(() => valid.attrs = undefined).to.throw(/must.*object/);
            chai_1.expect(() => valid.attrs = "ias").to.throw(/must.*object/);
        });
        it("should reject reserved keys as attrs", () => {
            chai_1.expect(() => new Resource_1.default("type", "id", { "id": "bleh" })).to.throw(/cannot be used as attribute/);
            chai_1.expect(() => new Resource_1.default("type", "id", { "type": "bleh" })).to.throw(/cannot be used as attribute/);
        });
        it("should reject use of same name for an attribute and a relationship", () => {
            chai_1.expect(() => new Resource_1.default("type", "id", { "test": true }, { "test": false })).to.throw(/relationship.+same name/);
        });
        it("should reject reserved complex attribute keys at all levels", () => {
            chai_1.expect(() => new Resource_1.default("type", "id", { "valid": { "links": "bb" } })).to.throw(/Complex attributes may not/);
            chai_1.expect(() => new Resource_1.default("type", "id", { "valid": { "relationships": "bb" } })).to.throw(/Complex attributes may not/);
            chai_1.expect(() => new Resource_1.default("type", "id", { "valid": ["a", "b", { "links": true }] })).to.throw(/Complex attributes may not/);
        });
    });
});
