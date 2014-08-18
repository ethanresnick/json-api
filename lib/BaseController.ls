require! {Q:\q 'mongoose' 'body-parser' templating:\url-template './types/Document' './types/Collection' './types/ErrorResource' \./util/utils}
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

    sorts  = req.query.sort.split(',').map(decodeURIComponent) if req.query.sort?
    fields = req.query.fields.split(',').map(decodeURIComponent) if req.query.fields?

    if req.query.include?
      includes = req.query.include.split(',').map(decodeURIComponent)
    else
      includes = @registry.defaultIncludes(type)

    filters = do ->
      params = {} <<< req.query; 
      delete params[\fields \include \sort];
      for attr, val of filters
        delete params[attr] if attr is /^(fields|sort)\[.+?\]$/
      params

    idOrIds = @_readIds(req)

    # PROCESS QUERY RESULTS AND RESPOND.
    adapter.find(type, idOrIds, filters, fields, sorts, includes)
      .then((resources) ~>
        @sendResources(req, res, resources[0], resources[1])
      ).catch((err) ~>
        er = ErrorResource.fromError(err)
        @sendResources(req, res, er)
      ).done()

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
    )

  PUT: (req, res, next) ->
    return next() if req.is('application/vnd.api+json') == false
    #before = @~beforeSave
    #@_buildQuery(req).promise!
    #  .then(->, ->)

  DELETE: (req, res, next) ->
    type = req.params.type
    adapter = @registry.adapter(type)
    idOrIds = @_readIds(req)

    adapter.delete(type, idOrIds)      
      .then((resources) ~>
        res.status(204)
        res.send!
      ).catch((err) ~>
        er = ErrorResource.fromError(err)
        @sendResources(req, res, er)
      )

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
    transformFn = @registry[transformMode](resource.type)
    resource = transformFn(resource, req, res) if transformFn
    for path, linked of resource.links
      resource.links[path] = @_transformRecursive(resource.links[path], req, res, transformMode)
    resource

  _readIds: (req) ->
    if req.params.id?
      idOrIds = req.params.id.split(",").map(decodeURIComponent)
      if idOrIds.length == 1 then idOrIds[0] else idOrIds
    else
      void

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
# update
# have a GET for multiple resources 404 if some not found
# perhaps delete associations on delete (how? should be in user code)

/*
  fulfillUpdate: function(req, res, next, customUpdateFunction, customModelResolver) {
    var self = this
      , updateFunction;    
    if(typeof customUpdateFunction === "function") {
      updateFunction = customUpdateFunction;
    } 
    else {
      updateFunction = function(doc) {
        for(var key in req.body) {
          doc[key] = req.body[key];
        }
        return doc;
      };
    }
    //200 status code + resource, rather than a 204,
    //is ok (actually, required) because we're updating
    //the modified date field on each PUT.
    this.mongooseDocFromIdsPromise(req, customModelResolver)
      .then(
        updateFunction
      ).then(function(doc) {
        return Q.nfcall(doc.save);
      })
      .spread(
        this.mongooseDocToJsonApiResource
      ).then(
        res.json.bind(res)
      ).catch(function(err) { 
        self.sendJsonApiError(err, res);
      });
  },
};*/
module.exports = BaseController