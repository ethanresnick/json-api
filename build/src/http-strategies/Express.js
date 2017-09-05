"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vary = require("vary");
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
        if (responseObject.headers.vary) {
            vary(res, responseObject.headers.vary);
        }
        if (!responseObject.contentType) {
            if (this.config.handleContentNegotiation) {
                res.status(406).send();
            }
            else {
                next();
            }
        }
        else {
            res.set("Content-Type", responseObject.contentType);
            res.status(responseObject.status || 200);
            if (responseObject.headers.location) {
                res.set("Location", responseObject.headers.location);
            }
            if (responseObject.body !== null) {
                res.send(new Buffer(responseObject.body)).end();
            }
            else {
                res.end();
            }
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
