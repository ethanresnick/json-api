import varyLib = require("vary");
import depd = require('depd')
import R = require('ramda');
import logger from '../util/logger';
import API, { RequestOpts, QueryBuildingContext } from "../controllers/API";
import Base, { HTTPStrategyOptions, Controller } from "./Base";
import Query from "../types/Query/Query";
import { HTTPResponse, Request as JSONAPIRequest, Result } from "../types";
import { Request, Response, NextFunction } from "express";
const deprecate = depd("json-api");

// Note: however, having one object type with both possible callback signatures
// in it doesn't work, but splitting these function signatures into separate
// types, and then unioning those types, does. Seems like they should be the
// same, but whatever works. Possibly, the difference comes from the limitation
// identified in https://github.com/Microsoft/TypeScript/issues/7294. Still,
// this behavior is probably subject to change (e.g., might be effected by
// https://github.com/Microsoft/TypeScript/pull/17819). However, it's the
// approach that the express typings seem to use, so I imagine it's safe enough.
export type DeprecatedQueryTransformNoReq = {
  (first: Query): Query;
};

export type DeprecatedQueryTransformWithReq = {
  (first: Request, second: Query): Query
}

export type DeprecatedQueryTransform =
  DeprecatedQueryTransformNoReq | DeprecatedQueryTransformWithReq;

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

  protected buildRequestObject(req: Request): Promise<JSONAPIRequest> {
    return super.buildRequestObject(req, req.protocol, req.host, req.params, req.query)
  }

  protected sendResponse(response: HTTPResponse, res: Response, next: NextFunction) {
    const { vary, ...otherHeaders } = response.headers;

    if(vary) {
      varyLib(res, vary);
    }

    if(response.status === 406 && !this.config.handleContentNegotiation) {
      return next();
    }

    res.status(response.status || 200);

    Object.keys(otherHeaders).forEach(k => {
      res.set(k, otherHeaders[k]);
    })

    if(response.body !== undefined) {
      res.send(new Buffer(response.body)).end();
    }

    else {
      res.end();
    }
  }

  protected doRequest = async (
    controller: Controller,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const requestObj = await this.buildRequestObject(req);
      const responseObj = await controller(requestObj, req, res);
      this.sendResponse(responseObj, res, next);
    }
    catch (err) {
      // This case should only occur if building a request object fails, as the
      // controller should catch any internal errors and always returns a response.
      this.sendError(err, req, res, next);
    }
  }

  /**
   * A middleware to handle requests for the documentation.
   * Note: this will ignore any port number if you're using Express 4.
   * See: https://expressjs.com/en/guide/migrating-5.html#req.host
   * The workaround is to use the host configuration option.
   */
  docsRequest = R.partial(this.doRequest, [this.docs.handle]);

  /**
   * A middleware to handle supported API requests.
   *
   * Supported requests included: GET /:type, GET /:type/:id/:relationship,
   * POST /:type, PATCH /:type/:id, PATCH /:type, DELETE /:type/:id,
   * DELETE /:type, GET /:type/:id/relationships/:relationship,
   * PATCH /:type/:id/relationships/:relationship,
   * POST /:type/:id/relationships/:relationship, and
   * DELETE /:type/:id/relationships/:relationship.
   *
   * Note: this will ignore any port number if you're using Express 4.
   * See: https://expressjs.com/en/guide/migrating-5.html#req.host
   * The workaround is to use the host configuration option.
   */
  apiRequest = R.partial(this.doRequest, [this.api.handle]);

  /**
   * Takes arguments for how to build the query, and returns a middleware
   * function that will respond to incoming requests with those query settings.
   *
   * @param {RequestCustomizationOpts} opts
   * @returns {RequestHandler} A middleware for fulfilling API requests.
   */
  customAPIRequest = (opts: RequestOpts) =>
    R.partial(this.doRequest, [
      (request, req, res) => this.api.handle(request, req, res, opts)
    ]);

  transformedAPIRequest = (queryTransform: DeprecatedQueryTransform) => {
    deprecate('transformedAPIRequest: use customAPIRequest instead.');

    return this.customAPIRequest({
      queryFactory: async (opts: QueryBuildingContext) => {
        const req = opts.serverReq as Request;
        const query = await this.api.makeQuery(opts);
        return queryTransform.length > 1
          ? (queryTransform as DeprecatedQueryTransformWithReq)(req, query)
          : (queryTransform as DeprecatedQueryTransformNoReq)(query);
      }
    });
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
  sendError = async (errors, req, res, next) => {
    if(!next) {
      deprecate("sendError with 3 arguments: must now provide next function.");
      next = (err: any) => {}
    }

    try {
      const responseObj = await API.responseFromError(errors, req.headers.accept);
      this.sendResponse(responseObj, res, next)
    }

    catch(err) {
      logger.warn("Hit an unexpected error creating or sending response. This shouldn't happen.");
      next(err);
    }
  }

  sendResult = async (result: Result, req, res, next) => {
    try {
      const responseObj = await API.responseFromResult(result, req.headers.accept, true);
      this.sendResponse(responseObj, res, next)
    }

    catch(err) {
      logger.warn("Hit an unexpected error creating or sending response. This shouldn't happen.");
      next(err);
    }
  }

  /**
   * @TODO Uses this ExpressStrategy to create an express app with
   * preconfigured routes that can be mounted as a subapp.
  toApp(typesToExcludedMethods) {
  }
  */
}
