"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
function default_1(request) {
    return new Promise(function (resolve, reject) {
        const errMessage = "Request body is not a valid JSON API document.";
        const missingBoddyError = new APIError_1.default(400, null, errMessage);
        switch (typeof request.body) {
            case 'undefined':
                resolve();
                break;
            case 'object': {
                !Object.prototype.hasOwnProperty.call(request.body, "data")
                    ? reject(missingBoddyError)
                    : resolve();
                break;
            }
            default:
                reject(missingBoddyError);
        }
    });
}
exports.default = default_1;
