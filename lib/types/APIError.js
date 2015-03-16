import polyfill from "babel/polyfill"

export default class APIError extends Error {
  constructor(status, code, title, detail, links, paths) {
    [this.status, this.code, this.title, this.detail, this.links, this.paths] = Array.from(arguments);
  }

  get status() {
    return this._status;
  }

  set status(status) {
    if(typeof status !== "undefined" && status !== null) {
      this._status = String(status).toString();
    }
    else {
     this._status = status;
    }
  }

  get code() {
    return this._code;
  }

  set code(code) {
    if(typeof code !== "undefined" && code !== null) {
      this._code = String(code).toString();
    }
    else {
     this._code = code;
    }
  }

  /**
   * Creates a JSON-API Compliant Error Object from a JS Error object
   *
   * Note: the spec allows error objects to have arbitrary properties 
   * beyond the ones for which it defines a meaning (ie. id, href, code,
   * status, path, etc.), but this function strips out all such properties
   * in order to offer a neater result (as JS error objects often contain
   * all kinds of crap).
   */
  static fromError(err) {
    return new APIError(
      err.status || err.statusCode || 500,
      err.code,     // most of the parameters below
      err.title,    // will probably be null/undefined,
      err.message,  // but that's fine.
      err.links,
      err.paths
    );
  }
}