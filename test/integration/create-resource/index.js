import {expect} from "chai";
import AgentPromise from "../../app/agent";
import {
  ORG_RESOURCE_CLIENT_ID,
  VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER,
  VALID_SCHOOL_RESOURCE_NO_ID,
  INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP
} from "../fixtures/creation";

describe("Creating Resources", () => {
  let Agent;

  describe("Creating a Valid Resource (With an Extra Member)", () => {
    let createdResource, createdId, res;
    before(done => {
      AgentPromise.then((A) => {
        Agent = A;
        Agent.request("POST", "/organizations")
          .type("application/vnd.api+json")
          .send({"data": VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER, "extra": false})
          .promise()
          .then((response) => {
            res = response;
            createdResource = res.body.data;
            createdId = res.body.data.id;
            done();
          });
      }).catch(done);
    });

    describe("HTTP", () => {
      it("should return 201", () => {
        expect(res.status).to.equal(201);
      });

      it("should include a valid Location header", () => {
        expect(res.headers.location).to.match(/\/organizations\/[a-z0-9]+/);
        expect(createdResource.links.self).to.equal(res.headers.location);
      });
    });

    describe("Document Structure", () => {
      // "A JSON object MUST be at the root of every
      // JSON API request and response containing data."
      it("should have an object/document at the top level", () => {
        expect(res.body).to.be.an("object");
      });

      it("should ignore extra document object members", () => {
        expect(res.status).to.be.within(200, 299);
        expect(res.body.extra).to.be.undefined;
      });
    });

    describe("Links", () => {

    });

    describe("Transforms", () => {
      describe("beforeSave", () => {
        it("should execute beforeSave hook", () => {
          expect(createdResource.attributes.description).to.equal("Added a description in beforeSave");
        });

        it("should allow beforeSave to return a Promise", (done) => {
          Agent.request("POST", "/schools")
            .type("application/vnd.api+json")
            .send({"data": VALID_SCHOOL_RESOURCE_NO_ID})
            .promise()
            .then((response) => {
              expect(response.body.data.attributes.description).to.equal("Modified in a Promise");
              done();
            }, done).catch(done);
        });
      });
    });

    describe("The Created Resource", () => {
      it("should be returned in the body", () => {
        expect(createdResource).to.be.an("object");
        expect(createdResource.type).to.equal("organizations");
        expect(createdResource.attributes).to.be.an("object");
        expect(createdResource.relationships).to.be.an("object");
        expect(createdResource.relationships.liaisons).to.be.an("object");
      });

      it("should ignore extra resource object members", () => {
        expect(res.body.data.extraMember).to.be.undefined;
        expect(res.body.data.attributes.extraMember).to.be.undefined;
      });
    });
  });

  describe("Creating a Resource With A Client-Id", () => {
    let err;
    before(done => {
      Agent.request("POST", "/organizations")
        .type("application/vnd.api+json")
        .send({"data": ORG_RESOURCE_CLIENT_ID})
        .promise()
        .then(
          () => { done("Should not run!") },
          (error) => {
            err = error;
            done();
          }
        );
    });

    describe("HTTP", () => {
      it("should return 403", () => {
        expect(err.response.status).to.equal(403);
      });
    });

    describe("Document Structure", () => {
      it("should contain an error", () => {
        expect(err.response.body.errors).to.be.an("array");
      });
    });
  });

  describe("Creating a Resource With a Missing Relationship Data Key", () => {
    let err;
    before((done) => {
      Agent.request("POST", "/organizations")
        .type("application/vnd.api+json")
        .send({"data": INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP})
        .promise()
        .then(
          () => { done("Should not run!"); },
          (error) => {
            err = error;
            done();
          }
        );
    });

    describe("HTTP", () => {
      it("should return 400", () => {
        expect(err.response.status).to.equal(400);
      });
    });

    describe("Document Structure", () => {
      it("should contain an error", () => {
        expect(err.response.body.errors).to.be.an("array");
      });
    });

    describe("The error", () => {
      it("should have the correct title", () => {
        expect(err.response.body.errors[0].title).to.be.equal("Missing relationship linkage.");
      });

      it("should have the correct details", () => {
        expect(err.response.body.errors[0].details).to.be.equal("No data was found for the liaisons relationship.");
      });
    });
  });
});

    // "[S]erver implementations MUST ignore
    //  [members] not recognized by this specification."
    /*it("must ignore unrecognized request object members", (done) => {
      return "PATCH", '/organizations/' + ORG_STATE_GOVT_PATCH_EXTRA_MEMBERS.id)
        .send({ data: ORG_STATE_GOVT_PATCH_EXTRA_MEMBERS})
        .promise()
        .then(function(res) {
          expect(res.status).to.be.within(200, 299);
        });
    });
    VALID_ORG_STATE_GOVT_PATCH

  // A logical collection of resources (e.g., the target of a to-many relationship) MUST be represented as an array, even if it only contains one item.
  // TODO: unit test to ensure to-Many relationships always represented as arrays
  // http://jsonapi.org/format/#document-structure-top-level
  it('must represent a logical collection of resources as an array, even if it only contains one item', function() {
    return Agent.request('GET', '/v1/books/?filter[date_published]=1954-07-29')
      .promise()
      .then(function(res) {
        expect(res.status).to.equal(200);
        expect(res.body)
          .to.have.property('data')
            .that.is.a('array');
        expect(res.body.data.length).to.equal(1);
      });
  });

  // A logically singular resource (e.g., the target of a to-one relationship) MUST be represented as a single resource object.
  // TODO: unit test to ensure to-One relationships always represented as single objects
  // it('must represent a logically singular resource as a single resource object');
*/
