import { expect } from "chai";
import { Predicate } from "../../../../src/types/index";
import { toMongoCriteria } from "../../../../src/db-adapters/Mongoose/lib";

describe("Mongoose Adapter private helper functions", () => {
  describe("toMongoCriteria", () => {
    describe("predicates", () => {
      it("should return empty objects for predicates with empty arguments", () => {
        const or: Predicate = { field: undefined, value: [], operator: "or"};
        const and: Predicate = { field: undefined, value: [], operator: "and"};

        expect(toMongoCriteria(or)).to.deep.equal({});
        expect(toMongoCriteria(and)).to.deep.equal({})
      })
    });

    it("should support multiple operators for the same field", () => {
      const testPredicate: Predicate = {
        operator: "and",
        value: [
          { field: "field", value: "value", operator: "eq" },
          { field: "field", value: "value", operator: "neq" },
          { field: "field", value: "value", operator: "gte" },
          {
            operator: "or",
            value: [
              { field: "field", value: "value2", operator: "eq"},
              { field: "field3", value: 1, operator: "gte"}
            ],
            field: undefined
          }
        ],
        field: undefined
      };

      expect(toMongoCriteria(testPredicate)).to.deep.equal({
        $and: [
          { field: "value" },
          { field: { $ne: "value" } },
          { field: { $gte: "value" } },
          { $or: [{ field: "value2" }, {field3: { $gte: 1 } }] }
        ]
      });
    });

    it("should support multiple filters with the same operator + field", () => {
      expect(toMongoCriteria({
        operator: 'and',
        value:
         [ { field: 'id2', operator: 'eq', value: '23' },
           { field: 'id2', operator: 'in', value: ['1', '2'] },
           { field: 'id2', operator: 'eq', value: '33' } ],
        field: undefined
      })).to.deep.equal({
        $and: [
          { id2: "23" },
          { id2: { $in: ['1', '2'] } },
          { id2: '33'}
        ]
      })
    });

    it("should transform filters on id to filters on _id", () => {
      expect(toMongoCriteria({
        operator: 'and',
        value:
         [ { field: 'id', operator: 'eq', value: '33' } ],
        field: undefined
      })).to.deep.equal({
        $and: [
          { _id: "33" }
        ]
      });
    })

    it("should support nested predicates", () => {
      const testPredicate: Predicate = {
        operator: "and",
        value: [
          { field: "field", value: "value", operator: "eq"},
          {
            operator: "or",
            value: [
              {
                operator: "and",
                value: [{ field: "field2", value: "varlu2", operator: "eq"}],
                field: undefined
              },
              { field: "field3", value: 1, operator: "gte"}
            ],
            field: undefined
          }
        ],
        field: undefined
      };

      expect(toMongoCriteria(testPredicate)).to.deep.equal({
        $and: [
          { field: "value" },
          {
            $or: [
              { $and: [{ field2: "varlu2" }] },
              {field3: { $gte: 1 }}
            ]
          }
        ]
      });
    });
  });
});
