import Q = require("q");
import mongodb = require("mongodb");
import mongoose = require("mongoose");
import pluralize = require("pluralize");

import {arrayContains, arrayValuesMatch} from "../../util/arrays";
import {deleteNested} from "../../util/misc";
import {forEachArrayOrVal, mapResources, groupResourcesByType} from "../../util/type-handling";
import * as util from "./lib";
import Resource, { ResourceWithId } from "../../types/Resource";
import Collection from "../../types/Collection";
import Linkage from "../../types/Linkage";
import Relationship from "../../types/Relationship";
import APIError from "../../types/APIError";
import FieldDocumentation from "../../types/Documentation/Field";
import FieldTypeDocumentation from "../../types/Documentation/FieldType";
import RelationshipTypeDocumentation from "../../types/Documentation/RelationshipType";
import { Adapter } from '../AdapterInterface';

export default class MongooseAdapter implements Adapter<typeof MongooseAdapter> {
  // Workaround for https://github.com/Microsoft/TypeScript/issues/3841.
  // Doing this makes our implements declaration work.
  "constructor": typeof MongooseAdapter;

  public models: {[modelName: string]: mongoose.Model<any>};
  public inflector: typeof pluralize;
  public idGenerator: (doc: mongoose.Document) => mongodb.ObjectID

  constructor(models?: {[modelName: string]: mongoose.Model<any>}, inflector?, idGenerator?) {
    this.models = models || <{[modelName: string]: mongoose.Model<any>}>(<any>mongoose).models;
    this.inflector = inflector || pluralize;
    this.idGenerator = idGenerator;
  }

  /**
   * Returns a Promise for an array of two items: the primary resources (either
   * a single Resource or a Collection) and the included resources, as an array.
   *
   * Note: The correct behavior if idOrIds is an empty array is to return no
   * documents, as happens below. If it's undefined, though, we're not filtering
   * by id and should return all documents.
   */
  find(type, idOrIds: string | string[] | undefined, fields, sorts, filters, includePaths) {
    const model = this.getModel(this.constructor.getModelName(type));
    const [mode, idQuery] = this.constructor.getIdQueryType(idOrIds);
    const pluralizer = this.inflector.plural;
    let primaryDocumentsPromise, includedResourcesPromise = Q(null);

    const queryBuilder = mode === 'findOne' // ternary is a hack for TS compiler
      ? model[mode](idQuery)
      : model[mode](idQuery);

    // do sorting
    if(Array.isArray(sorts)) {
      queryBuilder.sort(sorts.join(" "));
    }

    // filter out invalid records with simple fields equality.
    // note that there's a non-trivial risk of sql-like injection here.
    // we're mostly protected by the fact that we're treating the filter's
    // value as a single string, though, and not parsing as JSON.
    if(typeof filters === "object" && !Array.isArray(filters)) {
      queryBuilder.where(filters);
    }

    // in an ideal world, we'd use mongoose here to filter the fields before
    // querying. But, because the fields to filter can be scoped by type and
    // we don't always know about a document's type until after query (becuase
    // of discriminator keys), and because filtering out fields can really
    // complicate population for includes, we don't yet filter at query time but
    // instead just hide filtered fields in @docToResource. There is a more-
    // efficient way to do this down the road, though--something like taking the
    // provided fields and expanding them just enough (by looking at the type
    // heirarachy and the relationship paths) to make sure that we're not going
    // to run into any of the problems outlined above, while still querying for
    // less data than we would without any fields restriction. For reference, the
    // code for safely using the user's `fields` input, by putting them into a
    // mongoose `.select()` object so that the user can't prefix a field with a
    // minus on input to affect the query, is below.
    // Reference: http://mongoosejs.com/docs/api.html#query_Query-select.
    // let arrToSelectObject = (prev, curr) => { prev[curr] = 1; return prev; };
    // for(let type in fields) {
    //   fields[type] = fields[type].reduce(arrToSelectObject, {});
    // }

    // support includes, but only a level deep for now (recursive includes,
    // especially if done in an efficient way query wise, are a pain in the ass).
    if(includePaths) {
      const populatedPaths: string[] = [];
      const refPaths = util.getReferencePaths(model);

      includePaths = includePaths.map((it) => it.split("."));
      includePaths.forEach((pathParts) => {
        // first, check that the include path is valid.
        if(!arrayContains(refPaths, pathParts[0])) {
          let title = "Invalid include path.";
          let detail = `Resources of type "${type}" don't have a(n) "${pathParts[0]}" relationship.`;
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
      primaryDocumentsPromise = Q(queryBuilder.exec()).then((docs) => {
        forEachArrayOrVal(docs, (doc) => {
          // There's no gaurantee that the doc (or every doc) was found
          // and we can't populate paths on a non-existent doc.
          if(!doc) return;

          populatedPaths.forEach((path) => {
            // if it's a toOne relationship, doc[path] will be a doc or undefined;
            // if it's a toMany relationship, we have an array (or undefined).
            let refDocs = Array.isArray(doc[path]) ? doc[path] : [doc[path]];
            refDocs.forEach((it) => {
              // only include if it's not undefined.
              if(it) {
                includedResources.push(
                  this.constructor.docToResource(it, pluralizer, fields)
                );
              }
            });
          });
        });

        return docs;
      });

      includedResourcesPromise = primaryDocumentsPromise.then(() =>
        new Collection(includedResources)
      );
    }

    else {
      primaryDocumentsPromise = Q(queryBuilder.exec());
    }

    return Q.all([primaryDocumentsPromise.then((it) => {
      const makeCollection = !idOrIds || Array.isArray(idOrIds) ? true : false;
      return this.constructor.docsToResourceOrCollection(it, makeCollection, pluralizer, fields);
    }), includedResourcesPromise]).catch(util.errorHandler);
  }

  /**
   * Returns a Promise that fulfills with the created Resource. The Promise
   * may also reject with an error if creation failed or was unsupported.
   *
   * @param {string} parentType - All the resources to be created must be this
   *   type or be sub-types of it.
   * @param {(Resource|Collection)} resourceOrCollection - The resource or
   *   collection of resources to create.
   */
  create(parentType, resourceOrCollection) {
    const resourcesByType = groupResourcesByType(resourceOrCollection);

    // Note: creating the resources as we do below means that we do one
    // query for each type, as opposed to only one query for all of the
    // documents. That's unfortunately much slower, but it ensures that
    // mongoose runs all the user's hooks.
    let creationPromises: Array<Promise<mongoose.Document[]>> = [];
    let setIdWithGenerator = (doc) => { doc._id = this.idGenerator(doc); };
    for(let type in resourcesByType) {
      let model = this.getModel(this.constructor.getModelName(type));
      let resources: Resource[] = resourcesByType[type];
      let docObjects = resources.map(util.resourceToDocObject);

      if(typeof this.idGenerator === "function") {
        forEachArrayOrVal(docObjects, setIdWithGenerator);
      }

      creationPromises.push(model.create(docObjects));
    }

    return Promise.all(creationPromises).then((docArrays) => {
      const makeCollection = resourceOrCollection instanceof Collection;
      const finalDocs = docArrays.reduce((a, b) => a.concat(b), []);
      // TODO: why isn't fields passed here, but is only passed in find...
      // is that appropriate? (Probably... check spec, and common sense.)
      return this.constructor.docsToResourceOrCollection(
        finalDocs, makeCollection, this.inflector.plural
      );
    }).catch(util.errorHandler);
  }

  /**
   * @param {string} parentType - All the resources to be created must be this
   *   type or be sub-types of it.
   * @param {Object} resourceOrCollection - The changed Resource or Collection
   *   of resources. Should only have the fields that are changed.
   */
  update(parentType, resourceOrCollection) {
    // It'd be faster to bypass Mongoose Document creation & just have mongoose
    // send a findAndUpdate command directly to mongo, but we want Mongoose's
    // standard validation and lifecycle hooks, and so we have to find first.
    // Note that, starting in Mongoose 4, we'll be able to run the validations
    // on update, which should be enough, so we won't need to find first.
    // https://github.com/Automattic/mongoose/issues/860
    // TODO: Fix the above. Using update also provides a better concurrency model.
    // Either that, or we need to do add a where version = ... between the find
    // and the update to make sure we don't have conflicting changes.
    const model = this.getModel(this.constructor.getModelName(parentType));
    const singular = this.inflector.singular;
    const plural = this.inflector.plural;

    // Set up some data structures based on resourcesOrCollection
    const resourceTypes: string[] = [];
    const changeSets = {};

    const idOrIds = mapResources(resourceOrCollection, (it: ResourceWithId) => {
      changeSets[it.id] = it;
      resourceTypes.push(it.type);
      return it.id;
    });

    const [mode, idQuery] = this.constructor.getIdQueryType(idOrIds);
    const queryBuilder = mode === 'findOne' // ternary is a hack for TS compiler
      ? model[mode](idQuery)
      : model[mode](idQuery);

    return Q(queryBuilder.exec()).then((docs) => {
      const successfulSavesPromises: Promise<mongoose.Document>[] = [];

      // if some ids were invalid/deleted/not found, we can't let *any* update
      // succeed. this is the beginning of our simulation of transactions.
      // There are two types of invalid cases here: we looked up one or more
      // docs and got none back (i.e. docs === null) or we looked up an array of
      // docs and got back docs that were missing some requested ids.
      if(docs === null) {
        throw new APIError(404, undefined, "No matching resource found.");
      }
      else {
        const idOrIdsAsArray = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
        const docIdOrIdsAsArray = Array.isArray(docs) ? docs.map(it => it.id) : [docs.id];

        if(!arrayValuesMatch(idOrIdsAsArray, docIdOrIdsAsArray)) {
          let title = "Some of the resources you're trying to update could not be found.";
          throw new APIError(404, undefined, title);
        }
      }

      forEachArrayOrVal(docs, (currDoc: mongoose.Document & { id: any}) => {
        let newResource = changeSets[currDoc.id];

        // Allowing the type to change is a bit of a pain. If the type's
        // changed, it means the mongoose Model representing the doc must be
        // different too. So we have to get the data from the old doc with
        // .toObject(), change its discriminator, and then create an instance
        // of the new model with that data. We also have to mark that new
        // instance as not representing a new document, so that mongoose will
        // do an update query rather than a save. Finally, we have to do all
        // this before updating other attributes, so that they're correctly
        // marked as modified when changed.
        const currDocModel = (<mongoose.Model<any>>currDoc.constructor);
        const currentModelName = currDocModel.modelName;
        const newModelName = this.constructor.getModelName(newResource.type, singular);
        if(currentModelName !== newModelName) {
          const newDoc = currDoc.toObject({virtuals: true, getters: true});
          const NewModelConstructor = this.getModel(newModelName);

          // TODO: is schema.options.discriminatorKey always defined?
          // Is this a/the most public interface through which we can access it?
          newDoc[<string>(<any>currDocModel.schema).options.discriminatorKey] = newModelName;

          // replace the currDoc with our new creation.
          currDoc = new NewModelConstructor(newDoc);
          currDoc.isNew = false;
        }

        // update all attributes and links provided, ignoring type/meta/id.
        currDoc.set(util.resourceToDocObject(newResource));

        successfulSavesPromises.push(currDoc.save());
      });

      return Promise.all(successfulSavesPromises);
    }).then((docs) => {
      let makeCollection = resourceOrCollection instanceof Collection;
      return this.constructor.docsToResourceOrCollection(docs, makeCollection, plural);
    }).catch(util.errorHandler);
  }

  delete(parentType, idOrIds) {
    const model = this.getModel(this.constructor.getModelName(parentType));
    const [mode, idQuery] = this.constructor.getIdQueryType(idOrIds);

    if(!idOrIds) {
      return Q.Promise((resolve, reject) => {
        reject(new APIError(400, undefined, "You must specify some resources to delete"));
      });
    }

    const queryBuilder = mode === 'findOne' // ternary is a hack for TS compiler
      ? model[mode](idQuery)
      : model[mode](idQuery);

    return Q(queryBuilder.exec()).then((docs) => {
      if(!docs) throw new APIError(404, undefined, "No matching resource found.");
      forEachArrayOrVal(docs, (it) => { it.remove(); });
      return docs;
    }).catch(util.errorHandler);
  }

  /**
   * Unlike update(), which would do full replacement of a to-many relationship
   * if new linkage was provided, this method adds the new linkage to the existing
   * relationship. It doesn't do a find-then-save, so some mongoose hooks may not
   * run. But validation and the update query hooks will work if you're using
   * Mongoose 4.0.
   */
  addToRelationship(type, id, relationshipPath, newLinkage) {
    let model = this.getModel(this.constructor.getModelName(type));
    let update = {
      $addToSet: {
        [relationshipPath]: { $each: newLinkage.value.map(it => it.id)}
      }
    };
    let options = {runValidators: true};

    return Q.ninvoke(model, "findOneAndUpdate", {"_id": id}, update, options)
      .catch(util.errorHandler);
  }

  removeFromRelationship(type, id, relationshipPath, linkageToRemove) {
    let model = this.getModel(this.constructor.getModelName(type));
    let update = {
      $pullAll: {
        [relationshipPath]: linkageToRemove.value.map(it => it.id)
      }
    };
    let options = {runValidators: true};

    return Q.ninvoke(model, "findOneAndUpdate", {"_id": id}, update, options)
      .catch(util.errorHandler);
  }

  getModel(modelName) {
    if(!this.models[modelName]) {
      // don't use an APIError here, since we don't want to
      // show this internals-specific method to the user.
      let err = new Error(`The model "${modelName}" has not been registered with the MongooseAdapter.`);
      (<any>err).status = 404;
      throw err;
    }
    return this.models[modelName];
  }

  getTypesAllowedInCollection(parentType) {
    const parentModel = this.getModel(
      this.constructor.getModelName(parentType, this.inflector.singular)
    );
    return [parentType].concat(
      this.constructor.getChildTypes(parentModel, this.inflector.plural)
    );
  }

  /**
   * Return the paths that, for the provided type, must always must be filled
   * with relationship info, if they're present. Occassionally, a path might be
   * optionally fillable w/ relationship info; this shouldn't return those paths.
   */
  getRelationshipNames(type) {
    let model = this.getModel(
      this.constructor.getModelName(type, this.inflector.singular)
    );
    return util.getReferencePaths(model);
  }

  /**
   * We want to always return a collection when the user is asking for something
   * that's logically a Collection (even if it only has 1 item), and a Resource
   * otherwise. But, because mongoose returns a single doc if you query for a
   * one-item array of ids, and because we sometimes generate arrays (e.g. of
   * promises for documents' successful creation) even when only creating/updating
   * one document, just looking at whether docs is an array isn't enough to tell
   * us whether to return a collection or not. And, in all these cases, we want
   * to handle the possibility that the query returned no documents when we needed
   * one, such that we must 404. This function centralizes all that logic.
   *
   * @param docs The docs to turn into a resource or collection
   * @param makeCollection Whether we're making a collection.
   * @param pluralizer An inflector function for setting the Resource's type
   */
  static docsToResourceOrCollection(docs, makeCollection, pluralizer, fields?: object): Collection | Resource {
    // if docs is an empty array and we're making a collection, that's ok.
    // but, if we're looking for a single doc, we must 404 if we didn't find any.
    if(!docs || (!makeCollection && Array.isArray(docs) && docs.length === 0)) {
      throw new APIError(404, undefined, "No matching resource found.");
    }

    docs = !Array.isArray(docs) ? [docs] : docs;
    docs = docs.map((it) => this.docToResource(it, pluralizer, fields));
    return makeCollection ? new Collection(docs) : docs[0];
  }

  // Useful to have this as static for calling as a utility outside this class.
  static docToResource(doc, pluralizer = pluralize.plural, fields?: object) {
    let type = this.getType(doc.constructor.modelName, pluralizer);
    let refPaths = util.getReferencePaths(doc.constructor);
    let schemaOptions = doc.constructor.schema.options;

    // Get and clean up attributes
    // Note: we can't use the depopulate attribute because it doesn't just
    // depopulate fields _inside_ the passed in doc, but can actually turn the
    // doc itself into a string if the doc was originally gotten by population.
    // That's stupid, and it breaks our include handling.
    // Also, starting in 4.0, we won't need the delete versionKey line:
    // https://github.com/Automattic/mongoose/issues/2675
    let attrs = doc.toJSON({virtuals: true, getters: true});
    delete attrs.id; // from the id virtual.
    delete attrs._id;
    delete attrs[schemaOptions.versionKey];
    delete attrs[schemaOptions.discriminatorKey];

    // Delete attributes that aren't in the included fields.
    // TODO: Some virtuals could be expensive to compute, so, if field
    // restrictions are in use, we shouldn't set {virtuals: true} above and,
    // instead, we should read only the virtuals that are needed (by searching
    // the schema to identify the virtual paths and then checking those against
    // fields) and add them to newAttrs.
    if(fields && fields[type]) {
      let newAttrs = {};
      fields[type].forEach((field) => {
        if(attrs[field]) {
          newAttrs[field] = attrs[field];
        }
      });
      attrs = newAttrs;
    }

    // Build relationships
    let relationships = {};
    let getProp = (obj, part) => obj[part];

    refPaths.forEach((path) => {
      // skip if applicable
      if(fields && fields[type] && !arrayContains(fields[type], path)) {
        return;
      }

      // get value at the path w/ the reference, in both the json'd + full docs.
      let pathParts = path.split(".");
      let jsonValAtPath = pathParts.reduce(getProp, attrs);
      let referencedType = this.getReferencedType(doc.constructor, path);

      // delete the attribute, since we're moving it to relationships
      deleteNested(path, attrs);

      // Now, since the value wasn't excluded, we need to build its
      // Relationship. Note: the value could still be null or an empty array.
      // And, because of population, it could be a single document or array of
      // documents, in addition to a single/array of ids. So, as is customary,
      // we'll start by coercing it to an array no matter what, tracking
      // whether to make it a non-array at the end, to simplify our code.
      let isToOneRelationship = false;

      if(!Array.isArray(jsonValAtPath)) {
        jsonValAtPath = [jsonValAtPath];
        isToOneRelationship = true;
      }

      let linkage: typeof Linkage.prototype.value = [];
      jsonValAtPath.forEach((docOrIdOrNull) => {
        let idOrNull;

        // if it has an ._id key, it's a document.
        if(docOrIdOrNull && docOrIdOrNull._id) {
          idOrNull = String(docOrIdOrNull._id);
        }

        else {
          // Even though we did toJSON(), id may be an ObjectId. (lame.)
          idOrNull = docOrIdOrNull ? String(docOrIdOrNull) : null;
        }

        linkage.push(idOrNull ? {type: referencedType, id: idOrNull} : null);
      });

      // go back from an array if neccessary and save.
      linkage = new Linkage(isToOneRelationship ? linkage[0] : linkage);
      relationships[path] = new Relationship(linkage);
    });

    // finally, create the resource.
    return new Resource(type, doc.id, attrs, relationships);
  }

  static getModelName(type, singularizer = pluralize.singular) {
    let words = type.split("-");
    words[words.length - 1] = singularizer(words[words.length - 1]);
    return words.map((it) => it.charAt(0).toUpperCase() + it.slice(1)).join("");
  }

  // Get the json api type name for a model.
  static getType(modelName, pluralizer = pluralize.plural) {
    return pluralizer(modelName.replace(/([A-Z])/g, "\-$1").slice(1).toLowerCase());
  }

  static getReferencedType(model, path, pluralizer = pluralize.plural) {
    return this.getType(util.getReferencedModelName(model, path), pluralizer);
  }

  static getChildTypes(model, pluralizer = pluralize.plural) {
    if(!model.discriminators) return [];

    return Object.keys(model.discriminators).map(it => this.getType(it, pluralizer));
  }

  static getStandardizedSchema(model, pluralizer = pluralize.plural) {
    const schemaOptions = model.schema.options;
    const versionKey = schemaOptions.versionKey;
    const discriminatorKey = schemaOptions.discriminatorKey;
    const virtuals = model.schema.virtuals;
    const schemaFields: FieldDocumentation[] = [];

    const getFieldType = (path, schemaType) => {
      if(path === "_id") {
        return new FieldTypeDocumentation("Id", false);
      }


      const typeOptions = schemaType.options.type;
      const holdsArray = Array.isArray(typeOptions);

      const baseType = holdsArray ? typeOptions[0].ref : typeOptions.name;
      const refModelName = util.getReferencedModelName(model, path);

      return !refModelName ?
        new FieldTypeDocumentation(baseType, holdsArray) :
        new RelationshipTypeDocumentation(
          holdsArray, refModelName, this.getType(refModelName, pluralizer)
        );

    };

    model.schema.eachPath((name, type) => {
      if(arrayContains([versionKey, discriminatorKey], name)) {
        return;
      }

      const fieldType = getFieldType(name, type);
      name = (name === "_id") ? "id" : name;
      const likelyAutoGenerated = name === "id" || (
        fieldType.baseType === "Date" &&
        /created|updated|modified/.test(name) &&
        typeof type.options.default === "function"
      );

      let defaultVal;
      if(likelyAutoGenerated) {
        defaultVal = "__AUTO__";
      }

      else if(type.options.default && typeof type.options.default !== "function") {
        defaultVal = type.options.default;
      }

      // find the "base type's" options (used below), in case
      // we have an array of values of the same type at this path.
      let baseTypeOptions = Array.isArray(type.options.type) ? type.options.type[0] : type.options;

      // Add validation info
      let validationRules = {
        required: !!type.options.required,
        oneOf: baseTypeOptions.enum ? type.enumValues || (type.caster && type.caster.enumValues) : undefined,
        max: type.options.max || undefined
      };

      type.validators.forEach((validatorObj) => {
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

    for(let virtual in virtuals) {
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

    while((matches = wordsRe.exec(pascalCasedString)) !== null) {
      words.push(matches[0]);
    }

    return words.join(" ");
  }

  /*
  Note: adding overloads here creates more (false) compile errors than it fixes,
  because of issues like https://github.com/Microsoft/TypeScript/issues/10523
  static getIdQueryType(ids: string[]): ["find", {_id: {$in: string[]}}];
  static getIdQueryType(id: string): ["findOne", {_id: string}];
  static getIdQueryType(id: undefined): ["find", {}];
  static getIdQueryType(): ["find", {}];*/
  static getIdQueryType(idOrIds: string | string[] | undefined = undefined) {
    type result =
      ["findOne", {_id: string}] | // one resource
      ["find", {_id: {$in: string[]}}] | // set of resources
      ["find", {}]; // all resources in collection

    const [mode, idQuery, idsArray] = <result & { 2?: string[] }>(() => {
      if(Array.isArray(idOrIds)) {
        return ["find", {_id: {"$in": idOrIds}}, idOrIds];
      }

      else if(typeof idOrIds === "string") {
        return ["findOne", {_id: idOrIds}, [idOrIds]];
      }

      else {
        return ["find", {}, undefined];
      }
    })();

    if (idsArray && !idsArray.every(this.idIsValid)) {
      throw Array.isArray(idOrIds)
        ? new APIError(400, undefined, "Invalid ID.")
        : new APIError(404, undefined, "No matching resource found.", "Invalid ID.");
    }

    return <result>[mode, idQuery];
  }

  static idIsValid(id) {
    return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  }
}