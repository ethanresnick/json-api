require! [\mocha, \sinon \chai, \../lib/BaseController]
expect = chai.expect
it2 = it # a hack for livescript

describe("Base Controller", ->
  describe("extend", ->
    it2("returns a new object the provided properties and `this` as the prototype", ->
      orig = {'base': -> it}
      new1 = BaseController.extend.call(orig, {'my2': -> it})
      new2 = BaseController.extend({'my3': true})

      expect(new1.__proto__ == orig).to.be.true
      expect(new1.my2).to.be.a('function')
      expect(new2.__proto__ == BaseController).to.be.true
      expect(new2.my3).to.be.true
    )
  )
)