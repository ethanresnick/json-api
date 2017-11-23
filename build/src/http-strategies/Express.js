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
const varyLib = require("vary");
const API_1 = require("../controllers/API");
const Base_1 = require("./Base");
class ExpressStrategy extends Base_1.default {
    constructor(apiController, docsController, options) {
        super(apiController, docsController, options);
    }
    docsRequest(req, res, next) {
        this.buildRequestObject(req, req.protocol, req.host, req.params, req.query).then((requestObject) => {
            return this.docs.handle(requestObject, req, res).then((responseObject) => {
                this.sendResources(responseObject, res, next);
            });
        }).catch((err) => {
            this.sendError(err, req, res);
        });
    }
    sendResources(responseObject, res, next) {
        const _a = responseObject.headers, { vary } = _a, otherHeaders = __rest(_a, ["vary"]);
        if (vary) {
            varyLib(res, vary);
        }
        if (responseObject.status === 406 && !this.config.handleContentNegotiation) {
            return next();
        }
        res.status(responseObject.status || 200);
        Object.keys(otherHeaders).forEach(k => {
            res.set(k, otherHeaders[k]);
        });
        if (responseObject.body !== undefined) {
            res.send(new Buffer(responseObject.body)).end();
        }
        else {
            res.end();
        }
    }
    sendError(errors, req, res) {
        API_1.default.responseFromExternalError(errors, req.headers.accept).then((responseObject) => this.sendResources(responseObject, res, () => { })).catch((err) => {
            res.status(err.status).send(err.message);
        });
    }
    apiRequest(req, res, next) {
        return this.apiRequestWithTransform(undefined, req, res, next);
    }
    transformedAPIRequest(queryTransform) {
        return this.apiRequestWithTransform.bind(this, queryTransform);
    }
    apiRequestWithTransform(queryTransform, req, res, next) {
        queryTransform = queryTransform && queryTransform.length > 1
            ? queryTransform.bind(undefined, req)
            : queryTransform;
        this.buildRequestObject(req, req.protocol, req.host, req.params, req.query).then((requestObject) => {
            return this.api.handle(requestObject, req, res, queryTransform).then((responseObject) => {
                this.sendResources(responseObject, res, next);
            });
        }).catch((err) => {
            this.sendError(err, req, res);
        });
    }
}
exports.default = ExpressStrategy;
