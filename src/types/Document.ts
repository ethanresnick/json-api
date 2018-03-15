import APIError, { APIErrorJSON } from './APIError';
import { isPlainObject, objectIsEmpty } from "../util/misc";
import { PrimaryDataJSON, UrlTemplateFnsByType, UrlTemplateFns, Links } from './index';
import Data from "./Generic/Data";
import Resource, { ResourceJSON } from "./Resource";
import ResourceIdentifier from "./ResourceIdentifier";
import ResourceSet from './ResourceSet';
import Relationship from './Relationship';
import ResourceIdentifierSet from "../types/ResourceIdentifierSet";

// TODO: Make the constructor API sane in the presence of types;
// actually define the API for this class (e.g., which fields are public?)
// TODO: use more Maybes for optional fields?
//
// TODO: Require that, if doc.primary is a Relationship, the Relationship
// must have a data key, as a relationship without data, which is valid in
// resource objects, is invalid as primary data because it would result in
// an invalid response document (with no data key).
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

export type TransformMeta = {
  section: "primary" | "included";
};

export type DocTransformFn<T> = (resourceOrIdentifier: T, meta: TransformMeta) => Promise<T | undefined>;
export type DocResourceTransformFn = DocTransformFn<Resource>;
export type DocFullTransformFn = DocTransformFn<Resource | ResourceIdentifier>;

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
      const { related, relationship } = templatesForOwnerType;
      return { related, self: relationship };
    }

    const { data, links = {} } = (() => {
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

  getContents(): (Resource | ResourceIdentifier)[] {
    return [
      ...(this.included || []),
      ...(this.primary ? this.primary.values : [])
    ];
  }

  /**
   * The transform function walks over the items in the document and calls the
   * user-provided function for each one, building a new document with the results.
   *
   * @param {DocResourceTransformFn | DocFullTransformFn} fn The function to run
   *   over all items in the document. This function can return undefined to
   *   indicate that the argument provided to it should be removed altogether
   *   from the resulting document. By default, the user-provided function will
   *   be run on all resources and resource identifier objects in the document.
   *   When passed a resource, it must return a resource (or undefined) and,
   *   when passed a resource identifier, it must return a resource identifier
   *   (or undefined). When the document has resource identifier objects within
   *   a resource object, i.e., in relationships, transform traverses down to
   *   the resource identifier objects first and runs the function on those,
   *   storing the result in the outer resource, which is then ultimately run
   *   through the function itself.
   *
   * @param {boolean} resourcesOnly If this argument is true, resource identifier
   *   objects will be skipped when walking the document, and the user-provided
   *   function will only be run on full resources. Note: setting this false
   *   could incur a pretty sizable performance penalty (and, of course, requires
   *   that your transform function be able to work on ResoruceIdentifiers).
   */
  async transform(
    fn: DocResourceTransformFn | DocFullTransformFn,
    resourcesOnly: boolean = true
  ): Promise<Document> {
    const res = this.clone();

    // Turn the user's function into a function that we can use with flatMap
    // and that's aware of our "if undefined, then remove" pattern.
    // Note: we still need to partially apply meta before handing this to flatMap.
    const flatMapper = async (it: Resource | ResourceIdentifier, meta: TransformMeta) => {
      const result = await (fn as DocFullTransformFn)(it, meta);
      return result === undefined ? Data.empty : Data.pure(result);
    };

    // Create a function used to flatMap resources that knows to walk down
    // relationships, iff we're supposed to be doing that. Again, we still
    // need to partially apply meta before using with flatMap.
    const resourceFlatMapper = resourcesOnly
      ? flatMapper
      : async function (it: Resource, meta: TransformMeta): Promise<Data<Resource>> {
          const relationshipNames = Object.keys(it.relationships);
          const flatMapperWithMeta = (it2: any) => flatMapper(it2, meta);
          const newRelationshipPromises = relationshipNames.map(k =>
            it.relationships[k].flatMapAsync(flatMapperWithMeta)
          )

          const newRelationships = await Promise.all(newRelationshipPromises);
          newRelationships.forEach((newRelationship, i) => {
            it.relationships[relationshipNames[i]] = newRelationship;
          });

          // After transforming all the relationships, transform the resource.
          return flatMapper(it, meta);
        };

    // Makes sure we kick off both the primary and included promises
    // before awaiting anything, for speed.
    const newPrimaryPromiseOrUndefined = (() => {
      const primaryMeta: TransformMeta = { section: "primary" };
      const resourceFlatMapperWithMeta = (it2: any) =>
        (resourceFlatMapper as any)(it2, primaryMeta);

      if(res.primary instanceof ResourceSet) {
        return res.primary.flatMapAsync(resourceFlatMapperWithMeta);
      }

      // We don't have `.primary`, or we have linkage there,
      // and the user's asked not to tranform that, so we leave primary as-is.
      if(!res.primary || resourcesOnly) {
        return res.primary;
      }

      // We have, and are transforming, linkage.
      return res.primary.flatMapAsync((it2: any) => flatMapper(it2, primaryMeta));
    })();

    if(res.included) {
      const includedMeta: TransformMeta = { section: "included" };
      const resourceFlatMapperWithMeta = (it2: any) =>
        (resourceFlatMapper as any)(it2, includedMeta);

      res.included =
        (await Data.of(res.included).flatMapAsync<any>(resourceFlatMapperWithMeta)).values;
    }

    res.primary = await newPrimaryPromiseOrUndefined;
    return res;
  }
}
