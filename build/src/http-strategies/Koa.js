"use strict";
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
        if (responseObject.headers.vary) {
            vary_1.default(ctx.res, responseObject.headers.vary);
        }
        if (responseObject.status === 406 && !this.config.handleContentNegotiation) {
            return true;
        }
        ctx.set("Content-Type", responseObject.contentType);
        ctx.status = responseObject.status || 200;
        if (responseObject.headers.location) {
            ctx.set("Location", responseObject.headers.location);
        }
        if (responseObject.body !== null) {
            ctx.body = new Buffer(responseObject.body);
        }
    }
    sendError(errors, ctx) {
        API_1.default.responseFromExternalError(errors, ctx.headers.accept).then((responseObject) => this.sendResources(responseObject, ctx)).catch((err) => {
            ctx.throw(err.message, err.status);
        });
    }
}
exports.default = KoaStrategy;
