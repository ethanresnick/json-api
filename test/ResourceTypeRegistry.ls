require! [\mocha, \sinon \chai, \../lib/ResourceTypeRegistry]
expect = chai.expect
it2 = it # a hack for livescript

registry = {}

makeGetterSetterTest = (newThing, type, methodName, deep) ->
  return ->
    expect(registry[methodName](type)).to.be.undefined;
    registry[methodName](type, newThing)
    # You may get a copy of the set object back, not a direct
    # reference. And that's acceptable. A deep check lets that pass.
    if deep
      expect(registry[methodName](type)).to.deep.equal(newThing)
    else
      expect(registry[methodName](type)).to.equal(newThing)

describe("ResourceTypeRegistry", ->
  beforeEach(->
    registry := new ResourceTypeRegistry()
  )

  describe("type", ->
    description = 
      adapter: {}
      beforeSave: ->
      afterQuery: -> 
      info: {}
      urlTemplates: {'mytypes.path': 'test template'}

    it2("should be a getter/setter for a type",
      makeGetterSetterTest(description, "mytypes", "type", true)
    )
  )

  describe("adapter" ->
    it2("should be a getter/setter for a type's adapter", 
      makeGetterSetterTest({'a':'new model'}, "mytypes", "adapter")
    )
  )

  describe("beforeSave" ->
    it2("should be a getter/setter for a type for a type's beforeSave", 
      makeGetterSetterTest(->, "mytypes", "beforeSave")
    )
  )

  describe("afterQuery" ->
    it2("should be a getter/setter for a type's afterQuery", 
      makeGetterSetterTest(->, "mytypes", "afterQuery")
    )
  )

  describe("info" ->
    it2("should be a getter/setter for a type's info", 
      makeGetterSetterTest({}, "mytypes", "info")
    )
  )

  describe("urlTemplates" ->
    it2("should be a getter/setter for a type's urlTemplates",
      makeGetterSetterTest(
        {'mytypes.path': 'test template'}, 
        "mytypes", "urlTemplates", true
      )
    )

    it2("should reject invalid urlTemplates", ->
      newTemps = {'unscoped.path':'new template'}
      expect(-> registry.urlTemplates("mytypes", newTemps)).to.throw(Error)
    )
  )
)