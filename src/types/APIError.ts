export type APIErrorJSON = {
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  links?: any;
  paths?: any;
}

export type Opts = {
  status?: string | number;
  code?: string | number;
  title?: string;
  detail?: string;
  links?: object;
  paths?: string[];
};

// TODO: refactor args list to be:
// constructor(title, status, [code, detail, links, paths])
// This matches the standard Error constructor and makes sense intuitively.
// TODO: turn on noImplicitAny, fix errors
export default class APIError extends Error {
  public status?: string;
  public code?: string;
  public title?: string;
  public detail?: string;
  public links?: any;
  public paths?: any;

  constructor(opts: Opts);
  constructor(
    status?: Opts['status'], code?: Opts['code'], title?: Opts['title'],
    detail?: Opts['detail'], links?: Opts['links'], paths?: Opts['paths']
  );
  constructor(...args) {
    super();

    // Use a Proxy to handle coercing status, code etc.
    // to strings on set (including below in the constructor).
    // Because we're setting the validated properties directly on obj,
    // ownKeys will work correctly.
    const res = new Proxy(this, {
      set(obj, prop, value) {
        const coercePropToString =
          ["status", "code", "title", "detail"].indexOf(<string>prop) > -1;

        obj[prop] = coercePropToString
          ? (value == null ? undefined : String(value))
          : value;

        return true;
      }
    });

    // Construct from object format
    if(args.length === 1 && typeof args[0] === 'object') {
      Object.assign(res, args[0]);
    }

    // Construct from list of arguments
    else {
      [res.status, res.code, res.title, res.detail, res.links, res.paths] = args;
    }

    return res;
  }

  toJSON(): APIErrorJSON {
    return {...(this as object)};
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
        err.detail || err.details || (err.message ? err.message : undefined),
        err.links,
        err.paths
      );
    }

    // Otherwise, we just show a generic error message.
    else {
      return new ErrorConstructor({ status: 500, title: fallbackTitle });
    }
  }
}
