
require! [\mongoose \../types/Resource \../types/Collection  \../types/ErrorResource \../util/advice \Q];

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
    # have to do a qb.find below, not qb.in,
    # as mongoose doesn't intercept `in` to
    # handle id casting, but it does for `find`
    @queryBuilder
      ..find({'_id': {'$in': ids}})

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

  limitTo: (limit) ->
    @queryBuilder
      ..limit(limit)
  
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
    qb = @queryBuilder
    p = Q(@queryBuilder.exec!)
    # Add errorHandler here for simplicity, because we don't know which `then`s we're
    # going to register below. E.g. if we did .then(@~afterQuery, @~errorHandler), it
    # wouldn't be registered for a create (POST) request. But if we added both
    # .then(@~afterQuery, @~errorHandler) & .then(@~beforeSave, @~errorHandler), the
    # errorHandler, which is meant for query errors, would catch @~afterQuery errors 
    # on findOneAndRemove style queries (which run the bepore and after handlers).
    p .= then(-> it, @~errorHandler)
    p .= then(@~afterQuery) if @queryBuilder.op is /^find/ # do this first.
    p .= then(@~beforeSave) if @queryBuilder.op is /(update|modify|remove)/
    p

  # Responsible for generating a sendable Error Resource if the query threw an Error
  errorHandler: (err) ->
    new ErrorResource(null, {
      "title": "An error occurred while trying to find, create, or modify the requested resource(s)."
    })

  afterQuery: (docs) ->
    if !docs
      return new ErrorResource(null, {status: 404, title:"No matching resources found"})

    makeCollection = docs instanceof Array
    docs = [docs] if !makeCollection
    docs .= map(~> @@docToResource(it, @model.collection.name))
    if makeCollection then new Collection(docs) else docs[0]

  # The momngoose conversion logic.
  # Useful to have as a pure function 
  # for calling it as a utility outside this class.
  @docToResource = (doc, type) ->
    attrs = doc.toObject!
    delete attrs['_id', '__v']
    new Resource(type, doc.id, attrs);

module.exports = MongooseAdapter