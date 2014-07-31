require! [\mocha, \sinon \chai, \../../lib/types/Resource \../../lib/adapters/MongooseAdapter]
expect = chai.expect
it2 = it # a hack for livescript

describe("Mongoose Adapter", ->
  describe("docToResource", ->
    it2("should remove _id,  __v; use id as the id; and call toObject", ->
      type = "myType"
      doc =
        id: 'blah2'
        prop: 'val'
        _id: 'blah'
        __v: 'blah3' 
        toObject: sinon.spy(-> {_id: @_id, __v:@__v, prop:'valToObject'})
        # above, toObject doesn't copy over id, which may be "virtual"
  
      resource = MongooseAdapter.docToResource(doc, type, [])

      expect(MongooseAdapter.docToResource).to.be.a("function")
      expect(doc.toObject.callCount).to.equal(1)
      expect(resource.attrs.prop).to.equal("valToObject")
      expect(resource.attrs._id).to.be.undefined
      expect(resource.attrs.__v).to.be.undefined
      expect(resource.id).to.equal('blah2')
    )
  )

)