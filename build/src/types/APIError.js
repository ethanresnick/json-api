"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const depd = require("depd");
const deprecate = depd("json-api");
exports.displaySafe = Symbol('isJSONAPIDisplayReady');
class APIError extends Error {
    constructor(...args) {
        super();
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor || APIError);
        }
        const res = new Proxy(this, {
            set(obj, prop, value) {
                const coercePropToString = ["status", "code", "title", "detail"].indexOf(prop) > -1;
                obj[prop] = coercePropToString
                    ? (value == null ? undefined : String(value))
                    : value;
                return true;
            }
        });
        if (args.length === 1 && typeof args[0] === 'object') {
            Object.assign(res, args[0]);
        }
        else {
            [res.status, res.code, res.title, res.detail, res.links, res.paths] = args;
        }
        return res;
    }
    toJSON() {
        return Object.assign({}, this);
    }
    static fromError(err) {
        const ErrorConstructor = this || APIError;
        const fallbackTitle = "An unknown error occurred while trying to process this request.";
        if (err instanceof APIError) {
            return err;
        }
        else if (err[exports.displaySafe] || err.isJSONAPIDisplayReady) {
            if (err.isJSONAPIDisplayReady) {
                deprecate("isJSONAPIDisplayReady magic property: " +
                    "use the APIError.displaySafe symbol instead.");
            }
            return new ErrorConstructor(err.status || err.statusCode || 500, err.code, err.title || fallbackTitle, err.detail || err.details || (err.message ? err.message : undefined), err.links, err.paths);
        }
        else {
            return new ErrorConstructor({ status: 500, title: fallbackTitle });
        }
    }
}
exports.default = APIError;
