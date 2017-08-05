"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const APIError_1 = require("../../../src/types/APIError");
describe("Error Objects", () => {
    describe("validation", () => {
        const er = new APIError_1.default(300, 1401);
        it("should coerce the status to a string", () => {
            chai_1.expect(er.status === "300").to.be.true;
        });
        it("should coerce the code to a string", () => {
            chai_1.expect(er.code === "1401").to.be.true;
        });
    });
    describe("the fromError helper", () => {
        it("should pass APIError instances through as is", () => {
            const error = new APIError_1.default();
            chai_1.expect(APIError_1.default.fromError(error)).to.equal(error);
        });
        it("should use the error's statusCode val as status iff status not defined", () => {
            let er = APIError_1.default.fromError({
                "statusCode": 300,
                "isJSONAPIDisplayReady": true
            });
            chai_1.expect(er.status === "300").to.be.true;
            er = APIError_1.default.fromError({
                "status": 200,
                "statusCode": 300,
                "isJSONAPIDisplayReady": true
            });
            chai_1.expect(er.status === "200").to.be.true;
        });
        it("should default to status 500", () => {
            chai_1.expect(APIError_1.default.fromError({}).status).to.equal("500");
        });
    });
});
