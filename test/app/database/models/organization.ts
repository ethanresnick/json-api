import mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;
type OrgDoc = { name: string; reversed: string };

export class OrganizationSchema extends mongoose.Schema {
  constructor() {
    super(...arguments);
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
      modified: { type: Date, default: new Date() }
    });

    this.virtual('virtualName').get(function(this: OrgDoc) {
      return this.name + ' (virtualized)';
    });

    this.virtual('echo').set(function(this: OrgDoc, v: string) {
      this.reversed = v && v.split("").reverse().join("");
    }).get(function(this: OrgDoc) {
      return this.reversed && this.reversed.split("").reverse().join("");
    });
  }
}

const schema = new OrganizationSchema();
const model = mongoose.model("Organization", schema);

export default {"model": model, schema: OrganizationSchema};
