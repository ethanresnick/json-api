require! ['Q', 'mongoose', './types/Document', './types/Collection', './types/ErrorResource']

module.exports =
  /**
   * Returns an object with newProps as properties (all enumerable) 
   * and values and `this` in the prototype chain. Allows you create
   * controllers that extend this one.
   */
  extend: (newProps) ->
    Object.create(this, {[k, {value: v, enumerable: true}] for own k, v of newProps});

  /**
   * A function that, when called, returns a new object that implements 
   * the Adapter interface. Should be provided by the child controller.
   * Whe need to get a new adapter on each request so the query state is
   * specific to this request (since the controller objects themselves
   * persist between requests).
   */
  adapterFn: null
   
  _buildQuery: (req) ->
    query = @adapterFn!
    switch req.method.toUpperCase!
    | "GET" => # Handles list/read requests
      if(req.params.id)
        ids = req.params.id.split(",");
        if ids.length > 1 
          then query.withIds(ids) 
          else query.withId(ids[0]) 
      else
        query.any!

      if(req.query.sort)
        query.sort(req.query.sort.split(','))

      # Note: For now, we don't support the
      # fields[TYPE] syntax (optional per spec).
      if(req.query.fields)
        query.onlyFields(req.query.fields.split(','))

    | "POST" => # Handles create requests
      


    query

  GET: (req, res, next) ->
    after = @~afterQuery
    @_buildQuery(req).promise!
      .then((result) ->
        if result instanceof Collection
          result.resources.map(-> after(it, req, res))
          result
        else
          after(result, req, res)
      ).then((resources) ->
        @@sendResources(res, resources)
      ).catch((err) ->
        er = ErrorResource.fromError(err)
        @@sendResources(res, er.status, er)
      )

  POST: (req, res, next) ->
    before = @~beforeSave
    @_buildQuery(req).promise!
      .then(->, ->)

  @sendResources = (res, resources, meta) ->
    if resources.type === "errors"
      if resources instanceof Collection
        status = resources.resources[0].attrs.status
      else
        status = resources.attrs.status
    else
      status = 200

    res.json(status, (new Document(resources, meta)).get!)


#create, update, read, list, delete    
/*


   * Returns a promise for all model instances in the
   * collection associated with this.model.
  
  manyMongooseDocsPromise: function(query, limit) {
    if(typeof query === 'number') {
      limit = query;
    }
    query = (query instanceof Array && query.length) ? {_id: {$in: query}} : {};

    return Q(this.model.find(query).limit(limit || 1000).exec());
  },

  
   * Preps a Mongoose model to be returned as a resource
   * in a JSON-API-compliant response (http://jsonapi.org/).
  
  mongooseDocToJsonApiResource: function(doc) {
    var resource = doc.toObject();

    this.model.schema.eachPath(function(path, type) {
      //add all properties from the schema, including sub-docs,
      //to the resource. Still need to figure out relations.
      var splitPath = path.split('.')
        , currLevel = resource;

      for(var i = 0, len = splitPath.length - 1; i<len; i++) {
        currLevel[splitPath[i]] = currLevel[splitPath[i]] || {};
        currLevel = currLevel[splitPath[i]];
      }
      currLevel[splitPath[len]] = doc.get(path);
    });

    resource.id = doc._id;
    delete resource._id;
    delete resource.__v;

    return resource;
  },

  mongooseDocsToJsonApiResponse: function(mongooseDocs) {
    var collectionName = pluralize.plural(this.model.modelName).toLowerCase()
      , resources      = (mongooseDocs instanceof Array) ? 
          mongooseDocs.map(this.mongooseDocToJsonApiResource.bind(this)) : 
          this.mongooseDocToJsonApiResource(mongooseDocs);

    return JsonApi.attachResources(collectionName, resources);
  },

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

  fulfillList: function(res, next) {
    var self = this;

  },

  fulfillRead: function(req, res, next, customModelResolver) {
    var self = this;

    this.mongooseDocFromIdsPromise(req, customModelResolver)
      .then(function(docs) {
        res.json(self.mongooseDocsToJsonApiResponse(docs));
      }).catch(function(err) {
        self.sendJsonApiError(err, res);
      });
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