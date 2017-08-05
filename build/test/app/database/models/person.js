"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const schema = new mongoose.Schema({
    name: String,
    email: { type: String, lowercase: true },
    gender: {
        type: String,
        enum: ["male", "female", "other"]
    }
});
exports.default = mongoose.model("Person", schema);
