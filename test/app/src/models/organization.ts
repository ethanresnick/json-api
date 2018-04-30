import mongoose = require("mongoose");
require('mongoose-geojson-schema'); //tslint:disable-line no-var-requires

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
      location: {
        type: mongoose.Schema.Types.Point,
        index: "2dsphere"
      },
      description: {
        type: String
      },
      reversed: {
        type: String
      },
      liaisons: [{ ref: "Person", type: ObjectId }],
      modified: { type: Date, default: new Date() },

      // This variable is never set by the user on create,
      // but we want to test that mongoose sets it with the default.
      neverSet: {
        type: String,
        default: "set from mongoose default"
      }
    });

    this.virtual("virtualName").get(function(this: OrgDoc) {
      return this.name + " (virtualized)";
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

export default { model: model, schema: OrganizationSchema };
