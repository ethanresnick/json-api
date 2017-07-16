"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const utils_1 = require("../lib/utils");
const ObjectId = mongoose.Schema.Types.ObjectId;
function OrganizationSchema() {
    mongoose.Schema.apply(this, arguments);
    this.add({
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        },
        liaisons: [{ ref: "Person", type: ObjectId }],
        modified: Date
    });
}
utils_1.inherit(OrganizationSchema, mongoose.Schema);
const schema = new OrganizationSchema();
const model = mongoose.model("Organization", schema);
exports.default = { "model": model, schema: OrganizationSchema };
