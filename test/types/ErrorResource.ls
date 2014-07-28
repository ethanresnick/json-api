require! [\mocha, \sinon \chai, \../../lib/types/ErrorResource]
expect = chai.expect
it2 = it # a hack for livescript

describe("Resource type", ->
  describe("validation", ->
    it2("type must be errors", -> 
      er = new ErrorResource("bobid9", {})
      expect(er.type).to.equal("errors")
      expect(-> er.type = 'noterrors').to.throw(/type.*errors/)
    )

    it2("should coerce the status to a string", ->
      er = new ErrorResource("bobid9", {status:300})
      expect(er.attrs.status === "300").to.be.true;
    )

    it2("should coerce the code to a string", ->
      er = new ErrorResource("bobid9", {code:1401})
      expect(er.attrs.code === "1401").to.be.true;
    )
  )

  describe("the fromError helper" ->
    it2("should use the error's statusCode val as status if status not defined", ->
      er = ErrorResource.fromError({'statusCode':300});
      expect(er.attrs.status === "300").to.be.true;

      er = ErrorResource.fromError({'status': 200, 'statusCode':300});
      expect(er.attrs.status === "200").to.be.true;
    );

    it2("should default to status 500", ->
      expect(ErrorResource.fromError({}).attrs.status).to.equal("500");
    )
  )
)