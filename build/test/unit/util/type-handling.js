"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _interopRequireWildcard = require("babel-runtime/helpers/interop-require-wildcard")["default"];

var _sinon = require("sinon");

var _sinon2 = _interopRequireDefault(_sinon);

var _chai = require("chai");

var _srcUtilTypeHandling = require("../../../src/util/type-handling");

var utils = _interopRequireWildcard(_srcUtilTypeHandling);

var _srcTypesResource = require("../../../src/types/Resource");

var _srcTypesResource2 = _interopRequireDefault(_srcTypesResource);

var _srcTypesCollection = require("../../../src/types/Collection");

var _srcTypesCollection2 = _interopRequireDefault(_srcTypesCollection);

describe("Utility methods", function () {
  describe("mapResources", function () {
    it("should call the map function on a single resource", function () {
      var mapper = _sinon2["default"].spy(function (it) {
        return it;
      });
      var resource = new _srcTypesResource2["default"]("tests", "43");
      utils.mapResources(resource, mapper);
      (0, _chai.expect)(mapper.calledOnce).to.be["true"];
      (0, _chai.expect)(mapper.calledWith(resource)).to.be["true"];
    });

    it("should call the map function on each resource in a collection", function () {
      var mapper = _sinon2["default"].spy(function (it) {
        return it;
      });
      var resources = [new _srcTypesResource2["default"]("tests", "43"), new _srcTypesResource2["default"]("tests", "44")];
      var collection = new _srcTypesCollection2["default"](resources);

      utils.mapResources(collection, mapper);
      (0, _chai.expect)(mapper.callCount).to.equal(2);
      (0, _chai.expect)(mapper.calledWith(resources[0])).to.be["true"];
      (0, _chai.expect)(mapper.calledWith(resources[1])).to.be["true"];
    });

    it("should return the mapped output", function () {
      var mapper = _sinon2["default"].spy(function (it) {
        return it.id;
      });
      var resources = [new _srcTypesResource2["default"]("tests", "43"), new _srcTypesResource2["default"]("tests", "44")];
      var collection = new _srcTypesCollection2["default"](resources);

      (0, _chai.expect)(utils.mapResources(collection, mapper)).to.deep.equal(["43", "44"]);
      (0, _chai.expect)(utils.mapResources(resources[0], mapper)).to.equal("43");
    });
  });

  describe.skip("forEachArrayOrVal", function () {
    it("should call the each function on a single value");
    it("should call the each function on each value in an array");
    it("should return void");
  });

  describe("objectIsEmpty", function () {
    it.skip("should return false on an object with direct properties");
    it.skip("should return true if the object only has prototype properties");
  });

  describe("ValueObject", function () {
    describe("the constructor function it produces", function () {
      /*eslint-disable new-cap */
      var WrappedConstructor = utils.ValueObject(function () {
        this.allowedProp = null;
        _Object$defineProperty(this, "otherValidProp", { writable: true, enumerable: true });
      });
      /*eslint-enable */

      it("should use provided initial values", function () {
        var it = new WrappedConstructor({ allowedProp: "14" });
        (0, _chai.expect)(it.allowedProp).to.equal("14");
      });

      it("should ignore initial values for unknown property names", function () {
        var it = new WrappedConstructor({ notAValidProperty: "14" });
        (0, _chai.expect)(it.notAValidProperty).to.be.undefined;
      });

      it("should prevent adding new properties to the object", function () {
        var it = new WrappedConstructor();
        (0, _chai.expect)(function () {
          return it.notAValidContextProperty = 4;
        }).to["throw"](TypeError);
      });

      it("should allow the values of existing properties to change", function () {
        var it = new WrappedConstructor();
        it.allowedProp = 9;
        it.otherValidProp = 7; //check Object.defineProperty props too.
        (0, _chai.expect)(it.allowedProp).to.equal(9);
        (0, _chai.expect)(it.otherValidProp).to.equal(7);
      });
    });
  });
});