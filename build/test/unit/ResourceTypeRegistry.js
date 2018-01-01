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
        it("should deep merge descriptionDefaults into resource description", () => {
            const registry = new ResourceTypeRegistry_1.default({
                "someType": {
                    info: { "example": "merged with the default" }
                }
            }, {
                info: { description: "provided as default" }
            });
            const resTypeInfo = registry.type("someType").info;
            expect(resTypeInfo).to.deep.equal({
                example: "merged with the default",
                description: "provided as default"
            });
        });
        it("should merge parent type's description into resource description", () => {
            const registry = new ResourceTypeRegistry_1.default({
                "b": {
                    parentType: "a",
                    info: { "description": "b" },
                    behaviors: {}
                },
                "a": {
                    info: { "description": "A", "example": "example from a" },
                    behaviors: null
                }
            });
            const resTypeInfo = registry.type("b").info;
            const resTypeBehaviors = registry.type("b").behaviors;
            expect(resTypeInfo).to.deep.equal({
                example: "example from a",
                description: "b"
            });
            expect(resTypeBehaviors).to.deep.equal({});
        });
        it("should give the description precedence over the provided default", () => {
            const someTypeDesc = {
                beforeSave: (resource, req, res) => { return resource; }
            };
            const registry = new ResourceTypeRegistry_1.default({
                "someType": someTypeDesc
            }, {
                beforeSave: (resource, req, res) => { return resource; },
            });
            expect(registry.type("someType").beforeSave).to.equal(someTypeDesc.beforeSave);
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
        it("should be a getter for a type's db adapter", makeGetterTest(function () { return; }, "mytypes", "dbAdapter"));
    });
    describe("beforeSave", () => {
        it("should be a getter for a type for a type's beforeSave", makeGetterTest(() => { return; }, "mytypes", "beforeSave"));
    });
    describe("beforeRender", () => {
        it("should be a getter for a type's beforeRender", makeGetterTest(() => { return; }, "mytypes", "beforeRender"));
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
