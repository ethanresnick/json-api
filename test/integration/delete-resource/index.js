import {expect} from "chai";
import AgentPromise from "../../app/agent";
import mongoose from "mongoose";

describe("Deleting a resource", () => {

  let id;
  before(done => {
    AgentPromise.then(Agent => {
      mongoose.models.Organization.create({ name: "Delete me" }, (err, model) => {
        if (err) {
          done(err);
        }
        id = model._id;
        Agent.request("DEL", `/organizations/${id}`)
          .type("application/vnd.api+json")
          .send()
          .promise()
          .then(() => done(), done).catch(done);
      });
    });
  });

  it("should delete a resource by id", done => {
    mongoose.models.Organization.findById(id, (err, model) => {
      expect(err).to.be.null;
      expect(model).to.be.null;
      done();
    });
  });
});
