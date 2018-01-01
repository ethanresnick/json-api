"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
function default_1(Organization, OrganizationSchema) {
    const schema = new OrganizationSchema({
        isCollege: Boolean,
        principal: { ref: "Person", type: ObjectId },
    });
    return Organization.discriminator("School", schema);
}
exports.default = default_1;
