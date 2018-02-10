import Resource, { ResourceJSON } from "./Resource";
import APIError, { APIErrorJSON } from './APIError';
import { isPlainObject, objectIsEmpty } from "../util/misc";
import { PrimaryDataJSON, UrlTemplateFnsByType, UrlTemplateFns, Links } from './index';
import Relationship from './Relationship';
import ResourceSet from './ResourceSet';
import ResourceIdentifierSet from "../types/ResourceIdentifierSet";

// TODO: Make the constructor API sane in the presence of types;
// actually define the API for this class (e.g., which fields are public?)
// TODO: use more Maybes for optional fields?
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
  primary?: ResourceSet | Relationship | ResourceIdentifierSet;
  errors?: APIError[];
  urlTemplates?: UrlTemplateFnsByType;
};

export default class Document {
  public meta: DocumentData['meta'];
  public included: DocumentData['included'];
  public primary: DocumentData['primary'];
  public errors: DocumentData['errors'];
  public urlTemplates: UrlTemplateFnsByType;

  constructor(data: DocumentData) {
    // Assign data members, giving some a default.
    const { urlTemplates = {}, ...restData } = data;

    // Validate meta, as sometimes we pass it in straight from the JSON,
    // which isn't really the case for anything else. TODO: decide what
    // level of validation/encapsulation is appropriate, given typescript.
    if(typeof data.meta !== 'undefined' && !isPlainObject(data.meta)) {
      throw new Error("Document `meta` must be an object.");
    }

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

    const { data = undefined, links = {} } = (() => {
      if(this.primary instanceof ResourceSet) {
        return this.primary.toJSON(this.urlTemplates);
      }

      else if (this.primary instanceof Relationship) {
        return this.primary.toJSON(
          templatesForRelationship(this.urlTemplates[this.primary.owner.type] || {})
        );
      }

      else if(this.primary) {
        return this.primary.toJSON();
      }

      return {};
    })();

    if(this.meta) {
      res.meta = this.meta;
    }

    if(!objectIsEmpty(links)) {
      res.links = links;
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

  clone() {
    const Ctor = (this.constructor || Document) as typeof Document;
    return new Ctor(this);
  }
}
