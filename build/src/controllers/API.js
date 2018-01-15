"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const templating = require("url-template");
const R = require("ramda");
const Document_1 = require("../types/Document");
const APIError_1 = require("../types/APIError");
const Data_1 = require("../types/Generic/Data");
const ResourceSet_1 = require("../types/ResourceSet");
const ResourceIdentifierSet_1 = require("../types/ResourceIdentifierSet");
const Relationship_1 = require("../types/Relationship");
const logger_1 = require("../util/logger");
const type_handling_1 = require("../util/type-handling");
const requestValidators = require("../steps/http/validate-request");
const negotiate_content_type_1 = require("../steps/http/content-negotiation/negotiate-content-type");
const validate_content_type_1 = require("../steps/http/content-negotiation/validate-content-type");
const parse_request_primary_1 = require("../steps/pre-query/parse-request-primary");
const validate_document_1 = require("../steps/pre-query/validate-document");
const validate_resources_1 = require("../steps/pre-query/validate-resources");
const parse_query_params_1 = require("../steps/pre-query/parse-query-params");
const filter_param_parser_1 = require("../steps/pre-query/filter-param-parser");
const apply_transform_1 = require("../steps/apply-transform");
const make_get_1 = require("../steps/make-query/make-get");
const make_post_1 = require("../steps/make-query/make-post");
const make_patch_1 = require("../steps/make-query/make-patch");
const make_delete_1 = require("../steps/make-query/make-delete");
const http_1 = require("http");
exports.IncomingMessage = http_1.IncomingMessage;
exports.ServerResponse = http_1.ServerResponse;
const CreateQuery_1 = require("../types/Query/CreateQuery");
exports.CreateQuery = CreateQuery_1.default;
const FindQuery_1 = require("../types/Query/FindQuery");
exports.FindQuery = FindQuery_1.default;
const UpdateQuery_1 = require("../types/Query/UpdateQuery");
exports.UpdateQuery = UpdateQuery_1.default;
const DeleteQuery_1 = require("../types/Query/DeleteQuery");
exports.DeleteQuery = DeleteQuery_1.default;
const AddToRelationshipQuery_1 = require("../types/Query/AddToRelationshipQuery");
exports.AddToRelationshipQuery = AddToRelationshipQuery_1.default;
const RemoveFromRelationshipQuery_1 = require("../types/Query/RemoveFromRelationshipQuery");
exports.RemoveFromRelationshipQuery = RemoveFromRelationshipQuery_1.default;
class APIController {
    constructor(registry, opts = {}) {
        this.makeDoc = (data) => new Document_1.default(Object.assign({ urlTemplates: this.urlTemplateFns }, data));
        this.handle = (request, serverReq, serverRes, opts = {}) => __awaiter(this, void 0, void 0, function* () {
            let contentType;
            let jsonAPIResult = {};
            try {
                logger_1.default.info('Negotiating response content-type');
                contentType =
                    yield negotiate_content_type_1.default(request.accepts, ["application/vnd.api+json"]);
                logger_1.default.info('Parsing request body/query parameters');
                const finalizedRequest = yield this.finalizeRequest(request);
                const queryFactory = opts.queryFactory || this.makeQuery;
                const transformExtras = {
                    request: finalizedRequest,
                    registry: this.registry,
                    serverReq,
                    serverRes
                };
                logger_1.default.info('Creating request query');
                const query = yield queryFactory(Object.assign({}, transformExtras, { makeDocument: this.makeDoc, transformDocument: R.partialRight(transformDoc, [transformExtras]), makeQuery: this.makeQuery }));
                if (!this.registry.hasType(query.type)) {
                    throw new APIError_1.default(404, undefined, `${request.type} is not a valid type.`);
                }
                logger_1.default.info('Executing request query');
                const adapter = this.registry.dbAdapter(query.type);
                jsonAPIResult =
                    yield adapter.doQuery(query).then(query.returning, query.catch);
                if (jsonAPIResult.document && jsonAPIResult.document.primary) {
                    jsonAPIResult.document.primary.links = Object.assign({ "self": () => request.uri }, jsonAPIResult.document.primary.links);
                }
            }
            catch (err) {
                logger_1.default.warn("API Controller caught error", err, err.stack);
                jsonAPIResult = makeResultFromErrors(this.makeDoc, err);
            }
            logger_1.default.info('Creating HTTPResponse');
            return resultToHTTPResponse(jsonAPIResult, contentType);
        });
        this.registry = registry;
        this.filterParamParser =
            opts.filterParser || this.constructor.defaultFilterParamParser;
        this.urlTemplateFns = type_handling_1.mapObject(registry.urlTemplates(), (templatesForType) => {
            return type_handling_1.mapObject(templatesForType, (it) => templating.parse(it).expand);
        });
    }
    finalizeRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { unaryFilterOperators, binaryFilterOperators } = this.registry.hasType(request.type)
                ? this.registry.dbAdapter(request.type).constructor
                : { unaryFilterOperators: [], binaryFilterOperators: [] };
            const finalizedRequest = Object.assign({}, request, { queryParams: Object.assign({}, parse_query_params_1.default(request.queryParams), { filter: this.filterParamParser(unaryFilterOperators, binaryFilterOperators, request.rawQueryString, request.queryParams) }), document: undefined });
            if (request.body !== undefined) {
                const linksJSONToTemplates = (linksJSON) => type_handling_1.mapObject(linksJSON || {}, v => () => v);
                const parsedPrimary = yield (() => __awaiter(this, void 0, void 0, function* () {
                    yield validate_content_type_1.default(request, this.constructor.supportedExt);
                    yield validate_document_1.default(request.body);
                    return parse_request_primary_1.default(request.body.data, parseAsLinkage(request));
                }))();
                finalizedRequest.document = this.makeDoc({
                    primary: parseAsLinkage(request)
                        ? (isBulkDelete(request)
                            ? ResourceIdentifierSet_1.default.of({
                                data: parsedPrimary,
                                links: linksJSONToTemplates(request.body.links)
                            })
                            : Relationship_1.default.of({
                                data: parsedPrimary,
                                links: linksJSONToTemplates(request.body.links),
                                owner: {
                                    type: request.type,
                                    id: request.id,
                                    path: request.relationship
                                }
                            }))
                        : ResourceSet_1.default.of({
                            data: parsedPrimary,
                            links: linksJSONToTemplates(request.body.links),
                        }),
                    meta: request.body.meta
                });
            }
            return finalizedRequest;
        });
    }
    makeQuery(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { request } = opts;
            let requestAfterBeforeSave = request;
            yield requestValidators.checkMethod(request);
            yield requestValidators.checkBodyExistence(request);
            if (request.document && request.document.primary) {
                if (!parseAsLinkage(request)) {
                    yield validate_resources_1.default(request.type, request.document.primary._data, opts.registry);
                }
                requestAfterBeforeSave = Object.assign({}, request, { document: yield opts.transformDocument(request.document, "beforeSave") });
            }
            const baseQuery = yield (() => {
                switch (request.method) {
                    case "get":
                        return make_get_1.default(requestAfterBeforeSave, opts.registry, opts.makeDocument);
                    case "post":
                        return make_post_1.default(requestAfterBeforeSave, opts.registry, opts.makeDocument);
                    case "patch":
                        return make_patch_1.default(requestAfterBeforeSave, opts.registry, opts.makeDocument);
                    case "delete":
                        return make_delete_1.default(requestAfterBeforeSave, opts.registry, opts.makeDocument);
                }
            })();
            const origReturning = baseQuery.returning;
            const origCatch = baseQuery.catch || makeResultFromErrors.bind(null, opts.makeDocument);
            const transformResultDocument = (result) => __awaiter(this, void 0, void 0, function* () {
                result.document = result.document &&
                    (yield opts.transformDocument(result.document, "beforeRender"));
                return result;
            });
            return baseQuery.resultsIn(R.pipe(origReturning, transformResultDocument), R.pipe(origCatch, transformResultDocument));
        });
    }
    static responseFromError(errors, requestAccepts) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.responseFromResult(makeResultFromErrors((data) => new Document_1.default(data), errors), requestAccepts, false);
        });
    }
    static responseFromResult(result, reqAccepts, allow406 = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let contentType;
            try {
                contentType = yield negotiate_content_type_1.default(reqAccepts, ["application/vnd.api+json"]);
                return resultToHTTPResponse(result, contentType);
            }
            catch (e) {
                const finalResult = allow406
                    ? makeResultFromErrors((data) => new Document_1.default(data), e)
                    : result;
                return resultToHTTPResponse(finalResult, "application/vnd.api+json");
            }
        });
    }
    static defaultFilterParamParser(legalUnary, legalBinary, rawQuery, params) {
        return filter_param_parser_1.getFilterList(rawQuery)
            .map(it => filter_param_parser_1.default(legalUnary, legalBinary, it))
            .getOrDefault(undefined);
    }
}
APIController.supportedExt = Object.freeze([]);
exports.default = APIController;
function makeResultFromErrors(makeDoc, errors) {
    const errorsArray = (Array.isArray(errors) ? errors : [errors])
        .map(APIError_1.default.fromError.bind(APIError_1.default));
    const status = pickStatus(errorsArray.map((v) => Number(v.status)));
    return {
        document: makeDoc({ errors: errorsArray }),
        status
    };
}
function resultToHTTPResponse(response, negotiatedMediaType) {
    const status = (() => {
        if (response.status) {
            return response.status;
        }
        if (response.document) {
            return response.document.errors
                ? pickStatus(response.document.errors.map(it => Number(it.status)))
                : 200;
        }
        return 204;
    })();
    const headers = Object.assign({}, (status !== 204
        ? { 'content-type': negotiatedMediaType || "application/vnd.api+json" }
        : {}), { 'vary': 'Accept' }, response.headers);
    return {
        status,
        headers,
        body: response.document && response.document.toString()
    };
}
function pickStatus(errStatuses) {
    return errStatuses[0];
}
function isBulkDelete(request) {
    return request.method === "delete" && !request.id && !request.aboutRelationship;
}
function parseAsLinkage(request) {
    return request.aboutRelationship || isBulkDelete(request);
}
function transformDoc(doc, mode, extras) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = doc.clone();
        const primaryData = res.primary && res.primary._data;
        const includedData = doc.included && Data_1.default.of(doc.included);
        if (primaryData) {
            res.primary._data =
                yield apply_transform_1.default(primaryData, mode, extras);
        }
        if (includedData) {
            res.included =
                (yield apply_transform_1.default(includedData, mode, extras)).values;
        }
        return res;
    });
}
