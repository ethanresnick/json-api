import { expect } from "chai";
import * as sut from "../../../../../src/db-adapters/Mongoose/utils/naming-conventions";

describe("Mongoose Adapter Conventional Naming Utils", () => {
  const typeNamesToModelNames = {
    "teams": "Team",
    "jobs": "Job",
    "events": "Event",
    "venues": "Venue",
    "related-clubs": "RelatedClub",
    "team-memberships": "TeamMembership"
  };

  describe("getTypeName", () => {
    it("should lowercase & pluralize the model name; use dashes in camelCased names", () => {
      for(const type in typeNamesToModelNames) { //tslint:disable-line:forin
        expect(sut.getTypeName(
          typeNamesToModelNames[type as keyof typeof typeNamesToModelNames]
        )).to.equal(type);
      }
    });

    it("should use a custom pluralize if provided", () => {
      const pluralize = () => "customplural";
      expect(sut.getTypeName("TestModel", pluralize)).to.equal("customplural");
    });
  });

  describe("getModelName", () => {
    it("should reverse getType", () => {
      for(const type in typeNamesToModelNames) { //tslint:disable-line:forin
        const modelName = typeNamesToModelNames[type as keyof typeof typeNamesToModelNames];
        expect(sut.getModelName(type)).to.equal(modelName);
      }
    });

    it("should use a custom singularizer if provided", () => {
      const singularize = () => "customsingular";
      expect(sut.getModelName("test-models", singularize)).to.equal("TestCustomsingular");
    });
  });
})
