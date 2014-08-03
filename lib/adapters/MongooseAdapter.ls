
require! [\mongoose \mongoose/lib/utils \../types/Resource \../types/Collection  \../types/ErrorResource \../util/advice \Q];

class MongooseAdapter
  (@model, @options) ->
    # find the names of all the paths in the
    # schema that refer to other models
    @refPaths = @@getReferencePaths(@model);
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
      ..where({(prop): val})

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
    @refPaths.forEach(~> 
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
    if !docs # if docs is an empty array, we don't 404: https://github.com/json-api/json-api/issues/101
      return new ErrorResource(null, {status: 404, title:"No matching resource found."})

    makeCollection = docs instanceof Array
    docs = [docs] if !makeCollection
    docs .= map(~> @@docToResource(it, @model.collection.name, @refPaths))
    if makeCollection then new Collection(docs, null, @model.collection.name) else docs[0]

  # The momngoose conversion logic.
  # Useful to have as a pure function for calling it as a utility outside this class.
  @docToResource = (doc, type, refPaths) ->
    # Get and clean up attributes
    attrs = doc.toObject!
    delete attrs['_id', '__v']

    # Build Links
    links = {}
    refPaths.forEach((path) ->
      # get value at the path w/ the reference, in the json'd + full docs.
      pathParts = path.split('.')
      valAtPath = pathParts.reduce(((obj, part) -> obj[part]), doc)
      jsonValAtPath = pathParts.reduce(((obj, part) -> obj[part]), attrs)

      # delete the attribute, since we're moving it to links (or, if it
      # doesn't link to anything, just removing it)
      lastPathPart = pathParts[*-1]
      containingPathParts = pathParts.slice(0, pathParts.length-1);
      containerVal = containingPathParts.reduce(((obj, part) -> obj[part]), attrs)
      delete containerVal[lastPathPart]

      # if there's a toOne relationship with no value in it, or a toMany
      # with an empty array, skip building a links key for it
      if !valAtPath or (valAtPath instanceof Array and valAtPath.length == 0)
        return

      # Now, if valAtPath is a single id or populated doc, we're going 
      # to replace it with a single (full or stubbed) Resource object
      # in the `links` key for the resource returned by this function.
      # Similarly, if valAtPath is an array of ids or populated docs,
      # we're going to build an array of Resource objects (which we'll
      # ultimately turn into a Collection). But, to make our lives simpler
      # (so we don't have separate code for toMany and toOne relationships),
      # let's coerce valAtPath to always hold an array of ids/docs and just 
      # keep track of whether to convert back to a single val at the end.
      isToOneRelationship = false
      if not (valAtPath instanceof Array)
        valAtPath = [valAtPath]
        jsonValAtPath = [jsonValAtPath];
        isToOneRelationship = true

      # fill the links for this path.
      resources = []
      valAtPath.forEach((docOrId, i) ~> 
        # if the referenced document was populated, build a full resource for it
        if(docOrId instanceof mongoose.Document)
          model = docOrId.constructor
          type  = model.collection.name
          resources.push(@@docToResource(docOrId, type, @@getReferencePaths(model)))

        # otherwise, we just have an id, so we make a stub resource (one w/o attrs)
        else
          # docOrId might be an OId here, so use jsonValAtPath,
          # which will have been converted to a string.
          id = jsonValAtPath[i]
          type = do ->
            # finding the type is hell. We have to go back into 
            # the schema for the parent document, find the current
            # path, and look at its `ref` field. Then we find the
            # associated model and inspect its collection name.
            schemaType = doc.constructor.schema.path(path)
            ref = (schemaType.caster || schemaType).options?.ref
            utils.toCollectionName(ref)
          resources.push(new Resource(type, id))
      );

      # flatten if neccessary; otherwise, formally turn it into a collection.
      links[path] = if isToOneRelationship then resources[0] else new Collection(resources)
    );

    # Return the resource
    new Resource(type, doc.id, attrs, links if refPaths.length);

  @getReferencePaths = (model) ->
    paths = []
    model.schema.eachPath((name, type) ~> 
      paths.push(name) if (type.caster || type).options?.ref
    );
    paths

module.exports = MongooseAdapter