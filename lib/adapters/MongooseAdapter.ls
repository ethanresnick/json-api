require! [\mongoose \../types/Resource \../types/Collection \../util/advice];

class MongooseAdapter
  (@model, @options) ->
    # find the names of all the paths in the
    # schema that refer to other models
    @refPaths = [];
    @model.schema.eachPath((name, type) -> 
      @refPaths.push(name) if type.options.ref?
    );

    @queryBuilder = new mongoose.Query(null, null, @model, @model.collection)

  # put the qb into the proper mode.
  # valid options are: find, findOne, update,
  # remove, findOneAndModify, findOneAndRemove.
  mode: ->
    @queryBuilder
      ..[mode]!

  any: ->
    @queryBuilder
      ..find!

  withId: (id) ->
    @queryBuilder
      ..findOne({'_id': id})

  withIds: (ids) ->
    @queryBuilder
      ..in('_id', [ids])

  withProperty: (prop, val) ->
    @queryBuilder
      ..where({prop: val})

  onlyFields: (fields) ->
    # assumes that, in your shchema, you haven't 
    # forced any fields to appear. reasonable.
    @queryBuilder
      ..select(fields.join(' '))

    # if we're fitering and haven't explicitly 
    # included id, we need to explicitly remove
    # it, since mongoose often includes it anyway
    if 'id' not in fields
      origAfter = @afterQuery
      @afterQuery = (docs) ->
        result = origAfter(...)
        if result instanceof Collection
          result.resources.map((resource) -> resource.id = void)
        else
          result.id = void
        result

    @queryBuilder
  
  includeLinked: (paths) ->
    # a path might point to a property that's not in this
    # model's schema. E.g. on a BlogPost resource, the
    # path could be comments.author, but the BlogPost
    # will only know about the `comments` part of the path.
    @refPaths.forEach(-> 
      for path, i in paths when (path.substr(0, it.length) == it)
        pathExtra = path.substr(it.length + 1) # remove next dot
        @queryBuilder.populate(({}
          ..path = it
          ..select = pathExtra if pathExtra
        ))
        # removed matched path so we don't check it next time.
        paths.splice(i, 1);
        continue
    )

    # if there were errors, in the form of unmatcheable paths...
    # try to populate those paths anyway, so mongoose will throw
    # an error when the query is actually executed
    if(paths.length)
      paths.forEach(-> @queryBuilder.populate(path: it))

    @queryBuilder


  /**
   * @param sorts array An array of field names to sort on.
   * Ascending is the default sort; prefix the field name with
   * a - to sort descending.
   */
  sort: (sorts) ->
    @queryBuilder.sort(sorts.join(' '))

  promise: ->
    p = @queryBuilder.exec!#.then(-> console.log(it); it)
    p .= then(@~afterQuery) if @queryBuilder.op is /^find/ # do this first.
    p .= then(@~beforeSave) if @queryBuilder.op is /(update|modify|remove)/
    p

  afterQuery: (docs) ->
    makeCollection = docs instanceof Array
    docs = [docs] if !makeCollection
    docs .= map(~>
      type = @model.collection.name
      id   = it.id
      attrs = it.toObject!
      delete attrs['_id', '__v']
      new Resource(type, id, attrs);
    )
    if makeCollection then new Collection(docs) else docs[0]

module.exports = MongooseAdapter