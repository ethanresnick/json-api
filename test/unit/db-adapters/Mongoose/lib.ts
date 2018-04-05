import mongoose = require("mongoose");
import { expect } from "chai";
import { Predicate } from "../../../../src/types/index";
import { toMongoCriteria, errorHandler } from "../../../../src/db-adapters/Mongoose/lib";
import APIError from '../../../../src/types/APIError';
import * as Errors from '../../../../src/util/errors';

describe("Mongoose Adapter private helper functions", () => {
  describe("errorHandler", () => {
    const validationSchema = new mongoose.Schema({
      "required": { required: true, type: String },
      "number": { type: Number },
      "customSetter": {
        type: Boolean,
        set(v) {
          if(v === 4) {
            throw new APIError({ typeUri: "made-up-for-test" })
          } else if (v === 5) {
            throw new Error("Generic error");
          } else {
            return v !== 0;
          }
        }
      }
    })
    const TestModel = mongoose.model("ValidationTest", validationSchema);

    const testModelErrors = (
      doc: any,
      testFn: (result: Error[], rawError: Error) => any
    ) => {
      return new TestModel(doc).validate().then(() => {
        throw new Error("Should not run");
      }, (e) => {
        try {
          errorHandler(e);
        } catch(result) {
          return testFn(result, e);
        }
      });
    };

    it("should return a special error for missing required fields", () => {
      return testModelErrors({}, (errors, rawError) => {
        const error = errors[0];
        const rawRequiredError = (rawError as any).errors.required;

        expect(error).to.be.an.instanceof(APIError);
        expect(error).to.deep.equal(
          Errors.missingField({
            detail: rawRequiredError.message,
            rawError: rawRequiredError
          })
        );
      });
    });

    it("should return a field invalid error w/ mongoose's message for built-in errors", () => {
      return testModelErrors({
        required: "present",
        number: "String!"
      }, (errors, rawError) => {
        const error = errors[0];
        const rawCastError = (rawError as any).errors.number;

        expect(error).to.be.an.instanceof(APIError);
        expect(error).to.deep.equal(
          Errors.invalidFieldValue({
            detail: 'Cast to Number failed for value "String!" at path "number"',
            rawError: rawCastError
          })
        );
      });
    });

    it("should use generic message, but error.reason as rawError, if user threw custom error", () => {
      return testModelErrors({
        required: "present",
        customSetter: 5
      }, (errors, rawError) => {
        const error = errors[0];
        const rawCastError = (rawError as any).errors.customSetter;

        expect(error).to.be.an.instanceof(APIError);
        expect(error).to.deep.equal(
          Errors.invalidFieldValue({
            detail: 'Invalid value for path "customSetter"',
            rawError: rawCastError.reason
          })
        );
      });
    });

    it("should use user-provided APIError if present", () => {
      return testModelErrors({
        required: "present",
        customSetter: 4
      }, (errors, rawError) => {
        const error = errors[0];
        expect(error).to.be.an.instanceof(APIError);
        expect(error).to.deep.equal(
          new APIError({ typeUri: "made-up-for-test" })
        );
      });
    });

    it("should support multiple errors at once", () => {
      return testModelErrors({
        customSetter: 4
      }, (errors, rawError) => {
        expect(
          errors.some((it: any) =>
            it.typeUri === "https://jsonapi.js.org/errors/missing-required-field"
          )
        ).to.be.true;

        expect(
          errors.some((it: any) => it.typeUri === "made-up-for-test")
        ).to.be.true;
      });
    })
  });

  describe("toMongoCriteria", () => {
    describe("predicates", () => {
      it("should return empty objects for predicates with empty arguments", () => {
        const or: Predicate = { field: undefined, value: [], operator: "or" };
        const and: Predicate = { field: undefined, value: [], operator: "and" };

        expect(toMongoCriteria(or)).to.deep.equal({});
        expect(toMongoCriteria(and)).to.deep.equal({});
      });
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
              { field: "field", value: "value2", operator: "eq" },
              { field: "field3", value: 1, operator: "gte" }
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
          { $or: [{ field: "value2" }, { field3: { $gte: 1 } }] }
        ]
      });
    });

    it("should support multiple filters with the same operator + field", () => {
      expect(
        toMongoCriteria({
          operator: "and",
          value: [
            { field: "id2", operator: "eq", value: "23" },
            { field: "id2", operator: "in", value: ["1", "2"] },
            { field: "id2", operator: "eq", value: "33" }
          ],
          field: undefined
        })
      ).to.deep.equal({
        $and: [
          { id2: "23" },
          { id2: { $in: ["1", "2"] } },
          { id2: "33"}
        ]
      });
    });

    it("should transform filters on id to filters on _id", () => {
      expect(
        toMongoCriteria({
          operator: "and",
          value: [{ field: "id", operator: "eq", value: "33" }],
          field: undefined
        })
      ).to.deep.equal({
        $and: [
          { _id: "33" }
        ]
      });
    });

    it("should support nested predicates", () => {
      const testPredicate: Predicate = {
        operator: "and",
        value: [
          { field: "field", value: "value", operator: "eq" },
          {
            operator: "or",
            value: [
              {
                operator: "and",
                value: [{ field: "field2", value: "varlu2", operator: "eq" }],
                field: undefined
              },
              { field: "field3", value: 1, operator: "gte" }
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
