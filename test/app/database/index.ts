import mongoose = require("mongoose");
import PersonModel from "../src/models/person";
import makeSchoolModelConstructor from "../src/models/school";
import OrganizationModelSchema from "../src/models/organization";

const OrganizationModel = OrganizationModelSchema.model;
const OrganizationSchema = OrganizationModelSchema.schema;

const models = {
  Person: PersonModel,
  Organization: OrganizationModel,
  School: makeSchoolModelConstructor(OrganizationModel, OrganizationSchema)
};

/**
 * Export a promise for an object that can get the models and has the db connected.
 */
export default mongoose.connect(
  "mongodb://localhost/integration-test",
  { useMongoClient: true }
).then(() => {
  return {
    models() {
      return models;
    },
    instance() {
      return mongoose;
    }
  };
});
