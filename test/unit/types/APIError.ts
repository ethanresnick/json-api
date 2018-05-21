import { expect } from "chai";
import APIError, { displaySafe } from "../../../src/types/APIError";

describe("Error Objects", () => {
  describe("validation", () => {
    const er = new APIError({ status: 300 });

    it("should coerce the status to a string", () => {
      expect(er.status === "300").to.be.true;
    });
  });

  describe("type uri/code", () => {
    it("should serialize typeUri in code (for now), ignoring any manually set code", () => {
      const er = new APIError({ typeUri: "http://example.com/", code: 300 } as any);
      expect(er.toJSON().code).to.equal("http://example.com/");
    });
  })

  describe("structure", () => {
    const er = new APIError({ status: 300 });

    it("should be an instanceof APIError", () => {
      expect(er).to.be.instanceof(APIError);
    });

    it("should have status as an enumerable own property", () => {
      expect(Object.keys(er)).to.include("status");
    });
  });

  describe("the fromError helper", () => {
    it("should pass APIError instances through as is", () => {
      const error = new APIError();
      expect(APIError.fromError(error)).to.equal(error);
    });

    it('should set rawError on generated instances', () => {
      const x = new Error("test");
      expect(APIError.fromError(x).rawError).to.equal(x);
    });

    it("should set status, title to generic vals on non-display-safe errors", () => {
      const er = APIError.fromError({
        "statusCode": 300,
        "title": "My Error"
      });

      expect(er.status).to.eq("500");
      expect(er.title).to.not.eq("My error");
    });

    it("should use the error's statusCode val as status iff status not defined", () => {
      const er = APIError.fromError({
        "statusCode": 300,
        [displaySafe]: true
      });

      const er2 = APIError.fromError({
        "status": 200,
        "statusCode": 300,
        [displaySafe]: true
      });

      expect(er.status).to.equal("300");
      expect(er2.status).to.equal("200");
    });

    it("should default to status 500", () => {
      expect(APIError.fromError({}).status).to.equal("500");
    });
  });
});
