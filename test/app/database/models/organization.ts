import mongoose = require("mongoose");
import { inherit } from "../lib/utils";

const ObjectId = mongoose.Schema.Types.ObjectId;

function OrganizationSchema() {
  mongoose.Schema.apply(this, arguments);
  this.add({
    name: {
      type: String,
      required: true,
      set: (it) => it.toUpperCase()
    },
    description: {
      type: String
    },
    reversed: {
      type: String
    },
    liaisons: [{ref: "Person", type: ObjectId}],
    modified: Date
  });

  this.virtual('virtualName').get(function() {
    return this.name + ' (virtualized)';
  });

  this.virtual('echo').set(function(v) {
    this.reversed = v && v.split("").reverse().join("");
  }).get(function() {
    return this.reversed && this.reversed.split("").reverse().join("");
  });
}

inherit(OrganizationSchema, mongoose.Schema);

const schema = new OrganizationSchema();
const model = mongoose.model("Organization", schema);

export default {"model": model, schema: OrganizationSchema};
