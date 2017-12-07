import qs = require("qs");
import getRawBody = require("raw-body");
import logger from "../util/logger";
import APIError from "../types/APIError";
import { Request } from "../types/";
import APIController from "../controllers/API";
import DocsController from "../controllers/Documentation";

export type HTTPStrategyOptions = {
  handleContentNegotiation?: boolean,
  tunnel?: boolean,
  host?: string
};

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
 * @param {string} options.host The host that the API is served from, as you'd
 *    find in the HTTP Host header. This value should be provided for security,
 *    as the value in the Host header can be set to something arbitrary by the
 *    client. If you trust the Host header value, though, and don't provide this
 *    option, the value in the Header will be used.
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
  protected config: HTTPStrategyOptions;

  constructor(apiController: APIController, docsController: DocsController, options?: HTTPStrategyOptions) {
    this.api = apiController;
    this.docs = docsController;

    this.config = {
      tunnel: false,
      handleContentNegotiation: true,
      ...options
    };

    if(typeof options === 'object' && options != null && !options.host) {
      logger.warn(
        "Unsafe: missing `host` option in http strategy. This is unsafe " +
        "unless you have reason to trust the (X-Forwarded-)Host header."
      );
    }

  }

  /**
   * Builds a Request object from an IncomingMessage object. It is not
   * possible to infer the protocol or the url params from the IncomingMessage
   * object alone so they must be passed as arguments. Optionally a query object
   * can be passed, otherwise the query parameters will be inferred from the
   * IncomingMessage url property and parsed using the qs node module.
   *
   * @param {http.IncomingMessage} req original request object from core node module http
   * @param {string} protocol
   * @param {string} fallbackHost Host to use if strategy.options.host is not set
   * @param {Object} params object containing url parameters
   * @param {Object} [parsedQuery] object containing pre-parsed query parameters
   */
  protected async buildRequestObject(req, protocol, fallbackHost, params, parsedQuery?): Promise<Request> {
    const queryStartIndex = req.url.indexOf("?");
    const hasQuery = queryStartIndex !== -1;
    const rawQueryString = hasQuery && req.url.substr(queryStartIndex + 1);

    const protocolGuess = protocol || (req.connection.encrypted ? "https" : "http");
    const host = this.config.host || fallbackHost;
    const body = await this.getParsedBodyJSON(req);

    return {
      // Handle route & query params
      queryParams: parsedQuery || (hasQuery && qs.parse(rawQueryString)) || {},
      rawQueryString: rawQueryString || undefined,

      id: params.id,
      type: params.type,
      relationship: params.related || params.relationship,
      aboutRelationship: !!params.relationship,

      // Handle HTTP/Conneg.
      uri: protocolGuess + "://" + host + req.url,
      method: (() => {
        // Support Verb tunneling, but only for PATCH and only if user turns it on.
        // Turning on any tunneling automatically could be a security issue.
        const usedMethod = req.method.toLowerCase();
        const requestedMethod =
          (req.headers["x-http-method-override"] || "").toLowerCase();

        if(this.config.tunnel && usedMethod === "post" && requestedMethod === "patch") {
          return "patch";
        }

        else if(requestedMethod) {
          const msg =
            `Cannot tunnel to the method "${requestedMethod.toUpperCase()}".`;

          throw new APIError(400, undefined, msg);
        }

        return usedMethod;
      })(),
      accepts: req.headers.accept,
      contentType: req.headers["content-type"],

      // handle body
      body
    };
  }

  protected async getParsedBodyJSON(req: any): Promise<string | undefined> {
    if(!hasBody(req)) {
      return undefined;
    }

    if(!isReadableStream(req)) {
      throw new APIError(
        500,
        undefined,
        "Request body could not be parsed. " +
        "Make sure other no other middleware has already parsed the request body."
      );
    }

    // Note: we always treat the encoding as utf-8 because
    // JSON is specified to always be utf-8, and letting the sender specify
    // the encoding we'll parse with (e.g., in req.headers['content-type'])
    // seeems lnike poor security hygiene.
    const bodyParserOptions: (getRawBody.Options & { encoding: string }) = {
      encoding: "utf-8",
      limit: "1mb",
      ...(hasValidContentLength(req)
          ? { length: req.headers["content-length"] }
          : {})
    };

    const bodyString = await getRawBody(req, bodyParserOptions);

    // Even though we passed the hasBody check, the body could still be
    // empty, so we check the length. (We can't check this before doing
    // getRawBody because, while Content-Length: 0 signals an empty body,
    // there's no similar in-advance clue for detecting empty bodies when
    // Transfer-Encoding: chunked is being used.)
    if(bodyString.length === 0) {
      return undefined;
    }

    try {
      return JSON.parse(bodyString);
    } catch (error) {
      throw new APIError(400, undefined, "Request contains invalid JSON.")
    }
  }
}

function hasBody(req) {
  return req.headers["transfer-encoding"] !== undefined || hasValidContentLength(req);
}

function hasValidContentLength(req) {
  // intentionally not using Number.isNaN below to cover undefined case
  return !isNaN(req.headers["content-length"]);
}

function isReadableStream(req) {
  return typeof req._readableState === "object" && req._readableState.endEmitted === false;
}
