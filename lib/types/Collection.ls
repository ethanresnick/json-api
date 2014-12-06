class Collection
  (@resources, @href, type) ~>  
    # it is possible to have an empty collection, which still must
    # have a type (https://github.com/json-api/json-api/issues/101),
    # so (annoyingly) we can't rely on just reading resource 0.
    @type = type || @resources?[0]?.type

  ids:~
    -> @resources.map((.id))

  size:~
    -> @resources.length


module.exports = Collection