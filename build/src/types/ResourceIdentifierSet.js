"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MaybeDataWithLinks_1 = require("./MaybeDataWithLinks");
class ResourceIdentifierSet extends MaybeDataWithLinks_1.default {
    toJSON() {
        return this.unwrapWith((it) => it.toJSON(), {});
    }
    static of(it) {
        return new this(it);
    }
}
exports.default = ResourceIdentifierSet;
