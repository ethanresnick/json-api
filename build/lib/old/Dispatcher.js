"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var RequestContext = _interopRequire(require("./types/RequestContext"));

var requestValidators = _interopRequireWildcard(require("./steps/http/validate-request"));

module.exports = function (registry, typeIs, contentType, bodyParser) {
  var supportedExt = ["bulk"];

  // The dispatcher, created once with the registry,
  // returns a single function that can handle incoming requests.
  return function (options, req, res, next) {
    var requestContext = new RequestContext(options);
    var responseContext = new ResponseContext();

    // Set up the context with properties we can easily infer.
    requestContext.populateFromRequest(req, typeIs, contentType);

    // Now, kick off the chain for generating the response.
    requestValidators.checkBodyExistence(requestContext).then(function () {
      if (requestContext.hasBody) {
        return requestValidators.checkBodyParsesAsJSON(req, res, bodyParser).then(function () {
          return requestValidators.checkContentType(requestContext, supportedExt);
        });
      } else {
        return Q(true);
      }
    })

    // Now that we've done the validation steps, further process the request.
    .then(function () {});
  };
}

/*

  (options, req, res, next) ->
    var re

      # Replace any label with an id/ids.
      .then(-> labelToIds(registry, req, res))
      .then((skipToRendering) ->
        # if skipToRendering is true, then the label mapped
        # to no ids, so we've already set the primary resources.
        if skipToRendering
          sendResources(req, res) 
        else
          parseReqResources(registry, req, res).then()
      )

      # Handle any error(s)
      .catch((err) ->
        errorsArr = [err] if not (err instanceof Array)
        status = pickStatus(errorsArr.map(-> Number(it.status)))
        res.status(status).json({"errors": errorsArr});
      )

# Takes an array of error status codes and 
# returns the code that best represents the set.
function pickStatus(errStatuses)
  errStatuses[0]

function sendResources(req, res)
  app.use(validateAccepts)*/
;