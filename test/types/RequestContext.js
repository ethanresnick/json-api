import mocha from "mocha"
import sinon from "sinon"
import chai from "chai"
import RequestContext from "../../src/types/Context/RequestContext"

var expect = chai.expect;

describe("RequestContext type", () => {
  describe("Initialization & sealing", () => {
    it("should use provided initial values", () => {
      var context = new RequestContext({idOrIds:"14"});
      expect(context.idOrIds).to.equal("14"); 
    });

    it("should ignore initial values for unknown property names", () => {
      var context = new RequestContext({notAValidContextProperty:"14"});
      expect(context.notAValidContextProperty).to.be.undefined; 
    });

    it("should allow the values of existing properties to change", () => {
      var context = new RequestContext();
      context.idOrIds = [1,3];
      context.body = {}; //check Object.defineProperty props too.
    });

    it("should prevent adding new properties to the object", () => {
      var context = new RequestContext();
      expect(() => context.notAValidContextProperty = 4).to.throw(TypeError); 
    });
  });
})