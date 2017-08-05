import {expect} from "chai";
import APIError from "../../../src/types/APIError";

describe("Error Objects", () => {
  describe("validation", () => {
    const er = new APIError(300, 1401);

    it("should coerce the status to a string", () => {
      expect(er.status === "300").to.be.true;
    });

    it("should coerce the code to a string", () => {
      expect(er.code === "1401").to.be.true;
    });
  });

  describe("the fromError helper", () => {
    it("should pass APIError instances through as is", () => {
      const error = new APIError();
      expect(APIError.fromError(error)).to.equal(error);
    });

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
