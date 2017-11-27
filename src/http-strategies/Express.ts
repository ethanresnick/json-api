import varyLib = require("vary");
import API from "../controllers/API";
import Base, { HTTPStrategyOptions } from "./Base";
import Query from "../types/Query/Query";
import { Request } from "express";

// Note: however, having one object type with both possible callback signatures
// in it doesn't work, but splitting these function signatures into separate
// types, and then unioning those types, does. Seems like they should be the
// same, but whatever works. Possibly, the difference comes from the limitation
// identified in https://github.com/Microsoft/TypeScript/issues/7294. Still,
// this behavior is probably subject to change (e.g., might be effected by
// https://github.com/Microsoft/TypeScript/pull/17819). However, it's the
// approach that the express typings seem to use, so I imagine it's safe enough.
export type QueryTransformCurried = {
  (first: Query): Query;
};

export type QueryTransformWithReq = {
  (first: Request, second: Query): Query
}

export type QueryTransform =
  QueryTransformCurried | QueryTransformWithReq;

/**
 * This controller receives requests directly from express and sends responses
 * directly through it, but it converts incoming requests to, and generates
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
 * @param {string} options.host The host that the API is served from, as you'd
 *    find in the HTTP Host header. This value should be provided for security,
 *    as the value in the Host header can be set to something arbitrary by the
 *    client. If you trust the Host header value, though, and don't provide this
 *    option, the value in the Header will be used.
 *
 * @param {boolean} options.handleContentNegotiation If the JSON API library
 *    can't produce a representation for the response that the client can
 *    `Accept`, should it return 406 or should it hand the request back to
 *    Express (i.e. call next()) so that subsequent handlers can attempt to
 *    find an alternate representation? By default, it does the former. But you
 *    can set this option to false to have this code just pass on to Express.
 */
export default class ExpressStrategy extends Base {
  constructor(apiController, docsController, options?: HTTPStrategyOptions) {
    super(apiController, docsController, options);
  }

  // For requests for the documentation.
  // Note: this will ignore any port number if you're using Express 4.
  // See: https://expressjs.com/en/guide/migrating-5.html#req.host
  // The workaround is to use the host configuration option.
  docsRequest(req, res, next) {
    this.buildRequestObject(req, req.protocol, req.host, req.params, req.query).then((requestObject) => {
      return this.docs.handle(requestObject, req, res).then((responseObject) => {
        this.sendResources(responseObject, res, next);
      });
    }).catch((err) => {
      this.sendError(err, req, res);
    });
  }

  sendResources(responseObject, res, next) {
    const { vary, ...otherHeaders } = responseObject.headers;

    if(vary) {
      varyLib(res, vary);
    }

    if(responseObject.status === 406 && !this.config.handleContentNegotiation) {
      return next();
    }

    res.status(responseObject.status || 200);

    Object.keys(otherHeaders).forEach(k => {
      res.set(k, otherHeaders[k]);
    })

    if(responseObject.body !== undefined) {
      res.send(new Buffer(responseObject.body)).end();
    }

    else {
      res.end();
    }
  }

  /**
   * A user of this library may wish to send an error response for an exception
   * that originated outside of the JSON API Pipeline and that's outside the
   * main spec's scope (e.g. an authentication error). So, the controller
   * exposes this method which allows them to do that.
   *
   * @param {Error|APIError|Error[]|APIError[]} errors Error or array of errors
   * @param {Object} req Express's request object
   * @param {Object} res Express's response object
   */
  sendError(errors, req, res) {
    API.responseFromExternalError(errors, req.headers.accept).then(
      (responseObject) => this.sendResources(responseObject, res, () => {})
    ).catch((err) => {
      // if we hit an error generating our error...
      res.status(err.status).send(err.message);
    });
  }

  apiRequest(req, res, next) {
    return this.apiRequestWithTransform(undefined, req, res, next);
  }

  transformedAPIRequest(queryTransform: QueryTransform) {
    return this.apiRequestWithTransform.bind(this, queryTransform);
  }

  // For requests like GET /:type, GET /:type/:id/:relationship,
  // POST /:type PATCH /:type/:id, PATCH /:type, DELETE /:type/:idOrLabel,
  // DELETE /:type, GET /:type/:id/links/:relationship,
  // PATCH /:type/:id/links/:relationship, POST /:type/:id/links/:relationship,
  // and DELETE /:type/:id/links/:relationship.
  // Note: this will ignore any port number if you're using Express 4.
  // See: https://expressjs.com/en/guide/migrating-5.html#req.host
  // The workaround is to use the host configuration option.
  private apiRequestWithTransform(queryTransform, req, res, next) {
    // Support query transform functions where the query is the only argument,
    // but also ones that expect (req, query).
    queryTransform = queryTransform && queryTransform.length > 1
      ? queryTransform.bind(undefined, req)
      : queryTransform;

    this.buildRequestObject(req, req.protocol, req.host, req.params, req.query).then((requestObject) => {
      return this.api.handle(requestObject, req, res, queryTransform).then((responseObject) => {
        this.sendResources(responseObject, res, next);
      });
    }).catch((err) => {
      this.sendError(err, req, res);
    });
  }
  /**
   * @TODO Uses this ExpressStrategy to create an express app with
   * preconfigured routes that can be mounted as a subapp.
  toApp(typesToExcludedMethods) {
  }
  */
}
