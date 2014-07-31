require! ['./Resource']

class ErrorResource extends Resource
  (id, attrs, @links, @href) ~>
    super("errors", id, attrs, @links, @href)

  _validateType: (type) ->
    throw new Error("type must be errors") if type != "errors"

  _coerceAttrs: (attrs) ->
    if attrs?
      ["code" "status"].forEach(-> 
        if attrs[it]? then attrs[it] = String(attrs[it]).toString!
      )
    attrs

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
    attrs =
      status: err.status || err.statusCode || 500
      detail: err.message

    # other valid json api props
    ["code" "title" "path"].forEach(->
      if err[it]?
        attrs[it] = err[it]
    );

    new this(err.id, attrs, err.links, err.href)

module.exports = ErrorResource