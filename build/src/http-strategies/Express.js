"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const varyLib = require("vary");
const depd = require("depd");
const R = require("ramda");
const logger_1 = require("../util/logger");
const API_1 = require("../controllers/API");
const Base_1 = require("./Base");
const deprecate = depd("json-api");
class ExpressStrategy extends Base_1.default {
    constructor(apiController, docsController, options) {
        super(apiController, docsController, options);
        this.doRequest = (controller, req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const requestObj = yield this.buildRequestObject(req);
                const responseObj = yield controller(requestObj, req, res);
                this.sendResponse(responseObj, res, next);
            }
            catch (err) {
                this.sendError(err, req, res, next);
            }
        });
        this.docsRequest = R.partial(this.doRequest, [this.docs.handle]);
        this.apiRequest = R.partial(this.doRequest, [this.api.handle]);
        this.customAPIRequest = (opts) => R.partial(this.doRequest, [
            (request, req, res) => this.api.handle(request, req, res, opts)
        ]);
        this.transformedAPIRequest = (queryTransform) => {
            deprecate('transformedAPIRequest: use customAPIRequest instead.');
            return this.customAPIRequest({
                queryFactory: (opts) => __awaiter(this, void 0, void 0, function* () {
                    const req = opts.serverReq;
                    const query = yield this.api.makeQuery(opts);
                    return queryTransform.length > 1
                        ? queryTransform(req, query)
                        : queryTransform(query);
                })
            });
        };
        this.sendError = (errors, req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (!next) {
                deprecate("sendError with 3 arguments: must now provide next function.");
                next = (err) => { };
            }
            try {
                const responseObj = yield API_1.default.responseFromError(errors, req.headers.accept);
                this.sendResponse(responseObj, res, next);
            }
            catch (err) {
                logger_1.default.warn("Hit an unexpected error creating or sending response. This shouldn't happen.");
                next(err);
            }
        });
        this.sendResult = (result, req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const responseObj = yield API_1.default.responseFromResult(result, req.headers.accept, true);
                this.sendResponse(responseObj, res, next);
            }
            catch (err) {
                logger_1.default.warn("Hit an unexpected error creating or sending response. This shouldn't happen.");
                next(err);
            }
        });
    }
    buildRequestObject(req) {
        return super.buildRequestObject(req, req.protocol, req.host, req.params, req.query);
    }
    sendResponse(response, res, next) {
        const _a = response.headers, { vary } = _a, otherHeaders = __rest(_a, ["vary"]);
        if (vary) {
            varyLib(res, vary);
        }
        if (response.status === 406 && !this.config.handleContentNegotiation) {
            return next();
        }
        res.status(response.status || 200);
        Object.keys(otherHeaders).forEach(k => {
            res.set(k, otherHeaders[k]);
        });
        if (response.body !== undefined) {
            res.send(new Buffer(response.body)).end();
        }
        else {
            res.end();
        }
    }
}
exports.default = ExpressStrategy;
