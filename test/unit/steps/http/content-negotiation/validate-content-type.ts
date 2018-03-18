import chai = require("chai");
import validate from "../../../../../src/steps/http/content-negotiation/validate-content-type";

const { expect } = chai;

describe("validateContentType", () => {
  const invalidMock = { contentType: "application/json", ext: [] };
  const validMock = { contentType: "application/vnd.api+json", ext: [] };

  it("should return a promise", () => {
    expect(validate(validMock) instanceof Promise).to.be.true;
  });

  it("should fail resquests with invalid content types with a 415", (done) => {
    validate(invalidMock, []).then(
      () => { done(new Error("This shouldn't run!")); },
      (err) => { if(err.status === "415") { done(); } }
    );
  });

  it("should allow requests with no extensions", (done) => {
    validate(validMock, ["ext1", "ext2"]).then(done);
  });

  /*
  it("should reject requests for unsupported extensions with a 415", (done) => {
    let contextMock = {contentType: "application/vnd.api+json", ext: ["bulk"]};
    requestValidators.checkContentType(contextMock, ["ext1", "ext2"]).then(
      () => { done(new Error("This shouldn't run!")); },
      (err) => { if(err.status === "415") { done(); } }
    );
  });

  it("should use json api with supported-ext when json api is supported and we're using no extensions", (done) => {
    let accept = "application/vnd.api+json";
    negotiate(accept, [], ["ext1", "ext2"]).then((contentType) => {
      if(contentType === 'application/vnd.api+json; supported-ext="ext1,ext2"') {
        done();
      }
      else {
        done(new Error("Expected JSON API Content Type"));
      }
    }, done);
  });
  */
});
