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
const qs = require("qs");
const getRawBody = require("raw-body");
const logger_1 = require("../util/logger");
const APIError_1 = require("../types/APIError");
class BaseStrategy {
    constructor(apiController, docsController, options) {
        this.api = apiController;
        this.docs = docsController;
        this.config = Object.assign({ tunnel: false, handleContentNegotiation: true }, options);
        if (typeof options === 'object' && options != null && !options.host) {
            logger_1.default.warn("Unsafe: missing `host` option in http strategy. This is unsafe " +
                "unless you have reason to trust the (X-Forwarded-)Host header.");
        }
    }
    buildRequestObject(req, protocol, fallbackHost, params, parsedQuery) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryStartIndex = req.url.indexOf("?");
            const hasQuery = queryStartIndex !== -1;
            const rawQueryString = hasQuery && req.url.substr(queryStartIndex + 1);
            const protocolGuess = protocol || (req.connection.encrypted ? "https" : "http");
            const host = this.config.host || fallbackHost;
            const body = yield this.getParsedBodyJSON(req);
            return {
                queryParams: parsedQuery || (hasQuery && qs.parse(rawQueryString)) || {},
                rawQueryString: rawQueryString || undefined,
                id: params.id,
                type: params.type,
                relationship: params.related || params.relationship,
                aboutRelationship: !!params.relationship,
                uri: protocolGuess + "://" + host + req.url,
                method: (() => {
                    const usedMethod = req.method.toLowerCase();
                    const requestedMethod = (req.headers["x-http-method-override"] || "").toLowerCase();
                    if (this.config.tunnel && usedMethod === "post" && requestedMethod === "patch") {
                        return "patch";
                    }
                    else if (requestedMethod) {
                        const msg = `Cannot tunnel to the method "${requestedMethod.toUpperCase()}".`;
                        throw new APIError_1.default(400, undefined, msg);
                    }
                    return usedMethod;
                })(),
                accepts: req.headers.accept,
                contentType: req.headers["content-type"],
                body
            };
        });
    }
    getParsedBodyJSON(req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!hasBody(req)) {
                return undefined;
            }
            if (!isReadableStream(req)) {
                throw new APIError_1.default(500, undefined, "Request body could not be parsed. " +
                    "Make sure other no other middleware has already parsed the request body.");
            }
            const bodyParserOptions = Object.assign({ encoding: "utf-8", limit: "1mb" }, (hasValidContentLength(req)
                ? { length: req.headers["content-length"] }
                : {}));
            const bodyString = yield getRawBody(req, bodyParserOptions);
            if (bodyString.length === 0) {
                return undefined;
            }
            try {
                return JSON.parse(bodyString);
            }
            catch (error) {
                throw new APIError_1.default(400, undefined, "Request contains invalid JSON.");
            }
        });
    }
}
exports.default = BaseStrategy;
function hasBody(req) {
    return req.headers["transfer-encoding"] !== undefined || hasValidContentLength(req);
}
function hasValidContentLength(req) {
    return !isNaN(req.headers["content-length"]);
}
function isReadableStream(req) {
    return typeof req._readableState === "object" && req._readableState.endEmitted === false;
}
