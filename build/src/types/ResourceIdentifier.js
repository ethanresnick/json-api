"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("./APIError");
class ResourceIdentifier {
    constructor(it) {
        if (!isValidLinkageObject(it)) {
            throw new APIError_1.default(400, undefined, "Invalid linkage value.");
        }
        this.type = it.type;
        this.id = it.id;
    }
    toJSON() {
        return { id: this.id, type: this.type };
    }
}
exports.default = ResourceIdentifier;
function isValidLinkageObject(it) {
    return it && typeof it.type === "string" && typeof it.id === "string";
}
exports.isValidLinkageObject = isValidLinkageObject;
