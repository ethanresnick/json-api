import LinkObject from "./LinkObject";
import Linkage from "./Linkage";
import Resource from "./Resource";
import Collection from "./Collection";
import APIError from "./APIError";
import {objectIsEmpty, mapResources, mapObject} from "../util/type-handling";
import {arrayUnique} from "../util/arrays";
import templating from "url-template";

export default class Document {
  /*eslint-disable no-unused-vars */
  constructor(primaryOrErrors, included = [], meta, urlTemplates, reqURI) {
    [this.primaryOrErrors, this.included, this.reqURI] = [primaryOrErrors, included, reqURI];

    // validate meta
    if(meta !== undefined) {
      if(typeof meta === "object" && !Array.isArray(meta)) {
        this.meta = meta;
      }
      else {
        throw new Error("Meta information must be an object");
      }
    }

    // parse all the templates once on construction.
    this.urlTemplates = mapObject(urlTemplates || {}, (templatesForType) => {
      return mapObject(templatesForType, templating.parse.bind(templating));
    });

    this.reqURI = reqURI;
  }
  /*eslint-enable */

  get() {
    let doc = {};

    if(this.meta) doc.meta = this.meta;

    // TODO: top-level related link.
    if(this.reqURI) {
      doc.links = {"self": this.reqURI};
    }

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

    else if(this.primaryOrErrors instanceof Linkage) {
      doc.data = linkageToJSON(this.primaryOrErrors);
    }

    // it's either resource, a collection, linkage or errors...
    else {
      doc.errors = this.primaryOrErrors.map(errorToJSON);
    }

    return doc;
  }
}

function linkageToJSON(linkage) {
  return linkage.value;
}

function linkObjectToJSON(linkObject, urlTemplates) {
  return {
    "linkage": linkageToJSON(linkObject.linkage)
  };
}

function resourceToJSON(resource, urlTemplates) {
  let json = resource.attrs;
  let selfTemplate = urlTemplates[resource.type] && urlTemplates[resource.type].self;
  json.id = resource.id;
  json.type = resource.type;

  if(!objectIsEmpty(resource.links) || selfTemplate) {
    json.links = {};
    if(selfTemplate) {
      let templateData = Object.assign({"id": resource.id}, resource.attrs);
      json.links.self = urlTemplates[resource.type].self.expand(templateData);
    }
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
