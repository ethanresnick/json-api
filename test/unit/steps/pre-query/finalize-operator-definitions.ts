import { expect } from 'chai';
import { finalizeFilterFieldExprArgs as sut } from '../../../../src/steps/pre-query/finalize-operator-definitions';
import { FieldExpression, Identifier } from '../../../../src/steps/pre-query/parse-query-params';

const dummyConfig = {
  or: { arity: Infinity, finalizeArgs: sut },
  and: { arity: Infinity, finalizeArgs: sut },
  binary: { arity: 2, finalizeArgs: sut },
  nary: { arity: Infinity, finalizeArgs: sut },
  trinary: { arity: 3, finalizeArgs: sut }
};

describe("finalizeFilterFieldExprArgs", () => {
  describe("`and` or `or` expressions", () => {
    it("Should require the expression have >0 arguments", () => {
      expect(() => sut(dummyConfig, "and", [])).to.throw(/"and".+requires at least one argument/);
      expect(() => sut(dummyConfig, "or", [])).to.throw(/"or".+requires at least one argument/);
    });

    it("should require every argument to be a (potentially invalid) field exp", () => {
      expect(() => sut(dummyConfig, "and", [{}])).to.throw(/"and".+arguments to be field expressions/);
      expect(() => sut(dummyConfig, "or", [4])).to.throw(/"or".+arguments to be field expressions/);

      // This code accepts field expressions as `and` arguments even if they
      // have invalid args/operators; its job isn't to do recursive validation.
      // The args of the (invalid) field expression get validated later.
      // See integration tests for this.
      const invalidExp = FieldExpression("binary", []);
      expect(sut(dummyConfig, "and", [invalidExp])).to.deep.equal([invalidExp]);

      const validArgs = [FieldExpression("nary", [])];
      expect(sut(dummyConfig, "and", validArgs)).to.deep.equal(validArgs);
    });
  });

  describe("binary operators", () => {
    it("should require args[0] to be an Identifier for binary operators", () => {
      const validArgs = [Identifier("test"), 3];
      expect(sut(dummyConfig, "binary", validArgs)).to.deep.equal(validArgs);
      expect(() => sut(dummyConfig, "binary", [4, 3])).to.throw(/expects field reference/);
    });

    it("should recursively prohibit identifiers in args[1]", () => {
      const invalidArgs = [
        [Identifier("test"), Identifier("test")],
        [Identifier("test"), [Identifier("test")]],
        [Identifier("test"), [4, Identifier("test")]]
      ];

      invalidArgs.forEach(invalidArgSet => {
        expect(() => sut(dummyConfig, "binary", invalidArgSet))
          .to.throw(/identifier not allowed in second argument/i);
      });
    });
  });

  describe("fixed arity operators", () => {
    it("should validate their arity", () => {
      const invalidArgs = [Identifier("test"), 3];
      const validArgs = [3, Identifier("test"), 3];
      expect(() => sut(dummyConfig, "trinary", invalidArgs)).to.throw(/exactly 3 arguments/);
      expect(sut(dummyConfig, "trinary", validArgs)).to.deep.equal(validArgs);
    });
  });
});
