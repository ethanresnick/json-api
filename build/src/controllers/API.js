"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const co = require("co");
const Response_1 = require("../types/HTTP/Response");
exports.SealedResponse = Response_1.Response;
const Document_1 = require("../types/Document");
const Collection_1 = require("../types/Collection");
const APIError_1 = require("../types/APIError");
const _0_validate_request_1 = require("../steps/0-validate-request");
const _1_convert_request_to_query_list_1 = require("../steps/1-convert-request-to-query-list");
const negotiate_content_type_1 = require("../steps/http/content-negotiation/negotiate-content-type");
const label_to_ids_1 = require("../steps/pre-query/label-to-ids");
const validate_resources_1 = require("../steps/pre-query/validate-resources");
const apply_transform_1 = require("../steps/apply-transform");
const do_get_1 = require("../steps/do-query/do-get");
const do_post_1 = require("../steps/do-query/do-post");
const do_patch_1 = require("../steps/do-query/do-patch");
const do_delete_1 = require("../steps/do-query/do-delete");
class APIController {
    constructor(registry) {
        this.registry = registry;
    }
    handle(request, frameworkReq, frameworkRes) {
        let response = new Response_1.default();
        let registry = this.registry;
        return (_0_validate_request_1.default([])(request)
            .then(_1_convert_request_to_query_list_1.default));
        return co(function* () {
            try {
                response.contentType = yield negotiate_content_type_1.default(request.headers.accepts, ["application/vnd.api+json"]);
                response.headers.vary = "Accept";
                if (!registry.hasType(request.frameworkParams.type)) {
                    throw new APIError_1.default(404, undefined, `${request.frameworkParams.type} is not a valid type.`);
                }
                if (typeof request.body !== "undefined") {
                    let parsedPrimary = yield parseRequestPrimary(request.body.data, Boolean(request.frameworkParams.relationship));
                    if (!request.frameworkParams.relationship) {
                        yield validate_resources_1.default(request.frameworkParams.type, parsedPrimary, registry);
                    }
                    request.primary = yield apply_transform_1.default(parsedPrimary, "beforeSave", registry, frameworkReq, frameworkRes);
                }
                if (request.idOrIds && request.allowLabel) {
                    let mappedLabel = yield label_to_ids_1.default(request.type, request.idOrIds, registry, frameworkReq);
                    request.idOrIds = mappedLabel;
                    let mappedIsEmptyArray = Array.isArray(mappedLabel) && !mappedLabel.length;
                    if (mappedLabel === null || mappedLabel === undefined || mappedIsEmptyArray) {
                        response.primary = (mappedLabel) ? new Collection_1.default() : null;
                    }
                }
                if (typeof response.primary === "undefined") {
                    switch (request.method) {
                        case "get":
                            yield do_get_1.default(request, response, registry);
                            break;
                        case "post":
                            yield do_post_1.default(request, response, registry);
                            break;
                        case "patch":
                            yield do_patch_1.default(request, response, registry);
                            break;
                        case "delete":
                            yield do_delete_1.default(request, response, registry);
                    }
                }
            }
            catch (errors) {
                let errorsArr = Array.isArray(errors) ? errors : [errors];
                let apiErrors = errorsArr.map(APIError_1.default.fromError);
                if (response.contentType !== "application/json") {
                    response.contentType = "application/vnd.api+json";
                }
                response.errors = response.errors.concat(apiErrors);
            }
            if (response.errors.length) {
                response.status = pickStatus(response.errors.map((v) => Number(v.status)));
                response.body = new Document_1.default(response.errors).get(true);
                return response;
            }
            response.primary = yield apply_transform_1.default(response.primary, "beforeRender", registry, frameworkReq, frameworkRes);
            response.included = yield apply_transform_1.default(response.included, "beforeRender", registry, frameworkReq, frameworkRes);
            if (response.status !== 204) {
                response.body = new Document_1.default(response.primary, response.included, undefined, registry.urlTemplates(), request.uri).get(true);
            }
            return response;
        });
    }
    static responseFromExternalError(errors, requestAccepts) {
        let response = new Response_1.default();
        response.errors = (Array.isArray(errors) ? errors : [errors])
            .map(APIError_1.default.fromError.bind(APIError_1.default));
        response.status = pickStatus(response.errors.map((v) => Number(v.status)));
        response.body = new Document_1.default(response.errors).get(true);
        return negotiate_content_type_1.default(requestAccepts, ["application/vnd.api+json"])
            .then((contentType) => {
            response.contentType = (contentType.toLowerCase() === "application/json")
                ? contentType : "application/vnd.api+json";
            return response;
        }, () => {
            response.contentType = "application/vnd.api+json";
            return response;
        });
    }
}
APIController.supportedExt = Object.freeze([]);
exports.default = APIController;
function pickStatus(errStatuses) {
    return errStatuses[0];
}
