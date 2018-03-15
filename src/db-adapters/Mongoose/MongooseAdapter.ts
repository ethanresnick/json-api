import R = require('ramda');
// Import mongo just for one of its type declarations (not imported at runtime).
// tslint:disable-next-line no-implicit-dependencies
import mongodb = require("mongodb");
import mongoose = require("mongoose");
import pluralize = require("pluralize");
import { Model, Document } from "mongoose";

import { AndPredicate } from "../../types/";
import { partition, setDifference, reduceToObject } from "../../util/misc";
import { values as objectValues } from '../../util/objectValueEntries';
import {
  getReferencePaths, getReferencedModelName,
  getDiscriminatorKey, getVersionKey, getMetaKeys
} from './utils/schema';
import { getTypePath } from "./utils/subtyping";
import docToResource from "./utils/doc-to-resource";
import { getTypeName } from '../../util/naming-conventions';
import * as util from "./lib";
import Data from "../../types/Generic/Data";
import Resource, { ResourceWithTypePath } from "../../types/Resource";
import ResourceIdentifier from "../../types/ResourceIdentifier";
import APIError from "../../types/APIError";
import FieldDocumentation from "../../types/Documentation/Field";
import FieldTypeDocumentation from "../../types/Documentation/FieldType";
import RelationshipTypeDocumentation from "../../types/Documentation/RelationshipType";
import { Adapter, TypeInfo, TypeIdMapOf } from '../AdapterInterface';
import CreateQuery from "../../types/Query/CreateQuery";
import FindQuery from "../../types/Query/FindQuery";
import DeleteQuery from "../../types/Query/DeleteQuery";
import UpdateQuery from "../../types/Query/UpdateQuery";
import AddToRelationshipQuery from "../../types/Query/AddToRelationshipQuery";
import RemoveFromRelationshipQuery from "../../types/Query/RemoveFromRelationshipQuery";

export default class MongooseAdapter implements Adapter<typeof MongooseAdapter> {
  // Workaround for https://github.com/Microsoft/TypeScript/issues/3841.
  // Doing this makes our implements declaration work.
  "constructor": typeof MongooseAdapter;

  // Some precomputed name mappings that we use throughout.
  // Note: a type name here can be a subtype (in the sense of Query.type,
  // or what goes in a typePath), even though subtypes aren't rendered in
  // the json-api `type` key. We need these mappings to read discriminator key
  // values correctly, and it's also just more convenient for users to pass in
  // models keyed by model name b/c that's how mongoose stores them.
  protected typeNamesToModelNames: { [typeName: string]: string | undefined };
  protected modelNamesToTypeNames: { [modelName: string]: string | undefined };

  constructor(
    protected models: { [modelName: string]: Model<any> } = (mongoose as any).models,
    protected toTypeName: (modelName: string) => string = getTypeName,
    protected idGenerator?: ((doc: Document) => mongodb.ObjectID)
  ) {
    this.typeNamesToModelNames = {};
    this.modelNamesToTypeNames = {};

    for(const modelName of Object.keys(models)) {
      const typeName = toTypeName(modelName);
      this.typeNamesToModelNames[typeName] = modelName;
      this.modelNamesToTypeNames[modelName] = typeName;
    }
  }

  // Partially applied versions of the static/utility methods to simplify things.
  docToResource(doc: Document, fields?: object) {
    return docToResource(this.models, this.modelNamesToTypeNames, doc, fields);
  }

  docsToResourceData(docs: null | Document | Document[], isPlural: boolean, fields?: object) {
    return this.constructor.docsToResourceData(
      this.models,
      this.modelNamesToTypeNames,
      docs,
      isPlural,
      fields
    );
  }

  getTypePath(model: Model<any>) {
    return getTypePath(model, this.modelNamesToTypeNames);
  }

  /**
   * Returns a Promise for an array of 3 items: the primary resources (either
   * a single Resource or a Collection); the included resources, as an array;
   * and the size of the full collection, if the primary resources represent
   * a paginated view of some collection.
   *
   * Note: The correct behavior if idOrIds is an empty array is to return no
   * documents, as happens below. If it's undefined, though, we're not filtering
   * by id and should return all documents.
   */
  async find(query: FindQuery) {
    const {
      type,
      populates: includePaths,
      select: fields,
      sort: sorts,
      offset,
      limit,
      singular
    } = query

    const mode = singular ? 'findOne' : 'find';
    const filters = query.getFilters();
    const mongofiedFilters = util.toMongoCriteria(filters);

    const model = this.getModel(type);

    this.constructor.assertIdsValid(filters, singular);

    const isPaginating = mode !== 'findOne' &&
      (typeof offset !== 'undefined' || typeof limit !== 'undefined');

    let primaryDocumentsPromise, includedResourcesPromise;

    const queryBuilder = mode === 'findOne' // ternary is a hack for TS compiler
      ? model[mode](mongofiedFilters)
      : model[mode](mongofiedFilters);

    // a promised query result that counts how many results we'd have if
    // we weren't paginating. this just resolves to null when we aren't paginating.
    const collectionSizePromise = isPaginating
      ? model.count(mongofiedFilters).exec()
      : Promise.resolve(null);

    // do sorting
    if(Array.isArray(sorts)) {
      queryBuilder.sort(
        sorts.map(it => (it.direction === 'DESC' ? '-' : '') + it.field).join(" ")
      );
    }

    if(offset) {
      queryBuilder.skip(offset);
    }

    if(limit) {
      queryBuilder.limit(limit);
    }

    // in an ideal world, we'd use mongoose here to filter the fields before
    // querying. But, because filtering out fields can really complicate population
    // for (nested) includes, we don't yet filter at query time but instead just
    // hide filtered fields in @docToResource. There is a more-efficient way to
    // do this down the road, though -- something like taking the provided fields
    // and expanding them just enough (by looking at the relationship paths) to
    // make sure that we have the relationship fields to populate --while still
    // querying for less data than we would without any fields restriction.
    // For reference, the code for safely using the user's `fields` input, by
    // putting them into a mongoose `.select()` object so that the user can't
    // prefix a field with a minus on input to affect the query, is below.
    // Reference: http://mongoosejs.com/docs/api.html#query_Query-select.
    // let arrToSelectObject = (prev, curr) => { prev[curr] = 1; return prev; };
    // for(let type in fields) {
    //   fields[type] = fields[type].reduce(arrToSelectObject, {});
    // }

    // support includes, but only a level deep for now (recursive includes,
    // especially if done in an efficient way query wise, are a pain in the ass).
    if(includePaths && includePaths.length > 0) {
      const populatedPaths: string[] = [];
      const refPaths = getReferencePaths(model);

      includePaths.map((it) => it.split(".")).forEach((pathParts) => {
        // first, check that the include path is valid.
        if(!refPaths.includes(pathParts[0])) {
          const title = "Invalid include path.";
          const detail = `Resources of type "${type}" don't have a(n) "${pathParts[0]}" relationship.`;
          throw new APIError(400, undefined, title, detail);
        }

        if(pathParts.length > 1) {
          throw new APIError(501, undefined, "Multi-level include paths aren't yet supported.");
        }

        // Finally, do the population
        populatedPaths.push(pathParts[0]);
        queryBuilder.populate(pathParts[0]);
      });

      let includedResources: Resource[] = [];
      primaryDocumentsPromise = Promise.resolve(queryBuilder.exec()).then((docOrDocs) => {
        includedResources =
          objectValues(
            Data.fromJSON(docOrDocs) // fromJSON to handle docOrDocs === null.
              .flatMap<Resource>((doc) => {
                return Data.of(populatedPaths).flatMap((path) => {
                  // Handle case that doc[path], which should hold id(s) of the
                  // referenced documents, is undefined b/c the relationship isn't set.
                  return typeof doc[path] === 'undefined'
                    ? Data.empty as Data<Resource>
                    : Data.fromJSON(doc[path]).map(docAtPath => {
                        return this.docToResource(docAtPath, fields);
                      })
                })
              })
              .values
              // Remove duplicates
              .reduce((acc, resource) => {
                acc[`${resource.type}/${resource.id}`] = resource;
                return acc;
              }, {} as { [id: string]: Resource })
          );

        return docOrDocs;
      });

      includedResourcesPromise =
        primaryDocumentsPromise.then(() => includedResources);
    }

    else {
      primaryDocumentsPromise = Promise.resolve(queryBuilder.exec());
      includedResourcesPromise = Promise.resolve(undefined);
    }

    return Promise.all([
      primaryDocumentsPromise.then((it) => {
        return this.docsToResourceData(it, mode === 'find', fields);
      }),
      includedResourcesPromise,
      collectionSizePromise
    ])/*.then(([primary, included, collectionSize]) => {
      return [primary, { included, meta: { collectionSize } }];
    })*/.catch(util.errorHandler);
  }

  /**
   * Returns a Promise that fulfills with the created Resource. The Promise
   * may also reject with an error if creation failed or was unsupported.
   */
  async create(query: CreateQuery) {
    const { records: resourceData } = query;
    const getSmallestSubType = (it: ResourceWithTypePath) => it.typePath[0];
    const setIdWithGenerator =
      typeof this.idGenerator === "function" &&
        ((doc) => { doc._id = (this.idGenerator as Function)(doc); });

    const resourcesByParentType = partition('type', resourceData);
    const creationPromises = Object.keys(resourcesByParentType).map(type => {
      const model = this.getModel(type);
      const discriminatorKey = getDiscriminatorKey(model);

      const resources = resourcesByParentType[type];
      const docObjects = resources.map((resource) => {
        const finalModel = this.getModel(getSmallestSubType(resource));
        const forbiddenKeys = getMetaKeys(finalModel);

        if(forbiddenKeys.some(k => k in resource.attrs || k in resource.relationships)) {
          throw new APIError({
            status: 400,
            title: "Illegal attribute/relationship provided."
          });
        }

        return util.resourceToDocObject(resource, (typePath: string[]) => {
          if(typePath.length === 1) {
            return {};
          }

          const smallestSubType = getSmallestSubType(resource);
          if(!discriminatorKey || !this.getModel(smallestSubType)) {
            throw new Error("Unexpected model name. Should've been caught earlier.");
          }

          return { [discriminatorKey]: this.typeNamesToModelNames[smallestSubType] };
        });
      });

      if(setIdWithGenerator) {
        docObjects.forEach(setIdWithGenerator);
      }

      return model.create(docObjects) as Promise<mongoose.Document[]>;
    });

    return Promise.all(creationPromises).then((docArrays) => {
      const makeCollection = !resourceData.isSingular;
      const finalDocs = docArrays.reduce((a, b) => a.concat(b), []);
      // TODO: why isn't fields passed here, but is only passed in find...
      // is that appropriate? (Probably... check spec, and common sense.)
      return this.docsToResourceData(finalDocs, makeCollection);
    }).catch(util.errorHandler);
  }

  /**
   */
  async update(query: UpdateQuery) {
    const { type: parentType, patch } = query;
    const parentModel = this.getModel(parentType);

    const prefetchedDocs = patch.map(it => it.adapterExtra).values.filter(it => !!it);
    const getOIdAsString = R.pipe<Record<"_id", mongodb.ObjectID>, mongodb.ObjectID, string>(R.prop('_id'), String);

    const docIdsToFetch = [...setDifference(
      patch.map(R.prop('id')).values,
      prefetchedDocs.map(getOIdAsString),
    )];

    // We only execute this if there's a non-zero number of docs still to fetch.
    const remainingDocsQuery =
      parentModel.find({ _id: { $in: docIdsToFetch } }).lean();

    const docsToUpdate = docIdsToFetch.length === 0
      ? prefetchedDocs
      : [...prefetchedDocs, ...(await remainingDocsQuery.exec() as any)];

    // We can store just by id, because we know all the types will be
    // the same :). (They'll all be the root type of `UpdateQuery.type`.)
    const docsToUpdateById = docsToUpdate.reduce(reduceToObject(getOIdAsString), {});

    const updateOpts = {
      new: true,
      // we validate the full doc in memory below,
      // so no need to run the validators again on update
      runValidators: false,
      upsert: false,
      // discard updates to fields not recognized in the schema.
      // TODO: set this to 'throw' instead?
      strict: true
    };

    const singleDocUpdateQueries = await patch.mapAsync(async (resourceUpdate) => {
      // tslint:disable-next-line no-shadowed-variable
      const Model = this.getModel(resourceUpdate.typePath[0]);
      const versionKey = getVersionKey(Model);

      if(!Model) {
        throw new Error("Unknown model name.");
      }

      const existingDoc = docsToUpdateById[resourceUpdate.id];
      const changeSet = util.resourceToDocObject(resourceUpdate);

      // Doc couldn't be found when we searched for it above.
      if(!existingDoc) {
        throw new APIError({
          status: 404,
          title: "One or more of the resources to update could not be found.",
          detail: `First missing resource was (${resourceUpdate.type}, ${resourceUpdate.id}).`
        });
      }

      const forbiddenKeys = getMetaKeys(Model);
      if(forbiddenKeys.some(k => k in changeSet)) {
        throw new APIError({
          status: 400,
          title: "Illegal attribute/relationship provided."
        });
      }

      // Construct an in-memory document for this resource and
      // apply the updates to it. Using .set ensures that setters get run, etc.
      const updatedDoc = Model.hydrate(existingDoc).set(changeSet);

      // Test that the doc is valid, using special
      // mongo error handling function if it isn't.
      try { await updatedDoc.validate(); } catch(e) { util.errorHandler(e) }

      // Then, we can't .save() because that won't let us add a criteria
      // on the version key. So, we construct an update based on the modified
      // paths of the updatedDoc (again, we don't just use the changeSet because
      // we want the result of applying setters) and findOneAndUpdate that.
      // Note: even if we were hydrating the model with an empty doc, we'd want
      // to call modifiedPaths to exclude keys for which the model set a default
      const modifiedPaths = updatedDoc.modifiedPaths();
      const updatedDocObject = updatedDoc.toObject();

      const finalUpdate = modifiedPaths.reduce((acc, key) => {
        acc[key] = updatedDocObject[key];
        return acc;
      }, {
        // Increment the version key so other updates based on reads
        // of an old version fail (with the version check below).
        "$inc": { [versionKey]: 1 }
      });

      const criteria = {
        _id: resourceUpdate.id,
        [versionKey]: existingDoc[versionKey]
      };

      // Note: the query below has to be wrapped in an array (or something)
      // so that it's not run automatically (because we're in an async function
      // and query is a thenable, so js would await the query). We don't want
      // it to run because we only wan to run the queries if all docs'
      // validation succeeds.
      return [parentModel.findOneAndUpdate(criteria, finalUpdate, updateOpts)];
    });

    // Don't run ANY of the queries unless all could be built successfully
    // (I.e., every changeset was valid).
    return singleDocUpdateQueries.flatMapAsync(async ([docUpdateQuery]) => {
      const doc = await (docUpdateQuery.exec().catch(util.errorHandler) as Promise<mongoose.Document>);

      if(!doc) {
        throw new APIError({
          status: 409,
          title: "One or more of the resources you are trying to update either " +
            "changed or was deleted while you were trying to update it. Try again.",
        });
      }

      return this.docsToResourceData(doc, false);
    });
  }

  async delete(query: DeleteQuery) {
    // Delete queries in theory let users delete resources that match arbitrary
    // criteria. Atm, though, json-api only supports delete by id(s). And, below,
    // we assume that ids are the only criteria in use, e.g., when we check the
    // length of the result set. So, throw if that assumption doesn't hold.
    if(!query.isSimpleIdQuery()) {
      throw new Error("Unsupported delete query");
    }

    // On deletion, the library doesn't load + verify for us the subtypes of
    // the resources the user is trying to delete (because that overhead isn't
    // strictly necessary, unlike in the update case where it's needed to run
    // the proper beforeSave). So, we have to do that ourselves first. If any
    // types are invalid, we do no deletions and return 400.
    const { type, singular } = query;
    const mode = singular ? 'findOne' : 'find';
    const filters = query.getFilters();
    const mongofiedFilters = util.toMongoCriteria(filters);

    // Before we query to verify the subtypes, lets throw a targeted error
    // message if we can identify that any of the ids are in an invalid format.
    this.constructor.assertIdsValid(filters, singular);

    // Ok, now, in order to verify that all ids of the right type, we need to
    // query on the root model of `Query.type` (Query.type could be a subtype);
    // if we query with the subtype model, ids that don't match the subtype will
    // just not match any docs, and we won't be able to distinguish the
    // "a doc is missing (404)" case from the "invalid type (400)" case.
    const QueryTypeModel = this.getModel(type);
    const baseModelName = QueryTypeModel.baseModelName || QueryTypeModel.modelName;
    const BaseModel = this.getModel(<string>this.modelNamesToTypeNames[baseModelName]);

    const queryBuilder = mode === 'findOne' // ternary is a hack for TS compiler
      ? BaseModel[mode](mongofiedFilters)
      : BaseModel[mode](mongofiedFilters);

    const docsToDelete = await queryBuilder.exec().then((docOrDocsOrNull) => {
      return Data.fromJSON<mongoose.Document>(docOrDocsOrNull);
    }, util.errorHandler);

    // Now, we verify all the type paths.
    const hasTypePathThrough = (throughType: string, doc: Document) => {
      return this.getTypePath(doc.constructor as Model<any>).includes(throughType);
    }

    if(!docsToDelete.every(R.partial(hasTypePathThrough, [type]))) {
      throw new APIError({
        status: 400,
        title: "One of the resources you're attempting to delete is not of an allowed type."
      });
    }

    // Ok, having verified that all the resources are of the right (sub) type,
    // we now want to check if no resources could be found and this is a single
    // delete. In that case only, we return 404. (If some resources were missing
    // and this is a bulk delete, we just delete the ones that we did find [as
    // making the client retry is inconvenient, and the result of removing the
    // missing ids and repeating the request would be the same].)
    if(singular && docsToDelete.size === 0) {
      throw new APIError({
        status: 404,
        title: "The resource you're trying to delete could not be found."
      });
    }

    // Finally, we can delete all the docs,
    // calling .remove() to run the user's middleware.
    docsToDelete.forEach(it => { it.remove(); });
    return docsToDelete.map((it: mongoose.Document) => this.docToResource(it));
  }

  /**
   * Unlike update(), which would do full replacement of a to-many relationship
   * if new linkage was provided, this method adds the new linkage to the existing
   * relationship. It doesn't do a find-then-save, so some mongoose hooks may not
   * run. But validation and the update query hooks will work.
   */
  async addToRelationship(query: AddToRelationshipQuery) {
    const { type, id, relationshipName, linkage: newLinkage } = query;

    // Below, we verify that the `type` key in linkage matches the `type` name
    // of the root model that the relationship is supposed to hold.
    //
    // TODO: if the relationship is supposed to hold resources only of a
    // specific subtype, validate that the linkage provided actually points to
    // a document of that subtype (and actually points to an existing document
    // at all!).
    //
    // TODO: update this to work like update(), where we find the doc and do an
    // update on it so that save middleware can run and so we know the subtype
    // of the owning document. Right now, we always run the parent model's
    // findOneAndUpdate middleware, even if type/id points to a subtype resource.
    // Likewise, we always read the supertype's schema when deciding which linkage
    // types are allowed. That's bad too.
    const model = this.getModel(type);
    this.assertRelationshipLinkageTypeValid(model, relationshipName, newLinkage);

    const options = { runValidators: true, context: 'query' };
    const update = {
      $addToSet: {
        [relationshipName]: { $each: newLinkage.map(it => it.id) }
      },
      $inc: { [getVersionKey(model)]: 1 }
    };

    return model.findOneAndUpdate({ "_id": id }, update, options).exec()
      .catch(util.errorHandler);
  }

  async removeFromRelationship(query: RemoveFromRelationshipQuery) {
    const { type, id, relationshipName, linkage: linkageToRemove } = query;

    // Below, we verify that the `type` key in linkage matches the `type` name
    // of the root model that the relationship is supposed to hold.
    //
    // TODO: if the relationship is supposed to hold resources only of a
    // specific subtype, validate that the linkage provided actually points to
    // a document of that subtype (and actually points to an existing document
    // at all).
    //
    // TODO: update this to work like update(), where we find the doc and do an
    // update on it so that save middleware can run and so we know the subtype
    // of the owning document. Right now, we always run the parent model's
    // findOneAndUpdate middleware, even if type/id points to a subtype resource.
    // Likewise, we always read the supertype's schema when deciding which linkage
    // types are allowed. That's bad too.
    const model = this.getModel(type);
    this.assertRelationshipLinkageTypeValid(model, relationshipName, linkageToRemove);

    const update = {
      $pullAll: {
        [relationshipName]: linkageToRemove.map(it => it.id)
      },
      $inc: { [getVersionKey(model)]: 1 }
    };
    const options = {runValidators: true, context: 'query'};

    return model.findOneAndUpdate({"_id": id}, update, options).exec()
      .catch(util.errorHandler);
  }

  /**
   * Takes the json-api (i.e., parent-most) `type` and id for a set or resources,
   * and returns the typePath for each resource. Must return subtypes earlier
   * in the array, per typePath rules. Can also return extra data about the
   * resource, which will be stored with it, for use optimizing future queries.
   * Any resources that aren't found won't have an entry in the results object.
   */
  async getTypePaths(items: {type: string, id: string}[]) {
    const itemsByType = partition('type', items);
    const types = Object.keys(itemsByType);
    const res = {};

    for(const type of types) {
      const theseItems = itemsByType[type];
      const BaseModel = this.getModel(type);
      const discriminatorKey = getDiscriminatorKey(BaseModel);

      // When we have a .lean() doc straight from mongo, we can't
      // just use .constructor to get the model. So we have to be
      // a bit more clever.
      const modelForLeanDoc = (it: any) =>
        (discriminatorKey && it[discriminatorKey])
          ? this.getModel(<string>this.modelNamesToTypeNames[it[discriminatorKey]])
          : BaseModel;

      // If we know the model has no subtypes,
      // we can skip a query altogether and just return the type path.
      if(!BaseModel.discriminators) {
        res[type] = theseItems.reduce((acc, item) => {
          acc[item.id] = { typePath: this.getTypePath(BaseModel) };
          return acc;
        }, {} as { [id: string]: TypeInfo });
      }

      else {
        const docsPromise =
          BaseModel.find({ _id: { $in: theseItems.map(it => it.id) }}).lean().exec();

        res[type] = docsPromise.then(docs => {
          return (docs as any[]).reduce((acc, doc) => {
            acc[String(doc._id)] = {
              typePath: this.getTypePath(modelForLeanDoc(doc)),
              extra: doc
            };
            return acc;
          }, {} as { [id: string]: TypeInfo });
        })
      }
    }

    const values = await Promise.all(types.map(type => res[type]));
    return types.reduce((acc, type, i) => {
      acc[type] = values[i];
      return acc;
    }, {} as TypeIdMapOf<TypeInfo>);
  }

  getModel(typeName: string) {
    const modelName = this.typeNamesToModelNames[typeName];
    if(!modelName || !this.models[modelName]) {
      // don't use an APIError here, since we don't want to
      // show this internals-specific method to the user.
      throw new Error(
        `No model for type "${typeName}" is registered with the MongooseAdapter.`
      );
    }
    return this.models[modelName];
  }

  /**
   * Return the paths that, for the provided type, must always must be filled
   * with relationship info, if they're present. Occassionally, a path might be
   * optionally fillable w/ relationship info; this shouldn't return those paths.
   */
  getRelationshipNames(typeName) {
    const model = this.getModel(typeName);
    return getReferencePaths(model);
  }

  doQuery(
    query: CreateQuery | FindQuery | UpdateQuery | DeleteQuery |
      AddToRelationshipQuery | RemoveFromRelationshipQuery
  ) {
    const method = (
      (query instanceof CreateQuery && this.create) ||
      (query instanceof FindQuery && this.find) ||
      (query instanceof DeleteQuery && this.delete) ||
      (query instanceof UpdateQuery && this.update) ||
      (query instanceof AddToRelationshipQuery && this.addToRelationship) ||
      (query instanceof RemoveFromRelationshipQuery && this.removeFromRelationship)
    );

    if(!method) {
      throw new Error("Unexpected query type.");
    }

    return method.call(this, query);
  }

  protected assertRelationshipLinkageTypeValid(
    ownerModel: Model<any>,
    relationshipName: string,
    linkage: ResourceIdentifier[]
  ) {
    const rootTypeNameForRefModel = (() => {
      try {
        const refModelName = getReferencedModelName(ownerModel, relationshipName);
        const refModelType = this.modelNamesToTypeNames[refModelName as string];
        const refModel = this.getModel(refModelType as string);
        return this.getTypePath(refModel).pop();
      } catch(e) {
        throw new Error(`Missing/invalid model name for relationship ${relationshipName}.`);
      }
    })();

    if(!linkage.every(it => it.type === rootTypeNameForRefModel)) {
      throw new APIError({
        status: 400,
        title: "Invalid linkage provided.",
        detail: `All linkage must have type: ${rootTypeNameForRefModel}.`
      });
    }
  }

  /**
   * We want return a singular Data<Resource> when the result is conceptually
   * singular, and a non-singular one otherwise. But, because mongoose returns
   * a single doc if you query for a one-item array of ids, and because we
   * sometimes generate arrays (e.g. of promises for documents' successful
   * creation) even when only creating/updating one document, just looking at
   * whether docs is an array isn't enough to tell us whether the result is
   * singular. And, in all these cases, we want to handle the possibility that
   * the query returned no documents when we needed one, such that we must 404.
   * This function centralizes all that logic.
   *
   * @param {object} models A model name => model dictionary
   * @param {object} modelNamesToTypeNames A model name => type name dictionary
   * @param {null | mongoose.Document | mongoose.Document[]} docs The docs to
   *   turn into a Data<Resource>
   * @param {boolean} isPlural Whether the result is not conceptually singular.
   * @param {object} fields
   */
  static docsToResourceData(
    models: any,
    modelNamesToTypeNames,
    docs: null | mongoose.Document | mongoose.Document[],
    isPlural: boolean,
    fields?: object
  ) {
    // if docs is an empty array and we're making a collection, that's ok.
    // but, if we're looking for a single doc, we must 404 if we didn't find any.
    if(!docs || (!isPlural && Array.isArray(docs) && docs.length === 0)) {
      throw new APIError(404, undefined, "No matching resource found.");
    }

    docs = !Array.isArray(docs) ? [docs] : docs;
    const resources = docs.map((it) =>
      docToResource(models, modelNamesToTypeNames, it, fields)
    );

    return isPlural ? Data.of<Resource>(resources) : Data.pure<Resource>(resources[0]);
  }

  static getStandardizedSchema(
    model: mongoose.Model<any>,
    pluralizer: typeof pluralize.plural = pluralize.plural.bind(pluralize)
  ) {
    const versionKey = getVersionKey(model);
    const discriminatorKey = getDiscriminatorKey(model);
    const virtuals = (model.schema as any).virtuals;
    const schemaFields: FieldDocumentation[] = [];

    const getFieldType = (path, schemaType) => {
      if(path === "_id") {
        return new FieldTypeDocumentation("Id", false);
      }

      const typeOptions = schemaType.options.type;
      const holdsArray = Array.isArray(typeOptions);

      const baseType = holdsArray ? typeOptions[0].ref : typeOptions.name;
      const refModelName = getReferencedModelName(model, path);

      return !refModelName ?
        new FieldTypeDocumentation(baseType, holdsArray) :
        new RelationshipTypeDocumentation(
          holdsArray, refModelName, getTypeName(refModelName, pluralizer)
        );

    };

    model.schema.eachPath((name, type) => {
      if([versionKey, discriminatorKey].includes(name)) {
        return;
      }

      // cast type to any for typescript because we're using
      // an uncomfortable number of undocumented properties below.
      const schemaType = type as any;
      const fieldType = getFieldType(name, schemaType);

      name = (name === "_id") ? "id" : name;
      const likelyAutoGenerated = name === "id" || (
        fieldType.baseType === "Date" &&
        /created|updated|modified/.test(name) &&
        typeof schemaType.options.default === "function"
      );

      let defaultVal;
      if(likelyAutoGenerated) {
        defaultVal = "__AUTO__";
      }

      else if(schemaType.options.default && typeof schemaType.options.default !== "function") {
        defaultVal = schemaType.options.default;
      }

      // find the "base type's" options (used below), in case
      // we have an array of values of the same type at this path.
      const baseTypeOptions = Array.isArray(schemaType.options.type)
        ? schemaType.options.type[0]
        : schemaType.options;

      // Add validation info
      const validationRules = {
        required: !!schemaType.options.required,
        oneOf: baseTypeOptions.enum ? schemaType.enumValues || (schemaType.caster && schemaType.caster.enumValues) : undefined,
        max: schemaType.options.max || undefined
      };

      schemaType.validators.forEach((validatorObj) => {
        Object.assign(validationRules, validatorObj.validator.JSONAPIDocumentation);
      });

      schemaFields.push(new FieldDocumentation(
        name,
        fieldType,
        validationRules,
        this.toFriendlyName(name),
        defaultVal
      ));
    });

    for(const virtual in virtuals) {
      // skip the id virtual, since we properly handled _id above.
      if(virtual === "id") {
        continue;
      }

      // for virtual properties, we can't infer type or validation rules at all,
      // so we add them with just a friendly name and leave the rest undefined.
      // The user is expected to override/set this in a resource type description.
      schemaFields.push(new FieldDocumentation(
        virtual,
        undefined,
        undefined,
        this.toFriendlyName(virtual)
      ));
    }
    return schemaFields;
  }

  static toFriendlyName(pathOrModelName: string) {
    const ucFirst = (v) => v.charAt(0).toUpperCase() + v.slice(1);

    // pascal case is "upper camel case", i.e. "MyName" as opposed to "myName".
    // this variable holds a normalized, pascal cased version of pathOrModelName,
    // such that `ModelFormat`, `pathFormat` `nested.path.format` all become
    // ModelFormat, PathFormat, and NestedPathFormat.
    const pascalCasedString = pathOrModelName.split(".").map(ucFirst).join("");

    // Now, to handle acronyms like InMLBTeam, we need to define a word as a
    // capital letter, plus (0 or more capital letters where the capital letter
    // is not followed by a non-capital letter or 0 or more non capital letters).
    let matches;
    const words: string[] = [];
    const wordsRe = /[A-Z]([A-Z]*(?![^A-Z])|[^A-Z]*)/g;

    // tslint:disable-next-line no-conditional-assignment
    while((matches = wordsRe.exec(pascalCasedString)) !== null) {
      words.push(matches[0]);
    }

    return words.join(" ");
  }

  /**
   * Verifies that filter constraints on the id field check against valid
   * mongo ids, and throws an error if not. TODO: Does this check make sense,
   * given that we don't also check relationship fields that hold ids?
   *
   * @param {AndPredicate} filters A set of filter constraints to check.
   * @param {boolean} isSingular Whether the query that the filters came from
   *   is singular. Influences error message.
   */
  static assertIdsValid(filters: AndPredicate, isSingular: boolean): void {
    const idsArray = filters.value.reduce((acc, filter) => {
      return filter.field === 'id'
        ? acc.concat(filter.value as any as (string | string[]))
        : acc;
    }, [] as string[]);

    if(!idsArray.every(this.idIsValid)) {
      throw isSingular
        ? new APIError(404, undefined, "No matching resource found.", "Invalid ID.")
        : new APIError(400, undefined, "Invalid ID.");
    }
  }

  static idIsValid(id) {
    return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  }

  static unaryFilterOperators: string[] = ["and", "or"];
  static binaryFilterOperators: string[] = ['eq', 'neq', 'ne', 'in', 'nin', 'lt', 'gt', 'lte', 'gte'];
}
