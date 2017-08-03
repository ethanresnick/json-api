import qs = require("qs");
import url = require("url");
import deepFreeze = require("deep-freeze");
import contentType = require("content-type");
import getRawBody = require("raw-body");
import { IncomingMessage } from "http";
import APIError from "../types/APIError";
import { Request } from "../types/index";
import APIController from "../controllers/API";
import DocsController from "../controllers/Documentation";

/**
 * This controller is the base for http strategy classes. It's built around
 * the premise that most if not all http frameworks are built on top of the
 * core http module and as such should provide the original IncomingMessage
 * object. This allows the buildRequestObject method to be framework agnostic
 * in it's translation to the json-api Request object.
 *
 * @param {Object} options A set of configuration options.
 *
 * @param {boolean} options.tunnel Whether to turn on PATCH tunneling. See:
 *    http://jsonapi.org/recommendations/#patchless-clients
 *
 * @param {boolean} options.handleContentNegotiation If the JSON API library
 *    can't produce a representation for the response that the client can
 *    `Accept`, should it return 406 or should it hand the request back to
 *    to the framwork so that subsequent handlers can attempt to find an
 *    alternate representation? By default, it does the former.
 */
export default class BaseStrategy {
  protected api: APIController;
  protected docs: DocsController;
  protected config: { handleContentNegotiation: boolean, tunnel: boolean };

  constructor(apiController: APIController, docsController: DocsController, options: object) {
    const defaultOptions = {
      tunnel: false,
      handleContentNegotiation: true
    };

    this.api = apiController;
    this.docs = docsController;
    this.config = Object.assign({}, defaultOptions, options); // apply options
  }

  /**
   * Builds a Request object from an IncomingMessage object. It is not
   * possible to infer the protocol or the url params from the IncomingMessage
   * object alone so they must be passed as arguments. Optionally a query object
   * can be passed, otherwise the query parameters will be inferred from the
   * IncomingMessage url property and parsed using the qs node module.
   *
   * @param {http.IncomingMessage} req original request object from node's http module
   * @param {string} protocol
   * @param {string} host
   * @param {Object} params object containing url parameters. See Request type for details.
   * @param {Object} [query] object containing query parameters
   */
  async buildRequestObject(req: IncomingMessage, protocol: string, host: string, 
    params: Request['frameworkParams'], query?): Promise<Request> {
  
    const contentTypeParsed = contentType.parse(req.headers["content-type"]);
    const uriParsed = url.parse(<string>req.url, false, false);

    const method = (() => {
      const usedMethod = (<string>req.method).toLowerCase();
      const requestedMethod = String(req.headers["x-http-method-override"] || "").toLowerCase();
      
      // Support Verb tunneling, but only for PATCH and only if user turns it on.
      // Turning on any tunneling automatically could be a security issue.
      if(requestedMethod) {
        if(this.config.tunnel && usedMethod === 'post' && requestedMethod === 'patch') {
          return 'patch';
        }
        
        throw new APIError(400, undefined, `Cannot tunnel to the method "${requestedMethod.toUpperCase()}".`);
      }

      return usedMethod;
    })();

    const bodyString: string | undefined = await (() => {
      if(!hasBody(req)) {
        return Promise.resolve(undefined);
      }

      if(!isReadableStream(req)) {
        if(typeof (<any>req).body === 'string') {
          return Promise.resolve(<string>(<any>req).body);
        }
        
        return Promise.reject(
          new APIError(500, undefined, "Request could not be parsed, and no previously parsed body was found.")
        );
      }

      // Handle a client sending multiple content-length headers, 
      // though this is technically an HTTP spec violation.
      const contentLength: string | undefined =
        (Array.isArray(req.headers["content-length"])
          ? (<string[]>req.headers["content-length"])[0]
          : <string | undefined>req.headers["content-length"]);

      return getRawBody(req, {
        encoding: contentTypeParsed.parameters.charset || "utf-8",
        limit: "1mb",
        length: contentLength && !isNaN(<any>contentLength) ? contentLength : null
      })
    })();

    const bodyParsed = (() => {
      // Even though we passed the hasBody check, the body could still be
      // empty, which we want to treat as no body, so we check the length. 
      // (We can't check this before doing getRawBody because, while 
      // Content-Length: 0 signals an empty body, there's no similar 
      // in-advance clue for detecting empty bodies when
      // Transfer-Encoding: chunked is being used.)
      try {
        return !bodyString || bodyString.length === 0 
          ? undefined 
          : JSON.parse(bodyString);
      }
      catch(e) {
        throw new APIError(400, undefined, "Request contains invalid JSON.");
      }
    })();

    // We want to deep freeze the request (as a nice guarantee to offer),
    // but we need to exclude the frameworkReq from that process, as that
    // object must stay mutable. Fastest way to do that is below.
    return <Request>Object.freeze({
      uri: Object.freeze({
        protocol: protocol || ((<any>req.connection).encrypted ? "https" : "http"),
        host,
        pathname: uriParsed.pathname,
        queryParams: query || (uriParsed.query ? qs.parse(uriParsed.query) : {})
      }),
      method,
      body: deepFreeze(bodyParsed),
      headers: Object.freeze({
        contentType: contentTypeParsed,
        accepts: req.headers.accept
      }),
      frameworkParams: Object.freeze(params),
      frameworkReq: req
    });
  }
}

function hasBody(req) {
  return req.headers["transfer-encoding"] !== undefined || !isNaN(req.headers["content-length"]);
}

function isReadableStream(req) {
  return typeof req._readableState === "object" && req._readableState.endEmitted === false;
}
