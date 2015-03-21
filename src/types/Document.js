import LinkObject from "./LinkObject"
import Resource from "./Resource"
import Collection from "./Collection"
import APIError from "./APIError"
import {objectIsEmpty, mapResources} from "../util/type-handling"
import {arrayUnique} from "../util/arrays"

export default class Document {
  /*eslint-disable no-unused-vars */
  constructor(primaryOrErrors, included = [], meta, urlTemplates) {
    [this.primaryOrErrors, this.included,  this.meta, this.urlTemplates] = Array.from(arguments);
  }
  /*eslint-enable */

  get() {
    let doc = {};

    if(this.meta && !objectIsEmpty(this.meta)) doc.meta = this.meta;

    // TODO: top-level links: self, related, etc.

    if(this.included && Array.isArray(this.included)) {
      doc.included = arrayUnique(this.included).map((resource) => {
        return resourceToJSON(resource, this.urlTemplates);
      });
    }

    if(this.primaryOrErrors instanceof Collection || this.primaryOrErrors instanceof Resource) {
      doc.data = mapResources(this.primaryOrErrors, (resource) => {
        return resourceToJSON(resource, this.urlTemplates);
      });
    }

    else if(this.primaryOrErrors instanceof LinkObject) {
      doc.data = linkObjectToJSON(this.primaryOrErrors, this.urlTemplates);
    }

    else if(Array.isArray(this.primaryOrErrors) && this.primaryOrErrors[0] instanceof Error) {
      doc.errors = this.primaryOrErrors.map(errorToJSON);
    }

    else {
      doc.data = this.primaryOrErrors; // e.g. primary could be null.
    }

    return doc;
  }

  static linkObjectFromJSON(json) {
    return new LinkObject(json.linkage);
  }

  static resourceFromJSON(json) {
    // save and then remove the non-attrs
    let id    = json.id; delete json.id;
    let type  = json.type; delete json.type;
    let links = json.links || {}; delete json.links;
    let meta  = json.meta; delete json.meta;

    // attrs are all the fields that are left.
    let attrs = json;

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
  };
}


function resourceToJSON(resource, urlTemplates) {
  let json = resource.attrs;
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

function errorToJSON(error) {
  let res = {};
  for(let key in error) {
    if(error.hasOwnProperty(key)) {
      res[key] = error[key];
    }
  }
  return res;
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
    if not @_urlTemplatesParsed[type + "." + path]
      throw new Error("Missing url template for " + type + "." + path);

    params = flat.flatten({[(type + "." + k), v] for k, v of extraParams}, {safe:true})
    params[type + "." + path] = referencedIdOrIds;

    @_urlTemplatesParsed[type + "." + path].expand(params)
*/
