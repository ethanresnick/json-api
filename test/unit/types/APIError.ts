import { expect } from "chai";
import APIError from "../../../src/types/APIError";

describe("Error Objects", () => {
  describe("validation", () => {
    const er = new APIError({ status: 300 });

    it("should coerce the status to a string", () => {
      expect(er.status === "300").to.be.true;
    });
  });

  describe("type uri/code", () => {
    it("should coerce code to string", () => {
      const er = new APIError({ code: 1401 });
      expect(er.code).to.equal("1401");
      expect(er.toJSON().code).to.equal("1401");
    });

    it("should serialize typeUri in code (for now), overriding any manually set code", () => {
      const er = new APIError({ typeUri: "http://example.com/", code: 300 });
      expect(er.code).to.equal("300");
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

    it('should set rawError on genereted instances', () => {
      const x = new Error("test");
      expect(APIError.fromError(x).rawError).to.equal(x);
    })

    it("should use the error's statusCode val as status iff status not defined", () => {
      let er = APIError.fromError({
        "statusCode": 300,
        "isJSONAPIDisplayReady": true
      });
      expect(er.status === "300").to.be.true;

      er = APIError.fromError({
        "status": 200,
        "statusCode": 300,
        "isJSONAPIDisplayReady": true
      });
      expect(er.status === "200").to.be.true;
    });

    it("should default to status 500", () => {
      expect(APIError.fromError({}).status).to.equal("500");
    });
  });
});
