import {expect} from "chai";
import AgentPromise from "../../app/agent";

describe("", () => {
  AgentPromise.then((Agent) => {
    Agent.request("GET", "/organizations")
      .accept("application/vnd.api+json")
      .promise()
      .then((res) => {
        describe("Fetching Collection", () => {
          describe("Status Code", () => {
            it("should be 200", () => {
              expect(res.status).to.equal(200);
            });
          });

          describe("Document Structure", () => {
            // "A JSON object MUST be at the root of every
            // JSON API request and response containing data."
            it("should have an object/document at the top level", () => {
              expect(res.body).to.be.an("object");
            });

            describe("Links", () => {
              it("should contain a self link to the collection", () => {
                expect(res.body.links).to.be.an("object");
                expect(res.body.links.self).to.match(/\:\d{1,5}\/organizations/);
              });
            });

            describe("Resource Objects/Primary Data", () => {
              // "A logical collection of resources MUST be represented as
              //  an array, even if it only contains one item or is empty."
              it("should be an array under data", () => {
                expect(res.body.data).to.be.an("array");
              });

              // "Unless otherwise noted, objects defined by this
              //  specification MUST NOT contain any additional members."
              it("should not contain extra members", () => {
                const isAllowedKey = (key) =>
                  ["type", "id", "attributes", "relationships", "links", "meta"].indexOf(key) !== -1;

                if(!Object.keys(res.body.data[0]).every(isAllowedKey)) {
                  throw new Error("Invalid Key!");
                }
              });

              it("should contain links under each relationship", () => {
                let liaisonRelationships = res.body.data.map(it => it.relationships.liaisons);
                liaisonRelationships.forEach((it) => {
                  // Every liaison should have a links object,
                  // and self and related must not be outside of links.
                  expect(it.links).to.be.an("object");
                  expect(it.self).to.be.undefined;
                  expect(it.related).to.be.undefined;

                  expect(it.links.self).to.be.a("string");
                  expect(it.data).to.not.be.undefined; //can be null, though
                });
              });
            });
          });
        });
      }).done();

    Agent.request("GET", "/people?sort=gender")
      .accept("application/vnd.api+json")
      .promise()
      .then((res) => {
        describe("Fetching Ascending Gendered Collection", () => {
          it("should have Jane above John", () => {
            let johnJaneList = res.body.data.map((it) => it.attributes.name).filter((it) => {
              return ["John Smith", "Jane Doe"].indexOf(it) > -1;
            });
            expect(johnJaneList[0]).to.equal("Jane Doe");
            expect(johnJaneList[1]).to.equal("John Smith");
          });
        });
      }).done();

    Agent.request("GET", "/people?sort=-name")
      .accept("application/vnd.api+json")
      .promise()
      .then((res) => {
        describe("Fetching Descended Sorted Name Collection", () => {
          it("Should have John above Jane", () => {
            let johnJaneList = res.body.data.map((it) => it.attributes.name).filter((it) => {
              return ["John", "Jane"].indexOf(it.substring(0, 4)) > -1;
            });
            expect(johnJaneList[0]).to.equal("John Smith");
            expect(johnJaneList[1]).to.equal("Jane Doe");
          });
        });
      }).done();
  }).done();
});

describe("", () => {
  AgentPromise.then((Agent) => {
    Agent.request("GET", "/people?sort=-gender,name")
      .accept("application/vnd.api+json")
      .promise()
      .then((res) => {
        describe("Fetching Multi-Sorted Collection", () => {
          it("Should have John above Jane", () => {
            expect(res.body.data.map((it) => it.attributes.name)).to.deep.equal([
              "Doug Wilson", "John Smith", "Jane Doe"
            ]);
          });
        });
      }).done();
  }).done();
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

  //require('./base-format');
  // require('./extensions');
  // require('./recommendations');
*/
