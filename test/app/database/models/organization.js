import mongoose from "mongoose";
import utils from "../lib/utils";

const ObjectId = mongoose.Schema.Types.ObjectId;

function OrganizationSchema() {
  mongoose.Schema.apply(this, arguments);
  this.add({
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    dateEstablished: {
      type: Date
    },
    liaisons: [{ref: "Person", type: ObjectId}]
  });
}

utils.inherit(OrganizationSchema, mongoose.Schema);

const schema = new OrganizationSchema();
const model = mongoose.model("Organization", schema);

export default {"model": model, schema: OrganizationSchema};
