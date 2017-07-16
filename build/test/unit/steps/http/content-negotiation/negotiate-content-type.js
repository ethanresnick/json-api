"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const negotiate_content_type_1 = require("../../../../../src/steps/http/content-negotiation/negotiate-content-type");
const { expect } = chai;
describe("negotiateContentType", () => {
    it("should use JSON API if clients correctly request it", (done) => {
        let accept = "application/vnd.api+json";
        negotiate_content_type_1.default(accept, ["application/vnd.api+json"]).then((contentType) => {
            expect(contentType).to.equal("application/vnd.api+json");
            done();
        }, done).done();
    });
    it("should 406 if all json api parameter instances are parameterized, even if there's a valid alternative", (done) => {
        let accept = 'application/vnd.api+json; ext="ext2", application/json';
        negotiate_content_type_1.default(accept, ["application/vnd.api+json"]).then(done, (err) => {
            expect(err.status).to.equal("406");
            done();
        }).done();
    });
    it("should allow parameterized json api media ranges as long as not all are parameterized", (done) => {
        let accept = 'application/vnd.api+json; ext="ext2",application/vnd.api+json';
        negotiate_content_type_1.default(accept, ["application/vnd.api+json", "text/html"]).then((contentType) => {
            if (contentType === "application/vnd.api+json") {
                done();
            }
            else {
                done(new Error("Should have negotiated JSON API base type"));
            }
        }, done).done();
    });
    it("should resolve with a non-json-api type when its the highest priority + supported by the endpoint", (done) => {
        let accept = "text/html,application/vnd.api+json;q=0.5,application/json";
        negotiate_content_type_1.default(accept, ["application/vnd.api+json", "text/html"]).then((contentType) => {
            if (contentType === "text/html") {
                done();
            }
            else {
                done(new Error("Expected HTML"));
            }
        }, done).done();
    });
    it("should resolve with json-api type if that's the highest priority, even if the endpoint supports an alternative", (done) => {
        let accept = "application/vnd.api+json,application/json,text/*";
        negotiate_content_type_1.default(accept, ["application/vnd.api+json", "text/html"]).then((contentType) => {
            if (contentType === "application/vnd.api+json") {
                done();
            }
            else {
                done(new Error("Expected Json API content type."));
            }
        }, done).done();
    });
    it("should use json if client accepts only json", (done) => {
        let accept = "text/html,application/xhtml+xml,application/json;q=0.9,**;q=0.8";
        negotiate_content_type_1.default(accept, ["application/vnd.api+json"]).then((contentType) => {
            if (contentType === "application/json") {
                done();
            }
            else {
                done(new Error("Expected JSON Content Type"));
            }
        }, done);
    });
});
