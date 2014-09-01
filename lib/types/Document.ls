require! {\./Resource, \./Collection, prelude:\prelude-ls, templating:\url-template, \flat, \../util/utils}

class Document
  (@primaryResources, extraResources, @meta, @urlTemplates)->
    # urlTemplate stuff
    @links = {}
    @_urlTemplatesParsed = {[k, templating.parse(template)] for k, template of @urlTemplates}

    # extraResources form the basis of the @linked collection, to
    # which we'll add linked resources found in the primary ones.
    @linked = extraResources 
    for type, resources of @linked
      @linked[type] = resources.map(@~renderResource)

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
      idKey = if isCollection then 'ids' else 'id'
      referencedResources = if isCollection then referenced.resources else [referenced]

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
      ..[@primaryResources.type] = do ~>
        isCollection = @primaryResources instanceof Collection
        # render each resource
        renderedResources = utils.mapResources(@primaryResources, @~renderResource)

        # remove reduncies in each resource object
        # (possible because our response contains [1,n] resources)
        if isCollection
          renderedResources.forEach(~>
            if it.links?
              for let path, link of it.links
                # it may seem redundant to check this on every
                # iteration of map, but necessary because some
                # resources may not have some paths in their 
                # `links` key (because not every resource has
                # a value for every relationship).
                templateKey = @primaryResources.type + '.' + path
                if not @links[templateKey]
                  @links[templateKey] = {}
                    ..[\type] = link.type
                    # only include the link template if the resources aren't 
                    # included directy. (type is always necessary, though, to
                    # connect the resource-level links to the top-level linked)
                    ..[\href] = @urlTemplates[templateKey] if it.links[path].href
                # in each resource's links key, replace the 
                # {href:"", "type":"", "id/ids":"string or []"}
                # object with just the val of the id or ids key,
                # as type and href are no longer necessary (they
                # are covered by the top-level links) and just an
                # id or ids doesn't need to be in an object.
                it.links[path] = (it.links[path].ids || it.links[path].id)
          )

        renderedResources

      ..[\linked] = @linked if not prelude.Obj.empty(@linked)
      ..[\links]  = @links if not prelude.Obj.empty(@links)

    doc

  @primaryResourcesfromJSON = ({links, meta, linked}:doc) ->
    # a helper function
    buildResource = (json, type, linked, topLinks) ->
      # save and then remove the non-attrs
      id = json.id; delete json.id;
      href = json.href; delete json.href;
      links = json.links; delete json.links;
      type = json.type || type; delete json.type;

      # attrs are all the fields that are left.
      attrs = json;

      # build links
      for key, val of links
        # Possible representations of the linked resource(s):
        # 1. id string, 2. {id:"", type:"", href:""}
        # 3. ["id", "id2"], 4. {ids:"", type:"", href:""}
        # 4 (alt). [{id: "x", type: ""}, ...]
        # And for any resource/collection object, the type + href
        # keys should be populated by merging with the top-level links.
        linkedType = val.type || val.0?.type || topLinks?[type + '.' + key]?.type
        linkedIdOrIds = (
          if typeof val is "string"
            val
          else if val.id
            val.id
          else if val instanceof Array
            val.map(-> it.id || it)
          else
            val.ids
        )
        # convert to stub resources and save in links
        linkedResourceOrResources = utils.mapArrayOrVal(linkedIdOrIds, (id) -> 
          # Below, I commented out searching for the full doc in the top-level
          # linked key, because the only way we could get a doc with a linked
          # key, because that would allow sideposting with client ids, which
          # we don't want to allow yet. See larger discussion here:
          # https://github.com/json-api/json-api/issues/202
          # fullDoc = linked.[][linkedType].filter(-> it.id==id)
          # if fullDoc.length
          #   buildResource(fullDoc[0], linkedType, linked, topLinks)
          # else
          new Resource(linkedType, id)
        )
        links[key] = if linkedResourceOrResources instanceof Array then new Collection(linkedResourceOrResources) else linkedResourceOrResources

      new Resource(type, id, attrs, links, href)

    for key of doc
      if key not in [\links, \meta, \linked]
        primaryResources = doc[key]
        makeCollection = primaryResources instanceof Array
        type = do ->
          return key if key != 'data'
          # else, figure out the type from the resources
          if makeCollection then primaryResources.0.type else primaryResources.type
        break

    primaryResources = [primaryResources] if not makeCollection
    primaryResources .= map(-> buildResource(it, type, linked, links))
    if makeCollection then new Collection(primaryResources, null, type) else primaryResources[0]

module.exports = Document