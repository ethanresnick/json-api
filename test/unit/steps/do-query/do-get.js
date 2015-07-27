import {expect} from "chai";
import ResourceTypeRegistry from "../../../../src/ResourceTypeRegistry";
import doGet from "../../../../src/steps/do-query/do-get";

class TestAdapter {
  static getReferencedType(model, path) {
    if (path === "some-relationship") {
      return "dasherize-off-type";
    }
    return "dasherize-on-type";
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
    registry.type("dasherize-on-type", { dbAdapter: dbAdapter });
    registry.type("dasherize-off-type", {
      dbAdapter: dbAdapter,
      behaviors: {
        dasherizeOutput: { enabled: false }
      }
    });
  });

  describe("parsing query params", () => {
    it("should camelize fields param according to type behavior", () => {
      let request = {
        type: "dasherize-on-type",
        queryParams: {
          fields: {
            "dasherize-on-type": "a-dasherized-field",
            "dasherize-off-type": "another-dasherized-field"
          }
        }
      };

      let passedToAdapter = doGet(request, {}, registry);
      expect(passedToAdapter.fields).to.deep.equal({
        "dasherize-on-type": ["aDasherizedField"],
        "dasherize-off-type": ["another-dasherized-field"]
      });
    });

    it("should camelize sort param according to type behavior", () => {
      let request = {
        type: "dasherize-on-type",
        queryParams: {
          sort: "ascending-field,-descending-field"
        }
      };

      let passedToAdapter = doGet(request, {}, registry);
      expect(passedToAdapter.sorts).to.deep.equal(["ascendingField", "-descendingField"]);
    });

    it("should camelize dot-separated sort path according to type behavior", () => {
      let request = {
        type: "dasherize-on-type",
        queryParams: {
          sort: "some-relationship.dont-transform-this-one"
        }
      };

      let passedToAdapter = doGet(request, {}, registry);
      expect(passedToAdapter.sorts).to.deep.equal(["someRelationship.dont-transform-this-one"]);
    });

    it("should camelize include param according to type behavior", () => {
      let request = {
        type: "dasherize-on-type",
        queryParams: {
          include: "dasherized-path.to-include,another-path"
        }
      };

      let passedToAdapter = doGet(request, {}, registry);
      expect(passedToAdapter.includes).to.deep.equal(["dasherizedPath.toInclude", "anotherPath"]);
    });

    it("should camelize filter param according to type behavior", () => {
      let request = {
        type: "dasherize-on-type",
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
