require! ['Q', 'mongoose', './types/Document', './types/Collection', './types/ErrorResource']

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

  /**
   * Returns an object extending this class, and registers the subclass.
   * By registering, I mean it adds the subclass to {@subclasses} and replaces
   * its urlTemplates with a reference to the shared urlTemplates object (after
   * merging in the subclass' additions). By extending this class, I mean
   * that the subclass will have newProps as properties/values on it (all
   * enumerable) and BaseController in its prototype chain.
   */
  extend: (type, newProps) ->
    for path, template of newProps.urlTemplates
      @urlTemplates[path] = template;
    delete newProps.urlTemplates
    @subclasses[type] = Object.create(@, 
      {[k, {value: v, enumerable: true}] for own k, v of newProps}
    );
    @subclasses[type]

  /**
   * A function run on each resource returned from a query to transform it.
   * Subclasses should replace this with their own implementation
   */
  afterQuery: -> it

  /**
   * A function run on each resource before it's saved.
   * Subclasses should replace this with their own implementation
   */
  beforeSave: -> it

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

  /**
   * Takes a Resource or Collection being returned and applies the
   * appropriate afterQuery method to it and (recursively)
   * to all of its linked resources.
   */
  _afterQueryRecursive: (queryResult) ->
    after = @~afterQuery
    if queryResult instanceof Collection
      queryResult.resources.map(-> after(it, req, res))
      queryResult
    else
      after(queryResult, req, res)

  _buildQuery: (req) ->
    query = @adapterFn!
    switch req.method.toUpperCase!
    | "POST" => # Handles create requests

    query

  _buildGETQuery: (req) ->
    query = @adapterFn!

    if(req.params.id)
      ids = req.params.id.split(","); #.map(decodeURIComponent)?
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

    query

  GET: (req, res, next) ->
    # Even if the accepts header doesn't include the
    # json api media type, try to respond anyway rather
    # than send a 406. See note here about HTTP 1.1:
    # http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
    @_buildGETQuery(req).promise!
      .then(@~_afterQueryRecursive)
      .then((resources) ~>
        @sendResources(res, resources)
      ).catch((err) ~>
        er = ErrorResource.fromError(err)
        @sendResources(res, er)
      )

  POST: (req, res, next) ->
    return next() if !req.is('application/vnd.api+json')
    if typeof req.body is not "object"
      try 
        req.body = JSON.parse(req.body);
      catch err
        return @sendResources(res, ErrorResource.fromError({
          title: "Request contains invalid JSON.",
          details: err.message,
          status: 400
        }))

    before = @~beforeSave
    #@_buildQuery(req).promise!
    #  .then(->, ->)

  PUT: (req, res, next) ->
    return next() if !req.is('application/vnd.api+json')
    before = @~beforeSave
    @_buildQuery(req).promise!
      .then(->, ->)

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