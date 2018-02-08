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
      }, {
        info: { description: "provided as default" }
      });

      const resTypeInfo = <ResourceTypeInfo>(<any>registry.type("someType")).info;

      expect(resTypeInfo).to.deep.equal({
        example: "merged with the default",
        description: "provided as default"
      });
    });

    it("should merge parent type's description into resource description", () => {
      const registry = new ResourceTypeRegistry({
        "b": {
          parentType: "a",
          info: { "description": "b" },
          behaviors: {}
        },
        "a": {
          info: { "description": "A", "example": "example from a" },
          behaviors: <object><any>null
        }
      });

      const resTypeInfo = <ResourceTypeInfo>(<any>registry.type("b")).info;
      const resTypeBehaviors = <ResourceTypeInfo>(<any>registry.type("b")).behaviors;

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

      const registry = new ResourceTypeRegistry({
        "someType": someTypeDesc
      }, {
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
      }, {
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

    it("should only look for descriptions at own, enumerable props of descs arg", () => {
      const typeDescs = Object.create({
        prototypeKey: {}
      }, {
        legitDesc: { value: {}, enumerable: true },
        nonEnumerableKey: { value: {}, enumerable: false }
      });

      const registeredTypes = new ResourceTypeRegistry(typeDescs).typeNames();
      expect(registeredTypes).to.contain('legitDesc');
      expect(registeredTypes).to.not.contain('nonEnumerableKey');
      expect(registeredTypes).to.not.contain('prototypeKey');
    });
  });

  it("Should allow null/undefined to overwrite all defaults", () => {
    const registry = new ResourceTypeRegistry({
      "testType": <any>{
        "behaviors": null
      }
    }, {
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
      makeGetterTest(function() { return; }, "mytypes", "dbAdapter")
    );
  });

  describe("beforeSave", () => {
    it("should be a getter for a type for a type's beforeSave",
      makeGetterTest(() => { return; }, "mytypes", "beforeSave")
    );
  });

  describe("beforeRender", () => {
    it("should be a getter for a type's beforeRender",
      makeGetterTest(() => { return; }, "mytypes", "beforeRender")
    );
  });

  describe("info", () => {
    it("should be a getter for a type's info",
      makeGetterTest({}, "mytypes", "info")
    );
  });

  describe("type tree functions", () => {
    const registry = new ResourceTypeRegistry({
      "kindergartens": { "parentType": "schools" },
      "schools": { "parentType": "organizations" },
      "organizations": {},
      "people": {},
      "law-schools": { parentType: "schools" }
    });

    describe("parentTypeName", () => {
      it("should be a getter for a type's parentType", () => {
        expect(registry.parentTypeName("schools")).to.equal("organizations");
        expect(registry.parentTypeName("organizations")).to.be.undefined;
      });
    });

    describe("rootTypeNameOf", () => {
      it("should be a getter for a type's top-most parentType", () => {
        expect(registry.rootTypeNameOf("kindergartens")).to.equal("organizations");
        expect(registry.rootTypeNameOf("schools")).to.equal("organizations");
        expect(registry.rootTypeNameOf("organizations")).to.equal("organizations");
      });
    });

    describe("typePathTo", () => {
      it("should return the path through the type tree to the provided type", () => {
        expect(registry.typePathTo("kindergartens"))
          .to.deep.equal(["kindergartens", "schools", "organizations"]);

        expect(registry.typePathTo("schools"))
          .to.deep.equal(["schools", "organizations"]);

        expect(registry.typePathTo("people")).to.deep.equal(["people"]);
      });
    });

    describe("isUnorderedPathThroughType", () => {
      it("should return whether the types provided exactly lead to a child type of the other type provided", () => {
        const sut = registry.isUnorderedPathThroughType.bind(registry);

        // path must start at the root node (i.e., needs "organizations" to get to 'schools')
        expect(sut(["schools"], "schools")).to.be.false;
        expect(sut(["schools", "organizations"], "schools")).to.be.true;
        expect(sut(["organizations", "schools"], "schools")).to.be.true;

        // a path to kindergartens or law-schools still works as a path to schools,
        // because those are child types of is a child of schools.
        expect(sut(["organizations", "schools", "kindergartens"], "schools")).to.be.true;
        expect(sut(["organizations", "schools", "law-schools"], "schools")).to.be.true;

        // same idea as above tests, but when type to lead to is a root type
        expect(sut(["people"], "people")).to.be.true;

        // but the path is invalid if there are two siblings from the same level
        expect(sut(["organizations", "schools", "kindergartens", "law-schools"], "schools")).to.be.false;

        // or if there are any extra members at all, for that matter
        expect(sut(["organizations", "schools", "people"], "schools")).to.be.false;
        expect(sut(["people", "john-does"], "people")).to.be.false;
      })
    })
  });
});
