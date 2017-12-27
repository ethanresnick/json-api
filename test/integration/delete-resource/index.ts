import {expect} from "chai";
import AgentPromise from "../../app/agent";
import { VALID_SCHOOL_RESOURCE_NO_ID } from "../fixtures/creation";

describe("Deleting a resource", () => {

  let Agent, id;
  before(() => {
    return AgentPromise.then(A => {
      Agent = A;
      return Agent.request("POST", "/schools")
        .type("application/vnd.api+json")
        .send({"data": VALID_SCHOOL_RESOURCE_NO_ID})
        .then(response => {
          id = response.body.data.id;
          return Agent.request("DEL", `/schools/${id}`)
            .type("application/vnd.api+json")
            .send();
        });
    });
  });

  it("should delete a resource by id", done => {
    Agent.request("GET", `/schools/${id}`)
      .accept("application/vnd.api+json")
      .then(done, err => {
        expect(err.response.statusCode).to.equal(404);
        done();
      }).catch(done);
  });
});
