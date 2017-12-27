import Resource, { ResourceJSON } from "./Resource";
import APIError, { APIErrorJSON } from './APIError';
import { objectIsEmpty } from "../util/type-handling";
import { PrimaryDataJSON, UrlTemplateFnsByType, UrlTemplateFns, Links } from './index';
import ResourceSet from './ResourceSet';
import Relationship from './Relationship';

// TODO: Make the constructor API sane in the presence of types;
// actually define the API for this class (e.g., which fields are public?)
// TODO: use more Maybes for optional fields?
// TODO: don't take primary or errors as a single argument?
export type DocumentJSON = ({
  data: PrimaryDataJSON,
  errors: undefined,
  included?: ResourceJSON[]
} | {
  errors: APIErrorJSON[],
  data: undefined,
  included: undefined
}) & {
  meta?: object,
  links?: Links
};

export type DocumentData = {
  meta?: object;
  included?: Resource[];
  primary?: ResourceSet | Relationship;
  errors?: APIError[];
  reqURI?: string;
  urlTemplates?: UrlTemplateFnsByType;
};

export default class Document {
  public meta: DocumentData['meta'];
  public included: DocumentData['included'];
  public primary: DocumentData['primary'];
  public errors: DocumentData['errors'];
  public reqURI: DocumentData['reqURI'];
  public urlTemplates: UrlTemplateFnsByType;

  constructor(data: DocumentData) {
    // Assign data members, giving some a default.
    // TODO: decide what level of validation/encapsulation
    // is appropriate, given typescript.
    const { urlTemplates = {}, ...restData } = data;
    Object.assign(this, restData, { urlTemplates });
  }

  toJSON() {
    const res = <DocumentJSON>{};
    const serializeResource =
      (it: Resource) => it.toJSON(this.urlTemplates[it.type] || {});

    // This function renames the "relationship" template on the resource type
    // description to "self" for the purposes of passing templates to Relationship.
    const templatesForRelationship = (templatesForOwnerType: UrlTemplateFns) => {
      const { related = undefined, relationship = undefined } = templatesForOwnerType;
      return { related, self: relationship };
    }

    const { data = undefined, links = {} } =
      this.primary instanceof ResourceSet
        ? this.primary.toJSON(this.urlTemplates)
        : (this.primary
            ? this.primary.toJSON(
                templatesForRelationship(
                  this.urlTemplates[this.primary.owner.type] || {}
                )
              )
            : {});

    if(this.meta) {
      res.meta = this.meta;
    }

    if(!objectIsEmpty(links)) {
      res.links = links;
    }

    // TODO: top-level related link.
    if(this.reqURI) {
      res.links = { "self": this.reqURI, ...res.links };
    }

    if(this.errors) {
      res.errors = this.errors.map(it => it.toJSON());
    }

    else {
      res.data = data;
      if(this.included) {
        res.included = this.included.map(serializeResource);
      }
    }

    return res;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}
