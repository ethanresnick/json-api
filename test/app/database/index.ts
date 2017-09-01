import mongoose = require("mongoose");
import fixtures = require("node-mongoose-fixtures");

import PersonModel from "./models/person";
import makeSchoolModelConstructor from "./models/school";
import OrganizationModelSchema from "./models/organization";

/*eslint-disable new-cap */
const ObjectId = mongoose.Types.ObjectId;
const govtId = ObjectId("54419d550a5069a2129ef254");
const smithId = ObjectId("53f54dd98d1e62ff12539db2");
const doeId = ObjectId("53f54dd98d1e62ff12539db3");
/*eslint-enable new-cap */

const OrganizationModel = OrganizationModelSchema.model;
const OrganizationSchema = OrganizationModelSchema.schema;

const models = {
  Person: PersonModel,
  Organization: OrganizationModel,
  School: makeSchoolModelConstructor(OrganizationModel, OrganizationSchema)
};

fixtures.save("all", {
  Person: [
    { name: "John Smith", email: "jsmith@gmail.com", gender: "male", _id: smithId },
    { name: "Jane Doe", gender: "female", _id: doeId },
    { name: "Doug Wilson", gender: "male" }
  ],
  Organization: [
    {name: "State Government", description: "Representing the good people.", liaisons: [doeId, smithId], _id: govtId}
  ],
  School: [
    {name: "City College", description: "Just your average local college.", liaisons: [smithId]},
    {name: "State College", description: "Just your average state college."}
  ]
});

/**
 * Export a promise for an object that can get the models and load
 * and reset the fixtures.
 */
export default mongoose.connect(
  "mongodb://localhost/integration-test",
  { useMongoClient: true}
).then(function() {
  return {
    models() {
      return models;
    },
    instance() {
      return mongoose;
    },
    fixturesRemoveAll() {
      return new Promise((resolve, reject) => {
        fixtures.reset((err, res) => {
          err ? reject(err) : resolve(res)
        })
      });
    },
    fixturesReset() {
      return this.fixturesRemoveAll().then(function() {
        return new Promise((resolve, reject) => {
          fixtures("all", (err, res) => {
            err ? reject(err) : resolve(res)
          })
        });
      });
    }
  };
});
