class Collection
  (@resources, @_href, type) ~>  
    # it is possible to have an empty collection, which still must
    # have a type (https://github.com/json-api/json-api/issues/101),
    # so (annoyingly) we can't rely on just reading resource 0.
    @type = if @resources[0] then @resources[0].type else type

  ids:~
    -> @resources.map((.id))

  href:~
    -> @_href || (-> 'something dynamic')
    (href) -> @_href = href;


module.exports = Collection