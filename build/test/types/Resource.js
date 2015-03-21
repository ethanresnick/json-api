"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var mocha = _interopRequire(require("mocha"));

var sinon = _interopRequire(require("sinon"));

var chai = _interopRequire(require("chai"));

var Resource = _interopRequire(require("../../src/types/Resource"));

var expect = chai.expect;

describe("Resource type", function () {
  describe("validation", function () {
    it("should require a type on construction", function () {
      expect(function () {
        return new Resource(null, "bob", {});
      }).to["throw"](/type.*required/);
      expect(function () {
        return new Resource("", "bob", {});
      }).to["throw"](/type.*required/);
    });

    it("should prevent setting type to emptly/null", function () {
      var r = new Resource("type", "133123", {});
      expect(function () {
        r.type = undefined;
      }).to["throw"](/type.*required/);
      expect(function () {
        r.type = "";
      }).to["throw"](/type.*required/);
      expect(function () {
        r.type = null;
      }).to["throw"](/type.*required/);
    });

    it("should coerce type to a string, as required", function () {
      var r = new Resource(true);
      var r2 = new Resource(1);
      expect(r.type).to.equal("true");
      expect(r2.type).to.equal("1");
    });

    it("should allow construction with no or valid id", function () {
      // valid/no ids should construct w/o error
      /*eslint-disable no-unused-vars */
      var noId = new Resource("type", null, {});
      var validId = new Resource("aoin", "39.20nA_-xgGr", {});
      /*eslint-enable */
    });

    it("should coerce ids to strings, as required by the spec", function () {
      var r = new Resource("type", 19339, {});
      expect(r.id === "19339").to.be["true"];
    });

    it("should reject non-object attrs", function () {
      var valid = new Resource("type", "id");
      /*eslint-disable no-unused-vars */
      var valid2 = new Resource("pyt", "id", {});
      /*eslint-enable */
      expect(function () {
        return new Resource("type", "id", ["attrs"]);
      }).to["throw"](/must.*object/);
      expect(function () {
        return new Resource("type", "id", "atts");
      }).to["throw"](/must.*object/);
      expect(function () {
        return valid.attrs = "";
      }).to["throw"](/must.*object/);
      expect(function () {
        return valid.attrs = undefined;
      }).to["throw"](/must.*object/);
      expect(function () {
        return valid.attrs = "ias";
      }).to["throw"](/must.*object/);
    });

    it("should reject reserved keys as attrs", function () {
      expect(function () {
        return new Resource("type", "id", { links: "bleh" });
      }).to["throw"](/invalid attribute name/);
      expect(function () {
        return new Resource("type", "id", { meta: true });
      }).to["throw"](/invalid attribute name/);
      expect(function () {
        return new Resource("type", "id", { id: "bleh" });
      }).to["throw"](/invalid attribute name/);
      expect(function () {
        return new Resource("type", "id", { type: "bleh" });
      }).to["throw"](/invalid attribute name/);
    });

    it.skip("should reject reserved keys as attrs even in nested objects", function () {
      expect(function () {
        return new Resource("type", "id", { valid: { id: "bb" } });
      }).to["throw"](/invalid attribute name/);
    });
  });
});