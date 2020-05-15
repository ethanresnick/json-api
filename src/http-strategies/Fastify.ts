import varyLib = require("vary");
import Base, { Controller, HTTPStrategyOptions } from "./Base";
import { HTTPResponse } from "../types";

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
export default class FastifyStrategy extends Base {
  constructor(apiController, docsController?, options?: HTTPStrategyOptions) {
    super(apiController, docsController, options);
  }

  get apiRequest() {
    return this._apiRequest(this.api.handle);
  }

  _apiRequest = (controller: Controller) => {
    const strategy = this; // tslint:disable-line no-this-assignment

    return async function(request, reply) {
      const protocol = request.raw.connection['encrypted'] === true ? 'https' : 'http';

      const requestObj = await strategy.buildRequestObject(request.raw, protocol, request.raw.hostname, request.params, request.query);
      const responseObj = await controller(requestObj, request, reply);

      reply.serializer((data) => data);
        
      return strategy.sendResponse(responseObj, reply);
    }
  }

// For requests for the documentation.
  get docsRequest() {
    if (this.docs == null) {
      throw new Error('Cannot get docs request handler. '
        + 'No docs controller was provided to the HTTP strategy.');
    }

    return this._doRequest(this.docs.handle);
  }

  _doRequest = (controller: Controller) => {
    const strategy = this; // tslint:disable-line no-this-assignment

    return async function(request, reply) {
      const protocol = request.raw.connection['encrypted'] === true ? 'https' : 'http';

      const requestObj = await strategy.buildRequestObject(request.raw, protocol, request.raw.hostname, request.params, request.query);
      const responseObj = await controller(requestObj, request, reply);

      return strategy.sendResponse(responseObj, reply);
    }
  }

  protected sendResponse(
    response: HTTPResponse,
    reply: any,
  ) {
    return new Promise((resolve, reject) => {
      try {
        const { vary, ...otherHeaders } = response.headers;
        const { res } = reply;
    
        if(vary) {
          varyLib(res, vary);
        }
    
        if(response.status === 406 && !this.config.handleContentNegotiation) {
          reject();
          return;
        }
    
        reply.status(response.status || 200);
    
        Object.keys(otherHeaders).forEach(k => {
          reply.header(k, otherHeaders[k]);
        });
    
        if(response.body !== undefined) {
          reply.send(response.body);
        }

        resolve();
      }
      catch { reject(); }
    });
  }
}
