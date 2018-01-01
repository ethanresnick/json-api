"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
class OrganizationSchema extends mongoose.Schema {
    constructor() {
        super(...arguments);
        this.add({
            name: {
                type: String,
                required: true,
                set: (it) => it.toUpperCase()
            },
            description: {
                type: String
            },
            reversed: {
                type: String
            },
            liaisons: [{ ref: "Person", type: ObjectId }],
            modified: { type: Date, default: new Date() }
        });
        this.virtual('virtualName').get(function () {
            return this.name + ' (virtualized)';
        });
        this.virtual('echo').set(function (v) {
            this.reversed = v && v.split("").reverse().join("");
        }).get(function () {
            return this.reversed && this.reversed.split("").reverse().join("");
        });
    }
}
exports.OrganizationSchema = OrganizationSchema;
const schema = new OrganizationSchema();
const model = mongoose.model("Organization", schema);
exports.default = { "model": model, schema: OrganizationSchema };
