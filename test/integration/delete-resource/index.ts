import {expect} from "chai";
import AgentPromise from "../../app/agent";
import { VALID_SCHOOL_RESOURCE_NO_ID } from "../fixtures/creation";

describe("Deleting a resource", () => {
  let Agent, creationId, creationIds;

  before(() => {
    return AgentPromise.then(A => {
      Agent = A;

      return Promise.all([
        createSchool(Agent), createSchool(Agent), createSchool(Agent)
      ]).then(schools => {
        [creationId, ...creationIds] = schools.map(it => it.id);
      })
    });
  });

  it("should delete a resource by id", () => {
    return Agent.request("DEL", `/schools/${creationId}`)
      .type("application/vnd.api+json")
      .send()
      .then(() => {
        return Agent.request("GET", `/schools/${creationId}`)
          .accept("application/vnd.api+json")
          .then(() => {
            throw new Error("shouldn't run");
          }, err => {
            expect(err.response.statusCode).to.equal(404);
          });
      });
  });

  it('should support bulk delete', () => {
    return Agent.request("DEL", `/schools`)
      .type("application/vnd.api+json")
      .send({ data: creationIds.map(id => ({ type: "schools", id })) })
      .then(() => {
        const notFoundPromises =
          creationIds.map(id =>
            Agent.request("GET", `/schools/${id}`)
              .accept("application/vnd.api+json")
              .then(() => {
                throw new Error("shouldn't run");
              }, err => {
                expect(err.response.statusCode).to.equal(404);
              }));

        return Promise.all(notFoundPromises);
      });
  });
});

function createSchool(Agent) {
  return Agent.request("POST", "/schools")
    .type("application/vnd.api+json")
    .send({"data": VALID_SCHOOL_RESOURCE_NO_ID})
    .then(response => response.body.data);
}
