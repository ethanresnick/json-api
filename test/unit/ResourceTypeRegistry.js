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

  describe("type", () => {
    let description = {
      dbAdapter: {},
      beforeSave: () => {},
      beforeRender: () => {},
      info: {},
      urlTemplates: {"path": "test template"}
    };

    it("should be a getter/setter for a type",
      makeGetterSetterTest(description, "mytypes", "type", true)
    );
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
