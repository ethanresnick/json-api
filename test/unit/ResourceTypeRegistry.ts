import chai = require("chai");
import chaiSubset = require("chai-subset");
import { minimalDummyAdapter } from './fixtures';
import ResourceTypeRegistry, {
  ResourceTypeDescription,
  ResourceTypeInfo
} from "../../src/ResourceTypeRegistry";
import { RFC6570String } from "../../src/types/UrlTemplate";

chai.use(chaiSubset);
const expect = chai.expect;

const makeGetterTest = function(value: any, type: string, methodName: string) {
  return function() {
    const registry = new ResourceTypeRegistry({
      [type]: {
        [methodName]: value
      }
    }, {
      dbAdapter: minimalDummyAdapter
    });

    // You may get a copy of the set object back, not a direct
    // reference. And that's preferable. A deep check lets that pass.
    // value == null below is a hack around typeof null == "object".
    switch((value === null) || typeof value) {
      case "function":
        expect((registry as any)[methodName](type)).to.deep.equal(value);
        break;

      // account for the possibility of other defaults
      case "object":
        expect((registry as any)[methodName](type)).to.containSubset(value);
        break;

      default:
        expect((registry as any)[methodName](type)).to.equal(value);
    }
  };
};

describe("ResourceTypeRegistry", function() {
  describe("constructor", () => {
    it("should register provided resource descriptions", () => {
      const registry = new ResourceTypeRegistry({
        "someType": { info: { "description": "provided to constructor" } }
      }, { dbAdapter: minimalDummyAdapter });

      const resType = <ResourceTypeDescription>registry.type("someType");
      const resTypeInfo = <ResourceTypeInfo>resType.info;

      expect(resType).to.be.an("object");
      expect(resTypeInfo.description).to.equal("provided to constructor");
    });

    it("should deep merge descriptionDefaults into resource description", () => {
      const registry = new ResourceTypeRegistry({
        "someType": {
          info: { "example": "merged with the default" }
        }
      }, {
        info: { description: "provided as default" },
        dbAdapter: minimalDummyAdapter
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
          defaultIncludes: [],
          dbAdapter: minimalDummyAdapter
        },
        "a": {
          info: { "description": "A", "example": "example from a" },
          defaultIncludes: <string[]><any>null,
          dbAdapter: minimalDummyAdapter
        }
      });

      const resTypeInfo = <ResourceTypeInfo>(<any>registry.type("b")).info;
      const resTypeIncludes = <ResourceTypeInfo>(<any>registry.type("b")).defaultIncludes;

      expect(resTypeInfo).to.deep.equal({
        example: "example from a",
        description: "b"
      });

      expect(resTypeIncludes).to.deep.equal([]);
    });

    it("should give the description precedence over the provided default", () => {
      const someTypeDesc = {
        beforeSave: (resource: any, req: any, res: any) => { return resource; }
      };

      const registry = new ResourceTypeRegistry({
        "someType": someTypeDesc
      }, {
        beforeSave: (resource: any, req: any, res: any) => { return resource; },
        dbAdapter: minimalDummyAdapter
      });

      expect((<any>registry.type("someType")).beforeSave).to.equal(someTypeDesc.beforeSave);
    });

    it("should give description and resource defaults precedence over global defaults", () => {
      const registry = new ResourceTypeRegistry(<any>{
        "testType": { transformLinkage: false },
        "testType2": { }
      }, {
        transformLinkage: true,
        dbAdapter: minimalDummyAdapter
      });

      const testTypeOutput =  <ResourceTypeDescription>registry.type("testType");
      const testType2Output = <ResourceTypeDescription>registry.type("testType2");

      expect(testTypeOutput.transformLinkage).to.be.false;
      expect(testType2Output.transformLinkage).to.be.true;
    });

    it("should only look for descriptions at own, enumerable props of descs arg", () => {
      const typeDescs = Object.create({
        prototypeKey: {}
      }, {
        legitDesc: { value: { dbAdapter: minimalDummyAdapter }, enumerable: true },
        nonEnumerableKey: { value: {}, enumerable: false }
      });

      const registeredTypes = new ResourceTypeRegistry(typeDescs).typeNames();
      expect(registeredTypes).to.contain("legitDesc");
      expect(registeredTypes).to.not.contain("nonEnumerableKey");
      expect(registeredTypes).to.not.contain("prototypeKey");
    });

    it("should reject type descs with no adapter", () => {
      expect(() => new ResourceTypeRegistry({
        "a": { transformLinkage: false }
      })).to.throw(/must be registered with a db adapter/);
    })

    it("Should allow null/undefined to overwrite all defaults", () => {
      const registry = new ResourceTypeRegistry({
        "testType": <any>{
          "info": null
        }
      }, {
        info: { example: "s" },
        dbAdapter: minimalDummyAdapter
      });

      expect(registry.info("testType")).to.equal(null);
    });
  });

  describe("urlTemplates()", () => {
    it("should return a parsed copy of the templates for all types", () => {
      const aTemps = {"self": ""};
      const bTemps = {"related": ""};
      const typeDescs = {
        "a": { urlTemplates: aTemps, dbAdapter: minimalDummyAdapter },
        "b": { urlTemplates: bTemps, dbAdapter: minimalDummyAdapter }
      };
      const registry = new ResourceTypeRegistry(typeDescs);
      const templatesOut = registry.urlTemplates();

      expect(templatesOut.a).to.not.equal(aTemps);
      expect(templatesOut.b).to.not.equal(bTemps);
      expect(templatesOut.a.self).to.be.a("function");
      expect(templatesOut.b.related).to.be.a("function");
    });
  });

  describe("urlTemplates(type)", () => {
    it("should be a getter for a type's parsed urlTemplates", () => {
      const registry = new ResourceTypeRegistry({
        "mytypes": { urlTemplates: {"path": "test template"} }
      }, {
        dbAdapter: minimalDummyAdapter
      });

      // tslint:disable-next-line no-non-null-assertion
      const templateOut = registry.urlTemplates("mytypes")!.path!;

      expect(registry.urlTemplates("mytypes")).to.be.an("object");
      expect(templateOut({})).to.equal("test%20template");
      expect(templateOut[RFC6570String]).to.equal("test template");
    });
  });

  describe("errorsConfig", () => {
    it("should be a getter, while returning parsed templates", () => {
      const registry = new ResourceTypeRegistry(
        {},
        { dbAdapter: minimalDummyAdapter },
        { urlTemplates: { about: "http://google.com/" } }
      );

      // tslint:disable-next-line no-non-null-assertion
      expect(registry.errorsConfig()!.urlTemplates.about!({})).to.equal("http://google.com/");
    });
  })

  describe("adapter", () => {
    const adapterClone = {
      ...minimalDummyAdapter,
      constructor: function() { return; }
    };

    it("should be a getter for a type's db adapter",
      makeGetterTest(adapterClone, "mytypes", "dbAdapter")
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
    }, {
      dbAdapter: minimalDummyAdapter
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

    describe("asTypePath", () => {
      const sut = registry.asTypePath.bind(registry);
      const validPaths = [
        { path: ["people"] },
        { path: ["organizations", "schools"], ordered: ["schools", "organizations"]  },

        // order doesn't matter
        { path: ["schools", "organizations"] },

        { path: ["kindergartens", "organizations", "schools"],
          ordered: ["kindergartens", "schools", "organizations"] },

        { path: ["law-schools", "schools", "organizations"] }
      ];

      const invalidPaths = [
        // paths must start at a root node (i.e., needs organizations too).
        { path: ["schools"] },

        // path can't contain two siblings from the same level in the tree
        { path: ["organizations", "schools", "kindergartens", "law-schools"] },

        // orgs + people are siblings; people is extra if we go orgs -> schools
        { path: ["organizations", "schools", "people"] },

        // john-does is an unknown type.
        { path: ["people", "john-does"] }
      ];

      it("should not accept an empty path as valid", () => {
        expect(sut([])).to.be.false;
        expect(sut([], "schools")).to.be.false;
      });

      describe("without throughType", () => {
        it("should return the ordered path if path points to a type; else false", () => {
          validPaths.forEach(path => {
            expect(sut(path.path)).to.deep.equal(path.ordered || path.path);
          });

          invalidPaths.forEach(path => {
            expect(sut(path.path)).to.be.false;
          });
        });
      });

      describe("with throughType", () => {
        it("should return the ordered path if path points to throughType or a child of it; else false", () => {
          const typeNames = registry.typeNames();

          // Invalid paths should continue to be invalid, regardless of throughType.
          invalidPaths.forEach(path => {
            const throughType = Math.random() < 0.5 ? "schools" : "people";
            expect(sut(path.path, throughType)).to.be.false;
          });

          // Valid paths should be valid for any type name along the path as
          // the through type, and invalid otherwise.
          validPaths.forEach(path => {
            const pathTypesSet = new Set(path.path);
            const validThroughType = getRandomElm(path.path);
            const invalidThroughType = getRandomElm(
              [...new Set(typeNames.filter(it => !pathTypesSet.has(it)))]
            );

            expect(sut(path.path, validThroughType)).to.deep.equal(
              path.ordered || path.path,
              `Expected type path for ${path.path} with throughType ${validThroughType} to eq ${path.ordered || path.path}.`
            );
            expect(sut(path.path, invalidThroughType)).to.eq(
              false,
              `Expected type path for ${path.path} with throughType ${invalidThroughType} to be false.`
            );
          });
        });
      });
    });
  });
});

function getRandomElm(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
