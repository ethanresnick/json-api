/* FROM PREVIOUS JSON PARSING
      requestValidators.checkBodyParsesAsJSON(req, res, bodyParser).then(
        () => { res.json(req.body); },
        (err) => { res.status(Number(err.status)).send("Error"); }
      );
    });

    it("should try to parse all bodies, no matter the content-type", (done) => {
      var request = supertest(app);
      request
        .post('/').set('Content-Type', 'application/xml').send('{"json":true}')
        .expect(200, '{"json":true}', done);
    });

    it("should reject the promise with a 400 error for an invalid json body", (done) => {
      var request = supertest(app);
      request.post('/').send("unquoted:false}").expect(400, done);
    });

    it("should resolve the promise successfully for a valid body", (done) => {
      var request = supertest(app);
      request
        .post('/').send('{"json":[]}')
        .expect(200, '{"json":[]}', done);
    }); */

/*
FROM PREVIOUS BASE CONTROLLER

require! {
  \mocha, \sinon \chai, 'body-parser', Q:\q, \supertest, \express,
  BaseController:\../../lib/controllers/Base, \../../lib/types/APIError, \../../lib/types/Collection, \../../lib/ResourceTypeRegistry
}

expect = chai.expect
it2 = it # a hack for livescript
app = express()

adapter =
  find: sinon.stub().returns(Q.fcall(-> throw new Error("Blah")))

registry =
  adapter: sinon.stub().returns(adapter)
  urlTemplates: sinon.stub().returns({
    "people.something": "something/{people.id}",
    "user.person": "people/{person.id}"
  })
  afterQuery: sinon.spy(-> -> it)
  beforeSave: sinon.spy(-> -> it)
  info: sinon.spy((type) -> {})

Base = new BaseController(registry)

getSpy = sinon.spy(Base~GET)
app.get("/:type/:id?", getSpy)

request = supertest(app)

describe("Base Controller", ->
  describe("GET", ->
    it2("should be a standard middleware function", ->
      expect(Base.GET).to.be.a('function').with.length(3)
    )

    describe("finding resources through the adapter", ->
      beforeEach(-> adapter.find.reset!; registry.adapter.reset!)

      urlsToFindOptions =
        '/mytypes': ['mytypes', void, {}, void, void, void]
        '/mytypes/1': ['mytypes', '1', {}, void, void, void]
        '/mytypes/1,2': ['mytypes', ['1','2'], {}, void, void, void]
        '/mytypes/test%252Cit%2Cextra': ['mytypes', ['test,it', 'extra'], {}, void, void, void]
        '/mytypes/1?sort=test': ['mytypes', '1', {}, void, ['test'], void]
        '/mytypes/1?sort=a,b': ['mytypes', '1', {}, void, ['a', 'b'], void]
        '/mytypes?sort=test%252Cit%2Cextra': ['mytypes', void, {}, void, ['test,it', 'extra'], void]
        '/mytypes?sort=a&include=bob&date=now': ['mytypes', void, {'date':'now'}, void, ['a'], ['bob']]

      for url, options of urlsToFindOptions
        ((url, options) ->
          it2("a request for " + url + " should make the right call", (done) ->
            request.get(url).end(->
              expect(registry.adapter.calledOnce).to.be.true
              expect(registry.adapter.calledWith("mytypes")).to.be.true
              expect(adapter.find.calledOnce).to.be.true
              expect(adapter.find.firstCall.args).to.deep.equal(options)
              done!
            )
          )
        )(url, options)
    )

    it2.skip("should run afterQuery recursively on the found resources", ->
    )
  )

  describe("sendResources", ->
    it2.skip("uses the error's status as response status code if passed an error resource", ->

      BaseController.sendResources(resSpy, new ErrorResource(null, {'status': 411}))
      BaseController.sendResources(resSpy, new ErrorResource(null, {'status': 408}))
      expect(resSpy.json.firstCall.args).to.have.length(2)
      expect(resSpy.json.secondCall.args).to.have.length(2)
      expect(resSpy.json.firstCall.args[0]).to.equal(411)
      expect(resSpy.json.secondCall.args[0]).to.equal(408)
      expect(resSpy.json.firstCall.args[1]).to.be.an("object")
    )

    it2.skip("should send the response with the proper mime type", ->
      BaseController.sendResources(resSpy, new ErrorResource(null, {'status': 408}))
      expect(resSpy.set.calledWith("Content-Type", "application/vnd.api+json")).to.be.true
    )

    it2.skip("calls `pickStatus` to figure out the appopriate response status code if passed a collection of error resources", ->
      coll = new Collection([new ErrorResource(null, {'status': 411}), new ErrorResource(null, {'status': 408})])
      pickStatusSpy = sinon.spy(BaseController, "_pickStatus");

      BaseController.sendResources(resSpy, coll)

      expect(pickStatusSpy.callCount).to.equal(1)
      expect(pickStatusSpy.calledWith([411, 408])).to.be.true
      expect(resSpy.json.firstCall.args).to.have.length(2)
      expect(resSpy.json.firstCall.args[1]).to.be.an("object")

      BaseController._pickStatus.restore();
    )
  )

  describe("getBodyPromise", ->
    parser = bodyParser.json({type: ['json', 'application/vnd.api+json']})
    it2.skip("promises req.body if that's already an object", (done)->
      body = {}
      BaseController.getBodyPromise({body: body}, {}, parser).then(->
        expect(it).to.equal(body)
        done!
      )
    )

    it2.skip("sends a 415 error for invalid character encodings", ->

    )
    it2.skip("sends a 400 error that says resource is required for an empty json body", ->)

    # the below should explicitly check that syntax errors which lead the body parser to
    # throw an error (because the json fails the strict mode test) are treated the same
    # as errors thrown directly from JSON.parse.
    it2.skip("sends a 400 invalid json error for any other json syntax errors", ->)
  )
  describe("", ->)
)*/
