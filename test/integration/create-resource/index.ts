import {expect} from "chai";
import AgentPromise from "../../app/agent";
import {
  ORG_RESOURCE_CLIENT_ID,
  ORG_RESOURCE_FALSEY_CLIENT_ID,
  ORG_RESOURCE_FALSEY_CLIENT_ID_2,
  VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER,
  INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP
} from "../fixtures/creation";

describe("Creating Resources", () => {
  let Agent;
  before(() => {
    return AgentPromise.then((A) => { Agent = A; })
  });

  describe("Creating a Valid Resource (With an Extra Member)", () => {
    let createdResource, res;
    before(() => {
      return Agent.request("POST", "/organizations")
        .type("application/vnd.api+json")
        .send({ "data": VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER, "extra": false })
        .then((response) => {
          res = response;
          createdResource = res.body.data;
        }, (e) => {
          console.log(e, e.response.body);
        });
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
      it("should have a top-level self link", () => {
        expect(res.body.links.self).to.match(/\/organizations$/);
      });
    });

    describe("Transforms", () => {
      describe("beforeSave", () => {
        it("should execute beforeSave hook", () => {
          expect(createdResource.attributes.description).to.equal("Added a description in beforeSave");
          expect(createdResource.attributes.modified).to.equal("2015-01-01T00:00:00.000Z");
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
    const errs: any[] = [];
    const clientIdObjects = [
      ORG_RESOURCE_CLIENT_ID,
      ORG_RESOURCE_FALSEY_CLIENT_ID,
      ORG_RESOURCE_FALSEY_CLIENT_ID_2
    ];

    before(() => {
      return Promise.all(
        clientIdObjects.map(data => {
          return Agent.request("POST", "/organizations")
            .type("application/vnd.api+json")
            .send({ data })
            .then(
              (resp) => { throw new Error("Should not run"); },
              (error) => { errs.push(error); }
            );
        })
      );
    });

    describe("HTTP", () => {
      it("should return 403", () => {
        expect(errs.every(it => it.response.status === 403)).to.be.true;
      });
    });

    describe("Document Structure", () => {
      it("should contain an error", () => {
        expect(errs.every(it => Array.isArray(it.response.body.errors))).to.be.true;
      });
    });
  });

  describe("Creating a Resource With a Missing Relationship Data Key", () => {
    let err;
    before(() => {
      return Agent.request("POST", "/organizations")
        .type("application/vnd.api+json")
        .send({"data": INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP})
        .promise()
        .then(() => {
          throw new Error("Should not run!");
        }, (error) => {
          err = error;
        });
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
      it("should have the correct information", () => {
        expect(err.response.body.errors[0].title).to.be.equal("Missing relationship linkage.");
        expect(err.response.body.errors[0].detail).to.be.equal("No data was found for the liaisons relationship.");
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
