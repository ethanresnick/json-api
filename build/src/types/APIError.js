"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let nonEnumerable = { writable: true, enumerable: false };
class APIError extends Error {
    constructor(...args) {
        super();
        Object.defineProperty(this, "_status", nonEnumerable);
        Object.defineProperty(this, "_code", nonEnumerable);
        Object.defineProperty(this, "status", {
            enumerable: true,
            get: () => this._status,
            set: (value) => {
                if (typeof value !== "undefined" && value !== null) {
                    this._status = String(value);
                }
                else {
                    this._status = value;
                }
            }
        });
        Object.defineProperty(this, "code", {
            enumerable: true,
            get: () => this._code,
            set: (value) => {
                if (typeof value !== "undefined" && value !== null) {
                    this._code = String(value);
                }
                else {
                    this._code = value;
                }
            }
        });
        [this.status, this.code, this.title, this.detail, this.links, this.paths] = args;
    }
    toJSON() {
        return Object.assign({}, this);
    }
    static fromError(err) {
        const fallbackTitle = "An unknown error occurred while trying to process this request.";
        const ErrorConstructor = this || APIError;
        if (err instanceof APIError) {
            return err;
        }
        else if (err.isJSONAPIDisplayReady) {
            return new ErrorConstructor(err.status || err.statusCode || 500, err.code, err.title || fallbackTitle, err.details || (err.message ? err.message : undefined), err.links, err.paths);
        }
        else {
            return new ErrorConstructor(500, undefined, fallbackTitle);
        }
    }
}
exports.default = APIError;
