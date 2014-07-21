require! ['./ResourceType']

class Resource
  (type, id, attrs, @links, @href) ~>
    # set manually, unlike @links and @href,
    # to trigger the validation checks and
    # create the @_type etc props.
    [@type, @id, @attrs] = [type, id, attrs];

  attrs:~
    -> @_attrs
    (attrs) ->
      if attrs?
        throw new Error("attrs must be an object") if typeof! attrs != \Object
        ["id", "type", "href", "links"].forEach(->
          # todo validate nested objs in attrs
          throw new Error(it + " is an ivalid attribute name") if attrs[it]?
        )
      @_attrs = attrs

  type:~
    -> @_type
    (type) ->
      @_validateType(type)
      @_type = type;

  id:~
    -> @_id
    (id) -> 
      if id? and /^[A-Za-z0-9\-\_]+$/ != id
        throw new Error("Invalid id") 
      @_id = String(id).toString!

  _validateType: (type) ->
    throw new Error("type is required") if not type?
    throw new Error("type must be a ResourceType instance") if type not instanceof ResourceType

module.exports = Resource