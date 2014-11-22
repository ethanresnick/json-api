require! [\../util/utils]

class Resource
  (type, id, attrs, @links, @href) ~>
    # set manually, unlike @links and @href, to trigger the 
    # validation checks and create the @_type etc props.
    [@type, @id, @attrs] = [type, id, attrs];

    # A resource can be of more than one type (e.g. a Horse resource is also
    # an Animal resource). So we use this class's `type` property to store the
    # type we'll present the resource to the user as (e.g. we'll present it as
    # an animal if they request all animals), while using `processAsType` to 
    # track which resource type's pre-render proccessing should be invoked.
    # By default, `processAsType` === `type`.
    @processAsType = type

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