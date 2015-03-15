require! {
  Q:\q, \mongoose, prelude:\prelude-ls, defaultInflector: 'pluralize',
  \../types/Resource, \../types/Collection, \../types/APIError,
  \../util/utils
}

class MongooseAdapter
  (models, inflector, idGenerator) ->
    @models = models || mongoose.models
    @inflector = inflector || defaultInflector
    @idGenerator = idGenerator

  /**
   * Returns a Promise for an array or resources. The first item in the 
   * promised array is the primary Resource or Collection being looked up.
   * The second item is an array of "extra resources". See the comments within
   * this method for a description of those.
   * 
   * Note: The correct behavior if idOrIds is an empty array is to return no
   * documents, as happens below. If it's undefined, though, we're not filtering
   * by id and should return all documents.
   */
  find: (type, idOrIds, filters, fields, sorts, includePaths) ->
    model = @getModel(@@getModelName(type))
    refPaths = @@getReferencePaths(model)
    queryBuilder = new mongoose.Query(null, null, model, model.collection)
    pluralize = @inflector.plural

    # findById(s) or find all
    if idOrIds
      switch typeof idOrIds
      | "string" =>
        idQuery = idOrIds
        mode = "findOne"
      | otherwise =>
        idQuery = {'$in':idOrIds}
        mode = "find"
      queryBuilder[mode]({'_id': idQuery})
    else
      queryBuilder.find!

    # add where clauses
    queryBuilder.where(filters) if typeof! filters is "Object"

    # functionally, escape fields for security. Create mongoose `select` 
    # objects, rather than passing the user's strings, so that the user 
    # can't prefix a field with a minus on input to affect the query.
    # See http://mongoosejs.com/docs/api.html#query_Query-select.
    for key of fields
      fields[key] = fields[key].reduce(((prev, curr) -> prev[curr] = 1; prev), {})

    # limit returned fields
    # note that with this sparse fieldset handling, id/links may be included
    # in the returned document anyway, even if the user doesn't ask for it
    # specifically, as that's the mongoose default. But that's fine. 
    # See: https://github.com/json-api/json-api/issues/260
    queryBuilder.select(fields[type]) if fields[type] instanceof Array

    # setup sorting
    queryBuilder.sort(sorts.join(' ')) if sorts instanceof Array

    # handle includes
    if includePaths
      extraResources = {}
      extraFieldsToRefTypes= {}
      extraDocumentsPromises = []
      duplicateQuery = queryBuilder.toConstructor!
      includePaths .= map(-> it.split('.'))

      for pathParts in includePaths
        continue if pathParts[0] not in @@getReferencePaths(model)

        # We have two basic cases. First: including linked objects that are 
        # direct properties of the resources we're returning. Handling these is
        # easy: we just populate the path (below), and then (later) the 
        # @@docToResource code can turn it into a Resource object that's linked
        # to the Resource representing the primary document.
        if pathParts.length == 1
          refType = @@getType(@@getReferencedModelName(model, pathParts[0]), pluralize)

          # There's one special case we have to account for before populating,
          # though, which is: the current pathParts may start with a field 
          # that's been excluded from the primary resources. E.g. a request for 
          # /people?fields=name&include=address requires us to populate 
          # person.address but then ultimately not include the address in the
          # generated Resource object. So, if that's the case:
          if (fields[type] and pathParts[0] not in fields[type])
            # We start by re-including the field in our query, enabling population.
            queryBuilder.select(pathParts[0])

            # Then we flag the field by adding it to extraFieldsToRefTypes.
            # This will let us remove it from the resource but still return it 
            # as an external resource (i.e. a resource that's part of the
            # "linked" bag *even though* it's not directly connected to any of
            # the returned primary resources, because the field showing the
            # connection was excluded).
            extraFieldsToRefTypes[pathParts[0]] = refType

          # Finally, do the population
          populateArgs = {}
            ..\path = pathParts[0]
            ..\select = fields[type] if fields[type]
          queryBuilder.populate(populateArgs)


        # Then, we have another case of include paths in which the resources
        # included won't, in our final API response, be directly linked to any
        # of the primary Resources we're returning. This is when we have includes 
        # that point to paths that aren't directly on this object (e.g. a post 
        # including comments.author). We handle this (really inefficiently) below.
        else
          do ~>
            lastModelName = model.modelName
            extraDocumentsPromises.push(pathParts.reduce(
              (resourcePromises, part) ~>
                resourcePromises.then((resources) ~>
                  if resources
                    # update model
                    lastModelName := @@getReferencedModelName(@getModel(lastModelName), part)

                    # type
                    type = @@getType(lastModelName, pluralize)
                    populateArgs = {}
                      ..\path = part
                      ..\select = fields[type] if fields[type]

                    # populate this nested path
                    Q.npost(
                      @getModel(lastModelName), 
                      "populate", 
                      [resources, populateArgs]
                    );
                ).then(-> 
                  # if this population was empty, just stop
                  return it if !it or (it instanceof Array and !it.length)

                  # for the next population, we need to have a single doc or an array
                  # of docs. And we need to filter what we're getting in based on the
                  # currend path part (that's the reduce). So if the input (it) isn't 
                  # an array (i.e it's a single doc), we just return it[part], which 
                  # will, as needed, be a single doc (if it's a to-one relationship) 
                  # or an array (if it's a to-many).
                  if it not instanceof Array 
                    it[part]
                  # but, if `it` is an array, then it[part] could also be an array
                  # (from a to-many relationship), so just returning it.map(-> it[part])
                  # could leave a nested array, which is unacceptable for the next 
                  # population. So, in that case, we also flatten (with reduce).
                  else
                    flatten = it[0][part] instanceof Array
                    mapped = it.map(-> it[part])
                    if flatten then mapped.reduce((a,b)-> a.concat(b)) else mapped
                )
              # below, .select(pathParts[0]) handles the case that the direct 
              # property was excluded, similar to what we had to do above.
              , Q(duplicateQuery().select(pathParts[0]).exec!))
              .then((resources) ~>
                return {} if !resources
                # rather than just returning the populated resources at this 
                # path, return an object with {"type", "resources"} keys where
                # type identifies the type of these resources from the schema,
                # which is more reliable than just reading the type of the first
                # resource--as that could be a sub-type of the refType.
                {"type": @@getType(lastModelName, pluralize), "docSet": resources}
              )
            );
      
      # A little helper for the below
      addDocAsExternalResource = (doc, collectionType) ~>
        # don't add empty references or duplicate docs.
        if doc && !extraResources[collectionType].some(-> it.id == doc.id)   
          extraResources[collectionType].push(@@docToResource(doc, pluralize)) 

      # use extraFieldsToRefTypes to put extra, populated fields into 
      # extraResources (as resources) & remove them from the primary documents
      primaryDocumentsPromise = Q(queryBuilder.exec!)
        .then((docs) ~>
          utils.forEachArrayOrVal(docs, (doc) ->
            for field, refType of extraFieldsToRefTypes
              extraResources[refType] = [] if not extraResources[refType]

              # if it's a to-one relationship, doc[field] will be a doc or undefined;
              # if it's a toMany relationship, we have an array (or undefined). Either
              # way, we want to convert any docs in docs[field] to resources and store
              # them, so we always coerce it to an array.
              refDocs = if doc[field] instanceof Array then doc[field] else [doc[field]]
              refDocs.forEach(-> addDocAsExternalResource(it, refType))
              doc[field] = undefined
            void
          )
          docs
        )

      extraResourcesPromise = Q.all(extraDocumentsPromises)
        .then((docSets) ~>
          # add docs from these extra queries to extraResources
          for {type, docSet} in docSets
            extraResources[type] = [] if !extraResources[type]

            # Add the docs.
            docSet = [docSet] if docSet not instanceof Array
            docSet.forEach(-> addDocAsExternalResource(it, type))

          # and then, when the primaryDocuments promise has put its
          # resources into extraResources too, return them as promised
          primaryDocumentsPromise.then(-> extraResources)
        )

    else
      primaryDocumentsPromise = Q(queryBuilder.exec!)
      extraResourcesPromise = Q(undefined)

    # convert primary docs to resources/collections, which isn't needed for
    # extraResources--they're already resources and aren't supposed to be collections.
    primaryResourcesPromise = primaryDocumentsPromise.then(-> 
      @@docsToResourceOrCollection(it, type, pluralize)
    )

    Q.all([primaryResourcesPromise, extraResourcesPromise])
      .catch(-> [@@errorHandler(it), undefined])

  # Create one or more docs.
  create: (resourceOrCollection) ->
    # since we're not allowing sideposting/comment ids,
    # (the spec is still too tentative on how to do that)
    # we know that we just have to iterate over the passed
    # in resources and go through their links non-recursively.
    model = @getModel(@@getModelName(resourceOrCollection.type))

    # turn the resource or collection into (an array of) plain objects
    docs = utils.mapResources(resourceOrCollection, @@resourceToPlainObject)

    # use id generator to set id, if a custom generator was provided
    generator = @idGenerator
    if typeof generator is "function"
      utils.forEachArrayOrVal(docs, (doc) -> 
        doc._id = generator(doc); void
      )

    Q.ninvoke(model, "create", docs).then(
      (~> @@docsToResourceOrCollection(it, resourceOrCollection.type, @inflector.plural)), 
      @@errorHandler
    )

  update: (type, idOrIds, changeSets) ->
    # It'd be faster to bypass Mongoose Document creation & just have mongoose
    # send a findAndUpdate command directly to mongo, but we want Mongoose's
    # standard validation and lifecycle hooks, and so we have to find first, 
    # then update.
    model = @getModel(@@getModelName(type))
    switch typeof idOrIds
      | "string" =>
        idQuery = idOrIds
        mode = "findOne"
      | otherwise =>
        idQuery = {'$in':idOrIds}
        mode = "find"

    Q(model[mode]({'_id': idQuery}).exec!).then((docs) ~>
      successfulSavesPromises = [];

      utils.forEachArrayOrVal(docs, ->
        it.set(changeSets[it.id])
        successfulSavesPromises.push(
          Q.Promise((resolve, reject) ->
            it.save((err, doc) ->
              reject(err) if err 
              resolve(doc)
            )
          )
        )
      );
      Q.all(successfulSavesPromises)
    ).then((docs) ~>
      @@docsToResourceOrCollection(docs, type, @inflector.plural)
    ).catch(@@errorHandler);

  delete: (type, idOrIds) ->
    model = @getModel(@@getModelName(type))

    # As with update, we're going to do the extra step of finding the docs,
    # loading them into Mongoose, and then removing them. Way slower than 
    # removing from mongo directly, but it allows any .pre('remove') listeners
    # to execute.
    switch typeof idOrIds
      | "string" =>
        idQuery = idOrIds
        mode = "findOne"
      | otherwise =>
        idQuery = {'$in':idOrIds}
        mode = "find"

    Q(model[mode]({'_id': idQuery}).exec!).then((docs) ~>
      utils.forEachArrayOrVal(docs, -> it.remove!);
      docs
    ).catch(@@errorHandler);

  getModel: (modelName) ->
    @models[modelName]

  # Responsible for generating a sendable Error Resource if the query threw an Error
  @errorHandler = (err) ->
    # Convert a validation errors collection to something reasonable
    if err.errors?
      errors = [];
      for key, thisError of err.errors
        errors.push(
          new APIError(
            if err.name is "ValidationError" then 400 else (thisError.status || 500), 
            null, 
            thisError.message, 
            null, 
            null, 
            if thisError.path? then [thisError.path] else null
          )
        )

      new Collection(errors, null, "errors")

    # allow the user to signal that their specific error message should be used.
    else if err.isJSONAPIDisplayReady
      new APIError(err.status || 500, null, err.message)
    
    # while still allowing us to issue something generic for most mongoose errors.
    else
      new APIError(
        400, null, 
        "An error occurred while trying to find, create, or modify the requested resource(s)."
      );

  /**
   * @param docs The docs to turn into a resource or collection
   * @param type The type to use for the Collection, if one's being made. 
   * @param pluralize An inflector function for setting the Resource's type
   */ 
  @docsToResourceOrCollection = (docs, type, pluralize) ->
    # if docs is an empty array, we don't 404: https://github.com/json-api/json-api/issues/101
    if !docs 
      return new APIError(404, null, "No matching resource found.")

    makeCollection = docs instanceof Array
    docs = [docs] if !makeCollection

    docs .= map(~> @@docToResource(it, pluralize))
    if makeCollection then new Collection(docs, null, type) else docs[0]

  @resourceToPlainObject = (resource) ->
    # just get attrs, as we're not paying attention to client-
    # provided ids or hrefs, and we already have the type
    res = {} <<< resource.attrs
    if resource.links?
      for key, value of resource.links
        res[key] = value.ids || value.id
    res

  # The mongoose conversion logic.
  # Useful to have as a pure function for calling it as a utility outside this class.
  @docToResource = (doc, pluralize) ->
    # type and refPaths depend on the instance
    type = @@getType(doc.constructor.modelName, pluralize)
    refPaths = @@getReferencePaths(doc.constructor)

    # Get and clean up attributes
    attrs = doc.toObject!
    schemaOptions = doc.constructor.schema.options
    delete attrs['_id', schemaOptions.versionKey, schemaOptions.discriminatorKey]

    # Build Links
    links = {}
    refPaths.forEach((path) ->
      # get value at the path w/ the reference, in the json'd + full docs.
      pathParts = path.split('.')
      valAtPath = pathParts.reduce(((obj, part) -> obj[part]), doc)
      jsonValAtPath = pathParts.reduce(((obj, part) -> obj[part]), attrs)

      # delete the attribute, since we're moving it to links (or, if it
      # doesn't link to anything, just removing it)
      utils.deleteNested(path, attrs)

      # If we have a refPath whose field is excluded from the document all 
      # together, make sure we don't add a links key for it.
      if valAtPath is undefined
        return

      # But, if there's a toOne relationship with no value in it,
      # or a toMany with an empty array, make an empty links for it.
      if !valAtPath or (valAtPath instanceof Array and valAtPath.length == 0)
        links[path] = if valAtPath instanceof Array then new Collection([]) else null
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
          resources.push(@@docToResource(docOrId, pluralize))

        # otherwise, we just have an id, so we make a stub resource (one w/o attrs)
        else
          # docOrId might be an OId here, so use jsonValAtPath,
          # which will have been converted to a string.
          id = jsonValAtPath[i]
          type = @@getType(@@getReferencedModelName(doc.constructor, path), pluralize)
          resources.push(new Resource(type, id))
      );

      # flatten if neccessary; otherwise, formally turn it into a collection.
      links[path] = if isToOneRelationship then resources[0] else new Collection(resources)
    );

    # finally, create the resource.
    resource = new Resource(type, doc.id, attrs, links if not prelude.Obj.empty(links))
    
    # Return the resource, handling sub docs.
    @@handleSubDocs(doc, resource)

  @handleSubDocs = (doc, resource) ->
    resource

  @getReferencePaths = (model) ->
    paths = []
    model.schema.eachPath((name, type) ~> 
      paths.push(name) if @@isReferencePath(type)
    );
    paths

  @getStandardizedSchema = (model) ->
    schema = model.schema
    schemaOptions = model.schema.options
    standardSchema = {}

    # valid types are String, Array[String], Number, Array[Number], Boolean, Array[Boolean],
    # Date, Array[Date], Id (for a local id), ModelNameId and Array[ModelNameId].
    _getStandardType = (path, schemaType) ->
      return 'Id' if path is '_id'

      isArray = schemaType.options.type instanceof Array
      rawType = if isArray then schemaType.options.type.0.type.name else schemaType.options.type.name
      refModel = @@getReferencedModelName(model, path)

      res = if isArray then 'Array[' else ''
      res += if refModel then (refModel + 'Id') else rawType
      res += if isArray then ']' else ''
      res

    model.schema.eachPath((name, type) ~> 
      return if name in [schemaOptions.versionKey, schemaOptions.discriminatorKey]

      standardType = _getStandardType(name, type)
      name = 'id' if name is '_id'
      required = type.options.required
      enumValues = type.options.enum?.values
      defaultVal =
        if name is 'id' or (standardType is 'Date' && name in ['created', 'modified'] && typeof type.options.default=='function')
        then '(auto generated)'
        else (type.options.default if (type.options.default? and typeof type.options.default != 'function'))

      standardSchema[name] = 
        type: standardType
        default: defaultVal
        enumValues: enumValues
        required: required
    )
    standardSchema

  @isReferencePath = (schemaType) ->
    (schemaType.caster || schemaType).options?.ref?

  @getReferencedModelName = (model, path) ->
    schemaType = model.schema.path(path)
    (schemaType.caster || schemaType).options?.ref

  @getChildTypes = (model, pluralize) ->
    if model.discriminators
      Object.keys(model.discriminators).map(~> @@getType(it, pluralize))
    else
      []

  # Get the json api type for a model.
  @getType = (modelName, pluralize) ->
    pluralize = pluralize || defaultInflector.plural
    pluralize(modelName.replace(/([A-Z])/g, '\-$1').slice(1).toLowerCase())

  @getModelName = (type, singularize) ->
    singularize = singularize || defaultInflector.singular
    words = type.split('-')
    # do singularization before adding back camel casing,
    # because the default inflector lowercases words to 
    # singularize them, and then can't add the camel casing back.
    words[*-1] = singularize(words[*-1])
    words.map(-> it.charAt(0).toUpperCase! + it.slice(1)).join('')

  @getNestedSchemaPaths = (model) ->

module.exports = MongooseAdapter
