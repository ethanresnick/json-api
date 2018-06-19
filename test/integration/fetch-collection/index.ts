import { expect } from "chai";
import AgentPromise from "../../app/agent";
import { VALID_SCHOOL_RESOURCE_NO_ID_EMPTY_PRINCIPAL_NO_LIAISONS } from '../fixtures/creation';

describe("Fetching Collection", () => {
  let Agent;
  before(async () => {
    return AgentPromise.then(A => { Agent = A; });
  });

  describe("Fetching all organizations", () => {
    let res;
    before(async () => {
      return Agent.request("GET", "/organizations")
        .accept("application/vnd.api+json")
        .then(response => {
          res = response;
        });
    });

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

      describe("Top-Level Links", () => {
        it("should contain a self link to the collection", () => {
          expect(res.body.links).to.be.an('object');
          expect(res.body.links.self).to.equal(`${Agent.baseUrl}/organizations`);
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
          // check each liaison relationship for a links object with links in it.
          res.body.data.map(it => it.relationships.liaisons).forEach((it) => {
            expect(it.links).to.be.an("object");
            expect(it.self).to.be.undefined;
            expect(it.related).to.be.undefined;

            expect(it.links.self).to.be.a("string");
            expect(it.data).to.not.be.undefined; //can be null, though
          });
        });

        // This test is good on its own, and the next couple tests also assume it passes.
        it("should contain both organizations and schools", () => {
          expect(res.body.data.some(it =>
            it.meta && it.meta.types && it.meta.types.includes("schools")
          )).to.be.true;
          expect(res.body.data.every(it => it.type === "organizations")).to.be.true;
        });

        it("should have transformed all resources, including sub types", () => {
          expect(res.body.data.every(resource => {
            return resource.attributes.addedBeforeRender;
          })).to.be.true;
        });

        it("should not contain resources removed in beforeRender", () => {
          expect(res.body.data.every(resource => {
            return resource.id !== "59af14d3bbd18cd55ea08ea2"
          })).to.be.true;
        });
      });
    });
  });

  describe("Fetching Ascending Gendered Collection", () => {
    let res; // tslint:disable-next-line no-identical-functions
    before(async () => {
      return Agent.request("GET", "/people?sort=gender")
        .accept("application/vnd.api+json")
        .then(response => {
          res = response;
        });
    });

    it("should have Jane above John", () => {
      const johnJaneList = res.body.data
        .map(it => it.attributes.name)
        .filter(it => {
          return ["John Smith", "Jane Doe"].indexOf(it) > -1;
        });
      expect(johnJaneList[0]).to.equal("Jane Doe");
      expect(johnJaneList[1]).to.equal("John Smith");
    });
  });

  describe("Fetching Descended Sorted Name Collection", () => {
    let res; // tslint:disable-next-line no-identical-functions
    before(async () => {
      return Agent.request("GET", "/people?sort=-name")
        .accept("application/vnd.api+json")
        .then(response => {
          res = response;
        });
    });

    it("Should have John above Jane", () => {
      const johnJaneList = res.body.data
        .map(it => it.attributes.name)
        .filter(it => {
          return ["John", "Jane"].indexOf(it.substring(0, 4)) > -1;
        });
      expect(johnJaneList).to.deep.equal(["John Smith", "Jane Doe"]);
    });
  });

  describe("Fetching Multi-Sorted Collection", () => {
    let res; // tslint:disable-next-line no-identical-functions
    before(async () => {
      return Agent.request("GET", "/people?sort=-gender,name")
        .accept("application/vnd.api+json")
        .then(response => {
          res = response;
        });
    });

    it("Should have Doug before John; both before Jane", () => {
      const johnJaneDougList = res.body.data.map((it) => it.attributes.name).filter((it) => {
        return ["John", "Jane", "Doug"].indexOf(it.substring(0, 4)) > -1;
      });

      expect(johnJaneDougList).to.deep.equal([
        "Doug Wilson", "John Smith", "Jane Doe"
      ]);
    });
  });

  describe("Fetching with Offset and/or Limit (reverse name sorted for determinism)", () => {
    let res; // tslint:disable-next-line no-identical-functions
    before(async () => {
      return Agent.request("GET", "/people?sort=-name&page[offset]=1&page[limit]=3")
        .accept("application/vnd.api+json")
        .then(response => {
          res = response;
        });
    });

    it("should only return exactly the 3 people we expect", () => {
      expect(res.body.data.map(it => it.attributes.name)).to.deep.equal([
        "John Smith",
        "Jane Doe",
        "Doug Wilson"
      ]);
    });

    it("Should include the total record count", () => {
      expect(res.body.meta).to.deep.equal({
        total: 5
      });
    });

    it("Should error iff limit is above the max allowed", () => {
      return Promise.all([
        Agent.request("GET", "/organizations?page[limit]=6")
          .then(() => {
            throw new Error("shouldn't run");
          }, e => {
            expect(e.status).to.eq(400);
            expect(e.response.body.errors[0].source.parameter).to.eq("page[limit]");
          }),
        Agent.request("GET", "/schools?page[limit]=6")
          .then(() => {
            throw new Error("shouldn't run");
          }, e => {
            expect(e.status).to.eq(400);
            expect(e.response.body.errors[0].source.parameter).to.eq("page[limit]");
          }),
        Agent.request("GET", "/schools?page[limit]=5")
      ]);
    });

    it("should apply the resource type's default page size", async () => {
      // Create a bunch of schools, but then only expect to see one by default.
      await Agent.request("POST", "/schools")
        .type("application/vnd.api+json")
        .send({
          data: [
            VALID_SCHOOL_RESOURCE_NO_ID_EMPTY_PRINCIPAL_NO_LIAISONS,
            VALID_SCHOOL_RESOURCE_NO_ID_EMPTY_PRINCIPAL_NO_LIAISONS,
            VALID_SCHOOL_RESOURCE_NO_ID_EMPTY_PRINCIPAL_NO_LIAISONS
          ]
        });

      return Agent.request("GET", "/schools").then(resp => {
        expect(resp.body.data).to.have.length(2);
      })
    })
  });

  describe("Filtering", () => {
    it("should support simple equality filters", () => {
      return Agent.request("GET", "/people")
        .query("filter=(name,:eq,`Doug Wilson`)")
        .accept("application/vnd.api+json")
        .then((res) => {
          expect(res.body.data).to.have.length(1);
          expect(res.body.data[0].attributes.name).to.equal("Doug Wilson");
        });
    });

    it("should support user's custom filters", (done) => {
      Agent.request("GET", '/people/custom-filter-test?customNameFilter=Doug Wilson')
        .accept("application/vnd.api+json")
        .then((res) => {
          expect(res.body.data).to.have.length(1);
          expect(res.body.data[0].attributes.name).to.equal("Doug Wilson");
          done();
        }, done).catch(done);
    });


    it("should still return resource array even with a single id filter", () => {
      return Agent.request("GET", "/organizations")
        .query("filter=(id,`54419d550a5069a2129ef254`)")
        .accept("application/vnd.api+json")
        .then((res) => {
          expect(res.body.data).to.be.an("array");
          expect(res.body.data).to.have.length(1);
          expect(res.body.data[0].id).to.equal("54419d550a5069a2129ef254");
        });
    });

    it("should give a nice error on invalid filter syntax/values", () => {
      const invalidFilterStringsToErrorRegexs = {
        "filter=(id,:n,`54419d550a5069a2129ef254`)": /"n" .+ recognized operator/i,
        "filter=(id,:neq,`54419d550a5069a2129ef254`,x)": /Expected field expression/i,
        "filter=(4,4)": /field reference/i,
        "filter=true": /Expected field expression/i,
        "filter=(:and,true)": /expects its arguments to be field expressions/i,
        "filter=(:and,((true:false)))": /Expected field expression but \"\(\" found/,
        "filter=(()": /Expected field expression but \"\(\" found/,
        "filter=(:and,(:eq,test))": /exactly 2 arguments/ // should be deep validating exps.
      };

      return Promise.all(
        Object.keys(invalidFilterStringsToErrorRegexs).map(filterString =>
          Agent.request("GET", "/organizations")
            .query(filterString)
            .accept("application/vnd.api+json")
            .then((res) => {
              throw new Error("shouldn't run");
            }, (e) => {
              const jsonErr = e.response.body.errors[0];
              expect(e.response.status).to.equal(400);
              expect(jsonErr.code).to.equal("https://jsonapi.js.org/errors/invalid-query-param-value");
              expect(jsonErr.source).to.deep.equal({ parameter: "filter" });
              expect(jsonErr.detail).to.match(invalidFilterStringsToErrorRegexs[filterString]);
            })
        )
      );
    });
  });

  describe("Fetching with includes", () => {
    it("should not contain duplicate resources", () => {
      return Agent.request("GET", "/organizations")
        .query("include=liaisons")
        .accept("application/vnd.api+json")
        .then(res => {
          const janeDoes =
            res.body.included.filter(it => it.attributes.name === 'Jane Doe');

          expect(janeDoes).to.have.length(1);
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

  //require('./base-format');
  // require('./extensions');
  // require('./recommendations');
*/
