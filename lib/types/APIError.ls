class APIError extends Error
  (status, code, @title, @detail, @links, @paths) ~>
    # set manually, unlike @title etc, to trigger the 
    # validation checks and create the @_status etc props.
    [@status, @code] = [status, code];

  status:~
    -> @_status
    (status) ->
      @_status = String(status).toString! if status != null

  code:~
    -> @_code
    (code) ->
      @_code = String(code).toString! if code != null

  /**
   * Creates a JSON-API Compliant Error Object from a JS Error object
   *
   * Note: the spec allows error objects to have arbitrary properties 
   * beyond the ones for which it defines a meaning (ie. id, href, code,
   * status, path, etc.), but this function strips out all such properties
   * in order to offer a neater result (as JS error objects often contain
   * all kinds of crap).
   */
  @fromError = (err) ->
    new this(
      err.status || err.statusCode || 500,
      err.code,     # most of the parameters below
      err.title,    # will probably be null/undefined,
      err.message,  # but that's fine.
      err.links,
      err.paths
    )

module.exports = APIError