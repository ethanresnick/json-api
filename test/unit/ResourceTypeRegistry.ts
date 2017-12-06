import chai = require("chai");
import chaiSubset = require("chai-subset");
import ResourceTypeRegistry, {
  ResourceTypeDescription,
  ResourceTypeInfo
} from "../../src/ResourceTypeRegistry";

chai.use(chaiSubset);
const expect = chai.expect;
const makeGetterTest = function(value, type, methodName) {
  return function() {
    const registry = new ResourceTypeRegistry({
      [type]: {
        [methodName]: value
      }
    });

    // You may get a copy of the set object back, not a direct
    // reference. And that's preferable. A deep check lets that pass.
    // value == null below is a hack around typeof null == "object".
    switch((value === null) || typeof value) {
      case "function":
        expect(registry[methodName](type)).to.deep.equal(value);
        break;

      // account for the possibility of other defaults
      case "object":
        expect(registry[methodName](type)).to.containSubset(value);
        break;

      default:
        expect(registry[methodName](type)).to.equal(value);
    }
  };
};

describe("ResourceTypeRegistry", function() {
  describe("constructor", () => {
    it("should register provided resource descriptions", () => {
      const registry = new ResourceTypeRegistry({
        "someType": { info: { "description": "provided to constructor" } }
      });

      const resType = <ResourceTypeDescription>registry.type("someType");
      const resTypeInfo = <ResourceTypeInfo>resType.info;

      expect(resType).to.be.an('object');
      expect(resTypeInfo.description).to.equal("provided to constructor");
    });

    it("should deep merge descriptionDefaults into resource description", () => {
      const registry = new ResourceTypeRegistry({
        "someType": {
          info: { "example": "merged with the default" }
        }
      }, <object>{
        info: { description: "provided as default" }
      });

      const resTypeInfo = <ResourceTypeInfo>(<any>registry.type("someType")).info;

      expect(resTypeInfo).to.deep.equal({
        example: "merged with the default",
        description: "provided as default"
      });
    });

    it("should give the description precedence over the provided default", () => {
      const someTypeDesc = {
        beforeSave: (resource, req, res) => { return resource; }
      };

      const registry = new ResourceTypeRegistry({
        "someType": someTypeDesc
      }, <object>{
        beforeSave: (resource, req, res) => { return resource; },
      });

      expect((<any>registry.type("someType")).beforeSave).to.equal(someTypeDesc.beforeSave);
    });

    it("should give description and resource defaults precedence over global defaults", () => {
      const registry = new ResourceTypeRegistry(<any>{
        "testType": {
          "behaviors": {
            "dasherizeOutput": {
              "enabled": true
            }
          }
        },
        "testType2": {}
      }, <object>{
        "behaviors": {
          "dasherizeOutput": {"enabled": false, "exceptions": []}
        }
      });

      const testTypeOutput =  <ResourceTypeDescription>registry.type("testType");
      const testType2Output = <ResourceTypeDescription>registry.type("testType2");

      const testTypeBehaviors = <any>testTypeOutput.behaviors;
      const testType2Behaviors = <any>testType2Output.behaviors;

      expect(testTypeBehaviors.dasherizeOutput.enabled).to.be.true;
      expect(testType2Behaviors.dasherizeOutput.enabled).to.be.false;
      expect(testType2Behaviors.dasherizeOutput.exceptions).to.deep.equal([]);
    });
  });

  it("Should allow null/undefined to overwrite all defaults", () => {
    const registry = new ResourceTypeRegistry({
      "testType": <any>{
        "behaviors": null
      }
    }, <object>{
      "behaviors": {
        "dasherizeOutput": {"enabled": false, "exceptions": []}
      }
    });

    expect(registry.behaviors("testType")).to.equal(null);
  });

  describe("urlTemplates()", () => {
    it("should return a copy of the templates for all types", () => {
      const aTemps = {"self": ""};
      const bTemps = {"related": ""};
      const typeDescs = {
        "a": {"urlTemplates": aTemps},
        "b": {"urlTemplates": bTemps}
      };
      const registry = new ResourceTypeRegistry(typeDescs);

      expect(registry.urlTemplates()).to.not.equal(typeDescs);
      expect(registry.urlTemplates()).to.containSubset({"a": aTemps, "b": bTemps});
    });
  });

  describe("urlTemplates(type)", () => {
    it("should be a getter for a type's urlTemplates",
      makeGetterTest({"path": "test template"}, "mytypes", "urlTemplates")
    );
  });

  describe("behaviors", () => {
    it("should be a getter for a type's behaviors",
      makeGetterTest({"someSetting": true}, "mytypes", "behaviors")
    );
  });

  describe("adapter", () => {
    it("should be a getter for a type's db adapter",
      makeGetterTest(function() {}, "mytypes", "dbAdapter")
    );
  });

  describe("beforeSave", () => {
    it("should be a getter for a type for a type's beforeSave",
      makeGetterTest(() => {}, "mytypes", "beforeSave")
    );
  });

  describe("beforeRender", () => {
    it("should be a getter for a type's beforeRender",
      makeGetterTest(() => {}, "mytypes", "beforeRender")
    );
  });

  describe("info", () => {
    it("should be a getter for a type's info",
      makeGetterTest({}, "mytypes", "info")
    );
  });

  describe("parentType", () => {
    const registry = new ResourceTypeRegistry({
      "b": {"parentType": "a"},
      "a": {}
    });

    it("should be a getter for a type for a type's parentType", () => {
      expect(registry.parentType("b")).to.equal("a");
      expect(registry.parentType("a")).to.be.undefined;
    });
  });
});
