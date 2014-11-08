require! {
  Q:\q, \mongoose, prelude:\prelude-ls, defaultInflector: 'pluralize',
  \../types/Resource, \../types/Collection, \../types/ErrorResource,
  \../util/advice, \../util/utils
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
   */
  find: (type, idOrIds, filters, fields, sorts, includePaths) ->
    model = @getModel(@@getModelName(type))
    refPaths = @@getReferencePaths(model)
    queryBuilder = new mongoose.Query(null, null, model, model.collection)

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

    # limit returned fields
    # note that with this sparse fieldset handling, id may be included
    # in the returned documend anyway, even if the user doesn't ask for
    # it specifically, as that's the mongoose default. But that's fine. 
    # See: https://github.com/json-api/json-api/issues/260
    queryBuilder.select(
      fields.map(-> if it.charAt(0) in ['+', '-'] then it.substr(1) else it).join(' ')
    ) if fields instanceof Array

    # setup sorting
    queryBuilder.sort(sorts.join(' ')) if sorts instanceof Array

    # handle includes
    if includePaths
      extraResources = {}
      extraFieldsToModelInfo = {}
      extraDocumentsPromises = []
      duplicateQuery = queryBuilder.toConstructor!
      includePaths .= map(-> it.split('.'))

      for pathParts in includePaths
        continue if pathParts[0] not in @@getReferencePaths(model)

        # We have some include paths that point to properties that we're 
        # returning on resources we're returning. Handling these is easy: 
        # you just populate the path, and then the @@docToResource code
        # can turn it into a Resource object that's linked to the Resource
        # representing the primary document.
        if pathParts.length == 1
          queryBuilder.populate(pathParts[0])

          # But then we have a case where the path points to a property on
          # the resource we're returning, but it's a field that's been excluded
          # For example, a request for /people?fields=name&include=address 
          # should include a bunch of Address resources in the response's 
          # top-level "linked" key--but there shouldn't be a "links" key 
          # pointing to the address ids in the primary people resources 
          # returned. (Yes, this doesn't seem very useful, but there are cases
          # for it.) So, the Resource object we ultimately create for each 
          # person shouldn't have a link to the address either. Hence, we need
          # to find these Addresses and return them as "extra resources"--ones
          # returned with the response but not directly connected to any of the
          # primary returned resources. We handle this by populating the fields 
          # anyway (above), but then tracking that we'll need to remove the
          # populated documents + convert them to extra resources, and doing so 
          # before we return.
          if (fields and pathParts[0] not in fields)
            # include the field (previously excluded) so the population happens.
            queryBuilder.select(pathParts[0])

            # find some info about the referenced model at the populated path
            refModel = @getModel(@@getReferencedModelName(model, pathParts[0]))
            refType = @@getType(refModel.modelName, @inflector.plural)
            refRefPaths = @@getReferencePaths(refModel)

            # initialize extraResources to know that we're going to at least
            # have an empty collection of extraResources of this type. E.g.
            # a request like /users?include=projects&fields=name should 
            # generate a "linked" key with a "projects" key, even if its value
            # is an empty array (i.e. if no users end up having projects).
            extraResources[refType] = [] if not extraResources[refType]

            # and finally store the info to remove & convert later.
            extraFieldsToModelInfo[pathParts[0]] =
              model: refModel, refPaths: refRefPaths, type: refType

        # Finally, we have another case of include paths in which the resources
        # included won't, in our final API response, be directly linked to any
        # of the primary Resources we're returning. This is when we have includes 
        # that point to paths that aren't directly on this object (e.g. a post 
        # including comments.author). We handle this (really inefficiently) below.
        else
            lastModelName = model.modelName
            extraDocumentsPromises.push(pathParts.reduce(
              (resourcePromises, part) ~>
                resourcePromises.then((resources) ~>
                  if resources
                    # update model
                    lastModelName := @@getReferencedModelName(@getModel(lastModelName), part)

                    # populate this nested path
                    Q.npost(@getModel(lastModelName), "populate", [resources, {path: part}]);
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
              , Q(duplicateQuery().exec!)
            ))

      primaryDocumentsPromise = Q(queryBuilder.exec!)
        # ues extraFieldsToModelInfo to put extra, populated fields into 
        # extraResources (as resources) & remove them from the primary documents
        .then((docs) ~>
          utils.forEachArrayOrVal(docs, (doc) ->
            for field, modelInfo of extraFieldsToModelInfo
              # if it's a to-one relationship, doc[field] will be a doc or undefined;
              # if it's a toMany relationship, we have an array (or undefined). Either
              # way, we want to convert any docs in docs[field] to resources and store,
              # them, so we always coerce it to an array.
              refDocsArray = if doc[field] instanceof Array then doc[field] else [doc[field]]
              refDocsArray.forEach((referencedDoc) ->
                # don't add empty references or duplicate docs.
                if referencedDoc && !extraResources[modelInfo.type].some(-> it.id == referencedDoc.id)   
                  extraResources[modelInfo.type].push(
                    @@docToResource(referencedDoc, modelInfo.type, modelInfo.refPaths)
                  ) 
              )
              doc[field] = undefined
            void
          )
          docs
        )

      extraResourcesPromise = Q.all(extraDocumentsPromises)
        .then((docSets) ~>
          # add docs from these extra queries to extraResources
          for docSet in docSets
            # if the query was getting a to-one relationship, 
            # this docSet is a single doc; make an array for simplicity
            docSet = [docSet] if docSet not instanceof Array

            ## remove the empty results, and continue if we have nothing left
            docSet .= filter(-> it)
            continue if !docSet.length

            model = docSet[0].constructor
            type = @@getType(model.modelName, @inflector.plural)
            refPaths = @@getReferencePaths(model)
            extraResources[type] = [] if !extraResources[type]
            docSet.forEach((doc) ->
              if !extraResources[type].some(-> it.id == doc.id) # don't add duplicates
                extraResources[type].push(@@docToResource(doc, type, refPaths))
            )

          # and then, when the primaryDocuments promise has put its
          # resources into extraResources too, return them as promised
          primaryDocumentsPromise.then(-> extraResources)
        )

    else
      primaryDocumentsPromise = Q(queryBuilder.exec!)
      extraResourcesPromise = Q(undefined)

    # convert primary docs to resources/collections, which isn't needed for
    # extraResources--they're already resources and aren't supposed to be collections.
    primaryResourcesPromise = primaryDocumentsPromise.then(~> @@docsToResourceOrCollection(it, model, @inflector.plural))

    Q.all([primaryResourcesPromise, extraResourcesPromise]).catch(-> [@@errorHandler(it), undefined])

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

    Q.ninvoke(model, "create", docs).then((~> @@docsToResourceOrCollection(it, model, @inflector.plural)), @@errorHandler)

  update: (type, idOrIds, changeSets) ->
    # It'd be faster to bypass Mongoose Document creation & just have mongoose
    # send a findAndUpdate command directly to mongo, but we want Mongoose's
    # standard validation stuff, and so we have to find first, then update.
    model = @getModel(@@getModelName(type))
    switch typeof idOrIds
      | "string" =>
        idQuery = idOrIds
        mode = "findOne"
      | otherwise =>
        idQuery = {'$in':idOrIds}
        mode = "find"

    Q(model[mode]({'_id': idQuery}).exec!).then((docs) ~>
      utils.forEachArrayOrVal(docs, ->
        it.set(changeSets[it.id])
        it.save!
      );
      @@docsToResourceOrCollection(docs, model, @inflector.plural)
    ).catch(@@errorHandler);

  delete: (type, idOrIds) ->
    model = @getModel(@@getModelName(type))

    if idOrIds
      switch typeof idOrIds
      | "string" =>
        idQuery = idOrIds
        mode = "findOneAndRemove"
      | otherwise =>
        idQuery = {'$in': idOrIds}
        mode = "remove"

    Q(model[mode]({'_id': idQuery}).exec()).catch(@@errorHandler)

  getModel: (modelName) ->
    @models[modelName]

  # Responsible for generating a sendable Error Resource if the query threw an Error
  @errorHandler = (err) ->
    # Convert a validation errors collection to something reasonalbe
    if err.errors?
      errors = [];
      for key, thisError of err.errors
        generatedError = {}
          ..[\status] = if err.name is "ValidationError" then 400 else (thisError.status || 500)
          ..[\title] = thisError.message
          ..[\path] = thisError.path if thisError.path?

        errors.push(new ErrorResource(null, generatedError))

      new Collection(errors, null, "errors")

    # for other errors, issue something generic
    else
      new ErrorResource(null, {
        "title": "An error occurred while trying to find, create, or modify the requested resource(s)."
      })

  @docsToResourceOrCollection = (docs, model, pluralize) ->
    if !docs # if docs is an empty array, we don't 404: https://github.com/json-api/json-api/issues/101
      return new ErrorResource(null, {status: 404, title:"No matching resource found."})

    makeCollection = docs instanceof Array
    docs = [docs] if !makeCollection

    type = @@getType(model.modelName, pluralize)
    refPaths = @@getReferencePaths(model)

    docs .= map(~> @@docToResource(it, type, refPaths))
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
  @docToResource = (doc, type, refPaths, pluralize) ->
    # Get and clean up attributes
    attrs = doc.toObject!
    delete attrs['_id', '__v', '__t'] #for auto ids, versioning, and discriminators

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

      # if there's a toOne relationship with no value in it, or a toMany
      # with an empty array, skip building a links key for it. Could also
      # be a refPath whose field is excluded from the document all together.
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
          type  = @@getType(model.modelName, pluralize)
          resources.push(@@docToResource(docOrId, type, @@getReferencePaths(model)))

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

    # Return the resource
    resource = new Resource(type, doc.id, attrs, links if not prelude.Obj.empty(links))
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
      return if name in [\__v, \__t]

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
    Object.keys(model.discriminators).map(~> @@getType(it, pluralize)) if model.discriminators

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