import { expect } from "chai";
import agentPromise, { PromiseResult } from "../../app/agent";
import appPromise from "../../app/src/index";
import Data from '../../../src/types/Generic/Data';
import Resource, { ResourceWithTypePath } from '../../../src/types/Resource';
import Relationship from '../../../src/types/Relationship';
import ResourceIdentifier from '../../../src/types/ResourceIdentifier';
import FindQuery from '../../../src/types/Query/FindQuery';
import CreateQuery from '../../../src/types/Query/CreateQuery';
import DeleteQuery from '../../../src/types/Query/DeleteQuery';
import AddToRelationshipQuery from '../../../src/types/Query/AddToRelationshipQuery';
import RemoveFromRelationshipQuery from '../../../src/types/Query/RemoveFromRelationshipQuery';
import { VALID_ORG_RESOURCE_NO_ID } from "../fixtures/creation";
import { VALID_ORG_VIRTUAL_PATCH } from "../fixtures/updates";

/*
 * See https://github.com/ethanresnick/json-api/issues/149 for details
 * behind all these tests/why the library's behavior is what it is.
 */
describe("MongooseAdapter", () => {
  let adapter: PromiseResult<typeof appPromise>["adapter"];
  let Agent: PromiseResult<typeof agentPromise>;

  before(() => {
    return Promise.all([agentPromise, appPromise]).then(([agent, app]) => {
      Agent = agent;
      adapter = app.adapter;
    });
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
        Agent.request("GET", "/organizations")
          .query("sort=(location,geoDistance,[-70,40])")
          .query("page[limit]=1&page[offset]=1")
          .then(resp => {
            const resources = resp.body.data;
            expect(resources.length).to.equal(1);
            expect(resources[0].id).to.equal("59ac9c0ecc4c356fcda65202");
          })
      ]);
    });

    it('should support mixing other filters with geoDistance sort', () => {
      return Agent.request("GET", "/organizations")
        .query("filter=(or,(name,`ELEMENTARY%20SCHOOL`),(name,`STATE%20GOVERNMENT`))")
        .query("sort=(location,geoDistance,[0,0])")
        .then(resp => {
          // Should be one because the filter limits to two items, and then,
          // of those two items, ELEMENTARY SCHOOL is excluded for not having
          // a location field.
          expect(resp.body.data.length).to.equal(1);
          expect(resp.body.data[0].id).to.equal("54419d550a5069a2129ef254")
        });
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

  /* These are more truly "integration" tests
   * (testing the MoongooseAdapter and its integration with mongoose),
   * whereas the above are really end-to-end tests.
   */
  describe("Query return types", () => {
    describe("Find", () => {
      it("should return the proper type", () => {
        const dummyReturning = (result) => ({});
        const singularQuery = new FindQuery({
          type: "people", isSingular: true, returning: dummyReturning
        });
        const pluralQuery = new FindQuery({
          type: "people", isSingular: false, returning: dummyReturning
        });
        const paginatedQuery = new FindQuery({
          type: "people", limit: 10, isSingular: false, returning: dummyReturning
        });
        const populatedQuery = new FindQuery({
          type: "people", isSingular: false, populates: ["manages"], returning: dummyReturning
        });

        return Promise.all([
          adapter.find(singularQuery).then(result => {
            expect(result.primary.isSingular).to.equal(true);
            expect(result.included).to.be.undefined;
            expect(result.collectionSize).to.be.undefined;
          }),
          adapter.find(pluralQuery).then(result => {
            expect(result.primary.isSingular).to.equal(false);
            expect(result.included).to.be.undefined;
            expect(result.collectionSize).to.be.undefined;
          }),
          adapter.find(paginatedQuery).then(result => {
            const countReturned = result.primary.values.length;
            const expectedMinCollSize = Math.min(countReturned, 10);

            expect(result.primary.isSingular).to.equal(false);
            expect(countReturned > 4 && countReturned <= 10).to.be.true;
            expect(result.included).to.be.undefined;
            //tslint:disable-next-line no-non-null-assertion
            expect(result.collectionSize! >= expectedMinCollSize).to.be.true;
          }),
          adapter.find(populatedQuery).then(result => {
            expect(result.primary.isSingular).to.equal(false);
            expect(result.primary.values.length > 1).to.be.true;
            //tslint:disable-next-line no-non-null-assertion
            expect(result.included!.every(it=> it.type === 'organizations')).to.be.true;
          })
        ]);
      });
    });

    describe("AddToRelationship", () => {
      it("should return the proper type", async () => {
        const dummyReturning = (result) => ({});
        const originalLinkage = [new ResourceIdentifier("people", "53f54dd98d1e62ff12539db2")];

        const newOrg = (await adapter.create(new CreateQuery({
          type: "organizations",
          records: Data.pure(dummyOrgResource(originalLinkage)),
          returning: dummyReturning
        }))).created.values[0];

        const linkage = [
          new ResourceIdentifier("people", "53f54dd98d1e62ff12539db2"),
          new ResourceIdentifier("people", "53f54dd98d1e62ff12539db3"),
        ];

        const query = new AddToRelationshipQuery({
          type: "organizations",
          id: newOrg.id,
          relationshipName: "liaisons",
          linkage,
          returning: dummyReturning
        });

        return adapter.addToRelationship(query).then(result => {
          expect(result.before).to.be.an.instanceof(Relationship);
          expect(result.after).to.be.an.instanceof(Relationship);
          expect(result.before.owner).to.deep.equal({
            type: "organizations", id: newOrg.id, path: "liaisons"
          });
          expect(result.before.owner).to.deep.equal(result.after.owner);
          expect(result.before.values).to.deep.equal(originalLinkage);
          expect(result.after.values).to.deep.equal(linkage);
        });
      });
    });

    describe("RemoveFromRelationship", () => {
      it("should return the proper type", async () => {
        const dummyReturning = (result) => ({});
        const originalLinkage = [
          new ResourceIdentifier("people", "53f54dd98d1e62ff12539db2")
        ];

        const newOrg = (await adapter.create(new CreateQuery({
          type: "organizations",
          records: Data.pure(dummyOrgResource(originalLinkage)),
          returning: dummyReturning
        }))).created.values[0];

        const linkage = [
          new ResourceIdentifier("people", "53f54dd98d1e62ff12539db2"),
          new ResourceIdentifier("people", "53f54dd98d1e62ff12539db3"),
        ];

        const query = new RemoveFromRelationshipQuery({
          type: "organizations",
          id: newOrg.id,
          relationshipName: "liaisons",
          linkage,
          returning: dummyReturning
        });

        return adapter.removeFromRelationship(query).then(result => {
          expect(result.before).to.be.an.instanceof(Relationship);
          expect(result.after).to.be.an.instanceof(Relationship);
          expect(result.before.owner).to.deep.equal({
            type: "organizations", id: newOrg.id, path: "liaisons"
          });
          expect(result.before.owner).to.deep.equal(result.after.owner);
          expect(result.before.values).to.deep.equal(originalLinkage);
          expect(result.after.values).to.deep.equal([]);
        });
      });
    });

    describe("Delete", () => {
      it("should return the proper type", async () => {
        const dummyReturning = (result) => ({});
        const newOrgs = (await adapter.create(new CreateQuery({
          type: "organizations",
          records: Data.of([
            dummyOrgResource(),
            dummyOrgResource(),
            dummyOrgResource()
          ]),
          returning: dummyReturning
        }))).created.values;

        const [firstNewId, ...restNewIds] = newOrgs.map(it => it.id);

        const singularQuery = new DeleteQuery({
          type: "organizations",
          id: firstNewId,
          returning: dummyReturning
        });

        const pluralQuery = new DeleteQuery({
          type: "organizations",
          ids: restNewIds,
          returning: dummyReturning
        });

        return Promise.all([
          adapter.delete(singularQuery).then(result => {
            expect(result.deleted.isSingular).to.be.true;
            expect(result.deleted.values[0]).to.deep.equal(newOrgs[0])
          }),
          adapter.delete(pluralQuery).then(result => {
            expect(result.deleted.isSingular).to.be.false;
            expect(result.deleted.values).to.deep.equal([newOrgs[1], newOrgs[2]]);
          })
        ]);
      });
    })
  });
});

function dummyOrgResource(liaisonLinkage?) {
  const newOrgResource = new Resource(
    "organizations",
    undefined,
    { name: "whatevs" },
    liaisonLinkage
      ? {
          liaisons: Relationship.of({
            data: liaisonLinkage,
            owner: { type: "organizations", id: undefined, path: "liaisons" }
          })
        }
      : undefined
  );
  newOrgResource.typePath = ["organizations"];

  return newOrgResource as ResourceWithTypePath;
}

