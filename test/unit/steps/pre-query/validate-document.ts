import { expect } from "chai";
import validateDocument from "../../../../src/steps/pre-query/validate-document";

describe("Validate Request Is a JSON API Document", () => {
  it("should fulfill when the input is an object with a data key", (done) => {
    validateDocument({"data": null}).then(done);
  });

  it("should reject the promise for an array body", (done) => {
    validateDocument([]).then(
      () => { done(new Error("Should reject array bodies.")); },
      (err1) => {
        expect(err1.title).to.match(/not a valid JSON API document/);
        done();
      }
    ).catch(done);
  });

  it("should rejet the promise for a string body", (done) => {
    validateDocument("string").then(
      () => { done(new Error("Should reject string bodies.")); },
      (err2) => {
        expect(err2.title).to.match(/not a valid JSON API document/);
        done();
      }
    ).catch(done);
  });
});
