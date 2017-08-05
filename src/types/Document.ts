import templating = require("url-template");
import Linkage from "./Linkage";
import Resource, { ResourceJSON } from "./Resource";
import Collection from "./Collection";
import APIError, { APIErrorJSON } from './APIError';
import { RelationshipJSON } from './Relationship';
import {objectIsEmpty, mapResources, mapObject} from "../util/type-handling";
import {arrayUnique} from "../util/arrays";
import { URLTemplates } from "../ResourceTypeRegistry";
import { PrimaryDataOrErrors, PrimaryDataJSON } from './index';

// TODO: Make the constructor API sane in the presence of types;
// actually define the API for this class (e.g., which fields are public?)
// TODO: use more Maybes for optional fields?
// TODO: don't take primary or errors as a single argument?
export type DocumentJSON = ({
  data: PrimaryDataJSON,
  errors: undefined,
  included?: Collection
} | {
  errors: APIErrorJSON[],
  data: undefined,
  included: undefined
}) & {
  meta?: object,
  links?: object
};

export default class Document {
  public meta: object | undefined;
  public reqURI: string | undefined;
  public included: undefined | Collection;
  public primaryOrErrors: PrimaryDataOrErrors;
  protected urlTemplates: URLTemplates;

  constructor(primaryOrErrors: PrimaryDataOrErrors, included: undefined | Collection = undefined, meta: object | undefined = undefined, urlTemplates: URLTemplates = {}, reqURI: string | undefined = undefined) {
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
    this.urlTemplates = mapObject(urlTemplates, (templatesForType) => {
      return mapObject(templatesForType, templating.parse.bind(templating));
    });

    this.reqURI = reqURI;
  }


  get(): DocumentJSON;
  get(stringify: true): string;
  get(stringify: false): DocumentJSON;
  get(stringify: boolean = false) {
    const doc = <DocumentJSON>{};

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
      doc.data = this.primaryOrErrors.toJSON();
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

function relationshipToJSON(relationship, urlTemplates, templateData): RelationshipJSON {
  const result = <RelationshipJSON>{};

  if(relationship.linkage) {
    result.data = relationship.linkage.toJSON();
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
      (<any>result.links).related = relatedUrlTemplate.expand(templateData);
    }

    if(selfUrlTemplate) {
      (<any>result.links).self = selfUrlTemplate.expand(templateData);
    }
  }

  return result;
}

function resourceToJSON(resource, urlTemplates): ResourceJSON {
  const json = <ResourceJSON>{
    id: resource.id,
    type: resource.type,
    attributes: resource.attrs
  };

  if(resource.meta && !objectIsEmpty(resource.meta)) {
    json.meta = resource.meta;
  }

  // use type, id, meta and attrs for template data, even though building
  // links from attr values is usually stupid (but there are cases for it).
  const templateData = {...json};
  const selfTemplate = urlTemplates[resource.type] && urlTemplates[resource.type].self;

  if(!objectIsEmpty(resource.links) || selfTemplate) {
    json.links = {};
    if(selfTemplate) {
      json.links.self = selfTemplate.expand(templateData);
    }
  }

  if(!objectIsEmpty(resource.relationships)) {
    json.relationships = {};

    for(const path in resource.relationships) {
      const linkTemplateData = {"ownerType": json.type, "ownerId": json.id, "path": path};
      json.relationships[path] = relationshipToJSON(resource.relationships[path], urlTemplates, linkTemplateData);
    }
  }


  return json;
}

function errorToJSON(error: APIError) {
  return error.toJSON();
}
