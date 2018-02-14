import { expect } from "chai";
import AgentPromise from "../../app/agent";
import {
  VALID_ORG_RESOURCE_NO_ID
} from '../fixtures/creation';
import {
  VALID_ORG_VIRTUAL_PATCH
} from '../fixtures/updates';

/*
 * See https://github.com/ethanresnick/json-api/issues/149 for details
 * behind all these tests/why the library's behavior is what it is.
 */
describe("MongooseAdapter", () => {
  let Agent;
  before(() => {
    return AgentPromise.then((A) => { Agent = A; })
  });

  describe("Fetching", () => {
    it("should show virtuals in the response", () => {
      return Agent.request("GET", "/organizations")
        .then(resp => {
          expect(resp.body.data.every(resource =>
            resource.attributes.virtualName.endsWith(' (virtualized)')
          )).to.be.true;
        })
    });
  });

  describe("Deletion", () => {
  });

  describe("Creation", () => {
    let createdResource;
    before(() => {
      return Agent.request("POST", "/organizations")
        .type("application/vnd.api+json")
        .send({"data": VALID_ORG_RESOURCE_NO_ID })
        .then((response) => {
          createdResource = response.body.data;
        }, (e) => {
          console.log(e, e.response.body);
        });
    });

    it("should run setters on create", () => {
      expect(createdResource.attributes.name).to.equal(
        VALID_ORG_RESOURCE_NO_ID.attributes.name.toUpperCase()
      );

      expect(createdResource.attributes.echo).to.equal(
        VALID_ORG_RESOURCE_NO_ID.attributes.echo
      );
    });

    it("should show virtuals in the returned resource", () => {
      expect(createdResource.attributes.virtualName).to.equal(
        VALID_ORG_RESOURCE_NO_ID.attributes.name.toUpperCase() + ' (virtualized)'
      );

      expect(createdResource.attributes.reversed).to.equal(
        VALID_ORG_RESOURCE_NO_ID.attributes.echo.split("").reverse().join("")
      );
    });

    it("should apply schema defaults", () => {
      expect(createdResource.attributes.neverSet).to.equal("set from mongoose default");
    });

    it("should not allow setting internal fields as attributes", () => {
      const makeSetInternalFieldRequest = (k, v, inRelationships) => {
        const spreadData = inRelationships
          ? {
              relationships: {
                ...VALID_ORG_RESOURCE_NO_ID.relationships,
                [k]: { data: v }
              }
            }
          : {
              attributes: {
                ...VALID_ORG_RESOURCE_NO_ID.attributes,
                [k]: v
              }
            };

        return Agent.request("POST", "/organizations")
          .type("application/vnd.api+json")
          .send({ "data": { ...VALID_ORG_RESOURCE_NO_ID, ...spreadData } })
          .then((response) => {
            throw new Error("Should not run!");
          }, (e) => {
            expect(e.status).to.equal(400);
            expect(e.response.body.errors[0].title).to.match(/(illegal attribute)|(invalid linkage)/i);
          });
      }

      return Promise.all([
        makeSetInternalFieldRequest("__t", "School", false),
        makeSetInternalFieldRequest("__v", 3, false),
        makeSetInternalFieldRequest("__t", "School", true),
        makeSetInternalFieldRequest("__v", 3, true),
        makeSetInternalFieldRequest("__t", { "type": "organizations", id: "School" }, true),
        makeSetInternalFieldRequest("__v", { "type": "organizations", id: 3 }, true),
      ]);
    });
  });

  describe("Updating", () => {
    let res;
    before(() => {
      return Agent.request("PATCH", `/organizations/${VALID_ORG_VIRTUAL_PATCH.id}`)
        .type("application/vnd.api+json")
        .send({"data": VALID_ORG_VIRTUAL_PATCH })
        .then((response) => {
          res = response.body.data;
        });
    });

    it("should invoke setters on virtual, updated attributes", () => {
      expect(res.attributes.echo).to.be.equal(VALID_ORG_VIRTUAL_PATCH.attributes.echo);
      expect(res.attributes.reversed).to.be.equal(
        VALID_ORG_VIRTUAL_PATCH.attributes.echo.split("").reverse().join("")
      );
    });

    it("should invoke setters on non-virtual updated attributes", () => {
      expect(res.attributes.name).to.equal("CHANGED NAME");
    });

    it("should not allow setting internal fields", () => {
      const makeSetInternalFieldRequest = (k, v, inRelationships) => {
        const spreadData = inRelationships
          ? {
              relationships: {
                ...VALID_ORG_RESOURCE_NO_ID.relationships,
                [k]: { data: v }
              }
            }
          : {
              attributes: {
                ...VALID_ORG_RESOURCE_NO_ID.attributes,
                [k]: v
              }
            };

        return Agent.request("PATCH", `/organizations/${VALID_ORG_VIRTUAL_PATCH.id}`)
          .type("application/vnd.api+json")
          .send({
            "data": {
              type: "organizations",
              id: VALID_ORG_VIRTUAL_PATCH.id,
              ...spreadData
            }
          })
          .then((response) => {
            throw new Error("Should not run!");
          }, (e) => {
            expect(e.status).to.equal(400);
            expect(e.response.body.errors[0].title).to.match(/(illegal attribute)|(invalid linkage)/i);
          });
      }

      return Promise.all([
        makeSetInternalFieldRequest("__t", "School", false),
        makeSetInternalFieldRequest("__v", 3, false),
        makeSetInternalFieldRequest("__t", "School", true),
        makeSetInternalFieldRequest("__v", 3, true),
        makeSetInternalFieldRequest("__t", { "type": "organizations", id: "School" }, true),
        makeSetInternalFieldRequest("__v", { "type": "organizations", id: 3 }, true),
      ]);
    });
  });
});


