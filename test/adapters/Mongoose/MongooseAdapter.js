import chai from "chai";
import sinon from "sinon";
import Resource from "../../../src/types/Resource";
import Collection from "../../../src/types/Collection";
import MongooseAdapter from "../../../src/adapters/Mongoose/MongooseAdapter";

const expect = chai.expect;

describe("Mongoose Adapter", () => {
  describe("getType static method", () => {
    const typesToModelNames = {
      "teams": "Team",
      "jobs": "Job",
      "events": "Event",
      "venues": "Venue",
      "related-clubs": "RelatedClub",
      "team-memberships": "TeamMembership"
    };

    it("should lowercase & pluralize the model name; use dashes in camelCased names", () => {
      for(let type in typesToModelNames) {
        expect(MongooseAdapter.getType(typesToModelNames[type])).to.equal(type);
      }
    });

    it("should use a custom pluralize if provided", () => {
      let plural = () => "customplural";
      expect(MongooseAdapter.getType("TestModel", plural)).to.equal("customplural");
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
});

/*


    describe("getModelName", ->
      it2("should reverse getType", ->
        for type, modelName of typesToModelNames
          expect(MongooseAdapter.getModelName(type)).to.equal(modelName)
      )
    )
  )
}); */
