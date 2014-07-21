require! ['./Resource']

class ErrorResource extends Resource
  (type, id, attrs, @links, @href) ~>
    super(...)

  _validateType: (type) ->
    throw new Error("type name must be errors") if type.name != "errors"

module.exports = ErrorResource