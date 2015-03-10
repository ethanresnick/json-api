require! {
  prelude:\prelude-ls, templating:\url-template, \flat, \../config,
  \../util/utils, \./Resource, \./Collection,  
}

class Document
  (@primaryResources, extraResources, @meta, @urlTemplates)->
    # urlTemplate stuff
    @links = {}
    @_urlTemplatesParsed = {[k, templating.parse(template)] for k, template of @urlTemplates}

    # extraResources form the basis of the @included collection, to
    # which we'll add included resources found in the primary ones.
    @included = []
    for type, resources of extraResources
      @included.concat(resources.map(@~renderResource))

  # renders a non-stub resource
  renderResource: (resource) ->
    res = resource.attrs
    res.id = resource.id if resource.id
    res.type = resource.type
    res.meta = resource.meta if typeof! resource.meta is "Object"

    urlTempParams = do -> ({} <<< res)
    res.links = {}
    res.links[config.resourceUrlKey] = @urlFor(res.type, config.resourceUrlKey, res.id, urlTempParams)

    for path, referenced of resource.links
      # we're going to use referenced to fill res.links[path] with a full
      # link object. That may be putting more info in each resource than we 
      # want to return in the final response, but we'll filter it later.
      isCollection = referenced instanceof Collection
      idKey = if isCollection then config.homogeneousToManyIdsKey else config.toOneIdKey

      res.links[path] = {}
        ..[\type] = referenced.type
        ..[idKey] = referenced[if isCollection then \ids else \id]
        # If, down the line, link objects include a key
        # for providing the url of the linked entity, let's add it.
        # ..[config.urlOfLinkedEntityKey] = target.href || @urlFor(resource.type, path, referenced[idKey], urlTempParams)

      # We're also going to add any non-stub resources found in referenced 
      # to @included, so they can be preserved in the the final response.
      referencedArr = if isCollection then referenced.resources else [referenced]
      referencedArr.forEach(~>
        if it.attrs? then @included.push(it)
      )      

    res

  urlFor: (type, path, referencedIdOrIds, extraParams) ->
    if not @_urlTemplatesParsed[type + '.' + path]
      throw new Error("Missing url template for " + type + '.' + path);

    params = flat.flatten({[(type + '.' + k), v] for k, v of extraParams}, {safe:true})
    params[type + '.' + path] = referencedIdOrIds;

    @_urlTemplatesParsed[type + '.' + path].expand(params)

  get: ->
    mainKey = if @primaryResources.type is \errors then \errors else config.primaryResourcesKey

    doc = {}
      # Add meta key
      ..\meta = @meta if @meta

      # Add primary resource(s)
      ..[mainKey] = do ~>
        # errors are currently specified as a subresource, but they really aren't
        # (no self; "links" means something different, etc), so special case em.
        if @primaryResources.type is \errors
          renderedResources = utils.mapResources(@primaryResources, -> it.attrs)
        else
          renderedResources = utils.mapResources(@primaryResources, @~renderResource)
        
        renderedResources

      ..\included = utils.arrayUnique(@included) if not prelude.Obj.empty(@included)
      ..\links  = @links if not prelude.Obj.empty(@links)

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