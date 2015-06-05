import Q from "q";
import mongoose from "mongoose";
import fixtures from "node-mongoose-fixtures";
import OrganizationModelSchema from "./models/organization";

const ObjectId = mongoose.Types.ObjectId;
const govtId = ObjectId("54419d550a5069a2129ef254");
const smithId = ObjectId("53f54dd98d1e62ff12539db2");
const doeId = ObjectId("53f54dd98d1e62ff12539db3");

const OrganizationModel = OrganizationModelSchema.model;
const OrganizationSchema = OrganizationModelSchema.schema;

const models = {
  Person: require("./models/person"),
  Organization: OrganizationModel,
  School: require("./models/school")(OrganizationModel, OrganizationSchema)
};

fixtures.save("all", {
  Person: [
    { name: "John Smith", email: "jsmith@gmail.com", gender: "male", _id: smithId },
    { name: "Jane Doe", gender: "female", _id: doeId }
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
export default Q.ninvoke(mongoose, "connect", "mongodb://localhost/integration-test")
  .then(function() {
    return {
      models() {
        return models;
      },
      instance() {
        return mongoose;
      },
      fixturesRemoveAll() {
        return Q.npost(fixtures, "reset", []);
      },
      fixturesReset() {
        return this.fixturesRemoveAll().then(function() {
          return Q.nfcall(fixtures, "all");
        });
      }
    };
  });
