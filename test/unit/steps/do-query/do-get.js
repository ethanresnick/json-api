import {expect} from "chai";
import ResourceTypeRegistry from "../../../../src/ResourceTypeRegistry";
import doGet from "../../../../src/steps/do-query/do-get";

class TestAdapter {
  static getReferencedType(model, path) {
    if (path === "some-relationship") {
      return "dasherizeOffType";
    }
    return "dasherizeOnType";
  }
  find(type, idOrIds, fields, sorts, filters, includes) {
    return {
      then() {
        return { type, idOrIds, fields, sorts, filters, includes };
      }
    };
  }
}

describe("GET requests", () => {

  let registry;
  let dbAdapter = new TestAdapter();

  before(() => {
    registry = new ResourceTypeRegistry();
    registry.type("dasherizeOnType", { dbAdapter: dbAdapter });
    registry.type("dasherizeOffType", {
      dbAdapter: dbAdapter,
      behaviors: {
        dasherizeOutput: { enabled: false }
      }
    });
  });

  describe("parsing query params", () => {
    it("should camelize fields param according to type behavior", () => {
      let request = {
        type: "dasherizeOnType",
        queryParams: {
          fields: {
            dasherizeOnType: "a-dasherized-field",
            dasherizeOffType: "another-dasherized-field"
          }
        }
      };

      let passedToAdapter = doGet(request, {}, registry);
      expect(passedToAdapter.fields).to.deep.equal({
        dasherizeOnType: ["aDasherizedField"],
        dasherizeOffType: ["another-dasherized-field"]
      });
    });

    it("should camelize sort param according to type behavior", () => {
      let request = {
        type: "dasherizeOnType",
        queryParams: {
          sort: "ascending-field,-descending-field"
        }
      };

      let passedToAdapter = doGet(request, {}, registry);
      expect(passedToAdapter.sorts).to.deep.equal(["ascendingField", "-descendingField"]);
    });

    it("should camelize dot-separated sort path according to type behavior", () => {
      let request = {
        type: "dasherizeOnType",
        queryParams: {
          sort: "some-relationship.dont-transform-this-one"
        }
      };

      let passedToAdapter = doGet(request, {}, registry);
      expect(passedToAdapter.sorts).to.deep.equal(["someRelationship.dont-transform-this-one"]);
    });

    it("should camelize include param according to type behavior", () => {
      let request = {
        type: "dasherizeOnType",
        queryParams: {
          include: "dasherized-path.to-include,another-path"
        }
      };

      let passedToAdapter = doGet(request, {}, registry);
      expect(passedToAdapter.includes).to.deep.equal(["dasherizedPath.toInclude", "anotherPath"]);
    });

    it("should camelize filter param according to type behavior", () => {
      let request = {
        type: "dasherizeOnType",
        queryParams: {
          filter: {
            simple: {
              "dasherized-attribute": "equalsThisValue"
            }
          }
        }
      };

      let passedToAdapter = doGet(request, {}, registry);
      expect(passedToAdapter.filters).to.deep.equal({ dasherizedAttribute: "equalsThisValue" });
    });
  });
});
