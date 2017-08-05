import mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: String,
  email: {type: String, lowercase: true},
  gender: {
    type: String,
    enum: ["male", "female", "other"]
  }
});

export default mongoose.model("Person", schema);
