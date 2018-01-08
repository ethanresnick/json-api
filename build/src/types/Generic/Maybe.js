"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Nothing {
    getOrDefault(defaultVal) {
        return defaultVal;
    }
    bind(transform) {
        return this;
    }
    map(transform) {
        return this;
    }
}
exports.Nothing = Nothing;
;
class Just {
    constructor(x) {
        this.val = x;
    }
    getOrDefault(defaultVal) {
        return this.val;
    }
    map(transform) {
        return Maybe(transform(this.val));
    }
    bind(transform) {
        const transformed = transform(this.val);
        if (transformed instanceof Just || transformed instanceof Nothing) {
            return transformed;
        }
        else {
            return Maybe(transformed);
        }
    }
}
exports.Just = Just;
const NOTHING = new Nothing();
function Maybe(x) {
    return x !== undefined ? new Just(x) : NOTHING;
}
exports.default = Maybe;
