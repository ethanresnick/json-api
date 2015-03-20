import ResponseContext from "./types/Context/ResponseContext"
import Document from "./types/Document"
import * as requestValidators from "./steps/http/validate-request"
import negotiateContentType from "./steps/http/negotiate-content-type"
import doFind from "./steps/do-query/do-find"
import doCreate from "./steps/do-query/do-create"
import labelToIds from "./steps/pre-query/label-to-ids"
import parseRequestResources from "./steps/pre-query/parse-resources"


export default function(registry) {
  let supportedExt = ["bulk"];

  // The pipeline, created once with the registry,
  // returns a single function that can handle incoming requests.
  return function(requestContext) {
    let responseContext = new ResponseContext();

    // Now, kick off the chain for generating the response.
    // We'll validate and parse the body if one is present and, if one isn't,
    // we'll throw an error if one was supposed to be (or vice-versa).
    return requestValidators.checkBodyExistence(requestContext)
      .then(() => {
        if(requestContext.hasBody) {
          return requestValidators.checkBodyIsValidJSONAPI(requestContext.body).then(() => {
            return requestValidators.checkContentType(requestContext, supportedExt).then(() => {
              parseRequestResources(requestContext);
            });
          });
        }
      })

      // Map label to idOrIds, if applicable.
      .then(() => {
        if(requestContext.idOrIds && requestContext.allowLabel) {
          return labelToIds(registry, requestContext, responseContext);
        }
      })

      // Actually fulfill the request!
      .then(() => {
        // If we've already populated the primary resources, which is possible
        // because the label may have mapped to no id(s), we don't need to query.
        if(typeof responseContext.primary === "undefined") {
          switch(requestContext.method) {
            case "get":
              return doFind(requestContext, responseContext, registry);

            case "post":
              return doCreate(requestContext, responseContext, registry);
          }
        }
      })

      // Log any errors
      .catch((err) => {
        responseContext.errors = responseContext.errors.concat(err);
      })

      // Negotiate the content type
      .then(() => {
        let accept = requestContext.accepts;
        let usedExt = responseContext.ext;
        return negotiateContentType(accept, usedExt, supportedExt).then(
          (it) => { responseContext.contentType = it; }
        );
      })
      .then(() => {
        if(responseContext.errors.length) {
          responseContext.status = pickStatus(responseContext.errors.map(
            (v) => Number(v.status)
          ));
          responseContext.body = new Document(responseContext.errors).get();
        }
        else {
          responseContext.body = new Document(
            responseContext.primary, responseContext.included
          ).get();
        }
        return responseContext;
      });
  };
}

/**
 * Returns the status code that best represents a set of error statuses.
 */
function pickStatus(errStatuses) {
  return errStatuses[0];
}
