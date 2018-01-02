"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const WithCriteriaQuery_1 = require("../../../../src/types/Query/WithCriteriaQuery");
describe("WithCriteriaQuery", () => {
    const returning = (it) => it;
    const getIdFilters = (q) => q.getFilters().value.filter(it => it.field === 'id');
    const queries = [
        new WithCriteriaQuery_1.default({ type: "any", returning, singular: true }),
        new WithCriteriaQuery_1.default({ type: "any", id: "23", returning }),
        new WithCriteriaQuery_1.default({ type: "any", ids: ["23", "43"], returning })
    ];
    describe("matchingIdOrIds", () => {
        describe("matching single id", () => {
            const resultQueries = queries.map(q => q.matchingIdOrIds("33"));
            it("should add an id filter, not removing any that already exist", () => {
                const resultIdFilters = resultQueries.map(getIdFilters);
                const addedFilter = { field: "id", operator: 'eq', value: "33" };
                chai_1.expect(resultIdFilters).to.deep.equal([
                    [addedFilter],
                    [{ field: "id", operator: 'eq', value: "23" }, addedFilter],
                    [{ field: "id", operator: 'in', value: ["23", "43"] }, addedFilter]
                ]);
            });
            it("should set the query singular", () => {
                chai_1.expect(resultQueries.every(it => it.singular === true)).to.be.true;
            });
        });
        describe("matching multiple ids", () => {
            const resultQueries = queries.map(q => q.matchingIdOrIds(["33", "45"]));
            it("should add an id filter, not removing any that already exist", () => {
                console.log(resultQueries[1].getFilters());
                const resultIdFilters = resultQueries.map(getIdFilters);
                const addedFilter = { field: "id", operator: 'in', value: ["33", "45"] };
                chai_1.expect(resultIdFilters).to.deep.equal([
                    [addedFilter],
                    [{ field: "id", operator: 'eq', value: "23" }, addedFilter],
                    [{ field: "id", operator: 'in', value: ["23", "43"] }, addedFilter]
                ]);
            });
            it("should leave the singularity as is", () => {
                chai_1.expect(resultQueries.map(it => it.singular)).to.deep.equal([true, true, false]);
            });
        });
        describe("matching undefined", () => {
            it('should be a noop', () => {
                chai_1.expect(queries.map(it => it.matchingIdOrIds())).to.deep.equal(queries);
            });
        });
    });
});
