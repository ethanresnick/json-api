"use strict";

/*require! [\mocha, \sinon \chai, \../../lib/types/Resource \../../lib/adapters/MongooseAdapter]
expect = chai.expect
it2 = it # a hack for livescript

describe("Mongoose Adapter", ->
  describe("docToResource", ->
    it2("should remove _id, __v, __t; use id as the id; and call toObject", ->
      type = "myType"
      doc =
        id: 'blah2'
        prop: 'val'
        _id: 'blah'
        __t: 'blah4'
        __v: 'blah3'
        toObject: sinon.spy(-> {_id: @_id, __v:@__v, __t: @__t, prop:'valToObject'})
        # above, toObject doesn't copy over id, which may be "virtual"

      resource = MongooseAdapter.docToResource(doc, type, [])

      expect(MongooseAdapter.docToResource).to.be.a("function")
      expect(doc.toObject.callCount).to.equal(1)
      expect(resource.attrs.prop).to.equal("valToObject")
      expect(resource.attrs._id).to.be.undefined
      expect(resource.attrs.__v).to.be.undefined
      expect(resource.attrs.__t).to.be.undefined
      expect(resource.id).to.equal('blah2')
    )
  )

  describe("getType and getModelName", ->
    typesToModelNames =
      teams: \Team
      jobs: \Job
      events: \Event
      venues: \Venue
      'related-clubs': \RelatedClub
      'team-memberships': \TeamMembership

    describe("getType", ->
      it2("should lowercase & pluralize the model name, and use dashes in camelCased names", ->
        for type, modelName of typesToModelNames
          expect(MongooseAdapter.getType(modelName)).to.equal(type)
      )

      it2("should use a custom pluralize if provided", ->
        plural = -> 'mycustomresult'
        expect(MongooseAdapter.getType('TestModel', plural)).to.equal('mycustomresult')
      )
    )

    describe("getModelName", ->
      it2("should reverse getType", ->
        for type, modelName of typesToModelNames
          expect(MongooseAdapter.getModelName(type)).to.equal(modelName)
      )
    )
  )
)*/