import mongoose from "mongoose";

const schema = mongoose.Schema({
  _id: {
    type: String,
    required: true
  }
});

export default mongoose.model("StringId", schema);
