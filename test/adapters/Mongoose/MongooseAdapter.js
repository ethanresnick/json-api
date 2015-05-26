import chai from "chai";
import sinon from "sinon";
import Resource from "../../../src/types/Resource";
import Collection from "../../../src/types/Collection";
import MongooseAdapter from "../../../src/adapters/Mongoose/MongooseAdapter";

const expect = chai.expect;

describe("Mongoose Adapter", () => {
  describe("its static methods", () => {
    const typesToModelNames = {
      "teams": "Team",
      "jobs": "Job",
      "events": "Event",
      "venues": "Venue",
      "related-clubs": "RelatedClub",
      "team-memberships": "TeamMembership"
    };

    describe("getType", () => {
      it("should lowercase & pluralize the model name; use dashes in camelCased names", () => {
        for(let type in typesToModelNames) {
          expect(MongooseAdapter.getType(typesToModelNames[type])).to.equal(type);
        }
      });

      it("should use a custom pluralize if provided", () => {
        let pluralize = () => "customplural";
        expect(MongooseAdapter.getType("TestModel", pluralize)).to.equal("customplural");
      });
    });

    describe("getModelName", () => {
      it("should reverse getType", () => {
        for(let type in typesToModelNames) {
          let modelName = typesToModelNames[type];
          expect(MongooseAdapter.getModelName(type)).to.equal(modelName);
        }
      });

      it("should use a custom singularizer if provided", () => {
        let singularize = () => "customsingular";
        expect(MongooseAdapter.getModelName("test-models", singularize)).to.equal("TestCustomsingular");
      });
    });

    describe("getFriendlyName", () => {
      it("should detect camel-cased words, and separate and capitalize each one", () => {
        expect(MongooseAdapter.toFriendlyName("twitterId")).to.equal("Twitter Id");
      });

      it("should handle dot-separated, nested paths", () => {
        expect(MongooseAdapter.toFriendlyName("contact.name")).to.equal("Contact Name");
      });

      it("should handle acronyms in names", () => {
        expect(MongooseAdapter.toFriendlyName("inUSA")).to.equal("In USA");
        expect(MongooseAdapter.toFriendlyName("isMLBTeam")).to.equal("Is MLB Team");
        expect(MongooseAdapter.toFriendlyName("thisIsATest")).to.equal("This Is A Test");
        expect(MongooseAdapter.toFriendlyName("ATest")).to.equal("A Test");
        expect(MongooseAdapter.toFriendlyName("isCaseB")).to.equal("Is Case B");
      });
    });
  });
});


  /*
  describe("docToResource", () => {
    it("should remove _id, __v, __t; use id as the id; and call toObject", () => {
      const type = "myType";
      docStub = {
        id: "blah2",
        prop: "val",
        _id: "blah",
        __t: "blah4",
        __v: "blah3",
        toObject: sinon.spy(() => {
          return {_id: this._id, __v: this.__v, __t: this.__t, prop:"valToObject"};
        }
      }

        // above, toObject doesn"t copy over id, which may be "virtual"

      resource = MongooseAdapter.docToResource(doc, type, []);

      expect(MongooseAdapter.docToResource).to.be.a("function");
      expect(resource).to.be.an.instanceof(Resource);
      expect(doc.toObject.callCount).to.equal(1);
      expect(resource.attrs.prop).to.equal("valToObject");
      expect(resource.attrs._id).to.be.undefined;
      expect(resource.attrs.__v).to.be.undefined;
      expect(resource.attrs.__t).to.be.undefined;
      expect(resource.id).to.equal("blah2");
    });
  });*/
