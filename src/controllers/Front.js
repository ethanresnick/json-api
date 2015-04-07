import Q from "q";
import templating from "url-template";
import jade from "jade";
import path from "path";
import contentType from "content-type";
import getRawBody from "raw-body";
import API from "./API";
import Documentation from "./Documentation";
import Request from "../types/HTTP/Request";
import ResourceTypeRegistry from "../ResourceTypeRegistry";

/**
 * This controller (or a subclass of it if the user isn't on express) has the
 * job of converting the framework's req, res objects into framework-neutral
 * Request and Response objects, which it then provides to our other controllers
 * (API and Documentation) that do the real work. They generate a Response
 * object, so they're totally shielded from the framework's details, and then
 * this controller turns that into a true response.
 */
export default class FrontController {
  constructor(apiController, docsController) {
    this.api = apiController;
    this.docs = docsController;
  }

  // For requests like GET /:type, GET /:type/:id/:relationship,
  // POST /:type with or without ext=bulk, PATCH /:type/:id,
  // PATCH /:type with ext=bulk, DELETE /:type/:idOrLabel,
  // DELETE /:type; ext=bulk, GET /:type/:id/links/:relationship,
  // PATCH /:type/:id/links/:relationship, POST /:type/:id/links/:relationship,
  // and DELETE /:type/:id/links/:relationship.
  apiRequest(req, res, next) {
    buildRequestObject(req).then((requestObject) => {
      this.api.handle(requestObject, req, res).then((responseObject) => {
        this.sendResources(responseObject, res);
      });
    }, (err) => {
      res.status(err.status).send(err.message);
    });
  }

  // For requests for the documentation.
  docsRequest(req, res, next) {
    buildRequestObject(req).then((requestObject) => {
      this.docs.handle(requestObject).then((responseObject) => {
        this.sendResources(responseObject, res);
      });
    });
  }

  sendResources(responseObject, res) {
    if(!responseObject.contentType) {
      res.status(406).send();
    }
    else {
      res.set("Content-Type", responseObject.contentType);
      res.status(responseObject.status || 200);

      if(responseObject.location) {
        res.set("Location", responseObject.location);
      }

      if(responseObject.body !== null) {
        res.send(responseObject.body).end();
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
        (responseObject) => this.sendResources(responseObject, res)
      );
    });
  }
}


function buildRequestObject(req) {
  return Q.Promise(function(resolve, reject) {
    let it = new Request();

    // Handle route & query params
    it.queryParams     = req.query;
    it.allowLabel      = !!(req.params.idOrLabel && !req.params.id);
    it.idOrIds         = req.params.id || req.params.idOrLabel;
    it.type            = req.params.type;
    it.aboutLinkObject = !!req.params.relationship;
    it.relationship    = req.params.related || req.params.relationship;

    // Handle HTTP/Conneg.
    it.uri     = req.protocol + "://" + req.get("Host") + req.originalUrl;
    it.method  = req.method.toLowerCase();
    it.accepts = req.headers.accept;

    it.hasBody = hasBody(req);

    if(it.hasBody) {
      let typeParsed = contentType.parse(req);
      let bodyParserOptions = {};

      it.contentType  = typeParsed.type;
      if(typeParsed.parameters.ext) {
        it.ext = typeParsed.parameters.ext.split(",");
      }

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
            reject(err);
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
