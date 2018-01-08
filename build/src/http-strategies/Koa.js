"use strict";
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
const vary_1 = require("vary");
const API_1 = require("../controllers/API");
const Base_1 = require("./Base");
class KoaStrategy extends Base_1.default {
    constructor(apiController, docsController, options) {
        super(apiController, docsController, options);
    }
    apiRequest() {
        const strategy = this;
        return function* (next) {
            const ctx = this;
            try {
                const reqObj = yield strategy.buildRequestObject(ctx.req, ctx.protocol, ctx.host, ctx.params);
                const resObj = yield strategy.api.handle(reqObj, ctx.request, ctx.response);
                const delegate406Handling = strategy.sendResources(resObj, ctx);
                if (delegate406Handling) {
                    yield next;
                }
            }
            catch (err) {
                strategy.sendError(err, this);
            }
        };
    }
    docsRequest() {
        const strategy = this;
        return function* (next) {
            const ctx = this;
            try {
                const reqObj = yield strategy.buildRequestObject(ctx.req, ctx.protocol, ctx.host, ctx.params);
                const resObj = yield strategy.docs.handle(reqObj, ctx.request, ctx.response);
                const delegate406Handling = strategy.sendResources(resObj, ctx);
                if (delegate406Handling) {
                    yield next;
                }
            }
            catch (err) {
                strategy.sendError(err, this);
            }
        };
    }
    sendResources(responseObject, ctx) {
        const _a = responseObject.headers, { vary } = _a, otherHeaders = __rest(_a, ["vary"]);
        if (vary) {
            vary_1.default(ctx.res, vary);
        }
        if (responseObject.status === 406 && !this.config.handleContentNegotiation) {
            return true;
        }
        ctx.status(responseObject.status || 200);
        Object.keys(otherHeaders).forEach(k => {
            ctx.res.set(k, otherHeaders[k]);
        });
        if (responseObject.body !== undefined) {
            ctx.body = new Buffer(responseObject.body);
        }
    }
    sendError(errors, ctx) {
        API_1.default.responseFromError(errors, ctx.headers.accept).then((responseObject) => this.sendResources(responseObject, ctx)).catch((err) => {
            ctx.throw(err.message, err.status);
        });
    }
}
exports.default = KoaStrategy;
