import { expect } from "chai";
import WithCriteriaQuery from "../../../../src/types/Query/WithCriteriaQuery";

describe("WithCriteriaQuery", () => {
  const returning = (it: any) => it;
  const getIdFilters = (q: any) => q.getFilters().value.filter(it => it.field === 'id');
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
        const addedFilter = { field: "id", operator: 'eq', value: "33" };

        expect(resultIdFilters).to.deep.equal([
          [addedFilter],
          [{ field: "id", operator: 'eq', value: "23" }, addedFilter],
          [{ field: "id", operator: 'in', value: ["23", "43"] }, addedFilter]
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
        const addedFilter = { field: "id", operator: 'in', value: ["33", "45"] };

        expect(resultIdFilters).to.deep.equal([
          [addedFilter],
          [{ field: "id", operator: 'eq', value: "23" }, addedFilter],
          [{ field: "id", operator: 'in', value: ["23", "43"] }, addedFilter]
        ]);
      });

      it("should leave the singularity as is", () => {
        expect(resultQueries.map(it => it.singular)).to.deep.equal([true, true, false]);
      });
    });

    describe("matching undefined", () => {
      it('should be a noop', () => {
        expect(queries.map(it => it.matchingIdOrIds())).to.deep.equal(queries);
      });
    })
  });
});
