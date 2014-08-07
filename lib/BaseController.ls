require! ['Q', 'mongoose', './types/Document', './types/Collection', './types/ErrorResource', 'body-parser']

module.exports =
  /**
   * Keeps a collection of all objects extending this one, indexed by type.
   * Used to run the beforeSave/afterQuery methods from the controllers of
   * linked resources. E.g. if a subclass is a User controller w/ beforeSave
   * and afterQuery methods, it may be that a User also has some Projects,
   * and we want a request for /users?include=projects to be able to run
   * the beforeSave and afterQuery methods from the Projects controller before
   * returning.
   */
  subclasses: {}

  jsonBodyParser: bodyParser.json({type: ['json', 'application/vnd.api+json']})

  /**
   * Returns an object extending this class, and registers the subclass.
   * By registering, I mean it adds the subclass to {@subclasses}, replaces its
   * urlTemplates with a reference to the shared urlTemplates object (after
   * merging in the subclass' additions), and sets type as a property on the 
   * new instance. By extending this class, I mean that the subclass will have
   * newProps as properties/values on it (all enumerable) and BaseController in
   * its prototype chain.
   */
  extend: (type, newProps) ->
    for path, template of newProps.urlTemplates
      @urlTemplates[path] = template;
    delete newProps.urlTemplates
    newProps.type = type
    @subclasses[type] = Object.create(@, 
      {[k, {value: v, enumerable: true}] for own k, v of newProps}
    );
    @subclasses[type]

  /**
   * A function that, when called, returns a new object that implements 
   * the Adapter interface. Should be provided by the child controller.
   * We need to get a new adapter on each request so the query state is
   * specific to this request (since the controller objects themselves
   * persist between requests).
   */
  adapterFn: null

  /**
   * A urlTemplates object shared by all controllers.
   * If subclasses are created through {@extend}, their urlTemplates
   * will be merged into this rather than shading it, so a controller 
   * that extends BaseController will have access to the urlTemplates 
   * registered by another controller that extends it.
   */
  urlTemplates: {}

  # Takes an array of error status codes and returns
  # the code that best represents the collection.
  _pickStatus: (errStatuses) ->
    errStatuses[0]

  GET: (req, res, next) ->
    # Even if the accepts header doesn't include the
    # json api media type, try to respond anyway rather
    # than send a 406. See note here about HTTP 1.1:
    # http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html

    # BUILD QUERY
    query = @adapterFn!

    if(req.params.id)
      ids = req.params.id.split(",").map(decodeURIComponent)
      if ids.length > 1 
        then query.withIds(ids) 
        else query.withId(ids[0]) 
    else
      query.any!

    if req.query.sort?
      query.sort(req.query.sort.split(','))

    # Note: We don't support the (optional) fields[TYPE] syntax.
    if req.query.fields?
      query.onlyFields(req.query.fields.split(','))

    if req.query.include?
      query.includeLinked(req.query.include.split(','))

    filters = {} <<< req.query; delete filters[\fields \include \sort];
    for attr, val of filters
      #ignore any field[type] params
      continue if attr is /^fields\[.+?\]$/
      query.withProperty(attr, val) if val;

    # Add a default limit. TODO: support user provding one
    query.limitTo(100)

    # PROCESS QUERY RESULTS AND RESPOND.
    query.promise!
      .then(~> @_afterQueryRecursive(it, req, res))
      .then((resources) ~>
        @sendResources(res, resources)
      ).catch((err) ~>
        er = ErrorResource.fromError(err)
        @sendResources(res, er)
      )

  /**
   * Takes a Resource or Collection being returned and applies the
   * appropriate afterQuery method to it and (recursively)
   * to all of its linked resources.
   */
  _afterQueryRecursive: (resourceOrCollection, req, res) ->
    if resourceOrCollection instanceof Collection
      resourceOrCollection.resources.map(~> @_after(it, req, res))
      resourceOrCollection
    else
      @_after(resourceOrCollection, req, res)

  /** 
   * A helper function for {@_afterQueryRecursive}.
   *
   * @api private
   */
  _after: (resource, req, res) ->
    if typeof @subclasses[resource.type].afterQuery == 'function'
      resource = @subclasses[resource.type]~afterQuery(resource, req, res)
    for path, linked of resource.links
      resource.links[path] = @_afterQueryRecursive(resource.links[path], req, res)
    resource

  # Returns a promise that is fulfilled with the value of the request body, 
  # parsed as JSON. (If the body isn't parsed when this is called, it will
  # be parsed first and saved on req.body). If the promise is rejected, it
  # is with an ErrorResource desrcribing the error that occurred while parsing.
  _getBodyPromise: (req, res) ->
    if typeof req.body is not "object"
      # don't ever register the middleware, just call it as a function.
      Q.nfapply(@jsonBodyParser, [req, res]).then((-> req.body), (err) ->
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
            req.body
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
      Q.fcall(-> req.body)

  POST: (req, res, next) ->
    # below, explicitly checking for false to differentiate from null,
    # which means the content-type may match, but the body's empty.
    return next() if req.is('application/vnd.api+json') == false

    # here, we get body, which is the value of parsing the json
    # (including possibly null for an empty body).
    @_getBodyPromise(req, res).then((body) ~>
      resources = body && (body[@type] || body.data)
      if !resources or (resources instanceof Array and not resources.length)
        throw new ErrorResource(null, {
          title: "Request must contain a resource or an array of resources to create.",
          detail: "This resource or array of resources should be stored at the top-level 
                   document's `" + @type + "` or `data` key.",
          status: 400
        })
      
      # do the creation
      query = @adapterFn!.create(body).promise!.then(
        (created)->
          res.send(201);
          # should actually, along with mongoose adapter,
          # run these back through before/after.
        , 
        (err) ->
      )
    ).then(
      (created) -> 
        @sendResources(res, created)
      , 
      (errorResource) ~>
        @sendResources(res, errorResource)
    );
    #before = @~beforeSave
    #@_buildQuery(req).promise!
    #  .then(->, ->)

  PUT: (req, res, next) ->
    return next() if !req.is('application/vnd.api+json')
    #before = @~beforeSave
    #@_buildQuery(req).promise!
    #  .then(->, ->)

  sendResources: (res, resources, meta) ->
    if resources.type == "errors"
      if resources instanceof Collection
        status = @_pickStatus(resources.resources.map(-> Number(it.attrs.status)));
      else
        status = resources.attrs.status
    else
      status = 200

    res.set('Content-Type', 'application/vnd.api+json');
    res.json(Number(status), (new Document(resources, meta, @urlTemplates)).get!)

#todo: create, update, delete    
/*
  sendJsonApiError: function(err, res) {
    var errors, thisError, generatedError;

    //convert mongoose errors
    if(err.errors) {
      errors = [];
      for(var key in err.errors) {
        thisError = err.errors[key];
        generatedError = {
          status: (err.name == "ValidationError" ? 400 : (thisError.status || 500))
        };

        switch(thisError.type) {
          case "required":
          default:
            generatedError.title = thisError.message;
        };

        if(thisError.path) {
          generatedError.path = thisError.path;
        }
        errors.push(generatedError);
      }

      errors.status = err.status || (err.name == "ValidationError" ? 400 : 500);
      return JsonApi.sendError(errors, res);
    }
    
    JsonApi.sendError(err, res);
  },

  fulfillCreate: function(req, res, next, urlFor, readRouteName) {
    var self = this;
    this.model.create(req.body).then(function(newModel) {
      res.status(201);
      res.location(urlFor(readRouteName, {params: {id: newModel.id}}));
      res.send(self.mongooseDocsToJsonApiResponse(newModel));
    }, function(err) { self.sendJsonApiError(err, res); });
  },

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

  fulfillDelete: function(req, res, next, customModelResolver) {
    this.mongooseDocFromIdsPromise(req, customModelResolver).then(function(docs) {
      if(!(docs instanceof Array)) {
        docs = [docs];
      }
      return Q.all(docs.map(function(doc) { return Q.nfcall(doc.remove.bind(doc)); }));
    }).then(function() {
      res.status(204);
      res.send();
    }).catch(function(err) { self.sendJsonApiError(err, res); });
  } 
};*/