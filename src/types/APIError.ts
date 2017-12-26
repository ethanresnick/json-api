const nonEnumerable = {writable: true, enumerable: false};

export type APIErrorJSON = {
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  links?: any;
  paths?: any;
}

// TODO: refactor args list to be:
// constructor(title, status, [code, detail, links, paths])
// This matches the standard Error constructor and makes sense intuitively.
// TODO: turn on noImplicitAny, fix errors
// TODO: Define, for every type, a type for its structure as JSON, like we have for Document?
export default class APIError extends Error {
  public status?: string;
  public code?: string;
  public title?: string;
  public detail?: string;
  public links?: any;
  public paths?: any;
  private _status?: string;
  private _code?: string;

  constructor(...args) {
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
        if(typeof value !== "undefined" && value !== null) {
          this._code = String(value);
        }
        else {
          this._code = value;
        }
      }
    });

    [this.status, this.code, this.title, this.detail, this.links, this.paths] = args;
  }

  toJSON(): APIErrorJSON {
    // Intentionally not using {...this}.
    // See https://github.com/Microsoft/TypeScript/issues/10727
    return Object.assign({}, this); //tslint:disable-line:prefer-object-spread
  }

  /**
   * Creates a JSON-API Compliant Error Object from a JS Error object
   *
   */
  static fromError(err) {
    const ErrorConstructor = this || APIError; // in case `this` isn't bound.
    const fallbackTitle =
      "An unknown error occurred while trying to process this request.";

    if(err instanceof APIError) {
      return err;
    }

    // If the error is marked as ready for JSON API display, it's secure
    // to read values off it and show them to the user. (Note: most of
    // the args below will probably be null/undefined, but that's fine.)
    else if(err.isJSONAPIDisplayReady) {
      return new ErrorConstructor(
        err.status || err.statusCode || 500,
        err.code,
        err.title || fallbackTitle,
        err.details || (err.message ? err.message : undefined),
        err.links,
        err.paths
      );
    }

    // Otherwise, we just show a generic error message.
    else {
      return new ErrorConstructor(500, undefined, fallbackTitle);
    }
  }
}
