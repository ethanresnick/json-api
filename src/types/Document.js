import LinkObject from './LinkObject'
import Resource from './Resource'
import Collection from './Collection'
import {objectIsEmpty, arrayUnique, mapResources} from '../util/utils'

export default class Document {
  constructor(primary, included = [], links, meta, urlTemplates) {
    [this.primary, this.included, this.links, this.meta, this.urlTemplates] = 
      [primary, included, links, meta, this.urlTemplates];
  }

  get() {
    var doc = {};

    if(this.meta && !objectIsEmpty(this.meta)) doc.meta = this.meta;

    // TODO: top-level links: self, related, etc.
    if(this.links && !objectIsEmpty(this.links)) doc.links = this.links;

    if(this.included && Array.isArray(this.included)) {
      doc.included = arrayUnique(this.included).map((resource) => {
        return resourceToJSON(resource, this.urlTemplates)
      });
    }

    if(this.primary instanceof LinkObject) {
      doc.data = linkObjectToJSON(this.primary, this.urlTemplates);
    }

    else if(this.primary instanceof Collection || this.primary instanceof Resource) {
      doc.data = mapResources(this.primary, (resource) => {
        return resourceToJSON(resource, this.urlTemplates)
      });
    }

    else {
      doc.data = this.primary; // e.g. primary could be null.
    }

    return doc;
  }

  static linkObjectFromJSON(json) {
    return new LinkObject(json);
  }

  static resourceFromJSON(json) {
    // save and then remove the non-attrs
    var id    = json.id; delete json.id;
    var type  = json.type; delete json.type;
    var links = json.links || {}; delete json.links;
    var meta  = json.meta; delete json.meta;

    // attrs are all the fields that are left.
    var attrs = json;

    //build LinkObjects
    for(let key in links) {
      links[key] = this.linkObjectFromJSON(links[key]);
    }

    return new Resource(type, id, attrs, links, meta);
  }
}

function linkObjectToJSON(linkObject, urlTemplates) {
  return {
    "linkage": linkObject.linkage
  }
}

function resourceToJSON(resource, urlTemplates) {
  var json = resource.attrs;
  json.id = resource.id;
  json.type = resource.type;

  if(!objectIsEmpty(resource.links)) {
    json.links = {};
    for(let path in resource.links) {
      json.links[path] = linkObjectToJSON(resource.links[path], urlTemplates);
    }
  }

  if(resource.meta && !objectIsEmpty(resource.meta)) {
    json.meta = resource.meta;
  }

  return json;
}

/*
  (@primaryResources, extraResources, @meta, @urlTemplates)->
    # urlTemplate stuff
    @links = {}
    @_urlTemplatesParsed = {[k, templating.parse(template)] for k, template of @urlTemplates}

  # renders a non-stub resource
  renderResource: (resource) ->
    urlTempParams = do -> ({} <<< res)
    res.links = {}
    res.links[config.resourceUrlKey] = @urlFor(res.type, config.resourceUrlKey, res.id, urlTempParams)

  urlFor: (type, path, referencedIdOrIds, extraParams) ->
    if not @_urlTemplatesParsed[type + '.' + path]
      throw new Error("Missing url template for " + type + '.' + path);

    params = flat.flatten({[(type + '.' + k), v] for k, v of extraParams}, {safe:true})
    params[type + '.' + path] = referencedIdOrIds;

    @_urlTemplatesParsed[type + '.' + path].expand(params)
*/