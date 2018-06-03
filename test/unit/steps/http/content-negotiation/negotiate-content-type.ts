import chai = require("chai");
import negotiate from "../../../../../src/steps/http/content-negotiation/negotiate-content-type";

const { expect } = chai;
const JSON_API_BASE_MEDIA_TYPE = "application/vnd.api+json";
const HTML_MEDIA_TYPE = "text/html";

describe("negotiateContentType", () => {
  it("should use JSON API if clients correctly request it", () => {
    const accept = JSON_API_BASE_MEDIA_TYPE;
    return negotiate(accept, [JSON_API_BASE_MEDIA_TYPE])
      .then(contentType => {
        expect(contentType).to.equal(JSON_API_BASE_MEDIA_TYPE);
      });
  });

  it("should 406 if all json api parameter instances are parameterized, even if there's a valid alternative", (done) => {
    const accept = 'application/vnd.api+json; ext="ext2", application/json';
    negotiate(accept, [JSON_API_BASE_MEDIA_TYPE])
      .then(done, err => {
        expect(err.status).to.equal("406");
        done();
      })
      .catch(done);
  });

  it("should allow parameterized json api media ranges as long as not all are parameterized", () => {
    const accept =
      'application/vnd.api+json; ext="ext2",application/vnd.api+json';

    return negotiate(accept, [JSON_API_BASE_MEDIA_TYPE, HTML_MEDIA_TYPE])
      .then(contentType => {
        expect(contentType).to.equal(JSON_API_BASE_MEDIA_TYPE);
      });
  });

  it("should resolve with a non-json-api type when its the highest priority + supported by the endpoint", () => {
    const accept = "text/html,application/vnd.api+json;q=0.5,application/json";
    return negotiate(accept, [JSON_API_BASE_MEDIA_TYPE, HTML_MEDIA_TYPE])
      .then(contentType => {
        expect(contentType).to.equal(HTML_MEDIA_TYPE);
      });
  });

  it("should resolve with json-api type if that's the highest priority, even if the endpoint supports an alternative", () => {
    const accept = "application/vnd.api+json,application/json,text/*";
    return negotiate(accept, [JSON_API_BASE_MEDIA_TYPE, HTML_MEDIA_TYPE])
      .then(contentType => {
        expect(contentType).to.equal(JSON_API_BASE_MEDIA_TYPE);
      });
  });

  it("should use json if client accepts only json", () => {
    const accept =
      "text/html,application/xhtml+xml,application/json;q=0.9,**;q=0.8";

    return negotiate(accept, [JSON_API_BASE_MEDIA_TYPE])
      .then(contentType => {
        expect(contentType).to.eq("application/json");
      });
  });
});
