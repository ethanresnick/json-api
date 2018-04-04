import { expect } from "chai";
import AgentPromise from "../../app/agent";
import { VALID_ORG_RESOURCE_NO_ID } from "../fixtures/creation";
import ResourceTypeRegistry from "../../../src/ResourceTypeRegistry"
import APIController from "../../../src/controllers/API";
import ExpressStrategy from "../../../src/http-strategies/Express";

describe("Express Strategy", () => {
  let Agent;
  before(() => {
    return AgentPromise.then(A => { Agent = A; });
  });

  describe("configuration", () => {
    const registry = new ResourceTypeRegistry({});
    const api = new APIController(registry);

    it("does not require a documentation controller", () => {
      expect(() => new ExpressStrategy(api)).to.not.throw();
    });

    it("throws if you attempt to get a docs request handler if no docs controller was provided", () => {
      const express = new ExpressStrategy(api);
      expect(() => express.docsRequest).to.throw(/^Cannot get docs request handler/);
    });
  });

  describe("body parsing", () => {
    it("should work with pre-parsed bodies", () => {
      const urls = [
        "/parsed/text/organizations",
        "/parsed/raw/organizations",
        "/parsed/json/organizations"
      ];

      return Promise.all(
        urls.map(url =>
          Agent.request("POST", url)
            .type("application/vnd.api+json")
            .send({ data: VALID_ORG_RESOURCE_NO_ID })
            .then(resp => {
              expect(resp.status).to.equal(201);
            })
        )
      );
    });
  });

  describe("building the request object", () => {
    it("should properly detect the incoming url on mounted sub apps", () => {
      return Agent.request("GET", '/subapp/people').then(resp => {
        expect(resp.body.links.self).to.equal('http://127.0.0.1:3000/subapp/people');
      });
    });
  });
});
