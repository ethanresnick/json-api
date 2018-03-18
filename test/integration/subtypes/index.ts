import { expect } from "chai";
import AgentPromise from "../../app/agent";
import {
  VALID_SCHOOL_RESOURCE_NO_ID,
  VALID_ORG_RESOURCE_NO_ID,
  VALID_PERSON_RESOURCE_NO_ID
} from "../fixtures/creation";
import {
  NEVER_APPLIED_STATE_GOVT_PATCH,
  NEVER_APPLIED_SCHOOL_PATCH
} from "../fixtures/updates";

/*
 * See https://github.com/ethanresnick/json-api/issues/149 for details
 * behind all these tests/why the library's behavior is what it is.
 */
describe("Subtypes", () => {
  let Agent;
  before(() => {
    return AgentPromise.then((A) => { Agent = A; })
  });

  describe("Fetching", () => {
    describe("Subtype resources", () => {
      it("should be rendered as `type: parentType` + meta.types", () => {
        return Agent.request("GET", `/schools`)
          .then((response) => {
            const resources = response.body.data;
            expect(resources.length > 0).to.be.true;

            resources.forEach(it => {
              expect(it).to.satisfy(isValidSchoolSerialization)
            });
          });
      });

      it("should be impossible to fetch a parent type at a subtype endpoint", () => {
        return Agent.request("GET", '/schools/54419d550a5069a2129ef254')
          .then(() => {
            throw new Error("Shouldn't run!");
          }, (response) => {
            expect(response.status).to.equal(404);
          });
      });

      it("should apply ?fields restrictions based on the rendered `type`", () => {
        const hasNameOrDesc = (resource) => {
          const { attributes } = resource;
          return "name" in attributes || "description" in attributes;
        };

        return Promise.all([
          Agent.request("GET", '/schools?fields[schools]=isCollege')
            .then((resp) => {
              expect(resp.body.data.every(hasNameOrDesc)).to.be.true;
            }),

          Agent.request("GET", '/schools?fields[organizations]=isCollege')
            .then((resp) => {
              expect(resp.body.data.some(hasNameOrDesc)).to.be.false;
            })
        ]);
      });
    });

    describe("Relationships pointing to subtype resources", () => {
      it("should use the parent type in the resource identifier object", () => {
        // Test for both the case where the schema knows we're pointing to a
        // subtype and the case where the relationship/schema is defined to be
        // able to hold any instance of the parent type, but we happen to be
        // holding the subtype.
        return Agent.request("GET", `/people/53f54dd98d1e62ff12539db3`)
          .then((response) => {
            const { manages, homeSchool } = response.body.data.relationships;
            expect(manages.data.type).to.equal('organizations');
            expect(homeSchool.data.type).to.equal('organizations');
          });
      });
    });
  });

  describe("Deletion", () => {
    describe("Subtype resources", () => {
      let newSchoolId, newOrganizationId;
      beforeEach(() => {
        return Agent.request("POST", "/organizations")
          .type('application/vnd.api+json')
          .send({ data: [VALID_SCHOOL_RESOURCE_NO_ID, VALID_ORG_RESOURCE_NO_ID] })
          .then((response) => {
            const [school, organization] = response.body.data;
            newSchoolId = school.id;
            newOrganizationId = organization.id;
          }, (e) => {
            throw new Error("Couldn't create resources to test deletion.");
          });
      });

      it("should be impossible to delete a parent type at a subtype endpoint", () => {
        // Test single and bulk deletes
        return Promise.all([
          Agent.request("DELETE", '/schools/54419d550a5069a2129ef254') // this is not a school
            .then(() => {
              throw new Error("Shouldn't run!");
            }, (response) => {
              expect(response.status).to.equal(400);
            }),

          Agent.request("DELETE", "/schools")
            .type("application/vnd.api+json")
            .send({
              data: [
                { type: "organizations", id: newSchoolId },
                { type: "organizations", id: newOrganizationId }
              ]
            })
            .then(() => {
              throw new Error("Shouldn't run!");
            }, (response) => {
              expect(response.status).to.equal(400);
            })
        ]);
      });

      it("should be possible to delete a subtype at a parent endpoint", () => {
        return Agent.request("DELETE", `/organizations/${newSchoolId}`)
          .then((response) => {
            expect(response.status).to.equal(204);
          });
      })
    });
  });

  describe("Creation", () => {
    it("should be possible at the parent type endpoint with meta.types", () => {
      return Agent.request("POST", "/organizations")
        .type("application/vnd.api+json")
        .send({ data: VALID_SCHOOL_RESOURCE_NO_ID })
        .then((response) => {
          expect(response.status).to.equal(201);
          expect(response.body.data).to.satisfy(isValidSchoolSerialization);

          // Verify that sub-type specific fields are being accepted.
          expect(response.body.data.attributes.isCollege).to.be.false;
        });
    });

    it("should be possible at the subtype endpoint with meta.types", () => {
      return Agent.request("POST", "/schools")
        .type("application/vnd.api+json")
        .send({ data: VALID_SCHOOL_RESOURCE_NO_ID })
        .then((response) => {
          expect(response.status).to.equal(201);
          expect(response.body.data).to.satisfy(isValidSchoolSerialization);
        });
    });

    it("should not be possible at any endpoint with subtype in `type` key, with or without meta.types", () => {
      const endpoints = ["/schools", "/organizations"];
      const bodies = [
        { ...VALID_SCHOOL_RESOURCE_NO_ID, type: "schools" }, // type=subtype and meta.types
        { ...VALID_SCHOOL_RESOURCE_NO_ID, type: "schools", meta: undefined } // type=subtype, w/o meta.types
      ];

      const requests = [].concat.apply([], endpoints.map(endpoint =>
        bodies.map(body => {
          return Agent.request("POST", endpoint)
            .type('application/vnd.api+json')
            .send({ data: body })
            .then((resp) => {
              throw new Error("Should not run")
            }, (e) => {
              expect(e.status).to.equal(400);
              expect(e.response.body.errors[0].title).to.match(/\`type\`.+resources.+invalid/);
            })
        })
      ));

      return Promise.all(requests);
    });

    it("should always run the subtype's beforeSave on creation", () => {
      const endpoints = ["/schools", "/organizations"];

      return Promise.all(
        endpoints.map(endpoint =>
          Agent.request("POST", endpoint)
            .type("application/vnd.api+json")
            .send({ data: VALID_SCHOOL_RESOURCE_NO_ID })
            .promise()
            .then((response) => {
              expect(response.body.data.attributes.description).to.equal("Added a description in beforeSave");
              expect(response.body.data.attributes.modified).to.equal("2015-10-27T05:16:57.257Z");
            })
        )
      );
    });

    it("should be impossible to create a parent type at the subtype endpoint", () => {
      return Agent.request("POST", "/schools")
        .type("application/vnd.api+json")
        .send({ data: VALID_ORG_RESOURCE_NO_ID })
        .then((resp) => {
          throw new Error("Shouldn't run");
        }, (e) => {
          expect(e.status).to.equal(400);
          expect(e.response.body.errors[0].title).to.match(/invalid types list/i)
        });
    });

    it("should be impossible to create an unrelated type at parent type endpoint, even if lying in meta.types", () => {
      const fixtureMeta = (VALID_PERSON_RESOURCE_NO_ID as any).meta || {};
      const fixutreMetaTypes = fixtureMeta.types || [];

      return Agent.request("POST", "/organizations")
        .type("application/vnd.api+json")
        .send({
          data: {
            meta: {
              ...fixtureMeta,
              types: [
                ...fixutreMetaTypes,
                "organizations", // this is bs. resource is not an org or a school.
                "schools"
              ]
            },
            ...VALID_PERSON_RESOURCE_NO_ID
          }
        })
        .then((resp) => {
          throw new Error("Shouldn't run");
        }, (e) => {
          expect(e.status).to.equal(400);
          expect(e.response.body.errors[0].title).to.match(/type.+resources.+invalid/i)
        });
    });
  });

  describe("Updating", () => {
    it("should be illegal to provide anything in `meta.types`", () => {
      return Agent.request("PATCH", "/organizations/54419d550a5069a2129ef254")
        .type("application/vnd.api+json")
        .send({
          data: {
            type: "organizations",
            id: "54419d550a5069a2129ef254",
            // These types are totally true (i.e., client's not lying) but
            // should still be an error, as any types in patch are treated as
            // a mutataion attempt, which is currently forbidden.
            meta: { types: ["organizations"] },
            attributes: { name: "N/A" }
          }
        })
        .then((resp) => {
          throw new Error("Shouldn't run");
        }, (e) => {
          expect(e.status).to.equal(400);
          expect(e.response.body.errors[0].title).to.match(/cannot provide.+types/i)
        });
    });

    it("should fail with a subtype in `type` key, whether a lie or not", () => {
      const endpoints = ["/schools", "/organizations"];
      const bodies = [
        { ...NEVER_APPLIED_STATE_GOVT_PATCH, type: "schools" }, // not actually a school
        { ...NEVER_APPLIED_SCHOOL_PATCH, type: "schools" } // a school, but still wrong type key.
      ];

      const requests = [].concat.apply([], endpoints.map(endpoint =>
        bodies.map(body => {
          return Agent.request("PATCH", endpoint)
            .type('application/vnd.api+json')
            .send({ data: [body] })
            .then((resp) => {
              throw new Error("Should not run")
            }, (e) => {
              expect(e.status).to.equal(400);
              expect(e.response.body.errors[0].title).to.match(/\`type\`.+resources.+invalid/);
            })
        })
      ));

      return Promise.all(requests);
    });

    // This test is irrelevant for now, because ALL values in meta.types simply
    // throw an error. When we support updating types though through meta.types,
    // we'll need some tests like this.
    it.skip("should catch client lies in `meta.types`", () => {
      const fixtureMeta = (NEVER_APPLIED_STATE_GOVT_PATCH as any).meta || {};
      const fixutreMetaTypes = fixtureMeta.types || [];

      return Agent.request("PATCH", "/schools/54419d550a5069a2129ef254")
        .type("application/vnd.api+json")
        .send({
          data: {
            meta: {
              ...fixtureMeta,
              types: [
                ...fixutreMetaTypes,
                "schools" // this is bs. the org is not a school.
              ]
            },
            ...NEVER_APPLIED_STATE_GOVT_PATCH
          }
        })
        .then((resp) => {
          throw new Error("Shouldn't run");
        }, (e) => {
          expect(e.status).to.equal(400);
          expect(e.response.body.errors[0].title).to.match(/invalid type/i)
        });
    });

    it("should be illegal to update a non-sub-type at a sub-type endpoint", () => {
      // State Govt is not a school, so this should fail.
      return Agent.request("PATCH", "/schools/54419d550a5069a2129ef254")
        .type("application/vnd.api+json")
        .send({ data: NEVER_APPLIED_STATE_GOVT_PATCH })
        .then((resp) => {
          throw new Error("Shouldn't run");
        }, (e) => {
          expect(e.status).to.equal(400);
          expect(e.response.body.errors[0].title).to.match(/invalid type/i)
        });
    });

    it("should run the subtype's beforeSave + beforeRender function", () => {
      return Agent.request("PATCH", "/schools/5a5934cfc810949cebeecc33")
        .type("application/vnd.api+json")
        .send({
          data: {
            type: "organizations",
            id: "5a5934cfc810949cebeecc33",
            attributes: {
              isCollege: false,
              description: ""
            }
          }
        })
        .then((resp) => {
          // Again, verify that subtype-specific fields are accepted
          expect(resp.body.data.attributes.isCollege).to.be.false;
          expect(resp.body.data.attributes.description).to.equal("Special, beforeSave description.");
          expect(resp.body.data.attributes.schoolBeforeRender).to.be.true;
        });
    });
  });
});

function isValidSchoolSerialization(schoolResource) {
  return schoolResource.type === 'organizations'
    && schoolResource.meta && schoolResource.meta.types
    && schoolResource.meta.types.length === 2
    && schoolResource.meta.types.includes('organizations')
    && schoolResource.meta.types.includes('schools');
}
