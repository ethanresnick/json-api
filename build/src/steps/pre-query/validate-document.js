"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
function default_1(body) {
    return new Promise(function (resolve, reject) {
        const ownProp = Object.prototype.hasOwnProperty;
        const errMessage = "Request body is not a valid JSON API document.";
        if (typeof body !== "object" || !ownProp.call(body, "data")) {
            reject(new APIError_1.default(400, undefined, errMessage));
        }
        else {
            resolve(undefined);
        }
    });
}
exports.default = default_1;
