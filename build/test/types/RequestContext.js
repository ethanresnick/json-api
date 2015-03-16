"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var mocha = _interopRequire(require("mocha"));

var sinon = _interopRequire(require("sinon"));

var chai = _interopRequire(require("chai"));

var RequestContext = _interopRequire(require("../../lib/types/RequestContext"));

var expect = chai.expect;

describe("RequestContext type", function () {
  it("should use provided initial values", function () {
    var context = new RequestContext({ idOrIds: "14" });
    expect(context.idOrIds).to.equal("14");
  });

  it("should ignore initial values for unknown property names", function () {
    var context = new RequestContext({ notAValidContextProperty: "14" });
    expect(context.notAValidContextProperty).to.be.undefined;
  });

  it("should allow the values of existing properties to change", function () {
    var context = new RequestContext();
    context.idOrIds = [1, 3];
  });

  it("should prevent adding new properties to the object", function () {
    var context = new RequestContext();
    expect(function () {
      return context.notAValidContextProperty = 4;
    }).to["throw"](TypeError);
  });
});