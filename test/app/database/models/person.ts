import mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: String,
  email: {type: String, lowercase: true},
  gender: {
    type: String,
    enum: ["male", "female", "other"]
  },
  manages: { type: mongoose.SchemaTypes.ObjectId, ref: 'Organization' },
  homeSchool: { type: mongoose.SchemaTypes.ObjectId, ref: 'School' }
});

type PersonDoc = { name: string };

schema.virtual('virtualName').get(function(this: PersonDoc) {
  return this.name + ' (virtualized)'; // tslint:disable-line:no-invalid-this
}).set(function(this: PersonDoc, v: string) {
  // tslint:disable-next-line:no-invalid-this
  this.name = v.substr(0, v.lastIndexOf(' (virtualized)'));
});

export default mongoose.model("Person", schema);
