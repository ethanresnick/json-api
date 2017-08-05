"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qs = require("qs");
const contentType = require("content-type");
const getRawBody = require("raw-body");
const APIError_1 = require("../types/APIError");
const Request_1 = require("../types/HTTP/Request");
exports.UnsealedRequest = Request_1.Request;
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
        const config = this.config;
        return new Promise(function (resolve, reject) {
            const it = new Request_1.default();
            if (query) {
                it.queryParams = query;
            }
            else if (req.url.indexOf("?") !== -1) {
                it.queryParams = qs.parse(req.url.split("?")[1]);
            }
            it.allowLabel = !!(params.idOrLabel && !params.id);
            it.idOrIds = params.id || params.idOrLabel;
            it.type = params.type;
            it.aboutRelationship = !!params.relationship;
            it.relationship = params.related || params.relationship;
            protocol = protocol || (req.connection.encrypted ? "https" : "http");
            host = host || req.headers.host;
            it.uri = protocol + "://" + host + req.url;
            it.method = req.method.toLowerCase();
            it.accepts = req.headers.accept;
            const requestedMethod = (req.headers["x-http-method-override"] || "").toLowerCase();
            if (config.tunnel && it.method === "post" && requestedMethod === "patch") {
                it.method = "patch";
            }
            else if (requestedMethod) {
                reject(new APIError_1.default(400, undefined, `Cannot tunnel to the method "${requestedMethod.toUpperCase()}".`));
            }
            if (hasBody(req)) {
                if (!isReadableStream(req)) {
                    return reject(new APIError_1.default(500, undefined, "Request body could not be parsed. Make sure other no other middleware has already parsed the request body."));
                }
                it.contentType = req.headers["content-type"];
                const typeParsed = contentType.parse(req);
                const bodyParserOptions = {
                    encoding: typeParsed.parameters.charset || "utf8",
                    limit: "1mb"
                };
                if (req.headers["content-length"] && !isNaN(req.headers["content-length"])) {
                    bodyParserOptions.length = req.headers["content-length"];
                }
                getRawBody(req, bodyParserOptions, function (err, string) {
                    if (err) {
                        reject(err);
                    }
                    else if (string.length === 0) {
                        it.hasBody = false;
                        it.body = "";
                        resolve(it);
                    }
                    else {
                        try {
                            it.hasBody = true;
                            it.body = JSON.parse(string);
                            resolve(it);
                        }
                        catch (error) {
                            reject(new APIError_1.default(400, undefined, "Request contains invalid JSON."));
                        }
                    }
                });
            }
            else {
                it.hasBody = false;
                it.body = undefined;
                resolve(it);
            }
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
