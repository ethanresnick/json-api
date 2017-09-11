"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chaiSubset = require("chai-subset");
const ResourceTypeRegistry_1 = require("../../src/ResourceTypeRegistry");
chai.use(chaiSubset);
const expect = chai.expect;
const makeGetterTest = function (value, type, methodName) {
    return function () {
        const registry = new ResourceTypeRegistry_1.default({
            [type]: {
                [methodName]: value
            }
        });
        switch ((value === null) || typeof value) {
            case "function":
                expect(registry[methodName](type)).to.deep.equal(value);
                break;
            case "object":
                expect(registry[methodName](type)).to.containSubset(value);
                break;
            default:
                expect(registry[methodName](type)).to.equal(value);
        }
    };
};
describe("ResourceTypeRegistry", function () {
    describe("constructor", () => {
        it("should register provided resource descriptions", () => {
            const registry = new ResourceTypeRegistry_1.default({
                "someType": { info: { "description": "provided to constructor" } }
            });
            const resType = registry.type("someType");
            const resTypeInfo = resType.info;
            expect(resType).to.be.an('object');
            expect(resTypeInfo.description).to.equal("provided to constructor");
        });
        it("should merge descriptionDefaults into resource description", () => {
            const registry = new ResourceTypeRegistry_1.default({
                "someType": {}
            }, {
                info: "provided as default"
            });
            const resTypeInfo = registry.type("someType").info;
            expect(resTypeInfo).to.equal("provided as default");
        });
        it("should give the description precedence over the provided default", () => {
            const someTypeDesc = {
                info: { "example": "overriding the default" },
                beforeSave: (resource, req, res) => { return resource; },
                beforeRender: (resource, req, res) => { return resource; },
                urlTemplates: { "path": "test template" }
            };
            const registry = new ResourceTypeRegistry_1.default({
                "someType": someTypeDesc
            }, {
                info: { "description": "provided as default" }
            });
            const output = registry.type("someType");
            expect(output.info).to.deep.equal(someTypeDesc.info);
            expect(output.beforeSave).to.equal(someTypeDesc.beforeSave);
            expect(output.beforeRender).to.equal(someTypeDesc.beforeRender);
            expect(output.urlTemplates).to.deep.equal(someTypeDesc.urlTemplates);
        });
        it("should give description and resource defaults precedence over global defaults", () => {
            const registry = new ResourceTypeRegistry_1.default({
                "testType": {
                    "behaviors": {
                        "dasherizeOutput": {
                            "enabled": true
                        }
                    }
                },
                "testType2": {}
            }, {
                "behaviors": {
                    "dasherizeOutput": { "enabled": false, "exceptions": [] }
                }
            });
            const testTypeOutput = registry.type("testType");
            const testType2Output = registry.type("testType2");
            const testTypeBehaviors = testTypeOutput.behaviors;
            const testType2Behaviors = testType2Output.behaviors;
            expect(testTypeBehaviors.dasherizeOutput.enabled).to.be.true;
            expect(testType2Behaviors.dasherizeOutput.enabled).to.be.false;
            expect(testType2Behaviors.dasherizeOutput.exceptions).to.deep.equal([]);
        });
    });
    it("Should allow null/undefined to overwrite all defaults", () => {
        const registry = new ResourceTypeRegistry_1.default({
            "testType": {
                "behaviors": null
            }
        }, {
            "behaviors": {
                "dasherizeOutput": { "enabled": false, "exceptions": [] }
            }
        });
        expect(registry.behaviors("testType")).to.equal(null);
    });
    describe("urlTemplates()", () => {
        it("should return a copy of the templates for all types", () => {
            const aTemps = { "self": "" };
            const bTemps = { "related": "" };
            const typeDescs = {
                "a": { "urlTemplates": aTemps },
                "b": { "urlTemplates": bTemps }
            };
            const registry = new ResourceTypeRegistry_1.default(typeDescs);
            expect(registry.urlTemplates()).to.not.equal(typeDescs);
            expect(registry.urlTemplates()).to.containSubset({ "a": aTemps, "b": bTemps });
        });
    });
    describe("urlTemplates(type)", () => {
        it("should be a getter for a type's urlTemplates", makeGetterTest({ "path": "test template" }, "mytypes", "urlTemplates"));
    });
    describe("behaviors", () => {
        it("should be a getter for a type's behaviors", makeGetterTest({ "someSetting": true }, "mytypes", "behaviors"));
    });
    describe("adapter", () => {
        it("should be a getter for a type's db adapter", makeGetterTest(function () { }, "mytypes", "dbAdapter"));
    });
    describe("beforeSave", () => {
        it("should be a getter for a type for a type's beforeSave", makeGetterTest(() => { }, "mytypes", "beforeSave"));
    });
    describe("beforeRender", () => {
        it("should be a getter for a type's beforeRender", makeGetterTest(() => { }, "mytypes", "beforeRender"));
    });
    describe("labelMappers", () => {
        it("should be a getter for a type's labelMappers", makeGetterTest({ "label": () => { } }, "mytypes", "labelMappers"));
    });
    describe("info", () => {
        it("should be a getter for a type's info", makeGetterTest({}, "mytypes", "info"));
    });
    describe("parentType", () => {
        const registry = new ResourceTypeRegistry_1.default({
            "b": { "parentType": "a" },
            "a": {}
        });
        it("should be a getter for a type for a type's parentType", () => {
            expect(registry.parentType("b")).to.equal("a");
            expect(registry.parentType("a")).to.be.undefined;
        });
    });
});
