"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FieldType_1 = require("./FieldType");
class RelationshipType extends FieldType_1.default {
    constructor(toMany, targetModel, targetType) {
        super("Relationship", toMany);
        [this.targetModel, this.targetType] = [targetModel, targetType];
    }
    toString() {
        return (this.isArray ? "Array[" : "") + this.targetModel + "Id" + (this.isArray ? "]" : "");
    }
}
exports.default = RelationshipType;
