import templating = require("url-template");
import Linkage from "./Linkage";
import Resource, { ResourceJSON } from "./Resource";
import Collection from "./Collection";
import APIError, { APIErrorJSON } from './APIError';
import { RelationshipJSON } from './Relationship';
import {objectIsEmpty, mapResources, mapObject} from "../util/type-handling";
import {arrayUnique} from "../util/arrays";
import { URLTemplates } from "../ResourceTypeRegistry";
import { PrimaryData, PrimaryDataJSON } from './index';

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

export type DocumentData = {
  meta?: object;
  included?: Collection;
  primary?: PrimaryData;
  errors?: APIError[];
  reqURI?: string;
  urlTemplates?: URLTemplates;
};

export default class Document {
  public meta: DocumentData['meta'];
  public included: DocumentData['included'];
  public primary: DocumentData['primary'];
  public errors: DocumentData['errors'];
  public reqURI: DocumentData['reqURI'];
  public urlTemplates: URLTemplates;

  constructor(data: DocumentData) {
    const { urlTemplates = {}, ...restData } = data;

    // Assign data members.
    // TODO: decide what level of validation/encapsulation is appropriate,
    // given typescript.
    Object.assign(this, restData);

    // parse all the templates once on construction.
    // TODO: accept parsed templates (which we probably want to store
    // in the registry) so that we're not incurring this overhead.
    this.urlTemplates = mapObject(urlTemplates, (templatesForType) => {
      return mapObject(templatesForType, templating.parse.bind(templating));
    });
  }

  toJSON() {
    const res = <DocumentJSON>{};
    const data = this.primary;

    if(this.meta) {
      res.meta = this.meta;
    }

    // TODO: top-level related link.
    if(this.reqURI) {
      res.links = {"self": this.reqURI};
    }

    if(this.errors) {
      res.errors = this.errors.map(errorToJSON);
    }

    else {
      res.data = data instanceof Collection || data instanceof Resource
        ? mapResources(data, (resource) =>
            resourceToJSON(resource, this.urlTemplates))

        : (data instanceof Linkage
            ? data.toJSON()
            : data); // data is null in this case.
    }

    if(this.included && this.included instanceof Collection) {
      res.included = arrayUnique(this.included.resources).map((resource) => {
        return resourceToJSON(resource, this.urlTemplates);
      });
    }

    return res;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}

function relationshipToJSON(relationship, urlTemplates, templateData): RelationshipJSON {
  const result = <RelationshipJSON>{};

  if(relationship.linkage) {
    result.data = relationship.linkage.toJSON();
  }

  // Add urls that we can.
  if(urlTemplates[templateData.ownerType]) {
    const relatedUrlTemplate = relationship.relatedURITemplate
      ? templating.parse(relationship.relatedURITemplate)
      : urlTemplates[templateData.ownerType].related;

    const selfUrlTemplate = relationship.selfURITemplate
      ? templating.parse(relationship.selfURITemplate)
      : urlTemplates[templateData.ownerType].relationship;

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
