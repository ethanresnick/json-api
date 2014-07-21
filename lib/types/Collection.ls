class Collection
  (@resources, @_href) ~>  

  ids:~
    -> @resources.map((.id))

  type:~
    -> @resources[0].type

  href:~
    -> @_href || (-> 'something dynamic')
    (href) -> @_href = href;


module.exports = Collection