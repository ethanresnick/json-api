import { expect } from "chai";
import AgentPromise from "../../app/agent";
import { VALID_ORG_RESOURCE_NO_ID } from "../fixtures/creation";
import { VALID_ORG_VIRTUAL_PATCH } from "../fixtures/updates";

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

    it("should support sorting by valid geoDistance, iff no other sorts are provided", () => {
      return Promise.all([
        Agent.request("GET", "/organizations?sort=(location,geoDistance,[-70,40])")
          .then(resp => {
            const resources = resp.body.data;
            const stateGovIndex = resources.findIndex(it => it.id === "54419d550a5069a2129ef254");
            const echoOrgIndex = resources.findIndex(it => it.id === "59ac9c0ecc4c356fcda65202");

            expect(stateGovIndex < echoOrgIndex).to.be.true;
          }),
        Agent.request("GET", "/organizations?sort=(location,geoDistance,[0,0])")
          .then(resp => {
            const resources = resp.body.data;
            const stateGovIndex = resources.findIndex(it => it.id === "54419d550a5069a2129ef254");
            const echoOrgIndex = resources.findIndex(it => it.id === "59ac9c0ecc4c356fcda65202");

            expect(echoOrgIndex < stateGovIndex).to.be.true;
          }),
        Agent.request("GET", "/organizations?sort=name,(location,geoDistance,[0,0])")
          .catch(e => {
            expect(e.response.status).to.equal(400);
            expect(e.response.body.errors[0].detail).to.equal("Cannot combine geoDistance sorts with other sorts.")
          })
      ]);
    });

    // This test is to indicate that, unlike other sorts, adding a "sort" by
    // geoDistance can actually change the results returned -- and, in that sense,
    // it isn't really a pure sort at all. This may change in a major version bump.
    it("should exclude documents with no geo field when \"sorting\" by distance", () => {
      return Agent.request("GET", "/organizations?sort=(location,geoDistance,[-70,40])")
        .then(resp => {
          expect(
            resp.body.data.filter(it => it.id === "59af14d3bbd18cd55ea08ea3")
          ).to.have.length(0);
        });
    });

    it("should support pagination with sorting by geoDistance", () => {
      return Promise.all([
        Agent.request("GET", "/organizations?sort=(location,geoDistance,[-70,40])&page[limit]=1")
          .then(resp => {
            const resources = resp.body.data;
            expect(resources.length).to.equal(1);
            expect(resources[0].id).to.equal("54419d550a5069a2129ef254");
          }),
        Agent.request("GET", "/organizations?sort=(location,geoDistance,[-70,40])&page[limit]=1&page[offset]=1")
          .then(resp => {
            const resources = resp.body.data;
            expect(resources.length).to.equal(1);
            expect(resources[0].id).to.equal("59ac9c0ecc4c356fcda65202");
          })
      ]);
    });
  });

  describe.skip("Deletion", () => { /* TODO */ });

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
            expect([
              "https://jsonapi.js.org/errors/illegal-field-name",
              "https://jsonapi.js.org/errors/invalid-linkage-json"
            ]).to.include(e.response.body.errors[0].code);
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
            expect([
              "https://jsonapi.js.org/errors/illegal-field-name",
              "https://jsonapi.js.org/errors/invalid-linkage-json"
            ]).to.include(e.response.body.errors[0].code);
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


