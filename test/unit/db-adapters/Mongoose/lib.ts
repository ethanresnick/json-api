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
