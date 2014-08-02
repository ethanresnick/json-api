require! {\./Resource, \./Collection, prelude:\prelude-ls, templating:\url-template, \flat}

class Document
  (@resources, @meta, @urlTemplates)->
    @linked = {}
    @links = {}
    @_urlTemplatesParsed = {[k, templating.parse(template)] for k, template of @urlTemplates}

  addLinkedResource: (resource) ->
    if not @linked[resource.type]?
      @linked[resource.type] = []

    if resource.id not in (@linked[resource.type]).map(-> it.id)
      @linked[resource.type].push(@renderResource(resource));

  # renders a non-stub resource
  renderResource: (resource) ->
    res = resource.attrs
    res.id = resource.id if resource.id
    urlTempParams = do -> ({} <<< res)
    if resource.links? then res.links = {}
    for path, referenced of resource.links
      # we're going to use referencedVal to fill res.links[path] with
      # an object with keys: type, id (or ids), and, optionally, href.
      # That may be putting more info in each resource than we want
      # to return in the final response (e.g. because it would state
      # the type redundantly in responses that have multiple resources),
      # but we'll filter it later. We're also going to add any non-stub
      # resources found in referencedVal to @linked, so they can be 
      # preserved in the the final response.
      isCollection = referenced instanceof Collection
      referencedResources = if isCollection then referenced.resources else [referenced]
      idKey = if isCollection then 'ids' else 'id'

      # a toOne relationship that's unfilled (null) or a toMany collection that's empty
      if !referencedResources[0]
        continue;

      res.links[path] = {}
        ..[\type] = referenced.type
        ..[idKey] = referenced[idKey]
        # only add the href if we have stubbed resources (no attributes; not in `linked`)
        if !referencedResources[0].attrs?
          ..[\href] = referenced.href || @urlFor(resource.type, path, referenced[idKey], urlTempParams)

      referencedResources.forEach(~>
        if it.attrs? then @addLinkedResource(it)
      )

    res

  urlFor: (type, path, referencedIdOrIds, extraParams) ->
    if not @_urlTemplatesParsed[type + '.' + path]
      throw new Error("Missing url template for " + type + '.' + path);

    params = flat.flatten({[(type + '.' + k), v] for k, v of extraParams}, {safe:true})
    params[type + '.' + path] = referencedIdOrIds;

    @_urlTemplatesParsed[type + '.' + path].expand(params)

  get: ->
    doc = {}
      # Add meta key
      ..[\meta] = @meta if @meta

      # Add primary resource(s)
      ..[@resources.type] = do ~>
        isCollection = @resources instanceof Collection
        # render each resource
        renderedResources = if isCollection
          then @resources.resources.map(@~renderResource)
          else @renderResource(@resources)

        # remove reduncies in each resource object
        # (possible because our response contains [1,n] resources)
        if isCollection
          renderedResources.map(~>
            if it.links?
              for let path, link of it.links
                # it may seem redundant to check this on every
                # iteration of map, but necessary because some
                # resources may not have some paths in their 
                # `links` key (because not every resource has
                # a value for every relationship).
                templateKey = @resources.type + '.' + path
                if not @links[templateKey]
                  @links[templateKey] = {
                    type: link.type,
                    href: @urlTemplates[templateKey]
                  };
                # in each resource's links key, replace the 
                # {href:"", "type":"", "id/ids":"string or []"}
                # object with just the val of the id or ids key,
                # as type and href are no longer necessary (they
                # are covered by the top-level links) and just an
                # id or ids doesn't need to be in an object.
                it.links[path] = (it.links[path].ids || it.links[path].id)
            it
          )

        renderedResources

      ..[\linked] = @linked if not prelude.Obj.empty(@linked)
      ..[\links]  = @links if not prelude.Obj.empty(@links)

    doc

module.exports = Document