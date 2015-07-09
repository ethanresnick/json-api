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
    const fallbackTitle = "An unknown error occurred while trying to process this request.";

    if(err instanceof APIError) {
      return err;
    }

    // If the error is marked as ready for JSON API display, it's secure
    // to read values off it and show them to the user. (Note: most of
    // the args below will probably be null/undefined, but that's fine.)
    else if(err.isJSONAPIDisplayReady) {
      return new APIError(
        err.status || err.statusCode || 500,
        err.code,
        err.title || fallbackTitle,
        err.details || err.message,
        err.links,
        err.paths
      );
    }

    // Otherwise, we just show a generic error message.
    else {
      return new APIError(500, undefined, fallbackTitle)
    }

  }
}
