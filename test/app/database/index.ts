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
const echoOrgId = ObjectId("59ac9c0ecc4c356fcda65202");
const genderPersonId = ObjectId("59af14d3bbd18cd55ea08ea1");
const invisibleResourceId = ObjectId("59af14d3bbd18cd55ea08ea2");
const elementaryId = ObjectId("59af14d3bbd18cd55ea08ea3");
/*eslint-enable new-cap */

const OrganizationModel = OrganizationModelSchema.model;
const OrganizationSchema = OrganizationModelSchema.schema;

const models = {
  Person: PersonModel,
  Organization: OrganizationModel,
  School: makeSchoolModelConstructor(OrganizationModel, OrganizationSchema)
};

fixtures.save("all", {
  // Don't add/delete in this collection; the pagination tests depend
  // on it being exactly as is. Also, don't change anyone's name or gender,
  // as the query transform and sorting tests depend on those.
  Person: [
    { name: "John Smith", email: "jsmith@gmail.com", gender: "male", _id: smithId },
    { name: "Jane Doe", gender: "female", _id: doeId },
    { name: "Doug Wilson", gender: "male" },
    { name: "Jordi Jones", _id: genderPersonId, gender: "other" },
    { name: "An Inivisible Sorcerer", gender: "other", _id: invisibleResourceId },
  ],
  Organization: [
    {name: "State Government", description: "Representing the good people.", liaisons: [doeId, smithId], _id: govtId},
    {name: "Org whose echo prop I'll change", reversed: "Test", _id: echoOrgId, liaisons: [doeId], modified: new Date("2015-01-01")}
  ],
  School: [
    {name: "City College", description: "Just your average local college.", liaisons: [smithId]},
    {name: "State College", description: "Just your average state college."},
    {name: "Elementary School", description: "For the youngins.", principal: invisibleResourceId, _id: elementaryId }
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
