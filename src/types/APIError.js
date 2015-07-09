let nonEnumerable = {writable: true, enumerable: false};

export default class APIError extends Error {
  /*eslint-disable no-unused-vars */
  constructor(status, code, title, detail, links, paths) {
    super();

    // Hack around lack of proxy support and default non-enumerability
    // of class accessor properties, while still giving us validation.
    Object.defineProperty(this, "_status", nonEnumerable);
    Object.defineProperty(this, "_code", nonEnumerable);
    Object.defineProperty(this, "status", {
      enumerable: true,
      get: () => this._status,
      set: (value) => {
        if(typeof value !== "undefined" && value !== null) {
          this._status = String(value).toString();
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
        if(typeof value !== "undefined" && value !== null) {
          this._code = String(value).toString();
        }
        else {
          this._code = value;
        }
      }
    });

    [this.status, this.code, this.title, this.detail, this.links, this.paths] = Array.from(arguments);
  }
  /*eslint-enable */

  /**
   * Creates a JSON-API Compliant Error Object from a JS Error object
   *
   */
  static fromError(err) {
    if(err instanceof APIError) {
      return err;
    }

    const title = err.title
      || (err.isJSONAPIDisplayReady && err.message)
      || "An unknown error occurred while trying to process this request.";

    // most of the args below will probably be null/undefined, but that's fine.
    return new APIError(
      err.status || err.statusCode || 500,
      err.code,
      title,
      err.message || err.details,
      err.links,
      err.paths
    );
  }
}
