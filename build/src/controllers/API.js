"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const co = require("co");
const Response_1 = require("../types/HTTP/Response");
exports.SealedResponse = Response_1.Response;
const Document_1 = require("../types/Document");
const Collection_1 = require("../types/Collection");
const APIError_1 = require("../types/APIError");
const requestValidators = require("../steps/http/validate-request");
const negotiate_content_type_1 = require("../steps/http/content-negotiation/negotiate-content-type");
const validate_content_type_1 = require("../steps/http/content-negotiation/validate-content-type");
const label_to_ids_1 = require("../steps/pre-query/label-to-ids");
const parse_request_primary_1 = require("../steps/pre-query/parse-request-primary");
const validate_document_1 = require("../steps/pre-query/validate-document");
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
        const response = new Response_1.default();
        const registry = this.registry;
        return co(function* () {
            try {
                yield requestValidators.checkMethod(request);
                yield requestValidators.checkBodyExistence(request);
                response.contentType = yield negotiate_content_type_1.default(request.accepts, ["application/vnd.api+json"]);
                response.headers.vary = "Accept";
                if (!registry.hasType(request.type)) {
                    throw new APIError_1.default(404, undefined, `${request.type} is not a valid type.`);
                }
                if (request.hasBody) {
                    yield validate_content_type_1.default(request, this.constructor.supportedExt);
                    yield validate_document_1.default(request.body);
                    const parsedPrimary = yield parse_request_primary_1.default(request.body.data, request.aboutRelationship);
                    if (!request.aboutRelationship) {
                        yield validate_resources_1.default(request.type, parsedPrimary, registry);
                    }
                    request.primary = yield apply_transform_1.default(parsedPrimary, "beforeSave", registry, frameworkReq, frameworkRes);
                }
                if (request.idOrIds && request.allowLabel) {
                    const mappedLabel = yield label_to_ids_1.default(request.type, request.idOrIds, registry, frameworkReq);
                    request.idOrIds = mappedLabel;
                    const mappedIsEmptyArray = Array.isArray(mappedLabel) && !mappedLabel.length;
                    if (mappedLabel === null || mappedLabel === undefined || mappedIsEmptyArray) {
                        response.primary = (mappedLabel) ? new Collection_1.default() : null;
                    }
                }
                response.meta = {};
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
                const errorsArr = Array.isArray(errors) ? errors : [errors];
                const apiErrors = errorsArr.map(APIError_1.default.fromError);
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
                response.body = new Document_1.default(response.primary, response.included, response.meta, registry.urlTemplates(), request.uri).get(true);
            }
            return response;
        });
    }
    static responseFromExternalError(errors, requestAccepts) {
        const response = new Response_1.default();
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
