"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Query_1 = require("./Query");
class CreateQuery extends Query_1.default {
    constructor(opts) {
        super({ using: opts.using });
        this.query = Object.assign({}, this.query, { records: opts.records });
    }
    get records() {
        return this.query.records;
    }
}
exports.default = CreateQuery;
