require! ['./Resource']

class ErrorResource extends Resource
  (id, attrs, @links, @href) ~>
    @type = "errors"
    super(...)

  _validateType: (type) ->
    throw new Error("type must be errors") if type != "errors"

module.exports = ErrorResource