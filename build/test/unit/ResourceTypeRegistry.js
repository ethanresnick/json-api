"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _chai2 = _interopRequireDefault(_chai);

var _srcResourceTypeRegistry = require("../../src/ResourceTypeRegistry");

var _srcResourceTypeRegistry2 = _interopRequireDefault(_srcResourceTypeRegistry);

var expect = _chai2["default"].expect;
var makeGetterSetterTest = function makeGetterSetterTest(newThing, type, methodName, deep) {
  var registry = new _srcResourceTypeRegistry2["default"]();
  return function () {
    expect(registry[methodName](type)).to.be.undefined;
    registry[methodName](type, newThing);

    // You may get a copy of the set object back, not a direct
    // reference. And that's acceptable. A deep check lets that pass.
    if (deep) {
      expect(registry[methodName](type)).to.deep.equal(newThing);
    } else {
      expect(registry[methodName](type)).to.equal(newThing);
    }
  };
};

describe("ResourceTypeRegistry", function () {
  describe("constructor", function () {
    it("should register resource descriptions provided in first parameter", function () {
      var registry = new _srcResourceTypeRegistry2["default"]([{
        type: "someType",
        info: "provided to constructor"
      }]);
      expect(registry.type("someType")).to.be.an.object;
      expect(registry.type("someType").info).to.equal("provided to constructor");
    });
  });

  describe("type", function () {
    it("should merge descriptionDefaults into resource description", function () {
      var registry = new _srcResourceTypeRegistry2["default"]([], {
        info: "provided as default"
      });

      registry.type("someType", {});
      expect(registry.type("someType").info).to.equal("provided as default");
      expect(registry.type("someType").behaviors).to.be.an("object");
    });

    it("should give the description precedence over the provided default", function () {
      var registry = new _srcResourceTypeRegistry2["default"]([], {
        info: "provided as default"
      });

      var someType = {
        info: "overriding the default",
        beforeSave: function beforeSave() {},
        beforeRender: function beforeRender() {},
        urlTemplates: { "path": "test template" }
      };

      registry.type("someType", someType);
      var output = registry.type("someType");

      expect(output.info).to.equal(someType.info);
      expect(output.beforeSave).to.equal(someType.beforeSave);
      expect(output.beforeRender).to.equal(someType.beforeRender);
      expect(output.urlTemplates).to.deep.equal(someType.urlTemplates);
    });

    it("should give description and resource defaults precedence over global defaults", function () {
      var registry = new _srcResourceTypeRegistry2["default"]([{
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
          "dasherizeOutput": { "enabled": false, "exceptions": [] }
        }
      });

      var testTypeOutput = registry.type("testType");
      var testType2Output = registry.type("testType2");

      expect(testTypeOutput.behaviors.dasherizeOutput.enabled).to.be["true"];
      expect(testType2Output.behaviors.dasherizeOutput.enabled).to.be["false"];
      expect(testTypeOutput.behaviors.dasherizeOutput.exceptions).to.deep.equal([]);
    });
  });

  describe("behaviors", function () {
    it("should merge in provided behaviors config", function () {
      var registry = new _srcResourceTypeRegistry2["default"]();
      registry.behaviors("testType", { "dasherizeOutput": { exceptions: {} } });

      // the global default shouldn't have been replaced over by the set above.
      expect(registry.behaviors("testType").dasherizeOutput.enabled).to.be["true"];
    });
  });

  describe("adapter", function () {
    it("should be a getter/setter for a type's db adapter", makeGetterSetterTest({ "a": "new model" }, "mytypes", "dbAdapter"));
  });

  describe("beforeSave", function () {
    it("should be a getter/setter for a type for a type's beforeSave", makeGetterSetterTest(function () {}, "mytypes", "beforeSave"));
  });

  describe("beforeRender", function () {
    it("should be a getter/setter for a type's beforeRender", makeGetterSetterTest(function () {}, "mytypes", "beforeRender"));
  });

  describe("labelMappers", function () {
    it("should be a getter/setter for a type's labelMappers", makeGetterSetterTest({ "label": function label() {} }, "mytypes", "labelMappers"));
  });

  describe("info", function () {
    it("should be a getter/setter for a type's info", makeGetterSetterTest({}, "mytypes", "info"));
  });

  describe("parentType", function () {
    it("should be a getter/setter for a type for a type's parentType", makeGetterSetterTest(function () {
      return "my-parents";
    }, "mytypes", "parentType"));
  });

  describe("urlTemplates", function () {
    it("should be a getter/setter for a type's urlTemplates", makeGetterSetterTest({ "path": "test template" }, "mytypes", "urlTemplates", true));
  });
});