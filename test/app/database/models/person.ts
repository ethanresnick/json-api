import mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: String,
  email: {type: String, lowercase: true},
  gender: {
    type: String,
    enum: ["male", "female", "other"]
  }
});

schema.virtual('virtualName').get(function() {
  return this.name + ' (virtualized)';
}).set(function(v) {
  this.name = v.substr(0, v.lastIndexOf(' (virtualized)'));
});

export default mongoose.model("Person", schema);
