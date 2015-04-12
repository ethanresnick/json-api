import chai from "chai";
import APIError from "../../src/types/APIError";

let expect = chai.expect;

describe("Error Objects", () => {
  describe("validation", () => {
    let er = new APIError(300, 1401);

    it("should coerce the status to a string", () => {
      expect(er.status === "300").to.be.true;
    });

    it("should coerce the code to a string", () => {
      expect(er.code === "1401").to.be.true;
    });
  });

  describe("the fromError helper", () => {
    it("should use the error's statusCode val as status if status not defined", () => {
      let er = APIError.fromError({"statusCode": 300});
      expect(er.status === "300").to.be.true;

      er = APIError.fromError({"status": 200, "statusCode": 300});
      expect(er.status === "200").to.be.true;
    });

    it("should default to status 500", () => {
      expect(APIError.fromError({}).status).to.equal("500");
    });
  });
});
