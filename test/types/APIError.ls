require! [\mocha, \sinon \chai, \../../lib/types/APIError]
expect = chai.expect
it2 = it # a hack for livescript

describe("Error Objects", ->
  describe("validation", ->
    it2("should coerce the status to a string", ->
      er = new APIError(300)
      expect(er.status === "300").to.be.true;
    )

    it2("should coerce the code to a string", ->
      er = new APIError(200, 1401)
      expect(er.code === "1401").to.be.true;
    )
  )

  describe("the fromError helper" ->
    it2("should use the error's statusCode val as status if status not defined", ->
      er = APIError.fromError({'statusCode':300});
      expect(er.status === "300").to.be.true;

      er = APIError.fromError({'status': 200, 'statusCode':300});
      expect(er.status === "200").to.be.true;
    );

    it2("should default to status 500", ->
      expect(APIError.fromError({}).status).to.equal("500");
    )
  )
)