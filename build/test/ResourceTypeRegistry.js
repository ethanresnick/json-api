"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var mocha = _interopRequire(require("mocha"));

var sinon = _interopRequire(require("sinon"));

var chai = _interopRequire(require("chai"));

var ResourceTypeRegistry = _interopRequire(require("../src/ResourceTypeRegistry"));

var expect = chai.expect;
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
    registry = new ResourceTypeRegistry();
  });

  describe("type", function () {
    var description = {
      adapter: {},
      beforeSave: function () {},
      beforeRender: function () {},
      info: {},
      urlTemplates: { path: "test template" }
    };

    it("should be a getter/setter for a type", makeGetterSetterTest(description, "mytypes", "type", true));
  });

  describe("adapter", function () {
    it("should be a getter/setter for a type's adapter", makeGetterSetterTest({ a: "new model" }, "mytypes", "adapter"));
  });

  describe("beforeSave", function () {
    it("should be a getter/setter for a type for a type's beforeSave", makeGetterSetterTest(function () {}, "mytypes", "beforeSave"));
  });

  describe("beforeRender", function () {
    it("should be a getter/setter for a type's beforeRender", makeGetterSetterTest(function () {}, "mytypes", "beforeRender"));
  });

  describe("labelMappers", function () {
    it("should be a getter/setter for a type's labelMappers", makeGetterSetterTest({ label: function () {} }, "mytypes", "labelMappers"));
  });

  describe("info", function () {
    it("should be a getter/setter for a type's info", makeGetterSetterTest({}, "mytypes", "info"));
  });

  describe("urlTemplates", function () {
    it("should be a getter/setter for a type's urlTemplates", makeGetterSetterTest({ path: "test template" }, "mytypes", "urlTemplates", true));
  });
});