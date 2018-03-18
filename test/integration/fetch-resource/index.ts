import { expect } from "chai";
import AgentPromise from "../../app/agent";

describe("Fetching Resources", () => {
  let Agent;

  before(() => {
    return AgentPromise.then(A => {
      Agent = A;
    });
  });

  describe("Fetching missing resources", () => {
    it("should return a 404", () => {
      return Agent.request("GET", "/organizations/4")
        .accept("application/vnd.api+json")
        .then(() => {
          throw new Error("Shouldn't run")
        }, (err) => {
          expect(err.status).to.equal(404);
        });
    });
  });

  describe("Fetching single resource with include", () => {
    it("should work", () => {
      return Agent.request("GET", '/organizations/54419d550a5069a2129ef254?include=liaisons')
        .accept("application/vnd.api+json")
        .then((res) => {
          expect(res.body.data.id).to.equal("54419d550a5069a2129ef254");
          expect(res.body.included).to.be.an("array");
          expect(res.body.included.map(it => it.id).sort()).to.deep.equal([
            "53f54dd98d1e62ff12539db2",
            "53f54dd98d1e62ff12539db3"
          ]);
        });
    });
  });

  describe("Fetching a single resource removed by beforeRender", () => {
    it("should return `data: null`", () => {
      return Agent.request("GET", "/people/59af14d3bbd18cd55ea08ea2")
        .accept("application/vnd.api+json")
        .then((res) => {
          expect(res.body.data).to.equal(null);
        });
    });
  });

  describe("Fetching a single resource with transformed (removed) linkage", () => {
    it("should not have the removed linkage", () => {
      return Agent.request("GET", "/schools/59af14d3bbd18cd55ea08ea3")
        .accept("application/vnd.api+json")
        .then((res) => {
          expect(res.body.data.relationships.principal.data).to.equal(null);
        });
    });
  });

  describe("Fetching a single resource with an id filter", () => {
    it("should not allow user's filter to override id in url", () => {
      return Promise.all([
        Agent.request("GET", "/organizations/54419d550a5069a2129ef254")
          .query("filter=(id,59af14d3bbd18cd55ea08ea3)")
          .accept("application/vnd.api+json")
          .then((res) => {
            throw new Error("Should 404");
          }, (res) => {
            expect(res.status).to.equal(404);
          }),

        Agent.request("GET", "/organizations/54419d550a5069a2129ef254")
          .query("filter=(id,in,(59af14d3bbd18cd55ea08ea3,54419d550a5069a2129ef254))")
          .accept("application/vnd.api+json")
          .then((res) => {
            expect(res.body.data.id).to.equal("54419d550a5069a2129ef254");
          })
      ]);
    });
  });

  describe("Fetching a static/hardcoded resource", () => {
    it("should work", () => {
      return Agent.request("GET", "/hardcoded-result")
        .accept("application/vnd.api+json")
        .then((res) => {
          expect(res.body.meta).to.deep.equal({ "hardcoded result": true });
          expect(res.status).to.equal(201);
        });
    });
  });
});
