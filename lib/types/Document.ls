require! {\./Resource, \./Collection, prelude:\prelude-ls, templating:\url-template}

class Document
  (@resources, @meta, @urlTemplates)->
    @linked = {}
    @links = {}
    @urlTemplates = {[k, templating.parse(template)] for k, template of @urlTemplates}

  addLinkedResource: (resource) ->
    if not @linked[resource.type]?
      @linked[resource.type] = []

    if resource.id not in (@linked[resource.type]).map(-> it.id)
      @linked[resource.type].push(@renderResource(resource));

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
      referencedResources = if isCollection then referenced.resources else referenced
      idKey = if isCollection then 'ids' else 'id'

      res.links[path] = {}
        ..[\type] = referenced.type
        ..[idKey] = referenced[idKey]
        # only add the href if we have stubbed resources (not in `linked`)
        ..[\href] = referenced.href || @urlFor(resource.type, path, referenced[idKey], urlTempParams) if !referencedResources[0].attrs?

      referencedResources.forEach(~>
        if it.attrs? then @addLinkedResource(it)
      )

    res

  urlFor: (type, path, referencedIdOrIds, extraParams) ->
    if not @urlTemplates[type + '.' + path]
      throw new Error("Missing url template for " + type + '.' + path);

    params = {[(type + '.' + k), v] for k, v of extraParams}
    (params[type] || (params[type] = {}))[path] = referencedIdOrIds;

    @urlTemplates[type + '.' + path].expand(params)

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

        # compact them as a group
        if isCollection
          a = 3
        else
          a = 0

        renderedResources

      ..[\linked] = @linked if not prelude.Obj.empty(@linked)
      ..[\links]  = \something if not prelude.Obj.empty(@links)

    doc

    /*
    todo: support linked and links
    Cases are: 
      - Resources in response:                  1 (read)                  OR        [0, n] (list)
      - Relationship type (in each resource):   toOne                     OR        toMany
      - Status of referenced resources:         included (compound doc)   OR        referenced by href
    
    Resource reps: 
    SINGLE  
      - object of attrs + id + optional type & href, 
      - id string
    MULTIPLE
      - array of (object of attrs + id + optional type & href)
      - array of (id string)
      - collection object w/ ids array + optional type & href

    0 resources | toOne or toMany relationship, included or referenced by href
      - { type:[] }
      
    1 resource | toOne relationship | referenced by href
      - {
        type: {
          "attrName": "val", 
          "links": {
            propName: {
              "type": "type2", 
              "id": "id2",  //not strictly necessary, but nice to include
              "href": "url"
            } 
          }
        }
      }

    1 resource | toMany relationship | referenced by href
      - {
        type: {
          "attrName": "val", 
          "links": {
            propName: {
              "type": "type2",
              "ids": ["id2", "id3"]  //not strictly necessary, but nice to include
              "href": "url"
            } 
          }
        }
      }

    DONE. 1 resource | toOne relationship | included.
      - {
          type: {
            "attrName": "val", 
            "links": {
              "propName": {
                "type": "type2", 
                id: "id2"
              } 
            }
          },
          linked: {
            type2: [{
              //full resource, sans type + href but with id.
            }]
          }
        }

    DONE. 1 resource | toMany relationship | included
      - {
        type: {
          "attrName": "val", 
          "links": {
            propName: {
              "type": "type2", 
              "ids": ["id2", "id3"]
            }
          }
        },
        linked: {
          //same as above
        }
      }


    [1, n] resources | toOne relationship | referenced by href
      - {
          //identical to the included case below, sans the linked key
          links: {
            "type.propName": {
              type: "type2",
              href: "/type2/id"
            }
          },
          type: [
            {
              "attrName": "val", 
              "links": {
                "propName": "id2" 
              }
            },
            ...
          ]
        }

    [1, n] resources | toMany relationship | referenced by href
      - {
          //identical to the included case below, sans the linked key
          links: {
            "type.propName": {
              type: "type2",
              href: "/type2/id"
            }
          },
          type: [
            {
              "attrName": "val", 
              "links": {
                "propName": ["id2", "id3"]
              }
            },
            ...
          ]
        }

    [1, n] resources | toOne relationship | included
      - {
          //add links so you dont have to specify type at each resource-level
          //links key. Has some overhead--most notably having to include the
          //url template, which isn't actually used--but pays off if the 
          //response has more than a handful of resources.
          links: {
            "type.propName": {
              type: "type2",
              href: "/type2/id"
            }
          },
          type: [
            {
              "attrName": "val", 
              "links": {
                "propName": "id2" 
              }
            },
            ...
          ],
          linked: {
            type2: [{
              //full resource, sans type + href but with id.
            }]
          }
        }

    [1, n] resources | toMany relationship | included
      - {
          //add links so you dont have to specify type at each resource-level
          //links key. Has some overhead--most notably having to include the
          //url template, which isn't actually used--but pays off if the 
          //response has more than a handful of resources.
          links: {
            "type.propName": {
              type: "type2",
              href: "/type2/id"
            }
          },
          type: [
            {
              "attrName": "val", 
              "links": {
                "propName": ["id2", "id3"] 
              }
            },
            ...
          ],
          linked: {
            type2: [{
              //full resource, sans type + href but with id.
            }]
          }
        }


    LINKS OBJECT
    --#1 whenever link template is populated w/ the id of the primary resource,
    --it's ambiguous whether you're linking to a collection or not. problem?
    --https://github.com/json-api/json-api/issues/249

    #  - a collection object (i.e { type: "type", ids:[1,2,3]})
    #  - can have href or, if we have multiple resources in the response, use a url template
    #  - a stub resource (or array of them), i.e. {id:"1", type:"type"}
    #  - can have 
    */
module.exports = Document