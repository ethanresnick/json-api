import vary from "vary";
import API from "../controllers/API";
import Base from "./Base";

/**
 * This controller receives requests directly from Koa and sends responses
 * directly through it, but it converts incoming requests to, and generates
 * responses, from Request and Response objects that are defined by this
 * framework in a way that's not particular to Koa. This controller thereby
 * acts as a translation-layer between Koa and the rest of this json-api
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
 *    Koa (i.e. yield next) so that subsequent handlers can attempt to
 *    find an alternate representation? By default, it does the former. But you
 *    can set this option to false to have this code just pass on to Koa.
 */
export default class KoaStrategy extends Base {
  constructor(apiController, docsController, options) {
    super(apiController, docsController, options);
  }

  // For requests like GET /:type, GET /:type/:id/:relationship,
  // POST /:type PATCH /:type/:id, PATCH /:type, DELETE /:type/:idOrLabel,
  // DELETE /:type, GET /:type/:id/links/:relationship,
  // PATCH /:type/:id/links/:relationship, POST /:type/:id/links/:relationship,
  // and DELETE /:type/:id/links/:relationship.
  apiRequest() {
    const strategy = this;
    return function *(next){
      const ctx = this;
      try {
        const reqObj = yield strategy.buildRequestObject(ctx.req, ctx.protocol, ctx.host, ctx.params);
        const resObj = yield strategy.api.handle(reqObj, ctx.request, ctx.response);
        const delegate406Handling = strategy.sendResources(resObj, ctx);
        if(delegate406Handling){
          yield next;
        }
      }
      catch (err) {
        strategy.sendError(err, this);
      }
    };
  }

  // For requests for the documentation.
  docsRequest() {
    const strategy = this;
    return function *(next){
      const ctx = this;
      try {
        const reqObj = yield strategy.buildRequestObject(ctx.req, ctx.protocol, ctx.host, ctx.params);
        const resObj = yield strategy.docs.handle(reqObj, ctx.request, ctx.response);
        const delegate406Handling = strategy.sendResources(resObj, ctx);
        if(delegate406Handling){
          yield next;
        }
      }
      catch (err) {
        strategy.sendError(err, this);
      }
    };
  }

  sendResources(responseObject, ctx): void | true {
    if(responseObject.headers.vary) {
      vary(ctx.res, responseObject.headers.vary);
    }

    if(responseObject.status === 406 && !this.config.handleContentNegotiation) {
      return true;
    }

    ctx.set("Content-Type", responseObject.contentType);
    ctx.status = responseObject.status || 200;

    if(responseObject.headers.location) {
      ctx.set("Location", responseObject.headers.location);
    }

    if(responseObject.body !== null) {
      ctx.body = new Buffer(responseObject.body);
    }
  }

  /**
   * A user of this library may wish to send an error response for an exception
   * that originated outside of the JSON API Pipeline and that's outside the
   * main spec's scope (e.g. an authentication error). So, the controller
   * exposes this method which allows them to do that.
   *
   * @param {Error|APIError|Error[]|APIError[]} errors Error or array of errors
   * @param {Object} ctx Koa's context object
   */
  sendError(errors, ctx) {
    API.responseFromExternalError(errors, ctx.headers.accept).then(
      (responseObject) => this.sendResources(responseObject, ctx)
    ).catch((err) => {
      // if we hit an error generating our error...
      ctx.throw(err.message, err.status);
    });
  }
}
