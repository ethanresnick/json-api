require! {
  Q:\q, 'mongoose', templating:\url-template,
  '../types/Document', '../types/Collection', '../types/APIError'
  '../util/utils', '../config'
}

class BaseController
  (@registry) ->

  GET: (req, res, next) ->
    adapter.find(type, idOrIds, filters, fields, sorts, includes).then((resources) ~>
      @sendResources(req, res, resources[0], resources[1])
    ).catch((err) ~>
      er = ErrorResource.fromError(err)
      @sendResources(req, res, er)
    ).done();

  POST: (req, res, next) ->
    # here, we get body, which is the value of parsing the json
    # (including possibly null for an empty body).
    @@getBodyResources(req, @jsonBodyParser).then((resources) ~>
      resources = @_transformRecursive(resources, req, res, 'beforeSave')
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
    Q.all([
      @_readIds(req, @registry.labelToIdOrIds(type), model), 
      @@getBodyResources(req, @jsonBodyParser)
    ]).spread((idOrIds, resourceOrCollection) ~>
      resourceOrCollection = @_transformRecursive(resourceOrCollection, req, res, 'beforeSave')

      providedBodyIds = resourceOrCollection.ids || [resourceOrCollection.id];
      providedUrlIds = if idOrIds instanceof Array then idOrIds else [idOrIds];

      if not utils.arrayValuesMatch(providedBodyIds, providedUrlIds)
        throw new Error("The id(s) to update that were provided in the url do 
        not match the ids of the resource objects provided in the request body.");


      # Build changesets.
      changeSets = {}
      resourceToChangeSet = -> 
        id = if typeof idOrIds == 'string' then idOrIds else it.id
        throw new Error("An id for the resource to be updated is required.") if not id;
        changeSets[id] = {} <<< it.attrs <<< {[k, v.id || v.ids] for k, v of it.links};

      if resourceOrCollection instanceof Collection 
      then resourceOrCollection.resources.forEach(resourceToChangeSet)
      else resourceToChangeSet(resourceOrCollection)

      # update.
      adapter.update(type, idOrIds, changeSets)
        .then((changed) ~>
          @sendResources(req, res, changed)
        )
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
        )
    ).catch((err) ~>
      er = ErrorResource.fromError(err)
      @sendResources(req, res, er)
    ).done()

  sendResources: (req, res, primaryResources, extraResources, meta) ->
    if primaryResources.type != "errors"
      status = res.statusCode || 200 # don't override status if already set.

    primaryResources = Q(@~_transformRecursive(primaryResources, req, res, 'afterQuery'))
    extraResources = Q(do ~>
      for type, resources of extraResources
        extraResources[type] = @~_transformRecursive(resources, req, res, 'afterQuery')
      extraResources
    )
    Q.all([primaryResources, extraResources]).spread((primary, extra) ~>
      res.status(Number(status)).json((new Document(primary, extra, meta, @registry.urlTemplates!)).get!)
    ).done()

  /**
   * Takes a Resource or Collection being returned and applies the appropriate
   * transform method to it and (recursively) to all of its linked resources.
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
    # if the resource is just an id reference (no attributes),
    # don't bother running the transform.
    return resource if !resource.attrs
    
    transformFn = @registry[transformMode](resource.type)

    # SuperFn is a function that the first transformer can invoke.
    # It'll return the resource passed in (i.e. do nothing) if there
    # is no parentType or the parentType doesn't define an appropriate
    # transformer. Otherwise, it'll return the result of calling
    # the parentType's transformer with the provided arguments.
    superFn = (resource, req, res) ~> 
      parentType = @registry.parentType(resource.type)

      if !parentType || !@registry[transformMode](parentType)
        resource
      else 
        @registry[transformMode](parentType)(resource, req, res, superFn)

    resource = transformFn(resource, req, res, superFn) if transformFn

    for path, linked of resource.links
      resource.links[path] = @_transformRecursive(resource.links[path], req, res, transformMode)

    resource

#todo: 
# have a GET for multiple resources 404 if some not found?
# perhaps delete associations on delete (how? should be in user code)
module.exports = BaseController