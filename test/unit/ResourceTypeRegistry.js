import chai from "chai";
import ResourceTypeRegistry from "../../src/ResourceTypeRegistry";

let expect = chai.expect;
let registry = {};
let makeGetterSetterTest = function(newThing, type, methodName, deep) {
  return function() {
    expect(registry[methodName](type)).to.be.undefined;
    registry[methodName](type, newThing);

    // You may get a copy of the set object back, not a direct
    // reference. And that's acceptable. A deep check lets that pass.
    if(deep) {
      expect(registry[methodName](type)).to.deep.equal(newThing);
    }
    else {
      expect(registry[methodName](type)).to.equal(newThing);
    }
  };
};

describe("ResourceTypeRegistry", function() {
  beforeEach(() => {
    registry = new ResourceTypeRegistry();
  });

  describe("constructor", () => {
    it("should register resource descriptions provided in first parameter", () => {
      let registry = new ResourceTypeRegistry([{
        type: "someType",
        info: "provided to constructor"
      }]);
      expect(registry.type("someType")).to.be.an.object;
      expect(registry.type("someType").info).to.equal("provided to constructor");
    });
  });

  describe("type", () => {
    it("should merge descriptionDefaults into resource description", () => {
      let registry = new ResourceTypeRegistry([], {
        info: "provided as default"
      });

      registry.type("someType", {});
      expect(registry.type("someType").info).to.equal("provided as default");
      expect(registry.type("someType").behaviors).to.be.an("object");
    });

    it("should give the description precedence over the provided default", () => {
      let registry = new ResourceTypeRegistry([], {
        info: "provided as default"
      });

      let someType = {
        info: "overriding the default",
        beforeSave: () => {},
        beforeRender: () => {},
        urlTemplates: {"path": "test template"}
      };

      registry.type("someType", someType);
      let output = registry.type("someType");

      expect(output.info).to.equal(someType.info);
      expect(output.beforeSave).to.equal(someType.beforeSave);
      expect(output.beforeRender).to.equal(someType.beforeRender);
      expect(output.urlTemplates).to.deep.equal(someType.urlTemplates);
    });

    it("should give description and resource defaults precedence over global defaults", () => {
      let registry = new ResourceTypeRegistry([{
        "type": "testType",
        "behaviors": {
          "dasherizeOutput": {
            "enabled": true
          }
        }
      }, {
        "type": "testType2"
      }], {
        "behaviors": {
          "dasherizeOutput": {"enabled": false, "exceptions": []}
        }
      });

      let testTypeOutput = registry.type("testType");
      let testType2Output = registry.type("testType2");

      expect(testTypeOutput.behaviors.dasherizeOutput.enabled).to.be.true;
      expect(testType2Output.behaviors.dasherizeOutput.enabled).to.be.false;
      expect(testTypeOutput.behaviors.dasherizeOutput.exceptions).to.deep.equal([]);
    });
  });

  describe("behaviors", () => {
    it("should merge in provided behaviors config", () => {
      let registry = new ResourceTypeRegistry();
      registry.behaviors("testType", {"dasherizeOutput": {exceptions: {}}});

      // the global default shouldn't have been replaced over by the set above.
      expect(registry.behaviors("testType").dasherizeOutput.enabled).to.be.true;
    });
  });

  describe("adapter", () => {
    it("should be a getter/setter for a type's db adapter",
      makeGetterSetterTest({"a": "new model"}, "mytypes", "dbAdapter")
    );
  });

  describe("beforeSave", () => {
    it("should be a getter/setter for a type for a type's beforeSave",
      makeGetterSetterTest(() => {}, "mytypes", "beforeSave")
    );
  });

  describe("beforeRender", () => {
    it("should be a getter/setter for a type's beforeRender",
      makeGetterSetterTest(() => {}, "mytypes", "beforeRender")
    );
  });

  describe("labelMappers", () => {
    it("should be a getter/setter for a type's labelMappers",
      makeGetterSetterTest({"label": () => {}}, "mytypes", "labelMappers")
    );
  });

  describe("info", () => {
    it("should be a getter/setter for a type's info",
      makeGetterSetterTest({}, "mytypes", "info")
    );
  });

  describe("parentType", () => {
    it("should be a getter/setter for a type for a type's parentType",
      makeGetterSetterTest(() => "my-parents", "mytypes", "parentType")
    );
  });

  describe("urlTemplates", () => {
    it("should be a getter/setter for a type's urlTemplates",
      makeGetterSetterTest(
        {"path": "test template"},
        "mytypes", "urlTemplates", true
      )
    );
  });
});
