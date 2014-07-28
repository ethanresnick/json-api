require! ['./Resource']

class ErrorResource extends Resource
  (id, attrs, @links, @href) ~>
    super("errors", id, attrs, @links, @href)

  _validateType: (type) ->
    throw new Error("type must be errors") if type != "errors"

  _coerceAttrs: (attrs) ->
    ["code" "status"].forEach(->
      if attrs[it]?
        attrs[it] = String(attrs[it]).toString!
    )
    attrs
module.exports = ErrorResource