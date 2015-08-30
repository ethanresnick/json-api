import {expect} from "chai";
import APIError from "../../../../src/types/APIError";
import MongooseAdapter from "../../../../src/db-adapters/Mongoose/MongooseAdapter";

describe("Mongoose Adapter", () => {
  describe("its instances methods", () => {
    describe("getModel", () => {
      it("should throw an exception for unknown models", () => {
        let adapter = new MongooseAdapter({});
        expect(() => { adapter.getModel("x"); }).to.throw(/model .+ has not been registered/);
      });
    });
  });

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

    describe("getIdQueryType", () => {
      it("should handle null input", () => {
        const res = MongooseAdapter.getIdQueryType();
        expect(res[0]).to.equal("find");
        expect(res[1]).to.be.undefined;
      });

      describe("string", () => {
        it("should throw on invalid input", () => {
          const fn = function() { MongooseAdapter.getIdQueryType("1"); };
          expect(fn).to.throw(APIError);
        });

        it("should produce query on valid input", () => {
          const res = MongooseAdapter.getIdQueryType("552c5e1c604d41e5836bb174");
          expect(res[0]).to.equal("findOne");
          expect(res[1]._id).to.equal("552c5e1c604d41e5836bb174");
        });
      });

      describe("array", () => {
        it("should throw if any ids are invalid", () => {
          const fn = function() { MongooseAdapter.getIdQueryType(["1", "552c5e1c604d41e5836bb174"]); };
          expect(fn).to.throw(APIError);
        });

        it("should produce query on valid input", () => {
          const res = MongooseAdapter.getIdQueryType(["552c5e1c604d41e5836bb174", "552c5e1c604d41e5836bb175"]);
          expect(res[0]).to.equal("find");
          expect(res[1]._id.$in).to.be.an.Array;
          expect(res[1]._id.$in[0]).to.equal("552c5e1c604d41e5836bb174");
          expect(res[1]._id.$in[1]).to.equal("552c5e1c604d41e5836bb175");
        });
      });
    });

    describe("idIsValid", () => {
      it("should reject all == null input", () => {
        expect(MongooseAdapter.idIsValid()).to.not.be.ok;
        expect(MongooseAdapter.idIsValid(null)).to.not.be.ok;
        expect(MongooseAdapter.idIsValid(undefined)).to.not.be.ok;
      });

      it("should reject bad input type", () => {
        expect(MongooseAdapter.idIsValid(true)).to.not.be.ok;
      });

      it("should reject empty string", () => {
        expect(MongooseAdapter.idIsValid("")).to.not.be.ok;
      });

      // the string coming into the MongooseAdapter needs to be the 24-character,
      // hex encoded version of the ObjectId, not an arbitrary 12 byte string.
      it("should reject 12-character strings", () => {
        expect(MongooseAdapter.idIsValid("aaabbbccc111")).to.not.be.ok;
      });

      it("should reject numbers", () => {
        expect(MongooseAdapter.idIsValid(1)).to.not.be.ok;
      });

      it("should accpet valid hex string", () => {
        expect(MongooseAdapter.idIsValid("552c5e1c604d41e5836bb175")).to.be.ok;
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
