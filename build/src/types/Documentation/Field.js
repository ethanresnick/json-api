"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Field {
    constructor(name, type, validation = {}, friendlyName, defaultVal) {
        this.kind = type;
        this.name = name;
        this.validation = validation;
        this.friendlyName = friendlyName;
        this.default = defaultVal;
    }
}
exports.default = Field;
