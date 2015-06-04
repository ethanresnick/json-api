"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _chai = require("chai");

var _srcTypesResource = require("../../../src/types/Resource");

var _srcTypesResource2 = _interopRequireDefault(_srcTypesResource);

describe("Resource type", function () {
  describe("validation", function () {
    it("should require a type on construction", function () {
      (0, _chai.expect)(function () {
        return new _srcTypesResource2["default"](null, "bob", {});
      }).to["throw"](/type.*required/);
      (0, _chai.expect)(function () {
        return new _srcTypesResource2["default"]("", "bob", {});
      }).to["throw"](/type.*required/);
    });

    it("should prevent setting type to emptly/null", function () {
      var r = new _srcTypesResource2["default"]("type", "133123", {});
      (0, _chai.expect)(function () {
        r.type = undefined;
      }).to["throw"](/type.*required/);
      (0, _chai.expect)(function () {
        r.type = "";
      }).to["throw"](/type.*required/);
      (0, _chai.expect)(function () {
        r.type = null;
      }).to["throw"](/type.*required/);
    });

    it("should coerce type to a string, as required", function () {
      var r = new _srcTypesResource2["default"](true);
      var r2 = new _srcTypesResource2["default"](1);
      (0, _chai.expect)(r.type).to.equal("true");
      (0, _chai.expect)(r2.type).to.equal("1");
    });

    it("should allow construction with no or valid id", function () {
      // valid/no ids should construct w/o error
      /*eslint-disable no-unused-vars */
      var noId = new _srcTypesResource2["default"]("type", undefined, {});
      var validId = new _srcTypesResource2["default"]("aoin", "39.20nA_-xgGr", {});
      /*eslint-enable */
    });

    it("should coerce ids to strings, as required by the spec", function () {
      var r = new _srcTypesResource2["default"]("type", 19339, {});
      (0, _chai.expect)(r.id === "19339").to.be["true"];
    });

    it("should reject non-object attrs", function () {
      // allow construction with no/empty attributes, though
      var valid = new _srcTypesResource2["default"]("type", "id");
      var valid2 = new _srcTypesResource2["default"]("pyt", "id", {}); //eslint-disable-line no-unused-vars

      // just don't allow setting attributes to a non-object.
      (0, _chai.expect)(function () {
        return new _srcTypesResource2["default"]("type", "id", ["attrs"]);
      }).to["throw"](/must.*object/);
      (0, _chai.expect)(function () {
        return new _srcTypesResource2["default"]("type", "id", "atts");
      }).to["throw"](/must.*object/);
      (0, _chai.expect)(function () {
        return valid.attrs = "";
      }).to["throw"](/must.*object/);
      (0, _chai.expect)(function () {
        return valid.attrs = undefined;
      }).to["throw"](/must.*object/);
      (0, _chai.expect)(function () {
        return valid.attrs = "ias";
      }).to["throw"](/must.*object/);
    });

    it("should reject reserved keys as attrs", function () {
      (0, _chai.expect)(function () {
        return new _srcTypesResource2["default"]("type", "id", { "id": "bleh" });
      }).to["throw"](/cannot be used as attribute/);

      (0, _chai.expect)(function () {
        return new _srcTypesResource2["default"]("type", "id", { "type": "bleh" });
      }).to["throw"](/cannot be used as attribute/);
    });

    it("should reject use of same name for an attribute and a relationship", function () {
      (0, _chai.expect)(function () {
        return new _srcTypesResource2["default"]("type", "id", { "test": true }, { "test": false });
      }).to["throw"](/relationship.+same name/);
    });

    it("should reject reserved complex attribute keys at all levels", function () {
      (0, _chai.expect)(function () {
        return new _srcTypesResource2["default"]("type", "id", { "valid": { "links": "bb" } });
      }).to["throw"](/Complex attributes may not/);

      (0, _chai.expect)(function () {
        return new _srcTypesResource2["default"]("type", "id", { "valid": { "relationships": "bb" } });
      }).to["throw"](/Complex attributes may not/);

      (0, _chai.expect)(function () {
        return new _srcTypesResource2["default"]("type", "id", { "valid": ["a", "b", { "links": true }] });
      }).to["throw"](/Complex attributes may not/);
    });
  });
});