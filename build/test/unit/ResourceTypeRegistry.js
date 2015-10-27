"use strict";

var _defineProperty = require("babel-runtime/helpers/define-property")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _chai2 = _interopRequireDefault(_chai);

var _chaiSubset = require("chai-subset");

var _chaiSubset2 = _interopRequireDefault(_chaiSubset);

var _srcResourceTypeRegistry = require("../../src/ResourceTypeRegistry");

var _srcResourceTypeRegistry2 = _interopRequireDefault(_srcResourceTypeRegistry);

_chai2["default"].use(_chaiSubset2["default"]);
var expect = _chai2["default"].expect;
var makeGetterTest = function makeGetterTest(value, type, methodName) {
  return function () {
    var registry = new _srcResourceTypeRegistry2["default"](_defineProperty({}, type, _defineProperty({}, methodName, value)));

    // You may get a copy of the set object back, not a direct
    // reference. And that's preferable. A deep check lets that pass.
    // value == null below is a hack around typeof null == "object".
    switch (value === null || typeof value) {
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

describe("ResourceTypeRegistry", function () {
  describe("constructor", function () {
    it("should register provided resource descriptions", function () {
      var registry = new _srcResourceTypeRegistry2["default"]({
        "someType": { info: "provided to constructor" }
      });

      expect(registry.type("someType")).to.be.an.object;
      expect(registry.type("someType").info).to.equal("provided to constructor");
    });

    it("should merge descriptionDefaults into resource description", function () {
      var registry = new _srcResourceTypeRegistry2["default"]({
        "someType": {}
      }, {
        info: "provided as default"
      });

      expect(registry.type("someType").info).to.equal("provided as default");
      expect(registry.type("someType").behaviors).to.be.an("object");
    });

    it("should give the description precedence over the provided default", function () {
      var someTypeDesc = {
        info: "overriding the default",
        beforeSave: function beforeSave() {},
        beforeRender: function beforeRender() {},
        urlTemplates: { "path": "test template" }
      };

      var registry = new _srcResourceTypeRegistry2["default"]({
        "someType": someTypeDesc
      }, {
        info: "provided as default"
      });

      var output = registry.type("someType");

      expect(output.info).to.deep.equal(someTypeDesc.info);
      expect(output.beforeSave).to.equal(someTypeDesc.beforeSave);
      expect(output.beforeRender).to.equal(someTypeDesc.beforeRender);
      expect(output.urlTemplates).to.deep.equal(someTypeDesc.urlTemplates);
    });

    it("should give description and resource defaults precedence over global defaults", function () {
      var registry = new _srcResourceTypeRegistry2["default"]({
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

      var testTypeOutput = registry.type("testType");
      var testType2Output = registry.type("testType2");

      expect(testTypeOutput.behaviors.dasherizeOutput.enabled).to.be["true"];
      expect(testType2Output.behaviors.dasherizeOutput.enabled).to.be["false"];
      expect(testTypeOutput.behaviors.dasherizeOutput.exceptions).to.deep.equal([]);
    });
  });

  it("Should allow null/undefined to overwrite all defaults", function () {
    var registry = new _srcResourceTypeRegistry2["default"]({
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

  describe("urlTemplates()", function () {
    it("should return a copy of the templates for all types", function () {
      var aTemps = { "self": "" };
      var bTemps = { "related": "" };
      var typeDescs = {
        "a": { "urlTemplates": aTemps },
        "b": { "urlTemplates": bTemps }
      };
      var registry = new _srcResourceTypeRegistry2["default"](typeDescs);

      expect(registry.urlTemplates()).to.not.equal(typeDescs);
      expect(registry.urlTemplates()).to.containSubset({ "a": aTemps, "b": bTemps });
    });
  });

  describe("urlTemplates(type)", function () {
    it("should be a getter for a type's urlTemplates", makeGetterTest({ "path": "test template" }, "mytypes", "urlTemplates"));
  });

  describe("behaviors", function () {
    it("should be a getter for a type's behaviors", makeGetterTest({ "someSetting": true }, "mytypes", "behaviors"));
  });

  describe("adapter", function () {
    it("should be a getter for a type's db adapter", makeGetterTest(function () {}, "mytypes", "dbAdapter"));
  });

  describe("beforeSave", function () {
    it("should be a getter for a type for a type's beforeSave", makeGetterTest(function () {}, "mytypes", "beforeSave"));
  });

  describe("beforeRender", function () {
    it("should be a getter for a type's beforeRender", makeGetterTest(function () {}, "mytypes", "beforeRender"));
  });

  describe("labelMappers", function () {
    it("should be a getter for a type's labelMappers", makeGetterTest({ "label": function label() {} }, "mytypes", "labelMappers"));
  });

  describe("info", function () {
    it("should be a getter for a type's info", makeGetterTest({}, "mytypes", "info"));
  });

  describe("parentType", function () {
    var registry = new _srcResourceTypeRegistry2["default"]({
      "b": { "parentType": "a", "info": { "x": true } },
      "a": { "info": { "y": false } }
    });

    it("should be a getter for a type for a type's parentType", function () {
      expect(registry.parentType("b")).to.equal("a");
      expect(registry.parentType("a")).to.be.undefined;
    });
  });
});