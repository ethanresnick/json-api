import mongoose from "mongoose";

var schema = mongoose.Schema({
  name: String,
  email: {type: String, lowercase: true},
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  }
});

export default mongoose.model('Person', schema);
