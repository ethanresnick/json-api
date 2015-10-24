import Linkage from "./Linkage";
import Resource from "./Resource";
import Collection from "./Collection";
import {objectIsEmpty, mapResources, mapObject} from "../util/type-handling";
import {arrayUnique} from "../util/arrays";
import templating from "url-template";

export default class Document {
  constructor(primaryOrErrors, included, meta, urlTemplates, reqURI) {
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

  get(stringify) {
    let doc = {};

    if(this.meta) doc.meta = this.meta;

    // TODO: top-level related link.
    if(this.reqURI) {
      doc.links = {"self": this.reqURI};
    }

    if(this.primaryOrErrors instanceof Collection || this.primaryOrErrors instanceof Resource) {
      doc.data = mapResources(this.primaryOrErrors, (resource) => {
        return resourceToJSON(resource, this.urlTemplates);
      });
    }

    else if(this.primaryOrErrors instanceof Linkage) {
      doc.data = linkageToJSON(this.primaryOrErrors);
    }

    else if(this.primaryOrErrors === null) {
      doc.data = this.primaryOrErrors;
    }

    // it's either resource, a collection, linkage, null, or errors...
    else {
      doc.errors = this.primaryOrErrors.map(errorToJSON);
    }

    if(this.included && this.included instanceof Collection) {
      doc.included = arrayUnique(this.included.resources).map((resource) => {
        return resourceToJSON(resource, this.urlTemplates);
      });
    }

    return stringify ? JSON.stringify(doc) : doc;
  }
}

function linkageToJSON(linkage) {
  return linkage && linkage.value;
}

function relationshipToJSON(relationship, urlTemplates, templateData) {
  let result = {};

  if(relationship.linkage) {
    result.data = linkageToJSON(relationship.linkage);
  }

  // Add urls that we can.
  if(urlTemplates[templateData.ownerType]) {
    const relatedUrlTemplate = relationship.relatedURITemplate ?
      templating.parse(relationship.relatedURITemplate) :
      urlTemplates[templateData.ownerType].related;

    const selfUrlTemplate = relationship.selfURITemplate ?
      templating.parse(relationship.selfURITemplate) :
      urlTemplates[templateData.ownerType].relationship;

    if(relatedUrlTemplate || selfUrlTemplate) {
      result.links = {};
    }

    if(relatedUrlTemplate) {
      result.links.related = relatedUrlTemplate.expand(templateData);
    }

    if(selfUrlTemplate) {
      result.links.self = selfUrlTemplate.expand(templateData);
    }
  }

  return result;
}

function resourceToJSON(resource, urlTemplates) {
  let json = {};
  json.id = resource.id;
  json.type = resource.type;
  json.attributes = resource.attrs;

  if(resource.meta && !objectIsEmpty(resource.meta)) {
    json.meta = resource.meta;
  }

  // use type, id, meta and attrs for template data, even though building
  // links from attr values is usually stupid (but there are cases for it).
  let templateData = Object.assign({}, json);
  let selfTemplate = urlTemplates[resource.type] && urlTemplates[resource.type].self;

  if(!objectIsEmpty(resource.links) || selfTemplate) {
    json.links = {};
    if(selfTemplate) {
      json.links.self = selfTemplate.expand(templateData);
    }
  }

  if(!objectIsEmpty(resource.relationships)) {
    json.relationships = {};

    for(let path in resource.relationships) {
      let linkTemplateData = {"ownerType": json.type, "ownerId": json.id, "path": path};
      json.relationships[path] = relationshipToJSON(resource.relationships[path], urlTemplates, linkTemplateData);
    }
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
