"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var _interopRequireWildcard = require("babel-runtime/helpers/interop-require-wildcard")["default"];

var sinon = _interopRequire(require("sinon"));

var chai = _interopRequire(require("chai"));

var utils = _interopRequireWildcard(require("../../src/util/type-handling"));

var Resource = _interopRequire(require("../../src/types/Resource"));

var Collection = _interopRequire(require("../../src/types/Collection"));

var expect = chai.expect;

describe("Utility methods", function () {
  describe("mapResources", function () {
    it("should call the map function on a single resource", function () {
      var mapper = sinon.spy(function (it) {
        return it;
      });
      var resource = new Resource("tests", "43");
      utils.mapResources(resource, mapper);
      expect(mapper.calledOnce).to.be["true"];
      expect(mapper.calledWith(resource)).to.be["true"];
    });

    it("should call the map function on each resource in a collection", function () {
      var mapper = sinon.spy(function (it) {
        return it;
      });
      var resources = [new Resource("tests", "43"), new Resource("tests", "44")];
      var collection = new Collection(resources);

      utils.mapResources(collection, mapper);
      expect(mapper.callCount).to.equal(2);
      expect(mapper.calledWith(resources[0])).to.be["true"];
      expect(mapper.calledWith(resources[1])).to.be["true"];
    });

    it("should return the mapped output", function () {
      var mapper = sinon.spy(function (it) {
        return it.id;
      });
      var resources = [new Resource("tests", "43"), new Resource("tests", "44")];
      var collection = new Collection(resources);

      expect(utils.mapResources(collection, mapper)).to.deep.equal(["43", "44"]);
      expect(utils.mapResources(resources[0], mapper)).to.equal("43");
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
        Object.defineProperty(this, "otherValidProp", { writable: true, enumerable: true });
      });
      /*eslint-enable */

      it("should use provided initial values", function () {
        var it = new WrappedConstructor({ allowedProp: "14" });
        expect(it.allowedProp).to.equal("14");
      });

      it("should ignore initial values for unknown property names", function () {
        var it = new WrappedConstructor({ notAValidProperty: "14" });
        expect(it.notAValidProperty).to.be.undefined;
      });

      it("should prevent adding new properties to the object", function () {
        var it = new WrappedConstructor();
        expect(function () {
          return it.notAValidContextProperty = 4;
        }).to["throw"](TypeError);
      });

      it("should allow the values of existing properties to change", function () {
        var it = new WrappedConstructor();
        it.allowedProp = 9;
        it.otherValidProp = 7; //check Object.defineProperty props too.
        expect(it.allowedProp).to.equal(9);
        expect(it.otherValidProp).to.equal(7);
      });
    });
  });
});