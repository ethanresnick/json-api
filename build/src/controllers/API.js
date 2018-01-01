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
const Document_1 = require("../types/Document");
const APIError_1 = require("../types/APIError");
const Data_1 = require("../types/Data");
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
class APIController {
    constructor(registry, opts = {}) {
        this.registry = registry;
        this.filterParamParser =
            opts.filterParser || this.constructor.defaultFilterParamParser;
        this.urlTemplateFns = type_handling_1.mapObject(registry.urlTemplates(), (templatesForType) => {
            return type_handling_1.mapObject(templatesForType, (it) => templating.parse(it).expand);
        });
    }
    handle(request, frameworkReq, frameworkRes, queryTransform) {
        return __awaiter(this, void 0, void 0, function* () {
            const registry = this.registry;
            const makeDoc = (data) => new Document_1.default(Object.assign({ urlTemplates: this.urlTemplateFns }, data));
            let jsonAPIResult = {};
            let contentType;
            try {
                yield requestValidators.checkMethod(request);
                yield requestValidators.checkBodyExistence(request);
                contentType =
                    yield negotiate_content_type_1.default(request.accepts, ["application/vnd.api+json"]);
                if (!registry.hasType(request.type)) {
                    throw new APIError_1.default(404, undefined, `${request.type} is not a valid type.`);
                }
                const adapter = registry.dbAdapter(request.type);
                const { unaryFilterOperators, binaryFilterOperators } = adapter.constructor;
                request.queryParams = Object.assign({}, parse_query_params_1.default(request.queryParams), { filter: this.filterParamParser(unaryFilterOperators, binaryFilterOperators, request.rawQueryString, request.queryParams) });
                if (typeof request.body !== 'undefined') {
                    yield validate_content_type_1.default(request, this.constructor.supportedExt);
                    yield validate_document_1.default(request.body);
                    const isBulkDelete = request.method === "delete" && !request.id && !request.aboutRelationship;
                    const parsedPrimary = yield parse_request_primary_1.default(request.body.data, request.aboutRelationship || isBulkDelete);
                    if (!request.aboutRelationship) {
                        yield validate_resources_1.default(request.type, parsedPrimary, registry);
                    }
                    request.primary = (yield apply_transform_1.default(parsedPrimary, "beforeSave", { frameworkReq, frameworkRes, request, registry }));
                }
                const query = yield (() => {
                    queryTransform = queryTransform || ((it) => it);
                    switch (request.method) {
                        case "get":
                            return queryTransform(make_get_1.default(request, registry, makeDoc));
                        case "post":
                            return queryTransform(make_post_1.default(request, registry, makeDoc));
                        case "patch":
                            return queryTransform(make_patch_1.default(request, registry, makeDoc));
                        case "delete":
                            return queryTransform(make_delete_1.default(request, registry, makeDoc));
                    }
                })();
                jsonAPIResult = yield adapter.doQuery(query).then(query.returning, query.catch || makeResultFromErrors.bind(null, makeDoc));
                if (jsonAPIResult.document && jsonAPIResult.document.primary) {
                    jsonAPIResult.document.primary.links = Object.assign({ "self": () => request.uri }, jsonAPIResult.document.primary.links);
                }
                if (jsonAPIResult.document) {
                    const primaryData = jsonAPIResult.document.primary &&
                        jsonAPIResult.document.primary.data;
                    const includedData = jsonAPIResult.document.included &&
                        Data_1.default.of(jsonAPIResult.document.included);
                    if (primaryData) {
                        jsonAPIResult.document.primary.data = yield apply_transform_1.default(primaryData, "beforeRender", { frameworkReq, frameworkRes, request, registry });
                    }
                    if (includedData) {
                        jsonAPIResult.document.included = (yield apply_transform_1.default(includedData, "beforeRender", { frameworkReq, frameworkRes, request, registry })).values;
                    }
                }
            }
            catch (err) {
                jsonAPIResult = makeResultFromErrors(makeDoc, err);
                const errorsArr = Array.isArray(err) ? err : [err];
                errorsArr.forEach(err => {
                    logger_1.default.info("API Controller caught error", err, err.stack);
                });
            }
            return resultToHTTPResponse(jsonAPIResult, contentType);
        });
    }
    static responseFromExternalError(errors, requestAccepts) {
        return __awaiter(this, void 0, void 0, function* () {
            let contentType;
            try {
                contentType = yield negotiate_content_type_1.default(requestAccepts, ["application/vnd.api+json"]);
            }
            catch (e) {
                contentType = "application/vnd.api+json";
            }
            return resultToHTTPResponse(makeResultFromErrors((data) => new Document_1.default(data), errors), contentType);
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
