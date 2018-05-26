import R = require("ramda");
import {
   Request, FinalizedRequest, Result, HTTPResponse,
   ServerReq, ServerRes,
   ParsedFilterParam,
   ParsedSortParam,
   makeDocument,
   ErrorOrErrorArray,
   SupportedOperators,
   FinalizedSupportedOperators,
   ParserOperatorsConfig
} from "../types";
import ResourceTypeRegistry from "../ResourceTypeRegistry";
import Document, { DocumentData, DocTransformFn } from "../types/Document";
import APIError from "../types/APIError";
import Data from "../types/Generic/Data";
import Resource from "../types/Resource";
import ResourceIdentifier from "../types/ResourceIdentifier";
import ResourceSet from "../types/ResourceSet";
import ResourceIdentifierSet from "../types/ResourceIdentifierSet";
import Relationship from "../types/Relationship";
import * as Errors from '../util/errors';
import logger from "../util/logger";

import * as requestValidators from "../steps/http/validate-request";
import negotiateContentType from "../steps/http/content-negotiation/negotiate-content-type";
import validateContentType from "../steps/http/content-negotiation/validate-content-type";

import finalizeOperatorConfig from '../steps/pre-query/finalize-operator-definitions';
import { getQueryParamValue } from '../util/query-parsing';
import parseQueryParams, { parseFilter, parseSort } from '../steps/pre-query/parse-query-params';
import parseRequestPrimary from "../steps/pre-query/parse-request-primary";
import setTypePaths from "../steps/set-type-paths";
import validateRequestDocument from "../steps/pre-query/validate-document";
import validateRequestResourceTypes from "../steps/pre-query/validate-resource-types";
import validateRequestResourceIds from "../steps/pre-query/validate-resource-ids";
import validateRequestResourceData from "../steps/pre-query/validate-resource-data";
import makeTransformFunction, { TransformMode, Transformable } from "../steps/make-transform-fn";
import runQuery, { RunnableQuery, QueryReturning } from '../steps/run-query';

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

export type APIControllerOpts = {
  filterParser?: customParamParser<ParsedFilterParam>;
  sortParser?: customParamParser<ParsedSortParam>;
};

export type customParamParser<T> = (
  supportedOperators: ParserOperatorsConfig,
  rawQuery: string | undefined,
  parsedParams: object,
  target: { method: string, uri: string }
) => T | undefined;

export type QueryFactory = (opts: QueryBuildingContext) => RunnableQuery | Promise<RunnableQuery>;

export type ResultFactory = (
  opts: ResultBuildingContext,
  customQueryFactory?: QueryFactory
) => Result | Promise<Result>;

export type QueryBuildingContext<T = Resource | ResourceIdentifier> = {
  request: FinalizedRequest;
  serverReq: ServerReq;
  serverRes: ServerRes;
  beforeSave: DocTransformFn<T>;
  beforeRender: DocTransformFn<T>;
  transformDocument(doc: Document, modeOrFn: TransformMode | DocTransformFn<T>): Promise<Document>;
  setTypePaths(
    it: (Resource | ResourceIdentifier)[],
    useInputData: boolean,
    requiredThroughType?: string
  ): Promise<void>;
  registry: ResourceTypeRegistry;
  makeDocument: makeDocument;
  makeQuery: QueryFactory;
  runQuery<T extends RunnableQuery>(q: T): Promise<QueryReturning<T>>;
};

export type ResultBuildingContext = QueryBuildingContext;

// Note: having one object type with both possible callback signatures
// in it doesn't work, but splitting these function signatures into separate
// types, and then unioning those types, does. Seems like they should be the
// same, but whatever works. Possibly, the difference comes from the limitation
// identified in https://github.com/Microsoft/TypeScript/issues/7294. Still,
// this behavior is probably subject to change (e.g., might be effected by
// https://github.com/Microsoft/TypeScript/pull/17819). However, it's the
// approach that the express typings seem to use, so I imagine it's safe enough.
export type QueryTransformNoReq = {
  // tslint:disable-next-line callable-types
  (first: RunnableQuery): RunnableQuery;
};

export type QueryTransformWithReq = {
  // tslint:disable-next-line callable-types
  (first: ServerReq, second: RunnableQuery): RunnableQuery;
};

export type RequestOpts = {
  queryTransform?: QueryTransformNoReq | QueryTransformWithReq
  queryFactory?: QueryFactory;
  resultFactory?: ResultFactory;
  supportedOperators?: SupportedOperators
};

export default class APIController {
  private registry: ResourceTypeRegistry;
  private filterParamParser: Exclude<APIControllerOpts["filterParser"], undefined>;
  private sortParamParser: Exclude<APIControllerOpts["sortParser"], undefined>;

  constructor(registry: ResourceTypeRegistry, opts: APIControllerOpts = {}) {
    this.registry = registry;
    this.filterParamParser = opts.filterParser || defaultFilterParamParser;
    this.sortParamParser = opts.sortParser || defaultSortParamParser;
  }

  protected makeDoc = (data: DocumentData) => {
    const errorsConfig = this.registry.errorsConfig();
    return new Document({
      urlTemplates: this.registry.urlTemplates(),
      errorUrlTemplates: errorsConfig && errorsConfig.urlTemplates,
      ...data
    });
  };

  protected async finalizeRequest(
    request: Request,
    supportedOperators: SupportedOperators
  ): Promise<FinalizedRequest> {
    // Handle query parsing errors in the same manner, whether they're thrown
    // by our built-in parsers or the user's custom parser.
    const guardedQueryParamParse = (
      parser: customParamParser<any>,
      paramName: string,
      thisParamFinalizedOps: ParserOperatorsConfig
    ) => {
      try {
        return parser(
          thisParamFinalizedOps,
          request.rawQueryString,
          request.queryParams,
          { method: request.method, uri: request.uri }
        );
      } catch (e) {
        throw Errors.invalidQueryParamValue({
          detail: `Invalid ${paramName} syntax: ${e.message} See jsonapi.js.org for details.`,
          source: { parameter: paramName }
        });
      }
    }

    // Finalize (i.e., fill in the defaults) for our operator descriptions
    // before passing them to the parser.
    const finalizedSupportedOperators =
      Object.keys(supportedOperators).reduce((acc, operatorName) => {
        const operatorConfig =
          // tslint:disable-next-line no-non-null-assertion
          finalizeOperatorConfig(operatorName, supportedOperators[operatorName]!);

        operatorConfig.legalIn.forEach(key => {
          acc[key][operatorName] = operatorConfig;
        });

        return acc;
      }, {
        filter: {} as FinalizedSupportedOperators,
        sort: {} as FinalizedSupportedOperators
      });

    // Parse any query params to finalize the request object.
    // We might not actually use the parse result to construct our query,
    // so we could (e.g.) put this in a lazily-evaluated getter, but we
    // always have to make it appear like the final params are available
    // in case someone tries to access them in beforeSave or a query factory.
    const finalizedRequest: FinalizedRequest = {
      ...request,
      queryParams: {
        ...parseQueryParams(request.queryParams),
        filter: guardedQueryParamParse(
          this.filterParamParser,
          "filter",
          finalizedSupportedOperators.filter
        ),
        sort: guardedQueryParamParse(
          this.sortParamParser,
          "sort",
          finalizedSupportedOperators.sort
        )
      },
      document: undefined
    };

    if(request.body !== undefined) {
      const parsedPrimary = await (async () => {
        await validateContentType(request, (<any>this.constructor).supportedExt);
        await validateRequestDocument(request.body);
        return parseRequestPrimary(request.body.data, parseAsLinkage(request));
      })();

      finalizedRequest.document = this.makeDoc({
        primary: parseAsLinkage(request)
          ? (isBulkDelete(request)
              ? ResourceIdentifierSet.of({
                  data: parsedPrimary as Data<ResourceIdentifier>
                })
              : Relationship.of({
                  data: parsedPrimary as Data<ResourceIdentifier>,
                  owner: {
                    type: <string>request.type,
                    id: <string>request.id,
                    path: <string>request.relationship
                  }
                }))
          : ResourceSet.of({
              data: parsedPrimary as Data<Resource>
            }),
        meta: request.body.meta
      });
    }

    return finalizedRequest;
  }

  /**
   * This returns the default set of supported operators for this request,
   * by looking them up from the adapter, iff we can find the adapter
   * for this request.
   */
  private getSupportedOperators(request: Request) {
    // If we can't find the adapter for this request, because the type hasn't
    // been registered, we can't know the valid filter/sort param operators,
    // so we act conservatively to say there are none. That may lead to some
    // parse errors, but it's probably better than erroring unconditionally
    // (even if no filters are in use).
    const typeDesc = this.registry.type(request.type);

    if(!typeDesc) {
      return { filter: {}, sort: {} };
    }

    return (typeDesc.dbAdapter.constructor.supportedOperators || {}) as SupportedOperators;
  }

  /**
   * Makes the default query the library will run, given some options
   * (including, naturally, the finalized request).
   *
   * @param {QueryBuildingContext} opts [description]
   */
  public async makeQuery(opts: QueryBuildingContext) {
    const { request } = opts;
    let requestAfterBeforeSave = request;

    // check that a valid method is in use
    // and that, if the body is supposed to be present, it is (or vice-versa).
    // We await these in order to be deterministic about the error message.
    // TODO: It might be slightly preferable to do the body existence check
    // in each of the makeQuery functions, when we're actually trying to use
    // the parsed body.
    await requestValidators.checkMethod(request);
    await requestValidators.checkBodyExistence(request);

    if(request.document && request.document.primary) {
      if(!parseAsLinkage(request)) {
        // We're assuming, for some of the calls below, that we'll only get
        // full resources on a patch (an update) or a post (for create) request.
        // If that's not true somehow, throw now so we don't run into trouble
        // with letting users set types they shouldn't be able to.
        if(!['post', 'patch'].includes(request.method)) {
          throw new Error("Unexpected method.");
        }

        await validateRequestResourceTypes(
          request.type,
          request.document.primary as ResourceSet,
          opts.registry
        );

        // If we're dealing with an update, ensure all provided resources
        // to patch have `id` keys. This must be guaranteed before we use
        // setResourceTypesList and tell it to look up the type/id in the db.
        // This is already ensured on bulk delete by basic linkage parsing rules.
        if(request.method === 'patch') {
          await validateRequestResourceIds(request.document.primary as ResourceSet);
        }

        // See comment at top of steps/set-type-paths for details.
        // Note: this call mutates reource objects in request.document
        // and can throw if user-provided types in `meta.types` are invalid
        // (on create) or are present when they shouldn't be (on update).
        await opts.setTypePaths(
          request.document.getContents(),
          request.method === "post",
          request.type
        );

        // Apply some minimal validation the data in the resource patch/creation,
        // only after we've set the type path (so we can find the right model to
        // validate with).
        validateRequestResourceData(
          request.document.primary as ResourceSet,
          opts.registry
        );
      }

      // On bulk deletes, we don't set the typePath (that's unnecessary overhead),
      // but we should verify that the resources the identifiers are refering to
      // are using the right json-api `type` key.
      if(isBulkDelete(request)) {
        await validateRequestResourceTypes(
          request.type,
          request.document.primary as ResourceSet,
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

    const baseQuery = await (async () => {
      switch(<"get" | "post" | "patch" | "delete">request.method) {
        case "get":
          return makeGET(requestAfterBeforeSave, opts.registry, opts.makeDocument)
        case "post":
          return makePOST(requestAfterBeforeSave, opts.registry, opts.makeDocument)
        case "patch":
          return makePATCH(requestAfterBeforeSave, opts.registry, opts.makeDocument)
        case "delete":
          return makeDELETE(requestAfterBeforeSave, opts.registry, opts.makeDocument)
        default:
          // Should never run because we validate the method above.
          throw new Error("Unknown/unexpected method.");
      }
    })();

    // Apply beforeRender and add default catch
    const origReturning = baseQuery.returning;
    const origCatch =
      baseQuery.catch || makeResultFromErrors.bind(null, opts.makeDocument);

    const transformResultDocument = async (result: Result) => {
      result.document = result.document &&
        await opts.transformDocument(result.document, "beforeRender");

      return result;
    };

    // TODO: remove R as any casts when there are available typings for R.pipeP.
    return baseQuery.resultsIn(
      (R as any).pipeP(
        R.pipe(
          origReturning,
          Promise.resolve.bind(Promise) as typeof Promise.resolve
        ),
        transformResultDocument
      ),
      (R as any).pipeP(
        R.pipe(
          origCatch,
          Promise.resolve.bind(Promise) as typeof Promise.resolve
        ),
        transformResultDocument
      )
    );
  }

  /**
   * Runs a query, using the appropriate adapter and after validating it.
   *
   * Note: can't use partial application below because this.registry isn't set
   * yet (at least in the TS polyfill) at the point when this initializer runs.
   */
  public runQuery: <T extends RunnableQuery>(q: T) => Promise<QueryReturning<T>> =
    <T extends RunnableQuery>(query: T) => runQuery(this.registry, query)

  /**
   * Makes the result the library will ultimately return.
   *
   * Note: this function should construct/run the query using only resources
   * that we also expose, through the same options object, to user-provided
   * result factory functions.
   *
   * @param {QueryBuildingContext} opts [description]
   */
  public async makeResult(
    opts: ResultBuildingContext,
    customQueryFactory?: QueryFactory
  ) {
    try {
      // Actually fulfill the request!
      // Use the custom query factory or the library's built-in one.
      // tslint:disable-next-line no-unbound-method
      const queryFactory = customQueryFactory || opts.makeQuery;

      logger.info("Creating request query");
      const query = await queryFactory(opts);

      logger.info("Executing request query");
      const result =
        await opts.runQuery(query).then(query.returning, query.catch);

      // add top level self link pre send.
      if(result.document && result.document.primary) {
        result.document.primary.links = {
          "self": () => opts.request.uri,
          ...result.document.primary.links
        };
      }

      return result;
    } catch(err) {
      return makeResultFromErrors(opts.makeDocument, err);
    }
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
      logger.info("Negotiating response content-type");
      contentType =
        await negotiateContentType(request.accepts, ["application/vnd.api+json"])

      logger.info("Parsing request body/query parameters");
      const finalizedRequest = await this.finalizeRequest(
        request,
        opts.supportedOperators || this.getSupportedOperators(request)
      );

      // As the custom query factory, use the user-provided one if present,
      // or make a factory by applying the user-provided query transform to
      // the library's generated query.
      const customQueryFactory = opts.queryFactory ||
        (opts.queryTransform && (() => {
          const queryTransform = opts.queryTransform;
          return async (queryFactoryOpts: QueryBuildingContext) => {
            const query = await this.makeQuery(queryFactoryOpts);
            const req = queryFactoryOpts.serverReq;
            return queryTransform.length > 1
              ? (queryTransform as QueryTransformWithReq)(req, query)
              : (queryTransform as QueryTransformNoReq)(query);
          };
        })());

      const transformExtras = {
        request: finalizedRequest,
        registry: this.registry,
        serverReq,
        serverRes
      };

      const beforeSave = makeTransformFunction("beforeSave", transformExtras);
      const beforeRender = makeTransformFunction("beforeRender", transformExtras);

      const resultBuildingOpts = {
        ...transformExtras,
        makeDocument: this.makeDoc, // tslint:disable-line no-unbound-method
        beforeSave,
        beforeRender,
        transformDocument(doc: Document, modeOrFn: TransformMode | DocTransformFn<Transformable>) {
          const fn = modeOrFn === 'beforeSave'
            ? beforeSave
            : (modeOrFn === 'beforeRender' ? beforeRender : modeOrFn);

          const transformLinkage =
            transformExtras.registry.typeNames()
              .some(it => transformExtras.registry.transformLinkage(it));

          return doc.transform(fn, !transformLinkage);
        },
        makeQuery: this.makeQuery, // tslint:disable-line no-unbound-method
        runQuery: this.runQuery,  // tslint:disable-line no-unbound-method
        // Note: can't use R.partialRight below if we want requiredThroughType
        // to be optional for callers.
        setTypePaths(
          it: (Resource | ResourceIdentifier)[],
          useInputData: boolean,
          requiredThroughType?: string
        ) {
          return setTypePaths(it, useInputData, requiredThroughType, transformExtras.registry);
        }
      }

      // tslint:disable-next-line no-unbound-method
      const resultFactory = opts.resultFactory || this.makeResult;

      jsonAPIResult = await resultFactory(
        resultBuildingOpts,
        customQueryFactory
      );
    }

    // If an error occurred, (e.g., parsing the request) convert it to a Result.
    catch (err) {
      logger.warn("API Controller caught error", err, err.stack);
      jsonAPIResult = makeResultFromErrors(this.makeDoc, err);
    }

    // Convert the Result to an HttpResponse. Atm, this is simply about
    // copying over a couple properties. In the future, though, one HTTP request
    // might generate multiple queries, and then possibly multiple Results,
    // which would be merged into a single HTTP Response.
    logger.info("Creating HTTPResponse", jsonAPIResult);
    return resultToHTTPResponse(jsonAPIResult, contentType);
  };

  /**
   * Builds a response from errors. Allows errors that occur outside of the
   * library to be handled and returned in JSON API-compiant fashion.
   *
   * @param {ErrOrErrArr} errors Error or array of errors
   * @param {string} requestAccepts Request's Accepts header
   */
  static async responseFromError(errors: ErrorOrErrorArray, requestAccepts) {
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

  public static supportedExt: ReadonlyArray<string> = Object.freeze([]);
}

export function defaultFilterParamParser(
  filterOps: ParserOperatorsConfig,
  rawQuery: string | undefined
) {
  return getQueryParamValue("filter", rawQuery)
    .map(it => parseFilter(it, filterOps))
    .getOrDefault(undefined);
}

export function defaultSortParamParser(
  sortOps: ParserOperatorsConfig,
  rawQuery: string | undefined
) {
  return getQueryParamValue("sort", rawQuery)
    .map(it => parseSort(it, sortOps))
    .getOrDefault(undefined);
}

/**
 * Creates a JSON:API Result from an error or array of errors.
 */
function makeResultFromErrors(makeDoc: makeDocument, errors: ErrorOrErrorArray): Result {
  const rawErrorsArray = (Array.isArray(errors) ? errors : [errors]);
  const finalErrorsArray: APIError[] =
    rawErrorsArray.map(APIError.fromError.bind(APIError));

  logger.warn("Errors converted to json-api Result", ...rawErrorsArray);
  const status = pickStatus(finalErrorsArray.map(v => Number(v.status)));

  return {
    document: makeDoc({ errors: finalErrorsArray }),
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
