"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const validate_content_type_1 = require("../../../../../src/steps/http/content-negotiation/validate-content-type");
const { expect } = chai;
describe("validateContentType", () => {
    const invalidMock = { contentType: "application/json", ext: [] };
    const validMock = { contentType: "application/vnd.api+json", ext: [] };
    it("should return a promise", () => {
        expect(validate_content_type_1.default(validMock) instanceof Promise).to.be.true;
    });
    it("should fail resquests with invalid content types with a 415", (done) => {
        validate_content_type_1.default(invalidMock, []).then(() => { done(new Error("This shouldn't run!")); }, (err) => { if (err.status === "415") {
            done();
        } });
    });
    it("should allow requests with no extensions", (done) => {
        validate_content_type_1.default(validMock, ["ext1", "ext2"]).then(done);
    });
});
