"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("./APIError");
class ResourceIdentifier {
    constructor(type, id) {
        this.type = type;
        this.id = id;
    }
    toJSON() {
        return { id: this.id, type: this.type };
    }
    static fromJSON(it) {
        if (!isValidLinkageObject(it)) {
            throw new APIError_1.default(400, undefined, "Invalid linkage value.");
        }
        const Constructor = this || ResourceIdentifier;
        return new Constructor(it.type, it.id);
    }
}
exports.default = ResourceIdentifier;
function isValidLinkageObject(it) {
    return it && typeof it.type === "string" && typeof it.id === "string";
}
exports.isValidLinkageObject = isValidLinkageObject;
