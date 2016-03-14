import mongoose from "mongoose";

const schema = mongoose.Schema({
  _id: String
});

export default mongoose.model("StringId", schema);
