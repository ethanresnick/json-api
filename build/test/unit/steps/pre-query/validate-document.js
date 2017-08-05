"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const validate_document_1 = require("../../../../src/steps/pre-query/validate-document");
describe("Validate Request Is a JSON API Document", () => {
    it("should fulfill when the input is an object with a data key", (done) => {
        validate_document_1.default({ "data": null }).then(done);
    });
    it("should reject the promise for an array body", (done) => {
        validate_document_1.default([]).then(() => { done(new Error("Should reject array bodies.")); }, (err1) => {
            chai_1.expect(err1.title).to.match(/not a valid JSON API document/);
            done();
        }).catch(done);
    });
    it("should rejet the promise for a string body", (done) => {
        validate_document_1.default("string").then(() => { done(new Error("Should reject string bodies.")); }, (err2) => {
            chai_1.expect(err2.title).to.match(/not a valid JSON API document/);
            done();
        }).catch(done);
    });
});
