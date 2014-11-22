require! {Q:\q 'mongoose' 'body-parser' templating:\url-template '../types/Document' '../types/Collection' '../types/ErrorResource' '../util/utils'}

class BaseController
  (@registry, @idHashSecret) ->
    @jsonBodyParser = bodyParser.json({type: ['json', 'application/vnd.api+json']})

  GET: (req, res, next) ->
    # Even if the accepts header doesn't include the
    # json api media type, try to respond anyway rather
    # than send a 406. See note here about HTTP 1.1:
    # http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
    type = req.params.type
    adapter = @registry.adapter(type)
    model = adapter.getModel(adapter@@getModelName(type))

    sorts  = req.query.sort.split(',').map(decodeURIComponent) if req.query.sort?
    fields = req.query.fields.split(',').map(decodeURIComponent) if req.query.fields?

    if req.query.include?
      includes = req.query.include.split(',').map(decodeURIComponent)
    else
      includes = @registry.info(type)?.defaultIncludes

    filters = do ->
      params = {} <<< req.query; 
      delete params[\fields \include \sort];
      for attr, val of filters
        delete params[attr] if attr is /^(fields|sort)\[.+?\]$/
      params

    @_readIds(req, @registry.labelToIdOrIds(type), model).then((idOrIds) ~>
      # PROCESS QUERY RESULTS AND RESPOND.
      adapter.find(type, idOrIds, filters, fields, sorts, includes)
        .then((resources) ~>
          @sendResources(req, res, resources[0], resources[1])
        ).catch((err) ~>
          er = ErrorResource.fromError(err)
          @sendResources(req, res, er)
        )
    ).done();

  POST: (req, res, next) ->
    # below, explicitly checking for false to differentiate from null,
    # which means the content-type may match, but the body's empty.
    return next() if req.is('application/vnd.api+json') == false

    # here, we get body, which is the value of parsing the json
    # (including possibly null for an empty body).
    @@getBodyResources(req, @jsonBodyParser).then((resources) ~>
      resources = @_transformRecursive(resources, req, res, 'beforeSave');
      type = resources.type

      adapter = @registry.adapter(type)
      adapter.create(resources).then((created) ~>
        if created.type != "errors"
          res.status(201)
          template = @registry.urlTemplate(type)
          res.set('Location', 
            templating.parse(template).expand({"#{type}.id": utils.mapResources(created, -> it.id)})
          )
        @sendResources(req, res, created)
      )
    ).catch((err) ~>
      # @@getBodyResources throws ErrorResources directly
      if err not instanceof [ErrorResource, Collection]
        err = ErrorResource.fromError(err)
      @sendResources(req, res, err)
    ).done();

  PUT: (req, res, next) ->
    return next() if req.is('application/vnd.api+json') == false

    type = req.params.type
    adapter = @registry.adapter(type)    
    model = adapter.getModel(adapter@@getModelName(type))

    Q.all([
      @_readIds(req, @registry.labelToIdOrIds(type), model), 
      @@getBodyResources(req, @jsonBodyParser)]
    ).spread((idOrIds, resourceOrCollection) ->
      changeSets = {}
      resourceToChangeSet = -> 
        id = if typeof idOrIds == 'string' then idOrIds else it.id
        throw new Error("An id for the resource to be updated is required.") if not id;
        changeSets[id] = {} <<< it.attrs <<< {[k, v.id || v.ids] for k, v of it.links};

      providedBodyIds = resourceOrCollection.ids || [resourceOrCollection.id];
      providedUrlIds = if idOrIds instanceof Array then idOrIds else [idOrIds];

      if not utils.arrayValuesMatch(providedBodyIds, providedUrlIds)
        throw new Error("The id(s) to update that were provided in the url do 
        not match the ids of the resource objects provided in the request body.");

      # Build changesets. 
      # Note that this is a little loose, because we're looping over the 
      if resourceOrCollection instanceof Collection 
      then resourceOrCollection.resources.forEach(resourceToChangeSet)
      else resourceToChangeSet(resourceOrCollection)

      [idOrIds, changeSets]
    ).spread((idOrIds, changeSets) ->
      adapter.update(type, idOrIds, changeSets)
    ).then((changed) ~>
      @sendResources(req, res, changed)
    ).catch((err) ~>
      er = ErrorResource.fromError(err)
      @sendResources(req, res, er)
    ).done()

  DELETE: (req, res, next) ->
    type = req.params.type
    adapter = @registry.adapter(type)
    model = adapter.getModel(adapter@@getModelName(type))
    
    @_readIds(req, @registry.labelToIdOrIds(type), model).then((idOrIds) ~>
      adapter.delete(type, idOrIds)      
        .then((resources) ~>
          res.status(204)
          res.send!
        ).catch((err) ~>
          er = ErrorResource.fromError(err)
          @sendResources(req, res, er)
        )
    ).done()

  sendResources: (req, res, primaryResources, extraResources, meta) ->
    if primaryResources.type == "errors"
      if primaryResources instanceof Collection
        status = @@pickStatus(primaryResources.resources.map(-> Number(it.attrs.status)));
      else
        status = primaryResources.attrs.status
    else
      status = res.statusCode || 200 # don't override status if already set.

    primaryResources = Q(@~_transformRecursive(primaryResources, req, res, 'afterQuery'))
    extraResources = Q(do ~>
      for type, resources of extraResources
        resources .= map(~> @~_transformRecursive(it, req, res, 'afterQuery'))
      extraResources
    )
    Q.all([primaryResources, extraResources]).spread((primary, extra) ~>
      res.set('Content-Type', 'application/vnd.api+json');
      res.status(Number(status)).json((new Document(primary, extra, meta, @registry.urlTemplates!)).get!)
    ).done()

  /**
   * Takes a Resource or Collection being returned and applies the
   * appropriate afterQuery method to it and (recursively)
   * to all of its linked resources.
   */
  _transformRecursive: (resourceOrCollection, req, res, transformMode) ->
    if resourceOrCollection instanceof Collection
      resourceOrCollection.resources .= map(~> @_transform(it, req, res, transformMode))
      resourceOrCollection
    else
      @_transform(resourceOrCollection, req, res, transformMode)

  /** 
   * A helper function for {@_transformRecursive}.
   * @api private
   */
  _transform: (resource, req, res, transformMode) ->
    # find the transform function for the subType, if it's defined.
    transformFn = @registry[transformMode](resource.processAsType)
    resource = transformFn(resource, req, res) if transformFn
    for path, linked of resource.links
      resource.links[path] = @_transformRecursive(resource.links[path], req, res, transformMode)
    resource

  _readIds: (req, mapper, model) ->
    Q.Promise((resolve, reject) ->
      if req.params.id?
        idOrIdsRaw = req.params.id.split(",").map(decodeURIComponent)
        idOrIdsPromise = if typeof mapper is "function"
          then Q.all(idOrIdsRaw.map(mapper(_, model, req)).map(Q)) 
          else Q(idOrIdsRaw)

        # partially apply mapper; will take id as first arg, get model as second.
        idOrIdsPromise.then((idOrIds) ->
          # flatten idOrIds array, since each label can produce an array.
          # also, strip undefined, which allows the mapper to say that  
          # "no ids match this label" by retturning undefined.
          idOrIds .= reduce(((a, b) -> 
            if typeof b is "undefined" then a else a.concat(b)
          ), [])
          resolve(if idOrIds.length == 1 then idOrIds[0] else idOrIds)
        ).catch((err) -> reject(err))

      else
        resolve(void)
    )

  # Takes an array of error status codes and returns
  # the code that best represents the collection.
  @pickStatus = (errStatuses) ->
    errStatuses[0]

  # Returns a promise that is fulfilled with the value of the request body, 
  # parsed as JSON. (If the body isn't parsed when this is called, it will
  # be parsed first and saved on req.body). If the promise is rejected, it
  # is with an ErrorResource desrcribing the error that occurred while parsing.
  @getBodyResources = (req, parser) ->
    _makeResources = (parsedBody) ->
      type = req.params.type
      resources = parsedBody && (parsedBody[type] || parsedBody.data)

      if !resources or (resources instanceof Array and not resources.length)
        throw new ErrorResource(null, {
          title: "Request body must contain a resource or an array of resources.",
          detail: "This resource or array of resources should be stored at the top-level 
                   document's `" + type + "` or `data` key.",
          status: 400
        })
      Document.primaryResourcesfromJSON(parsedBody)

    # do body parsing (and throw ErrorResources if there's a problem)
    if typeof req.body is not "object"
      # don't ever register the middleware, just call it as a function.
      Q.nfapply(parser, [req, {}]).then((-> _makeResources(req.body)), (err) ->
        switch err.message
        | /encoding unsupported/i =>
            # here, we're not using ErrorResource.fromError only to keep the
            # message from getting assigned to the error resource's detail
            # property, as the message given is generic and better for a title.
            throw new ErrorResource(null {
              title: err.message,
              status: err.status  
            })
        # This must come before the invalid json case, 
        # as its message also matches that
        | /empty body/i => 
            req.body = null
            _makeResources(req.body)
        | /invalid json/i => 
            throw new ErrorResource(null, {
              title: "Request contains invalid JSON.", 
              status: 400
            })
        | otherwise => 
          # an error thrown from JSON.parse
          if err instanceof SyntaxError
            err.title = "Request contains invalid JSON."
          throw ErrorResource.fromError(err)  
      );
    else
      Q(_makeResources(req.body))

#todo: 
# have a GET for multiple resources 404 if some not found?
# perhaps delete associations on delete (how? should be in user code)
module.exports = BaseController
