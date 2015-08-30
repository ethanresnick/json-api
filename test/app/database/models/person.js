import mongoose from "mongoose";

const schema = mongoose.Schema({ //eslint-disable-line new-cap
  name: String,
  email: {type: String, lowercase: true},
  gender: {
    type: String,
    enum: ["male", "female", "other"]
  }
});

export default mongoose.model("Person", schema);
