import Q from "q";
import vary from "vary";
import contentType from "content-type";
import getRawBody from "raw-body";
import API from "../controllers/API";
import Request from "../types/HTTP/Request";

/**
 * This controller receives requests directly from express and sends responses
 * direclty through it, but it converts incoming requests to, and generates
 * responses, from Request and Response objects that are defined by this
 * framework in a way that's not particular to express. This controller thereby
 * acts as a translation-layer between express and the rest of this json-api
 * framework.
 *
 * @param {Object} options A set of configuration options.
 *
 * @param {boolean} options.tunnel Whether to turn on PATCH tunneling. See:
 *    http://jsonapi.org/recommendations/#patchless-clients
 *
 * @param {boolean} options.handleContentNegotiation If the JSON API library
 *    can't produce a representation for the response that the client can
 *    `Accept`, should it return 406 or should it hand the request back to
 *    Express (i.e. call next()) so that subsequent handlers can attempt to
 *    find an alternate representation? By defualt, it does the former. But you
 *    can set this option to false to have this code just pass on to express.
 */
export default class ExpressStrategy {
  constructor(apiController, docsController, options) {
    const defaultOptions = {
      tunnel: false,
      handleContentNegotiation: true
    };

    this.api = apiController;
    this.docs = docsController;
    this.config = Object.assign(defaultOptions, options); // apply options

  }

  // For requests like GET /:type, GET /:type/:id/:relationship,
  // POST /:type PATCH /:type/:id, PATCH /:type, DELETE /:type/:idOrLabel,
  // DELETE /:type, GET /:type/:id/links/:relationship,
  // PATCH /:type/:id/links/:relationship, POST /:type/:id/links/:relationship,
  // and DELETE /:type/:id/links/:relationship.
  apiRequest(req, res, next) {
    buildRequestObject(req, this.config.tunnel).then((requestObject) => {
      this.api.handle(requestObject, req, res).then((responseObject) => {
        this.sendResources(responseObject, res, next);
      });
    }, (err) => {
      res.status(err.status).send(err.message);
    }).done();
  }

  // For requests for the documentation.
  docsRequest(req, res, next) {
    buildRequestObject(req, this.config.tunnel).then((requestObject) => {
      this.docs.handle(requestObject).then((responseObject) => {
        this.sendResources(responseObject, res, next);
      });
    }).done();
  }

  sendResources(responseObject, res, next) {
    if(responseObject.headers.vary) {
      vary(res, responseObject.headers.vary);
    }

    if(!responseObject.contentType) {
      this.config.handleContentNegotiation ? res.status(406).send() : next();
    }
    else {
      res.set("Content-Type", responseObject.contentType);
      res.status(responseObject.status || 200);

      if(responseObject.headers.location) {
        res.set("Location", responseObject.headers.location);
      }

      if(responseObject.body !== null) {
        res.send(new Buffer(responseObject.body)).end();
      }
      else {
        res.end();
      }
    }
  }

  /**
   * A user of this library may wish to send an error response for an exception
   * that originated outside of the JSON API Pipeline and that's outside the
   * main spec's scope (e.g. an authentication error). So, the controller
   * exposes this method which allows them to do that.
   */
  sendError(error, req, res) {
    buildRequestObject(req).then((requestObject) => {
      API.responseFromExternalError(requestObject, error, this.api.registry).then(
        (responseObject) => this.sendResources(responseObject, res, () => {})
      );
    });
  }

  /**
   * @TODO Uses this ExpressStrategy to create an express app with
   * preconfigured routes that can be mounted as a subapp.
   */
  toApp(typesToExcludedMethods) {
  }
}


function buildRequestObject(req, allowTunneling) {
  return Q.Promise(function(resolve, reject) {
    let it = new Request();

    // Handle route & query params
    it.queryParams       = req.query;
    it.allowLabel        = !!(req.params.idOrLabel && !req.params.id);
    it.idOrIds           = req.params.id || req.params.idOrLabel;
    it.type              = req.params.type;
    it.aboutRelationship = !!req.params.relationship;
    it.relationship      = req.params.related || req.params.relationship;

    // Handle HTTP/Conneg.
    it.uri     = req.protocol + "://" + req.get("Host") + req.originalUrl;
    it.method  = req.method.toLowerCase();
    it.accepts = req.headers.accept;

    // Support Verb tunneling, but only for PATCH and only if user turns it on.
    // Turning on any tunneling automatically could be a security issue.
    let requestedMethod = (req.headers["X-HTTP-Method-Override"] || "").toLowerCase();
    if(allowTunneling && it.method === "post" && requestedMethod === "patch") {
      it.method = "patch";
    }
    else if(requestedMethod) {
      reject(new Error(`Cannot tunnel to the method "${requestedMethod}".`));
    }

    it.hasBody = hasBody(req);

    if(it.hasBody) {
      it.contentType  = req.headers["content-type"];
      let typeParsed = contentType.parse(req);

      let bodyParserOptions = {};
      bodyParserOptions.encoding = typeParsed.parameters.charset || "utf8";
      bodyParserOptions.limit = "1mb";
      if(req.headers["content-length"] && !isNaN(req.headers["content-length"])) {
        bodyParserOptions.length = req.headers["content-length"];
      }

      getRawBody(req, bodyParserOptions, function(err, string) {
        if(err) { reject(err); }
        else {
          try {
            it.body = JSON.parse(string);
            resolve(it);
          }
          catch (error) {
            let parseErr = new Error("Request contains invalid JSON.");
            parseErr.status = error.statusCode = 400;
            reject(parseErr);
          }
        }
      });
    }
    else {
      it.body = null;
      resolve(it);
    }
  });
}

function hasBody(req) {
  return req.headers["transfer-encoding"] !== undefined
    || !isNaN(req.headers["content-length"]);
}
