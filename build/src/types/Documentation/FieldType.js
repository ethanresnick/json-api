"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FieldType {
    constructor(baseType, isArray = false) {
        [this.baseType, this.isArray] = [baseType, isArray];
    }
    toString() {
        return (this.isArray ? "Array[" : "") + this.baseType + (this.isArray ? "]" : "");
    }
}
exports.default = FieldType;
