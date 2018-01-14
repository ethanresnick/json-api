import templating = require("url-template");
import R = require("ramda");
import {
   Request, FinalizedRequest, Result, HTTPResponse,
   ServerReq, ServerRes,
   Predicate, FieldConstraint,
   UrlTemplateFnsByType, makeDocument
} from "../types";
import Query from "../types/Query/Query";
import ResourceTypeRegistry from '../ResourceTypeRegistry';
import Document, { DocumentData } from "../types/Document";
import APIError from "../types/APIError";
import Data from "../types/Generic/Data";
import Resource from '../types/Resource';
import ResourceIdentifier from "../types/ResourceIdentifier";
import ResourceSet from '../types/ResourceSet';
import ResourceIdentifierSet from "../types/ResourceIdentifierSet";
import Relationship from "../types/Relationship";
import logger from '../util/logger';
import { mapObject } from '../util/type-handling';

import * as requestValidators from "../steps/http/validate-request";
import negotiateContentType from "../steps/http/content-negotiation/negotiate-content-type";
import validateContentType from "../steps/http/content-negotiation/validate-content-type";

import parseRequestPrimary from "../steps/pre-query/parse-request-primary";
import validateRequestDocument from "../steps/pre-query/validate-document";
import validateRequestResources from "../steps/pre-query/validate-resources";
import parseQueryParams from "../steps/pre-query/parse-query-params";
import filterParamParser, { getFilterList } from "../steps/pre-query/filter-param-parser";
import applyTransform, { TransformMode, Extras } from "../steps/apply-transform";

import makeGET from "../steps/make-query/make-get";
import makePOST from "../steps/make-query/make-post";
import makePATCH from "../steps/make-query/make-patch";
import makeDELETE from "../steps/make-query/make-delete";

// Import to export
import { IncomingMessage, ServerResponse } from "http";
import CreateQuery from "../types/Query/CreateQuery";
import FindQuery from "../types/Query/FindQuery";
import UpdateQuery from "../types/Query/UpdateQuery";
import DeleteQuery from "../types/Query/DeleteQuery";
import AddToRelationshipQuery from "../types/Query/AddToRelationshipQuery";
import RemoveFromRelationshipQuery from "../types/Query/RemoveFromRelationshipQuery";
export {
  CreateQuery, FindQuery, UpdateQuery, DeleteQuery,
  AddToRelationshipQuery, RemoveFromRelationshipQuery,
  IncomingMessage, ServerResponse
};

export type ErrOrErrArr = Error | APIError | Error[] | APIError[];

export type APIControllerOpts = {
  filterParser?: filterParamParser
};

export type QueryFactory = (opts: QueryBuildingContext) => Query | Promise<Query>;

export type QueryBuildingContext = {
  request: FinalizedRequest,
  serverReq: ServerReq,
  serverRes: ServerRes,
  transformDocument: (doc: Document, mode: TransformMode) => Promise<Document>,
  registry: ResourceTypeRegistry,
  makeDocument: makeDocument,
  makeQuery: QueryFactory
};

export type RequestOpts = {
  queryFactory?: QueryFactory;
}

export type filterParamParser = (
  legalUnaryOpts: string[],
  legalBinaryOpts: string[],
  rawQuery: string | undefined,
  parsedParams: object
) =>
  (Predicate|FieldConstraint)[] | undefined;

export default class APIController {
  private registry: ResourceTypeRegistry;
  private filterParamParser: filterParamParser;
  private urlTemplateFns: UrlTemplateFnsByType;

  constructor(registry: ResourceTypeRegistry, opts: APIControllerOpts = {}) {
    this.registry = registry;
    this.filterParamParser =
      opts.filterParser || (<any>this.constructor).defaultFilterParamParser;

    this.urlTemplateFns = mapObject(registry.urlTemplates(), (templatesForType) => {
      return mapObject(templatesForType, (it) => templating.parse(it).expand);
    });
  }

  protected makeDoc = (data: DocumentData) =>
    new Document({ urlTemplates: this.urlTemplateFns, ...data });

  protected async finalizeRequest(request: Request): Promise<FinalizedRequest> {
    // Parse any query params to finalize the request object.
    // We might not actually use the parse result to construct our query,
    // so we could (e.g.) put this in a lazily-evaluated getter, but we
    // always have to make it appear like the final params are available
    // in case someone tries to access them in beforeSave or a query transform.
    // If we can't find the adapter for this request, we can't know the valid
    // filter param operators, so we act conservatively to say there are no
    // valid operators. That may lead to some parse errors, but it's probably
    // better than erroring unconditionally (even if no filters are in use).
    const { unaryFilterOperators, binaryFilterOperators } =
      this.registry.hasType(request.type)
        ? this.registry.dbAdapter(request.type).constructor
        : { unaryFilterOperators: [], binaryFilterOperators: [] };

    const finalizedRequest: FinalizedRequest = {
      ...request,
      queryParams: {
        ...parseQueryParams(request.queryParams),
        filter: this.filterParamParser(
          unaryFilterOperators,
          binaryFilterOperators,
          request.rawQueryString,
          request.queryParams
        ),
      },
      document: undefined
    }

    if(request.body !== undefined) {
      const linksJSONToTemplates = (linksJSON) =>
        mapObject(linksJSON || {}, v => () => v);

      const parsedPrimary = await (async () => {
        await validateContentType(request, (<any>this.constructor).supportedExt);
        await validateRequestDocument(request.body);
        return parseRequestPrimary(request.body.data, parseAsLinkage(request));
      })();

      finalizedRequest.document = this.makeDoc({
        primary: parseAsLinkage(request)
          ? (isBulkDelete(request)
              ? ResourceIdentifierSet.of({
                  data: parsedPrimary as Data<ResourceIdentifier>,
                  links: linksJSONToTemplates(request.body.links)
                })
              : Relationship.of({
                  data: parsedPrimary as Data<ResourceIdentifier>,
                  links: linksJSONToTemplates(request.body.links),
                  owner: {
                    type: <string>request.type,
                    id: <string>request.id,
                    path: <string>request.relationship
                  }
                }))
          : ResourceSet.of({
              data: parsedPrimary as Data<Resource>,
              links: linksJSONToTemplates(request.body.links),
            }),
        meta: request.body.meta
      });
    }

    return finalizedRequest;
  }

  /**
   * Makes the default query the library will run, given a finalized request
   * and some options.
   *
   * Note: this function should be pure, including in the sense of not needing
   * access to anything on `this.`, as everything needed to construct the query
   * should be in the same option set that we give user-provided query factory
   * functions.
   *
   * @param {QueryBuildingContext} opts [description]
   */
  public async makeQuery(opts: QueryBuildingContext) {
    const { request } = opts;
    let requestAfterBeforeSave = request;

    // check that a valid method is in use
    // and that, if the body is supposed to be present, it is (or vice-versa).
    // We await these in order to be deterministic about the error message.
    await requestValidators.checkMethod(request);
    await requestValidators.checkBodyExistence(request);

    if(request.document && request.document.primary) {
      // validate the request's resources, if any
      if(!parseAsLinkage(request)) {
        await validateRequestResources(
          request.type,
          (request.document.primary as any)._data as Data<Resource>,
          opts.registry
        );
      }

      // Apply beforeSave. Note: we arguably should be passing the
      // post-beforeSave primary data to the make query functions separately,
      // rather than override the original primary and pass that. But the
      // make query functions are still looking for the transformed data at
      // request.document, so we do this for simplicity. TODO: Should we
      // create ResourceIdentifier's from URL params and transform those too?
      requestAfterBeforeSave = {
        ...request,
        document: await opts.transformDocument(request.document, "beforeSave")
      };
    }

    const baseQuery = await (() => {
      switch(<"get"|"post"|"patch"|"delete">request.method) {
        case "get":
          return makeGET(requestAfterBeforeSave, opts.registry, opts.makeDocument)
        case "post":
          return makePOST(requestAfterBeforeSave, opts.registry, opts.makeDocument)
        case "patch":
          return makePATCH(requestAfterBeforeSave, opts.registry, opts.makeDocument)
        case "delete":
          return makeDELETE(requestAfterBeforeSave, opts.registry, opts.makeDocument)
      }
    })();

    // Apply beforeRender and add default catch
    const origReturning = baseQuery.returning;
    const origCatch = baseQuery.catch || makeResultFromErrors.bind(null, opts.makeDocument);

    const transformResultDocument = async (result: Result) => {
      result.document = result.document &&
        await opts.transformDocument(result.document, "beforeRender");

      return result;
    };

    return baseQuery.resultsIn(
      R.pipe(origReturning, transformResultDocument),
      R.pipe(origCatch, transformResultDocument),
    );
  }

  /**
   * @param {Request} request The Request this controller will use to generate
   *    the HTTPResponse.
   * @param {ServerReq} serverReq This should be the request object generated
   *    by the server framework that you're using. But, really, it can be
   *    absolutely anything, as this controller won't use it for anything except
   *    passing it to user-provided functions that it calls (like transforms).
   * @param {ServerRes} serverRes Theoretically, the response objcet generated
   *     by your http framework but, like with frameworkReq, it can be anything.
   */
  public handle = async (
    request: Request,
    serverReq: ServerReq,
    serverRes: ServerRes,
    opts: RequestOpts = {}
  ) => {
    let contentType: string | undefined;
    let jsonAPIResult: Result = {};

    // Kick off the chain for generating the response.
    try {
      // Attempt to negotiate the content type. Will be json-api, or standard
      // application/json if that's all the client supports, or will error.
      // Better to do this early so we exit fast if the client can't support anything.
      logger.info('Negotiating response content-type');
      contentType =
        await negotiateContentType(request.accepts, ["application/vnd.api+json"])

      logger.info('Parsing request body/query parameters');
      const finalizedRequest = await this.finalizeRequest(request);

      // Actually fulfill the request!
      const queryFactory = opts.queryFactory || this.makeQuery;

      const transformExtras = {
        request: finalizedRequest,
        registry: this.registry,
        serverReq,
        serverRes
      };

      logger.info('Creating request query');
      const query = await queryFactory({
        ...transformExtras,
        makeDocument: this.makeDoc, // already this bound.
        transformDocument: R.partialRight(transformDoc, [transformExtras]),
        makeQuery: this.makeQuery
      });

      // If the type in the request hasn't been registered,
      // we can't look up it's adapter to run the query, so we 404.
      if(!this.registry.hasType(query.type)) {
        throw new APIError(404, undefined, `${request.type} is not a valid type.`);
      }

      logger.info('Executing request query');
      const adapter = this.registry.dbAdapter(query.type);
      jsonAPIResult =
        await adapter.doQuery(query).then(query.returning, query.catch);

      // add top level self link pre send.
      if(jsonAPIResult.document && jsonAPIResult.document.primary) {
        jsonAPIResult.document.primary.links = {
          "self": () => request.uri,
          ...jsonAPIResult.document.primary.links
        };
      }
    }

    // If any errors occurred, convert them to a Response. Might be needed if,
    // e.g., the error was unexpected (and so uncaught and not transformed) in
    // one of prior steps or the user couldn't throw an APIError for
    // compatibility with other code.
    catch (err) {
      logger.warn("API Controller caught error", err, err.stack);
      jsonAPIResult = makeResultFromErrors(this.makeDoc, err);
    }

    // Convert jsonApiResponse to httpResponse. Atm, this is simply about
    // copying over a couple properties. In the future, though, one HTTP request
    // might generate multiple queries, and then multiple jsonAPIResponses,
    // which would be merged into a single HTTP Response.
    logger.info('Creating HTTPResponse');
    return resultToHTTPResponse(jsonAPIResult, contentType);
  }

  /**
   * Builds a response from errors. Allows errors that occur outside of the
   * library to be handled and returned in JSON API-compiant fashion.
   *
   * @param {ErrOrErrArr} errors Error or array of errors
   * @param {string} requestAccepts Request's Accepts header
   */
  static async responseFromError(errors: ErrOrErrArr, requestAccepts) {
    return this.responseFromResult(
      makeResultFromErrors((data: DocumentData) => new Document(data), errors),
      requestAccepts,
      false
    );
  }

  /**
   * Produces an HTTPResponse object from a JSON:API Result.
   * This is useful when you produce the result from outside the library,
   * rather than as the product of running a Query.
   *
   * @param {Result} result The result to send
   * @param {string} reqAccepts The `Accept` header of the user's request
   * @param {boolean= true} allow406 If no acceptable Content-Type can be
   *   negotiated given reqAccets, whether to send a 406 and replace the
   *   body of the resulting HTTPResponse with a 406 error message, or
   *   whether to ignore the user's `Accept` and send the result as is
   *   with Content-Type: application/vnd.api+json.
   * @returns {HTTPResponse}
   */
  static async responseFromResult(
    result: Result,
    reqAccepts?: string,
    allow406: boolean = true
  ) {
    let contentType: string;

    try {
      contentType = await negotiateContentType(reqAccepts, ["application/vnd.api+json"]);
      return resultToHTTPResponse(result, contentType);
    }

    catch (e) {
      // If we allow406, replace result with the 406 error message.
      const finalResult = allow406
        ? makeResultFromErrors((data: DocumentData) => new Document(data), e)
        : result;

      return resultToHTTPResponse(finalResult, "application/vnd.api+json");
    }
  }

  public static supportedExt = Object.freeze([]);

  static defaultFilterParamParser(legalUnary, legalBinary, rawQuery, params) {
    return getFilterList(rawQuery)
      .map(it => filterParamParser(legalUnary, legalBinary, it))
      .getOrDefault(undefined)
  }
}


/**
 * Creates a JSON:API Result from an error or array of errors.
 */
function makeResultFromErrors(makeDoc: makeDocument, errors: ErrOrErrArr): Result {
  const errorsArray =
    (Array.isArray(errors) ? errors : [errors])
      .map(<(v: any) => APIError>APIError.fromError.bind(APIError));

  const status = pickStatus(errorsArray.map((v) => Number(v.status)));

  return {
    document: makeDoc({ errors: errorsArray }),
    status
  };
}

function resultToHTTPResponse(response: Result, negotiatedMediaType?: string): HTTPResponse {
  const status = (() => {
    if(response.status) {
      return response.status;
    }

    if(response.document) {
      return response.document.errors
        ? pickStatus(response.document.errors.map(it => Number(it.status)))
        : 200
    }

    return 204;
  })();

  const headers = {
    // If we have a body, our bodies are always JSON:API, so we force that
    // as the Content-Type if nothing else (i.e., not even standard json)
    // could be negotiated.
    ...(status !== 204
      ? { 'content-type': negotiatedMediaType || "application/vnd.api+json" }
      : { }
    ),

    // No matter what, though, we're varying on Accept. See:
    // https://github.com/ethanresnick/json-api/issues/22
    'vary': 'Accept',

    ...response.headers
  };

  return {
    status,
    headers,
    body: response.document && response.document.toString()
  };
}

/**
 * Returns the status code that best represents a set of error statuses.
 */
function pickStatus(errStatuses) {
  return errStatuses[0];
}

function isBulkDelete(request: Request) {
  return request.method === "delete" && !request.id && !request.aboutRelationship;
}

function parseAsLinkage(request: Request) {
  return request.aboutRelationship || isBulkDelete(request);
}

async function transformDoc(doc: Document, mode: TransformMode, extras: Extras) {
  // Create Data, or read private internal Data if it exists, and transform it.
  const res = doc.clone();
  const primaryData = res.primary && (<any>res.primary)._data;
  const includedData = doc.included && Data.of(doc.included);

  if(primaryData) {
    (<any>res.primary)._data =
      await applyTransform(primaryData, mode, extras);
  }

  if(includedData) {
    res.included =
      (await applyTransform(includedData, mode, extras)).values;
  }

  return res;
}
