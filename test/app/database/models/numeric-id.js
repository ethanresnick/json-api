import mongoose from "mongoose";

const schema = mongoose.Schema({
  _id: Number
});

export default mongoose.model("NumericId", schema);
