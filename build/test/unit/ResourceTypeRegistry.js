"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _chai2 = _interopRequireDefault(_chai);

var _srcResourceTypeRegistry = require("../../src/ResourceTypeRegistry");

var _srcResourceTypeRegistry2 = _interopRequireDefault(_srcResourceTypeRegistry);

var expect = _chai2["default"].expect;
var registry = {};
var makeGetterSetterTest = function makeGetterSetterTest(newThing, type, methodName, deep) {
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
  beforeEach(function () {
    registry = new _srcResourceTypeRegistry2["default"]();
  });

  describe("type", function () {
    var description = {
      dbAdapter: {},
      beforeSave: function beforeSave() {},
      beforeRender: function beforeRender() {},
      info: {},
      urlTemplates: { "path": "test template" }
    };

    it("should be a getter/setter for a type", makeGetterSetterTest(description, "mytypes", "type", true));
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