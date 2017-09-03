"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("./Query");
class UpdateQuery extends Query_1.default {
    constructor(opts) {
        super({ using: opts.using });
        this.query = Object.assign({}, this.query, { patch: opts.patch });
    }
    get patch() {
        return this.query.patch;
    }
}
exports.default = UpdateQuery;
