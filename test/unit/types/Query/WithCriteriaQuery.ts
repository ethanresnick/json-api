import { expect } from "chai";
import { Identifier } from "../../../../src/steps/pre-query/parse-query-params";
import WithCriteriaQuery from "../../../../src/types/Query/WithCriteriaQuery";

describe("WithCriteriaQuery", () => {
  const returning = (it: any) => it;
  const getIdFilters = (q: any) =>
    q.getFilters().args.filter(it => it.args[0].value === "id");

  const queries = [
    new WithCriteriaQuery({ type: "any", returning, singular: true }), // no id
    new WithCriteriaQuery({ type: "any", id: "23", returning }), // single id
    new WithCriteriaQuery({ type: "any", ids: ["23", "43"], returning })
  ];

  describe("matchingIdOrIds", () => {
    describe("matching single id", () => {
      const resultQueries = queries.map(q => q.matchingIdOrIds("33"));

      it("should add an id filter, not removing any that already exist", () => {
        const resultIdFilters = resultQueries.map(getIdFilters);
        const addedFilter = { type: "FieldExpression", args: [Identifier("id"), "33"], operator: "eq" };

        expect(resultIdFilters).to.deep.equal([
          [addedFilter],
          [{ type: "FieldExpression", args: [Identifier("id"), "23"], operator: "eq" }, addedFilter],
          [{ type: "FieldExpression", args: [Identifier("id"), ["23", "43"]], operator: "in" }, addedFilter]
        ]);
      });

      it("should set the query singular", () => {
        expect(resultQueries.every(it => it.singular === true)).to.be.true;
      });
    });

    describe("matching multiple ids", () => {
      const resultQueries = queries.map(q => q.matchingIdOrIds(["33", "45"]));
      it("should add an id filter, not removing any that already exist", () => {
        const resultIdFilters = resultQueries.map(getIdFilters);
        const addedFilter = {
          type: "FieldExpression",
          args: [Identifier("id"), ["33", "45"]],
          operator: "in"
        };

        expect(resultIdFilters).to.deep.equal([
          [addedFilter],
          [{ type: "FieldExpression", args: [Identifier("id"), "23"], operator: "eq" }, addedFilter],
          [{ type: "FieldExpression", args: [Identifier("id"), ["23", "43"]], operator: "in" }, addedFilter]
        ]);
      });

      it("should leave the singularity as is", () => {
        expect(resultQueries.map(it => it.singular)).to.deep.equal([true, true, false]);
      });
    });

    describe("matching undefined", () => {
      it('should be a noop', () => {
        expect(queries.map(it => it.matchingIdOrIds(undefined))).to.deep.equal(queries);
      });
    });
  });
});
