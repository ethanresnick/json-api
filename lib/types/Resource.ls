require! [\../util/utils]

class Resource
  (type, id, attrs, @links, @href) ~>
    # set manually, unlike @links and @href, to trigger the 
    # validation checks and create the @_type etc props.
    [@type, @id, @attrs] = [type, id, attrs];

  removeAttr: (attrPath) ->
    utils.deleteNested(attrPath, @_attrs) if @attrs?

  attrs:~
    -> @_attrs
    (attrs) ->
      @_validateAttrs(attrs)
      @_attrs = @_coerceAttrs(attrs)

  type:~
    -> @_type
    (type) ->
      @_validateType(type)
      @_type = type;

  id:~
    -> @_id
    (id) ->
      @_id = if id? then String(id).toString! else null

  _coerceAttrs: (attrs) -> attrs # No coercion by default; subclasses may override.

  _validateAttrs: (attrs) ->
    if attrs? 
      throw new Error("if present, attrs must be an object") if typeof! attrs != \Object

      ["id", "type", "href", "links"].forEach(->
        # todo validate nested objs in attrs
        throw new Error(it + " is an ivalid attribute name") if attrs[it]?
      )

  _validateType: (type) ->
    throw new Error("type is required") if not type

module.exports = Resource