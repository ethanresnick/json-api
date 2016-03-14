import mongoose from "mongoose";

const schema = mongoose.Schema({
  _id: {
    type: Number,
    required: true
  }
});

export default mongoose.model("NumericId", schema);
