"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qs = require("qs");
const url = require("url");
const deepFreeze = require("deep-freeze");
const contentType = require("content-type");
const getRawBody = require("raw-body");
const APIError_1 = require("../types/APIError");
class BaseStrategy {
    constructor(apiController, docsController, options) {
        const defaultOptions = {
            tunnel: false,
            handleContentNegotiation: true
        };
        this.api = apiController;
        this.docs = docsController;
        this.config = Object.assign({}, defaultOptions, options);
    }
    buildRequestObject(req, protocol, host, params, query) {
        return Promise.resolve().then(() => {
            const contentTypeParsed = contentType.parse(req.headers["content-type"]);
            const uriParsed = url.parse(req.url, false, false);
            const method = (() => {
                const usedMethod = req.method.toLowerCase();
                const requestedMethod = String(req.headers["x-http-method-override"] || "").toLowerCase();
                if (requestedMethod) {
                    if (this.config.tunnel && usedMethod === 'post' && requestedMethod === 'patch') {
                        return 'patch';
                    }
                    throw new APIError_1.default(400, undefined, `Cannot tunnel to the method "${requestedMethod.toUpperCase()}".`);
                }
                return usedMethod;
            })();
            const bodyPromise = (() => {
                if (!hasBody(req)) {
                    return Promise.resolve(undefined);
                }
                if (!isReadableStream(req)) {
                    if (typeof req.body === 'string') {
                        return Promise.resolve(req.body);
                    }
                    return Promise.reject(new APIError_1.default(500, undefined, "Request could not be parsed, and no previously parsed body was found."));
                }
                const contentLength = (Array.isArray(req.headers["content-length"])
                    ? req.headers["content-length"][0]
                    : req.headers["content-length"]);
                return getRawBody(req, {
                    encoding: contentTypeParsed.parameters.charset || "utf-8",
                    limit: "1mb",
                    length: contentLength && !isNaN(contentLength) ? contentLength : null
                }).then(string => {
                    try {
                        return string.length === 0
                            ? undefined
                            : JSON.parse(string);
                    }
                    catch (e) {
                        throw new APIError_1.default(400, undefined, "Request contains invalid JSON.");
                    }
                });
            })();
            return bodyPromise.then(body => deepFreeze({
                uri: {
                    protocol: protocol || (req.connection.encrypted ? "https" : "http"),
                    host,
                    pathname: uriParsed.pathname,
                    queryParams: query || (uriParsed.query ? qs.parse(uriParsed.query) : {})
                },
                method,
                body,
                headers: {
                    contentType: contentTypeParsed,
                    accepts: req.headers.accept
                },
                frameworkParams: params
            }));
        });
    }
}
exports.default = BaseStrategy;
function hasBody(req) {
    return req.headers["transfer-encoding"] !== undefined || !isNaN(req.headers["content-length"]);
}
function isReadableStream(req) {
    return typeof req._readableState === "object" && req._readableState.endEmitted === false;
}
